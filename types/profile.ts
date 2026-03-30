import { z } from "zod";

import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from "@/lib/validations/profile";
import { Database } from "@/types/database.types";

// 프로필 데이터 타입 (필요한 필드만 Pick)
export type ProfileData = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "email" | "name" | "username" | "avatar_url" | "role" | "created_at"
>;

// 프로필 수정 입력 타입
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// 비밀번호 변경 입력 타입
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// 회원 탈퇴 입력 타입
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
