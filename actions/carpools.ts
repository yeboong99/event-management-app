"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  registerCarpoolSchema,
  requestCarpoolSchema,
  updateCarpoolSchema,
} from "@/lib/validations/carpool";
import type { ActionResult } from "@/types/action";
import type {
  CarpoolRequestStatus,
  CarpoolRequestWithCarpool,
  CarpoolRequestWithProfile,
  CarpoolWithDetails,
  CarpoolWithEvent,
} from "@/types/carpool";

// 카풀 등록
export async function registerCarpool(
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
    departurePlace: formData.get("departurePlace") as string,
    departureTime: (formData.get("departureTime") as string) || undefined,
    totalSeats: parseInt(formData.get("totalSeats") as string, 10),
    description: (formData.get("description") as string) || undefined,
  };

  const validated = registerCarpoolSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const { eventId, departurePlace, departureTime, totalSeats, description } =
    validated.data;

  // 권한 확인: 주최자 또는 승인된 참여자
  const { data: participation } = await supabase
    .from("participations")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  const isHost = event?.host_id === user.id;
  const isApproved = participation?.status === "approved";

  if (!isHost && !isApproved) {
    return { success: false, error: "카풀을 등록할 권한이 없습니다." };
  }

  // 이미 이 이벤트에 카풀을 생성(드라이버)했는지 확인
  const { data: existingDriverCarpool } = await supabase
    .from("carpools")
    .select("id")
    .eq("event_id", eventId)
    .eq("driver_id", user.id)
    .maybeSingle();

  if (existingDriverCarpool) {
    return {
      success: false,
      error: "이미 이 이벤트에 카풀을 등록하셨습니다.",
      errorCode: "CARPOOL_CONFLICT",
    };
  }

  // 이미 이 이벤트의 다른 카풀에 탑승 신청(pending/approved/rejected) 중인지 확인
  const { data: eventCarpools } = await supabase
    .from("carpools")
    .select("id")
    .eq("event_id", eventId);

  const carpoolIds = (eventCarpools ?? []).map((c) => c.id);

  if (carpoolIds.length > 0) {
    const { data: existingRequest } = await supabase
      .from("carpool_requests")
      .select("id")
      .in("carpool_id", carpoolIds)
      .eq("passenger_id", user.id)
      .in("status", ["pending", "approved", "rejected"])
      .limit(1)
      .maybeSingle();

    if (existingRequest) {
      return {
        success: false,
        error:
          "이미 다른 카풀에 탑승 신청하셨습니다. 내 카풀 탭에서 기존 신청을 취소 후 카풀을 등록해주세요.",
        errorCode: "CARPOOL_CONFLICT",
      };
    }
  }

  const { error } = await supabase.from("carpools").insert({
    event_id: eventId,
    driver_id: user.id,
    departure_place: departurePlace,
    departure_time: departureTime || null,
    total_seats: totalSeats,
    description: description || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

// 카풀 삭제
export async function deleteCarpool(
  carpoolId: string,
  eventId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 권한 확인: 드라이버 또는 주최자
  const { data: carpool } = await supabase
    .from("carpools")
    .select("driver_id")
    .eq("id", carpoolId)
    .single();

  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (!carpool || !event) {
    return { success: false, error: "카풀을 찾을 수 없습니다." };
  }

  if (carpool.driver_id !== user.id && event.host_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  const { error } = await supabase
    .from("carpools")
    .delete()
    .eq("id", carpoolId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

// 카풀 탑승 신청
export async function requestCarpool(
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
    carpoolId: formData.get("carpoolId") as string,
    message: (formData.get("message") as string) || undefined,
  };

  const validated = requestCarpoolSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const { carpoolId, message } = validated.data;

  // 카풀 정보 조회 (본인 카풀 체크 + 정원 체크용)
  const { data: carpool } = await supabase
    .from("carpools")
    .select("driver_id, event_id, total_seats")
    .eq("id", carpoolId)
    .single();

  if (!carpool) {
    return { success: false, error: "카풀을 찾을 수 없습니다." };
  }

  if (carpool.driver_id === user.id) {
    return { success: false, error: "본인 카풀에는 신청할 수 없습니다." };
  }

  // 승인된 참여자 여부 확인
  const { data: participation } = await supabase
    .from("participations")
    .select("status")
    .eq("event_id", carpool.event_id)
    .eq("user_id", user.id)
    .single();

  if (!participation || participation.status !== "approved") {
    return { success: false, error: "승인된 참여자만 카풀 신청이 가능합니다." };
  }

  // 이미 이 이벤트에 카풀을 생성(드라이버)했는지 확인
  const { data: existingDriverCarpool } = await supabase
    .from("carpools")
    .select("id")
    .eq("event_id", carpool.event_id)
    .eq("driver_id", user.id)
    .maybeSingle();

  if (existingDriverCarpool) {
    return {
      success: false,
      error: "이미 이 이벤트에 카풀을 등록하셨습니다.",
      errorCode: "CARPOOL_CONFLICT",
    };
  }

  // 이 이벤트의 다른 카풀에 이미 탑승 신청(pending/approved/rejected) 중인지 확인
  const { data: allEventCarpools } = await supabase
    .from("carpools")
    .select("id")
    .eq("event_id", carpool.event_id)
    .neq("id", carpoolId);

  const otherCarpoolIds = (allEventCarpools ?? []).map((c) => c.id);

  if (otherCarpoolIds.length > 0) {
    const { data: existingRequest } = await supabase
      .from("carpool_requests")
      .select("id")
      .in("carpool_id", otherCarpoolIds)
      .eq("passenger_id", user.id)
      .in("status", ["pending", "approved", "rejected"])
      .limit(1)
      .maybeSingle();

    if (existingRequest) {
      return {
        success: false,
        error:
          "이미 다른 카풀에 탑승 신청하셨습니다. 내 카풀 탭에서 기존 신청을 취소 후 다시 신청해주세요.",
        errorCode: "CARPOOL_CONFLICT",
      };
    }
  }

  // 현재 승인된 탑승자 수 조회 — 정원 초과 여부 서버 레벨 검증
  const { count: approvedCount } = await supabase
    .from("carpool_requests")
    .select("*", { count: "exact", head: true })
    .eq("carpool_id", carpoolId)
    .eq("status", "approved");

  if (approvedCount !== null && approvedCount >= carpool.total_seats) {
    return { success: false, error: "정원이 마감된 카풀입니다." };
  }

  const { error } = await supabase.from("carpool_requests").insert({
    carpool_id: carpoolId,
    passenger_id: user.id,
    message: message || null,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "이미 신청한 카풀입니다." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${carpool.event_id}`);
  return { success: true };
}

// 카풀 탑승 신청 승인
export async function approveCarpoolRequest(
  requestId: string,
  carpoolId: string,
  eventId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 권한 확인: 드라이버 또는 주최자
  const { data: carpool } = await supabase
    .from("carpools")
    .select("driver_id")
    .eq("id", carpoolId)
    .single();

  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (!carpool || !event) {
    return { success: false, error: "카풀을 찾을 수 없습니다." };
  }

  if (carpool.driver_id !== user.id && event.host_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  // approve_carpool_request RPC 호출
  const { error } = await supabase.rpc("approve_carpool_request", {
    p_request_id: requestId,
    p_carpool_id: carpoolId,
  });

  if (error) {
    if (error.message.includes("seats_full")) {
      return { success: false, error: "좌석이 모두 찼습니다." };
    }
    if (error.message.includes("carpool_not_found")) {
      return { success: false, error: "카풀을 찾을 수 없습니다." };
    }
    if (error.message.includes("request_not_found")) {
      return { success: false, error: "신청을 찾을 수 없습니다." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

// 카풀 탑승 신청 거절
export async function rejectCarpoolRequest(
  requestId: string,
  carpoolId: string,
  eventId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 권한 확인: 드라이버 또는 주최자
  const { data: carpool } = await supabase
    .from("carpools")
    .select("driver_id")
    .eq("id", carpoolId)
    .single();

  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (!carpool || !event) {
    return { success: false, error: "카풀을 찾을 수 없습니다." };
  }

  if (carpool.driver_id !== user.id && event.host_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  const { error } = await supabase
    .from("carpool_requests")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("carpool_id", carpoolId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

// 카풀 탑승 신청 취소 (본인)
export async function cancelCarpoolRequest(
  requestId: string,
  eventId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 본인 신청 확인
  const { data: request } = await supabase
    .from("carpool_requests")
    .select("passenger_id, status")
    .eq("id", requestId)
    .single();

  if (!request) {
    return { success: false, error: "신청을 찾을 수 없습니다." };
  }

  if (request.passenger_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  const { error } = await supabase
    .from("carpool_requests")
    .delete()
    .eq("id", requestId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

// 거절된 탑승 신청 삭제 (드라이버/주최자) — 신청자의 신청 이력이 사라져 재신청 가능해짐
export async function dismissCarpoolRequest(
  requestId: string,
  carpoolId: string,
  eventId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 권한 확인: 드라이버 또는 주최자
  const { data: carpool } = await supabase
    .from("carpools")
    .select("driver_id")
    .eq("id", carpoolId)
    .single();

  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (!carpool || !event) {
    return { success: false, error: "카풀을 찾을 수 없습니다." };
  }

  if (carpool.driver_id !== user.id && event.host_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  // 거절된 신청만 삭제 가능
  const { data: request } = await supabase
    .from("carpool_requests")
    .select("status")
    .eq("id", requestId)
    .single();

  if (!request) {
    return { success: false, error: "신청을 찾을 수 없습니다." };
  }

  if (request.status !== "rejected") {
    return { success: false, error: "거절된 신청만 삭제할 수 있습니다." };
  }

  const { error } = await supabase
    .from("carpool_requests")
    .delete()
    .eq("id", requestId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

// 이벤트별 카풀 목록 조회 (드라이버 프로필 + 승인된 탑승자 수 포함)
export async function getCarpoolsByEventId(
  eventId: string,
): Promise<CarpoolWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carpools")
    .select(
      `
      *,
      profiles!driver_id (
        id,
        name,
        avatar_url
      )
    `,
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  // 각 카풀의 승인된 탑승자 수 조회
  const carpoolsWithCount = await Promise.all(
    (data ?? []).map(async (carpool) => {
      const { count } = await supabase
        .from("carpool_requests")
        .select("*", { count: "exact", head: true })
        .eq("carpool_id", carpool.id)
        .eq("status", "approved");

      return {
        ...carpool,
        approved_count: count ?? 0,
      };
    }),
  );

  return carpoolsWithCount as CarpoolWithDetails[];
}

// 특정 카풀의 탑승 신청 목록 조회 (탑승자 프로필 포함)
export async function getCarpoolRequests(
  carpoolId: string,
): Promise<CarpoolRequestWithProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carpool_requests")
    .select(
      `
      *,
      profiles!passenger_id (
        id,
        name,
        avatar_url,
        email
      )
    `,
    )
    .eq("carpool_id", carpoolId)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as CarpoolRequestWithProfile[];
}

// 내가 신청한 카풀 요청 목록 조회 (카풀 및 이벤트 정보 포함)
export async function getMyCarpoolRequests(
  userId: string,
  status?: CarpoolRequestStatus | "all",
): Promise<CarpoolRequestWithCarpool[]> {
  const supabase = await createClient();

  let query = supabase
    .from("carpool_requests")
    .select(
      `
      *,
      carpools (
        *,
        profiles!driver_id (
          id,
          name,
          avatar_url
        ),
        events (
          id,
          host_id,
          title,
          category,
          event_date,
          location,
          cover_image_url,
          is_public,
          host:profiles!host_id (
            id,
            name,
            avatar_url
          )
        )
      )
    `,
    )
    .eq("passenger_id", userId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status as CarpoolRequestStatus);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as CarpoolRequestWithCarpool[];
}

// 카풀 정보 수정
export async function updateCarpool(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const rawData = {
    carpoolId: formData.get("carpoolId") as string,
    departurePlace: formData.get("departurePlace") as string,
    departureTime: (formData.get("departureTime") as string) || null,
    totalSeats: parseInt(formData.get("totalSeats") as string, 10),
    description: (formData.get("description") as string) || null,
  };

  const validated = updateCarpoolSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const { carpoolId, departurePlace, departureTime, totalSeats, description } =
    validated.data;

  // 이벤트 ID 조회 (revalidatePath용)
  const { data: carpool } = await supabase
    .from("carpools")
    .select("event_id")
    .eq("id", carpoolId)
    .single();

  if (!carpool) {
    return { success: false, error: "카풀을 찾을 수 없습니다." };
  }

  const { error } = await supabase.rpc("update_carpool_info", {
    p_carpool_id: carpoolId,
    p_departure_place: departurePlace,
    // 자동생성 타입이 string으로 선언되어 있으나 실제 DB 함수는 NULL 허용 — 타입 단언으로 처리
    p_departure_time: (departureTime ?? null) as string,
    p_total_seats: totalSeats,
    p_description: (description ?? null) as string,
  });

  if (error) {
    if (error.message.includes("carpool_not_found")) {
      return { success: false, error: "카풀을 찾을 수 없습니다." };
    }
    if (error.message.includes("seats_below_approved")) {
      return {
        success: false,
        error: "현재 승인된 탑승자 수 이상으로만 변경 가능합니다.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${carpool.event_id}`);
  return { success: true };
}

// 내가 등록한 카풀 목록 조회 (이벤트 정보 + 승인된 탑승자 수 포함)
export async function getMyCarpools(
  userId: string,
): Promise<CarpoolWithEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carpools")
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
        cover_image_url,
        is_public,
        host:profiles!host_id (
          id,
          name,
          avatar_url
        )
      )
    `,
    )
    .eq("driver_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // 각 카풀의 승인된 탑승자 수 조회
  const carpoolsWithCount = await Promise.all(
    (data ?? []).map(async (carpool) => {
      const { count } = await supabase
        .from("carpool_requests")
        .select("*", { count: "exact", head: true })
        .eq("carpool_id", carpool.id)
        .eq("status", "approved");

      return {
        ...carpool,
        approved_count: count ?? 0,
      };
    }),
  );

  return carpoolsWithCount as unknown as CarpoolWithEvent[];
}
