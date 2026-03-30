import { z } from "zod";

// 프로필 수정 스키마
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "이름은 최소 1자 이상이어야 합니다")
    .max(30, "이름은 최대 30자까지 가능합니다")
    .trim(),
  username: z
    .string()
    .min(2, "사용자명은 최소 2자 이상이어야 합니다")
    .max(20, "사용자명은 최대 20자까지 가능합니다")
    .regex(
      /^[a-z0-9_]+$/,
      "사용자명은 영소문자, 숫자, 언더스코어(_)만 사용 가능합니다",
    )
    .optional(),
});

// 비밀번호 변경 스키마
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "현재 비밀번호는 최소 6자 이상이어야 합니다"),
    newPassword: z.string().min(6, "새 비밀번호는 최소 6자 이상이어야 합니다"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "새 비밀번호와 비밀번호 확인이 일치하지 않습니다",
    path: ["confirmPassword"],
  });

// 계정 탈퇴 스키마
export const deleteAccountSchema = z.object({
  confirmation: z.string().refine((value) => value === "탈퇴합니다", {
    message: '"탈퇴합니다"를 정확히 입력해주세요',
  }),
});
