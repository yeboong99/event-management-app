"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  deleteEventCoverImage,
  uploadEventCoverImage,
} from "@/lib/supabase/storage";
import { kstDatetimeLocalToUtc } from "@/lib/utils";
import { eventCreateSchema, eventUpdateSchema } from "@/lib/validations/event";
import { ActionResult } from "@/types/action";
import { EventCategory, EventWithHost } from "@/types/event";

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

/** 초대 토큰으로 조회한 비공개 이벤트 기본 정보 */
export type EventByInviteToken = {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  event_date: string;
  location: string | null;
  max_participants: number | null;
  cover_image_url: string | null;
  host_id: string;
  host_name: string | null;
  is_public: boolean | null;
};

// ─────────────────────────────────────────────
// 이벤트 생성
// ─────────────────────────────────────────────

/**
 * 새 이벤트를 생성합니다.
 * 커버 이미지가 포함된 경우 Supabase Storage에 업로드합니다.
 */
export async function createEvent(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // FormData 파싱
  const rawData = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    eventDate: formData.get("eventDate"),
    location: formData.get("location") || undefined,
    maxParticipants: formData.get("maxParticipants")
      ? Number(formData.get("maxParticipants"))
      : undefined,
    isPublic: formData.get("isPublic") === "true",
  };

  // Zod 검증
  const validated = eventCreateSchema.safeParse(rawData);
  if (!validated.success) {
    const firstError = Object.values(
      validated.error.flatten().fieldErrors,
    )[0]?.[0];
    return {
      success: false,
      error: firstError ?? "입력값이 올바르지 않습니다.",
    };
  }

  const {
    title,
    description,
    category,
    eventDate,
    location,
    maxParticipants,
    isPublic,
  } = validated.data;

  // 커버 이미지 업로드 처리
  let coverImageUrl: string | null = null;
  const coverImageFile = formData.get("coverImage");

  if (coverImageFile instanceof File && coverImageFile.size > 0) {
    try {
      const eventId = crypto.randomUUID();
      coverImageUrl = await uploadEventCoverImage(
        coverImageFile,
        user.id,
        eventId,
      );
    } catch (uploadError) {
      return {
        success: false,
        error:
          uploadError instanceof Error
            ? uploadError.message
            : "이미지 업로드에 실패했습니다.",
      };
    }
  }

  // events 테이블 insert
  const { data: event, error: insertError } = await supabase
    .from("events")
    .insert({
      title,
      description: description ?? null,
      category,
      // KST datetime-local 값을 UTC ISO 문자열로 변환 후 저장
      event_date: kstDatetimeLocalToUtc(eventDate),
      location: location ?? null,
      max_participants: maxParticipants ?? null,
      is_public: isPublic,
      cover_image_url: coverImageUrl,
      host_id: user.id,
    })
    .select("id")
    .single();

  if (insertError || !event) {
    return {
      success: false,
      error: insertError?.message ?? "이벤트 생성에 실패했습니다.",
    };
  }

  revalidatePath("/events");
  // 생성 성공 파라미터를 포함하여 이벤트 상세 페이지로 이동
  redirect(`/events/${event.id}?created=true`);
}

// ─────────────────────────────────────────────
// 이벤트 수정
// ─────────────────────────────────────────────

/**
 * 이벤트 정보를 수정합니다.
 * host_id가 현재 사용자와 일치하는 경우에만 수정 가능합니다.
 */
export async function updateEvent(
  eventId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 이벤트 조회 + host_id 권한 확인
  const { data: existingEvent, error: fetchError } = await supabase
    .from("events")
    .select("id, host_id, cover_image_url")
    .eq("id", eventId)
    .single();

  if (fetchError || !existingEvent) {
    return { success: false, error: "이벤트를 찾을 수 없습니다." };
  }

  if (existingEvent.host_id !== user.id) {
    return { success: false, error: "이벤트를 수정할 권한이 없습니다." };
  }

  // FormData 파싱
  const rawData = {
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    category: formData.get("category") || undefined,
    eventDate: formData.get("eventDate") || undefined,
    location: formData.get("location") || undefined,
    maxParticipants: formData.get("maxParticipants")
      ? Number(formData.get("maxParticipants"))
      : undefined,
    isPublic:
      formData.get("isPublic") !== null
        ? formData.get("isPublic") === "true"
        : undefined,
  };

  // Zod 검증 (partial)
  const validated = eventUpdateSchema.safeParse(rawData);
  if (!validated.success) {
    const firstError = Object.values(
      validated.error.flatten().fieldErrors,
    )[0]?.[0];
    return {
      success: false,
      error: firstError ?? "입력값이 올바르지 않습니다.",
    };
  }

  const {
    title,
    description,
    category,
    eventDate,
    location,
    maxParticipants,
    isPublic,
  } = validated.data;

  // 커버 이미지 처리
  const removeCoverImage = formData.get("removeCoverImage") === "true";
  const newCoverImageFile = formData.get("coverImage");
  let coverImageUrl: string | null | undefined = undefined; // undefined = 변경 없음

  if (removeCoverImage) {
    // 기존 이미지 삭제
    if (existingEvent.cover_image_url) {
      try {
        const filePath =
          existingEvent.cover_image_url.split("/event-covers/")[1];
        await deleteEventCoverImage(filePath);
      } catch {
        // 스토리지 삭제 실패는 무시하고 DB 업데이트 진행
      }
    }
    coverImageUrl = null;
  } else if (newCoverImageFile instanceof File && newCoverImageFile.size > 0) {
    // 기존 이미지가 있으면 삭제 후 새 이미지 업로드
    if (existingEvent.cover_image_url) {
      try {
        const filePath =
          existingEvent.cover_image_url.split("/event-covers/")[1];
        await deleteEventCoverImage(filePath);
      } catch {
        // 스토리지 삭제 실패는 무시하고 업로드 진행
      }
    }
    try {
      coverImageUrl = await uploadEventCoverImage(
        newCoverImageFile,
        user.id,
        eventId,
      );
    } catch (uploadError) {
      return {
        success: false,
        error:
          uploadError instanceof Error
            ? uploadError.message
            : "이미지 업로드에 실패했습니다.",
      };
    }
  }

  // 업데이트할 필드 구성
  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  // KST datetime-local 값을 UTC ISO 문자열로 변환 후 저장
  if (eventDate !== undefined)
    updateData.event_date = kstDatetimeLocalToUtc(eventDate);
  if (location !== undefined) updateData.location = location;
  if (maxParticipants !== undefined)
    updateData.max_participants = maxParticipants;
  if (isPublic !== undefined) updateData.is_public = isPublic;
  if (coverImageUrl !== undefined) updateData.cover_image_url = coverImageUrl;

  // events 테이블 update
  const { error: updateError } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", eventId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message ?? "이벤트 수정에 실패했습니다.",
    };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  // 수정 성공 파라미터를 포함하여 이벤트 상세 페이지로 이동
  redirect(`/events/${eventId}?updated=true`);
}

// ─────────────────────────────────────────────
// 이벤트 삭제
// ─────────────────────────────────────────────

/**
 * 이벤트를 삭제합니다.
 * host_id가 현재 사용자와 일치하는 경우에만 삭제 가능합니다.
 */
export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 이벤트 조회 + host_id 권한 확인
  const { data: existingEvent, error: fetchError } = await supabase
    .from("events")
    .select("id, host_id, cover_image_url")
    .eq("id", eventId)
    .single();

  if (fetchError || !existingEvent) {
    return { success: false, error: "이벤트를 찾을 수 없습니다." };
  }

  if (existingEvent.host_id !== user.id) {
    return { success: false, error: "이벤트를 삭제할 권한이 없습니다." };
  }

  // 커버 이미지 삭제
  if (existingEvent.cover_image_url) {
    try {
      const filePath = existingEvent.cover_image_url.split("/event-covers/")[1];
      await deleteEventCoverImage(filePath);
    } catch {
      // 스토리지 삭제 실패는 무시하고 DB 삭제 진행
    }
  }

  // events 테이블 delete
  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (deleteError) {
    return {
      success: false,
      error: deleteError.message ?? "이벤트 삭제에 실패했습니다.",
    };
  }

  revalidatePath("/events");
  redirect("/events");
}

// ─────────────────────────────────────────────
// 이벤트 조회 함수
// ─────────────────────────────────────────────

/**
 * 이벤트 ID로 단일 이벤트를 조회합니다. (주최자 정보 + 승인된 참여자 수 포함)
 */
export async function getEventById(
  eventId: string,
): Promise<EventWithHost | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      host:profiles!host_id(name, avatar_url)
    `,
    )
    .eq("id", eventId)
    .single();

  if (error || !data) {
    return null;
  }

  // SECURITY DEFINER RPC로 참여자 수 조회 (RLS 우회, 주최자 +1 포함)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: countData, error: countError } = (await (supabase.rpc as any)(
    "get_event_participant_count",
    { p_event_id: eventId },
  )) as { data: number | null; error: unknown };

  return {
    ...data,
    current_participants_count: countError ? 1 : (countData ?? 1),
  } as EventWithHost;
}

/**
 * 현재 로그인 사용자가 주최하는 이벤트 목록을 조회합니다.
 * @param category - 카테고리 필터 (선택)
 */
export async function getMyEvents(category?: string): Promise<EventWithHost[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  let query = supabase
    .from("events")
    .select(
      `
      *,
      host:profiles!host_id(name, avatar_url)
    `,
    )
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category as EventWithHost["category"]);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return [];
  }

  // 배치 RPC로 N+1 없이 참여자 수 일괄 조회 (SECURITY DEFINER, 주최자 +1 포함)
  const eventIds = data.map((e) => e.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: countsData } = (await (supabase.rpc as any)(
    "get_events_participant_counts",
    { p_event_ids: eventIds },
  )) as { data: { event_id: string; participant_count: number }[] | null };

  const countMap = new Map<string, number>(
    (countsData ?? []).map(
      (row: { event_id: string; participant_count: number }) => [
        row.event_id,
        row.participant_count,
      ],
    ),
  );

  return data.map((item) => ({
    ...item,
    // approved 참여자가 없는 이벤트는 배치 RPC 결과에 row가 없으므로 기본값 1 사용
    current_participants_count: countMap.get(item.id) ?? 1,
  })) as EventWithHost[];
}

/**
 * 공개 이벤트 목록을 조회합니다.
 * @param category - 카테고리 필터 (선택)
 */
export async function getPublicEvents(
  category?: string,
): Promise<EventWithHost[]> {
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select(
      `
      *,
      host:profiles!host_id(name, avatar_url)
    `,
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category as EventWithHost["category"]);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return [];
  }

  // 배치 RPC로 N+1 없이 참여자 수 일괄 조회 (SECURITY DEFINER, 주최자 +1 포함)
  const eventIds = data.map((e) => e.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: countsData } = (await (supabase.rpc as any)(
    "get_events_participant_counts",
    { p_event_ids: eventIds },
  )) as { data: { event_id: string; participant_count: number }[] | null };

  const countMap = new Map<string, number>(
    (countsData ?? []).map(
      (row: { event_id: string; participant_count: number }) => [
        row.event_id,
        row.participant_count,
      ],
    ),
  );

  return data.map((item) => ({
    ...item,
    // approved 참여자가 없는 이벤트는 배치 RPC 결과에 row가 없으므로 기본값 1 사용
    current_participants_count: countMap.get(item.id) ?? 1,
  })) as EventWithHost[];
}

// ─────────────────────────────────────────────
// 초대 토큰 기반 이벤트 조회
// ─────────────────────────────────────────────

/**
 * 초대 토큰으로 비공개 이벤트 기본 정보를 조회합니다.
 * SECURITY DEFINER RPC를 호출하므로 RLS를 우회합니다.
 */
export async function getEventByInviteToken(
  token: string,
): Promise<EventByInviteToken | null> {
  // UUID 형식 검증 (DB 호출 전 빠른 실패)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return null;
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.rpc as any)(
    "get_event_by_invite_token",
    { p_invite_token: token },
  )) as { data: EventByInviteToken[] | null; error: unknown };

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}
