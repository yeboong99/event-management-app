"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  changePasswordSchema,
  deleteAccountSchema,
} from "@/lib/validations/profile";
import { ActionResult } from "@/types/action";

// ─────────────────────────────────────────────
// 비밀번호 변경
// ─────────────────────────────────────────────

/**
 * 비밀번호를 변경합니다.
 * 현재 비밀번호로 재인증 후 새 비밀번호로 업데이트합니다.
 */
export async function changePassword(
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

  // FormData 추출
  const rawData = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  // Zod 서버 검증
  const validated = changePasswordSchema.safeParse(rawData);
  if (!validated.success) {
    const firstError = Object.values(
      validated.error.flatten().fieldErrors,
    )[0]?.[0];
    return {
      success: false,
      error: firstError ?? "입력값이 올바르지 않습니다.",
    };
  }

  const { currentPassword, newPassword } = validated.data;

  // 현재 비밀번호로 재인증 (현재 비밀번호 유효성 검증)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, error: "현재 비밀번호가 올바르지 않습니다." };
  }

  // 새 비밀번호로 업데이트
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

// ─────────────────────────────────────────────
// 회원 탈퇴
// ─────────────────────────────────────────────

/**
 * 회원 탈퇴를 처리합니다.
 * auth.users 삭제 시 CASCADE로 profiles, participations 등 연관 데이터가 자동 삭제됩니다.
 * SUPABASE_SERVICE_ROLE_KEY 필요 (RLS 우회)
 */
export async function deleteAccount(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  // 인증 확인 및 userId 추출
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const userId = user.id;

  // FormData 추출
  const rawData = {
    confirmation: formData.get("confirmation"),
  };

  // Zod 서버 검증 ("탈퇴합니다" 문자열 확인)
  const validated = deleteAccountSchema.safeParse(rawData);
  if (!validated.success) {
    const firstError = Object.values(
      validated.error.flatten().fieldErrors,
    )[0]?.[0];
    return {
      success: false,
      error: firstError ?? "입력값이 올바르지 않습니다.",
    };
  }

  // Service Role 클라이언트로 auth.users 삭제 (RLS 우회)
  const adminClient = createAdminClient();
  const { error: deleteError } =
    await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    return { success: false, error: "계정 삭제에 실패했습니다." };
  }

  redirect("/auth/login");
}
