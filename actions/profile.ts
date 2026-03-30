"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { deleteAvatarImage, uploadAvatarImage } from "@/lib/supabase/storage";
import { updateProfileSchema } from "@/lib/validations/profile";
import { ActionResult } from "@/types/action";
import { ProfileData } from "@/types/profile";

// ─────────────────────────────────────────────
// 프로필 조회
// ─────────────────────────────────────────────

/**
 * 현재 로그인 사용자의 프로필을 조회합니다.
 */
export async function getProfile(): Promise<ActionResult<ProfileData>> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 프로필 조회
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, name, username, avatar_url, role, created_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  return { success: true, data: profile as ProfileData };
}

// ─────────────────────────────────────────────
// 프로필 수정
// ─────────────────────────────────────────────

/**
 * 현재 로그인 사용자의 프로필을 수정합니다.
 * 아바타 이미지 업로드/삭제를 포함합니다.
 */
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const userId = user.id;

  // 기존 프로필 조회 (avatar_url 필요)
  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  if (fetchError || !existingProfile) {
    return { success: false, error: "프로필 정보를 불러올 수 없습니다." };
  }

  // FormData 파싱
  const name = formData.get("name") as string;
  const username = formData.get("username") as string | null;
  const avatar = formData.get("avatar");
  const removeAvatar = formData.get("removeAvatar") === "true";

  // Zod 검증
  const validated = updateProfileSchema.safeParse({
    name,
    username: username || undefined,
  });

  if (!validated.success) {
    const firstError = Object.values(
      validated.error.flatten().fieldErrors,
    )[0]?.[0];
    return {
      success: false,
      error: firstError ?? "입력값이 올바르지 않습니다.",
    };
  }

  // 아바타 처리
  let avatarUrl: string | null | undefined = undefined; // undefined = 변경 없음

  if (removeAvatar) {
    // 기존 이미지 삭제 요청
    if (existingProfile.avatar_url) {
      try {
        await deleteAvatarImage(existingProfile.avatar_url);
      } catch {
        // 스토리지 삭제 실패는 무시하고 DB 업데이트 진행
      }
    }
    avatarUrl = null;
  } else if (avatar instanceof File && avatar.size > 0) {
    // 새 이미지 업로드: 기존 이미지가 있으면 먼저 삭제
    if (existingProfile.avatar_url) {
      try {
        await deleteAvatarImage(existingProfile.avatar_url);
      } catch {
        // 스토리지 삭제 실패는 무시하고 업로드 진행
      }
    }
    try {
      avatarUrl = await uploadAvatarImage(avatar, userId);
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

  // 업데이트 데이터 구성
  const updateData: Record<string, unknown> = {
    name: validated.data.name,
    username: username || null,
    ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
  };

  // profiles 테이블 update
  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message ?? "프로필 수정에 실패했습니다.",
    };
  }

  revalidatePath("/profile");
  return { success: true };
}

// ─────────────────────────────────────────────
// 인증 공급자 확인
// ─────────────────────────────────────────────

/**
 * 현재 로그인 사용자의 인증 공급자를 반환합니다.
 * 인증 실패 또는 에러 시 기본값 "email"을 반환합니다.
 */
export async function getAuthProvider(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return "email";
  }

  return user.app_metadata?.provider ?? "email";
}
