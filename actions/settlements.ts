"use server";

import { revalidatePath } from "next/cache";

import { calculateSettlement } from "@/lib/settlement";
import { createClient } from "@/lib/supabase/server";
import { settlementItemFormSchema } from "@/lib/validations/settlement";
import type { ActionResult } from "@/types/action";
import type {
  SettlementItem,
  SettlementItemWithPayer,
  SettlementResult,
} from "@/types/settlement";

// createClient() 반환 타입 추출
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * paidBy 사용자가 해당 이벤트의 정산 대상자(주최자 또는 승인된 참여자)인지 검증
 */
async function isValidPaidBy(
  supabase: SupabaseServerClient,
  eventId: string,
  paidByUserId: string,
): Promise<boolean> {
  // 주최자 여부 확인
  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (event?.host_id === paidByUserId) {
    return true;
  }

  // 승인된 참여자 여부 확인
  const { data: participation } = await supabase
    .from("participations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", paidByUserId)
    .eq("status", "approved")
    .maybeSingle();

  return participation !== null;
}

// ─────────────────────────────────────────────
// 정산 항목 조회
// ─────────────────────────────────────────────

/**
 * 특정 이벤트의 정산 항목 목록을 조회합니다.
 * 각 항목에는 지출자(payer) 프로필 정보가 포함됩니다.
 */
export async function getSettlementItems(
  eventId: string,
): Promise<SettlementItemWithPayer[]> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  // 정산 항목 조회 (지출자 프로필 조인)
  const { data, error } = await supabase
    .from("settlement_items")
    .select("*, payer:profiles!paid_by(id, name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("정산 항목 조회 오류:", error.message);
    return [];
  }

  return (data as SettlementItemWithPayer[]) ?? [];
}

// ─────────────────────────────────────────────
// 정산 결과 계산
// ─────────────────────────────────────────────

/**
 * 특정 이벤트의 정산 결과를 계산합니다.
 * 주최자와 승인된 참여자를 대상으로 균등 분담 기준의 최소 거래 쌍을 반환합니다.
 */
export async function getSettlementResult(
  eventId: string,
): Promise<SettlementResult | null> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // 정산 항목 조회
  const items = await getSettlementItems(eventId);

  if (items.length === 0) {
    return null;
  }

  // 총 지출 금액 합산
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  // 이벤트 주최자 조회
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("host_id, host:profiles!host_id(id, name)")
    .eq("id", eventId)
    .single();

  if (eventError || !eventData) {
    console.error("이벤트 주최자 조회 오류:", eventError?.message);
    return null;
  }

  // 승인된 참여자 조회
  const { data: participationData, error: participationError } = await supabase
    .from("participations")
    .select("user_id, profiles(id, name)")
    .eq("event_id", eventId)
    .eq("status", "approved");

  if (participationError) {
    console.error("참여자 조회 오류:", participationError.message);
    return null;
  }

  // 주최자 정보 추출
  const hostProfile = eventData.host as { id: string; name: string | null };

  // 주최자 + 승인 참여자 합쳐서 participants 배열 구성 (userId 기준 중복 제거)
  const participantMap = new Map<
    string,
    { userId: string; name: string; totalPaid: number }
  >();

  // 주최자 추가
  participantMap.set(hostProfile.id, {
    userId: hostProfile.id,
    name: hostProfile.name ?? "알 수 없음",
    totalPaid: 0,
  });

  // 승인된 참여자 추가
  for (const participation of participationData ?? []) {
    const profile = participation.profiles as {
      id: string;
      name: string | null;
    } | null;

    if (profile && !participantMap.has(profile.id)) {
      participantMap.set(profile.id, {
        userId: profile.id,
        name: profile.name ?? "알 수 없음",
        totalPaid: 0,
      });
    }
  }

  // 정산 항목에서 paid_by 기준으로 각 참여자의 totalPaid 합산
  for (const item of items) {
    const entry = participantMap.get(item.paid_by);
    if (entry) {
      entry.totalPaid += item.amount;
    }
  }

  const payments = Array.from(participantMap.values());

  // 정산 계산 실행
  return calculateSettlement(payments, totalAmount);
}

/**
 * 이벤트의 정산 확정 여부를 조회합니다.
 */
export async function getIsSettlementFinalized(
  eventId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("is_settlement_finalized")
    .eq("id", eventId)
    .maybeSingle();
  return data?.is_settlement_finalized ?? false;
}

// ─────────────────────────────────────────────
// 정산 항목 CUD
// ─────────────────────────────────────────────

// 정산 항목 생성
export async function createSettlementItem(
  formData: FormData,
): Promise<ActionResult<SettlementItem>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const eventId = formData.get("eventId") as string;
  const label = formData.get("label") as string;
  const amount = Number(formData.get("amount"));
  const paidBy = formData.get("paidBy") as string;

  // Zod 검증
  const validated = settlementItemFormSchema.safeParse({
    label,
    amount,
    paidBy,
  });
  if (!validated.success) {
    const errorMessage =
      Object.values(validated.error.flatten().fieldErrors)[0]?.[0] ??
      "입력값이 올바르지 않습니다.";
    return { success: false, error: errorMessage };
  }

  // 권한 확인: 이벤트 주최자 또는 승인된 참여자만 정산 항목 생성 가능
  const { data: eventData } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!eventData) {
    return { success: false, error: "이벤트를 찾을 수 없습니다." };
  }

  const isHost = eventData.host_id === user.id;

  if (!isHost) {
    const { data: participation } = await supabase
      .from("participations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .eq("status", "approved")
      .maybeSingle();

    if (!participation) {
      return { success: false, error: "권한이 없습니다." };
    }
  }

  // 정산 확정 여부 확인 — 확정된 경우 수정 불가
  const { data: eventStatus } = await supabase
    .from("events")
    .select("is_settlement_finalized")
    .eq("id", eventId)
    .maybeSingle();

  if (eventStatus?.is_settlement_finalized) {
    return {
      success: false,
      error: "정산이 확정되어 항목을 추가할 수 없습니다.",
    };
  }

  // 지출자 유효성 검증
  const validPaidBy = await isValidPaidBy(supabase, eventId, paidBy);
  if (!validPaidBy) {
    return {
      success: false,
      error: "지출자는 이벤트 주최자 또는 승인된 참여자여야 합니다.",
    };
  }

  const { data: item, error } = await supabase
    .from("settlement_items")
    .insert({
      event_id: eventId,
      paid_by: paidBy,
      label,
      amount,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true, data: item };
}

// 정산 항목 수정
export async function updateSettlementItem(
  formData: FormData,
): Promise<ActionResult<SettlementItem>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const itemId = formData.get("itemId") as string;
  const label = formData.get("label") as string;
  const amount = Number(formData.get("amount"));
  const paidBy = formData.get("paidBy") as string;

  // 항목 조회 — event_id, created_by 추출
  const { data: existingItem } = await supabase
    .from("settlement_items")
    .select("event_id, created_by")
    .eq("id", itemId)
    .maybeSingle();

  if (!existingItem) {
    return { success: false, error: "항목을 찾을 수 없습니다." };
  }

  const eventId = existingItem.event_id;

  // Zod 검증
  const validated = settlementItemFormSchema.safeParse({
    label,
    amount,
    paidBy,
  });
  if (!validated.success) {
    const errorMessage =
      Object.values(validated.error.flatten().fieldErrors)[0]?.[0] ??
      "입력값이 올바르지 않습니다.";
    return { success: false, error: errorMessage };
  }

  // 권한 확인: 이벤트 주최자 또는 항목 작성자만 수정 가능
  const { data: event } = await supabase
    .from("events")
    .select("host_id, is_settlement_finalized")
    .eq("id", eventId)
    .maybeSingle();

  const isHost = event?.host_id === user.id;
  const isCreator = existingItem.created_by === user.id;

  if (!isHost && !isCreator) {
    return { success: false, error: "권한이 없습니다." };
  }

  // 정산 확정 여부 확인 — 확정된 경우 수정 불가
  if (event?.is_settlement_finalized) {
    return { success: false, error: "정산이 확정되어 수정할 수 없습니다." };
  }

  // 지출자 유효성 검증
  const validPaidBy = await isValidPaidBy(supabase, eventId, paidBy);
  if (!validPaidBy) {
    return {
      success: false,
      error: "지출자는 이벤트 주최자 또는 승인된 참여자여야 합니다.",
    };
  }

  const { data: item, error } = await supabase
    .from("settlement_items")
    .update({ label, amount, paid_by: paidBy })
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true, data: item };
}

// 정산 항목 삭제
export async function deleteSettlementItem(
  formData: FormData,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const itemId = formData.get("itemId") as string;

  // 항목 조회 — event_id, created_by 추출
  const { data: existingItem } = await supabase
    .from("settlement_items")
    .select("event_id, created_by")
    .eq("id", itemId)
    .maybeSingle();

  if (!existingItem) {
    return { success: false, error: "항목을 찾을 수 없습니다." };
  }

  const eventId = existingItem.event_id;

  // 권한 확인: 이벤트 주최자 또는 항목 작성자만 삭제 가능
  const { data: event } = await supabase
    .from("events")
    .select("host_id, is_settlement_finalized")
    .eq("id", eventId)
    .maybeSingle();

  const isHost = event?.host_id === user.id;
  const isCreator = existingItem.created_by === user.id;

  if (!isHost && !isCreator) {
    return { success: false, error: "권한이 없습니다." };
  }

  // 정산 확정 여부 확인 — 확정된 경우 삭제 불가
  if (event?.is_settlement_finalized) {
    return { success: false, error: "정산이 확정되어 삭제할 수 없습니다." };
  }

  const { error } = await supabase
    .from("settlement_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true, data: null };
}

// 정산 확정
export async function finalizeSettlement(
  eventId: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 주최자 권한 확인
  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return { success: false, error: "이벤트를 찾을 수 없습니다." };
  }

  if (event.host_id !== user.id) {
    return { success: false, error: "권한이 없습니다." };
  }

  const { error } = await supabase
    .from("events")
    .update({ is_settlement_finalized: true })
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true, data: null };
}
