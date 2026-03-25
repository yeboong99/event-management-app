"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  applyParticipationSchema,
  toggleAttendanceSchema,
  updateParticipationStatusSchema,
} from "@/lib/validations/participation";
import { ActionResult } from "@/types/action";
import {
  Participation,
  ParticipationStatus,
  ParticipationWithEvent,
  ParticipationWithProfile,
} from "@/types/participation";

export async function applyParticipation(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const rawData = {
    eventId: formData.get("eventId") as string,
    message: formData.get("message") as string | undefined,
  };

  const validated = applyParticipationSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const { eventId, message } = validated.data;

  const { error } = await supabase.from("participations").insert({
    event_id: eventId,
    user_id: user.id,
    message: message || null,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      // UNIQUE 제약 위반: 중복 신청
      return { success: false, error: "이미 참여 신청하셨습니다." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function approveParticipation(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const rawData = {
    participationId: formData.get("participationId") as string,
    eventId: formData.get("eventId") as string,
    status: "approved" as const,
  };

  const validated = updateParticipationStatusSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const { participationId, eventId } = validated.data;

  // 이벤트 호스트 권한 검증
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: "이벤트를 찾을 수 없습니다." };
  }

  if (event.host_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  // approve_participation RPC 호출 (동시성 제어 포함)
  const { error } = await supabase.rpc("approve_participation", {
    p_participation_id: participationId,
    p_event_id: eventId,
  });

  if (error) {
    if (error.message.includes("max_participants_exceeded")) {
      return { success: false, error: "최대 참여 인원을 초과했습니다." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function rejectParticipation(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const participationId = formData.get("participationId") as string;
  const eventId = formData.get("eventId") as string;

  // 이벤트 호스트 권한 검증
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: "이벤트를 찾을 수 없습니다." };
  }

  if (event.host_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  const { error } = await supabase
    .from("participations")
    .update({ status: "rejected" })
    .eq("id", participationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function cancelParticipation(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const participationId = formData.get("participationId") as string;
  const eventId = formData.get("eventId") as string;

  // 참여 신청 조회 (본인 및 pending 상태 검증용)
  const { data: participation } = await supabase
    .from("participations")
    .select("user_id, status")
    .eq("id", participationId)
    .single();

  if (!participation) {
    return { success: false, error: "참여 신청을 찾을 수 없습니다." };
  }

  if (participation.user_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  if (participation.status !== "pending") {
    return { success: false, error: "대기 중인 신청만 취소할 수 있습니다." };
  }

  const { error } = await supabase
    .from("participations")
    .delete()
    .eq("id", participationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function toggleAttendance(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const rawData = {
    participationId: formData.get("participationId") as string,
    attended: formData.get("attended") === "true",
  };

  const validated = toggleAttendanceSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const eventId = formData.get("eventId") as string;

  // 주최자 권한 검증
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: "이벤트를 찾을 수 없습니다." };
  }

  if (event.host_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  const { error } = await supabase
    .from("participations")
    .update({ attended: validated.data.attended })
    .eq("id", validated.data.participationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function getParticipations(
  eventId: string,
  status?: string,
): Promise<ParticipationWithProfile[]> {
  const supabase = await createClient();

  let query = supabase
    .from("participations")
    .select(
      `
      *,
      profiles (
        id,
        name,
        avatar_url,
        email
      )
    `,
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status as ParticipationStatus);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []) as ParticipationWithProfile[];
}

export async function getMyParticipations(
  status?: string,
): Promise<ParticipationWithEvent[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  let query = supabase
    .from("participations")
    .select(
      `
      *,
      events (
        id,
        host_id,
        title,
        category,
        event_date,
        location,
        max_participants,
        cover_image_url,
        is_public,
        created_at,
        updated_at,
        host:profiles!host_id (
          id,
          name,
          avatar_url
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status as ParticipationStatus);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as ParticipationWithEvent[];
}

export async function getParticipationStatus(
  eventId: string,
  userId: string,
): Promise<Participation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("participations")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  // PGRST116: 행이 없을 때 PostgREST가 반환하는 에러 코드 → null 반환
  if (error && error.code !== "PGRST116") throw new Error(error.message);

  return data;
}
