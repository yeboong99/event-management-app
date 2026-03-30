# 플랜: 프로필 도메인 타입 및 Zod 스키마 정의 (Task #84)

## Context

프로필 관련 기능(수정, 비밀번호 변경, 회원 탈퇴)을 구현하기 위해 필요한 타입과 Zod 검증 스키마를 사전 정의합니다. 기존 `lib/validations/event.ts` 패턴을 따릅니다.

## 생성 파일

### 1. `lib/validations/profile.ts` (신규)

`lib/validations/event.ts` 패턴 참고 (`import { z } from "zod"`, named export):

```typescript
// updateProfileSchema
name: z.string().min(1).max(30).trim();
username: z.string()
  .regex(/^[a-z0-9_]+$/)
  .min(2)
  .max(20)
  .optional();

// changePasswordSchema
currentPassword: z.string().min(6);
newPassword: z.string().min(6);
confirmPassword: z.string();
// .refine()으로 newPassword === confirmPassword 검증

// deleteAccountSchema
confirmation: z.string().refine((val) => val === "탈퇴합니다");
```

### 2. `types/profile.ts` (신규)

`types/database.types.ts`의 `profiles` Row 타입 기반:

```typescript
// ProfileData: profiles 테이블 Row에서 필요한 필드만 Pick
// id, email, name, username, avatar_url, role, created_at

// UpdateProfileInput: z.infer<typeof updateProfileSchema>
// ChangePasswordInput: z.infer<typeof changePasswordSchema>
```

## 구현 단계

- Step 1: [nextjs-supabase-fullstack] `lib/validations/profile.ts` 및 `types/profile.ts` 생성

## 참조 파일

- `lib/validations/event.ts` — 기존 스키마 패턴
- `types/database.types.ts` 265-277줄 — profiles Row 타입

## 검증

1. `npm run type-check` — 타입 에러 없음 확인
2. `npm run lint` — lint 통과 확인
