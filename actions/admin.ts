"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { ActionResult } from "@/types/action";

// ─────────────────────────────────────────────
// Zod 스키마
// ─────────────────────────────────────────────

const updateUserRoleSchema = z.object({
  targetUserId: z.string().uuid(),
  newRole: z.enum(["user", "admin"]),
});

// ─────────────────────────────────────────────
// 사용자 역할 변경
// ─────────────────────────────────────────────

/**
 * Admin이 특정 사용자의 역할을 변경합니다.
 * SECURITY DEFINER RPC(update_user_role)를 호출하여 RLS를 우회합니다.
 */
export async function updateUserRole(
  formData: FormData,
): Promise<ActionResult<null>> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 현재 사용자가 admin인지 확인
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "사용자 정보를 확인할 수 없습니다." };
  }

  if (profile.role !== "admin") {
    return {
      success: false,
      error: "관리자만 역할을 변경할 수 있습니다.",
    };
  }

  // FormData 파싱
  const rawData = {
    targetUserId: formData.get("targetUserId"),
    newRole: formData.get("newRole"),
  };

  // Zod 검증
  const validated = updateUserRoleSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: "입력값이 올바르지 않습니다." };
  }

  const { targetUserId, newRole } = validated.data;

  // 자기 자신의 역할 변경 차단
  if (targetUserId === user.id) {
    return { success: false, error: "자신의 역할은 변경할 수 없습니다." };
  }

  // SECURITY DEFINER RPC 호출 (RLS 우회, DB 함수 내부에서도 재검증)
  const { error: rpcError } = await supabase.rpc("update_user_role", {
    target_user_id: targetUserId,
    new_role: newRole,
  });

  if (rpcError) {
    return { success: false, error: "역할 변경에 실패했습니다." };
  }

  revalidatePath("/admin/users");

  return { success: true, data: null };
}

// ─────────────────────────────────────────────
// 정산 확정 해제
// ─────────────────────────────────────────────

/**
 * Admin이 특정 이벤트의 정산 확정을 해제합니다.
 */
export async function adminUnfinalizeSettlement(
  eventId: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 현재 사용자가 admin인지 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      success: false,
      error: "관리자만 정산 확정을 해제할 수 있습니다.",
    };
  }

  const { error } = await supabase
    .from("events")
    .update({ is_settlement_finalized: false })
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/events");
  revalidatePath(`/events/${eventId}`);

  return { success: true, data: null };
}
