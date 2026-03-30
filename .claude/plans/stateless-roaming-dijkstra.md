# 플랜: Task 87 - 인증 관련 Server Actions 구현 (비밀번호 변경, 회원 탈퇴)

## Context

프로필 설정 페이지에서 사용자가 비밀번호를 변경하거나 계정을 탈퇴할 수 있도록 Server Actions를 구현합니다.
관련 Zod 스키마(`changePasswordSchema`, `deleteAccountSchema`)와 타입(`ChangePasswordInput`)은 이미 정의되어 있으며, 이를 재사용합니다.
현재 `actions/auth.ts` 파일이 존재하지 않으므로 신규 생성합니다.

---

## 사전 조건 확인 (중요)

`deleteAccount` 구현에 `SUPABASE_SERVICE_ROLE_KEY`가 필요합니다.
현재 `.env.local` 및 `.env.example`에 이 값이 **없으므로**, 구현 전 아래 두 작업이 선행되어야 합니다:

1. **환경변수 추가**: `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY` 추가 (Supabase 대시보드 → Project Settings → API에서 확인)
2. **Service Role 클라이언트 생성**: `lib/supabase/admin.ts` 신규 생성

---

## 핵심 재사용 파일

| 파일                         | 용도                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| `lib/validations/profile.ts` | `changePasswordSchema`, `deleteAccountSchema` (이미 정의됨) |
| `types/profile.ts`           | `ChangePasswordInput` 타입 (이미 정의됨)                    |
| `types/action.ts`            | `ActionResult` 공통 반환 타입                               |
| `lib/supabase/server.ts`     | `createClient()` - 일반 Server 클라이언트                   |

---

## 구현 단계

### Step 1: [nextjs-supabase-fullstack] Service Role 클라이언트 및 환경변수 설정

**파일:** `lib/supabase/admin.ts` (신규)

```typescript
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

// Service Role 클라이언트 (서버 사이드 전용)
// 반드시 Server Component/Server Action에서만 사용할 것
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
```

**환경변수 추가:**

- `.env.example`에 `SUPABASE_SERVICE_ROLE_KEY=<SUBSTITUTE_SUPABASE_SERVICE_ROLE_KEY>` 추가
- `.env.local`에 실제 값 추가 (사용자가 직접 입력)

---

### Step 2: [nextjs-supabase-fullstack] `actions/auth.ts` 신규 생성

**구현할 함수 2개:**

#### `changePassword(formData: FormData): Promise<ActionResult>`

```
1. createClient() 호출 → 인증된 사용자 확인
2. FormData에서 currentPassword, newPassword, confirmPassword 추출
3. changePasswordSchema.safeParse() 서버 검증
4. supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
   → 실패 시: { success: false, error: "현재 비밀번호가 올바르지 않습니다." }
5. supabase.auth.updateUser({ password: newPassword })
   → 실패 시: { success: false, error: 에러 메시지 }
6. revalidatePath('/profile')
7. return { success: true }
```

#### `deleteAccount(formData: FormData): Promise<ActionResult>`

```
1. createClient() 호출 → 인증된 사용자 확인 (userId 추출)
2. FormData에서 confirmation 추출
3. deleteAccountSchema.safeParse() 서버 검증 ("탈퇴합니다" 일치 확인)
4. createAdminClient() 호출 → Service Role 클라이언트
5. supabase.auth.admin.deleteUser(userId)
   → 실패 시: { success: false, error: "계정 삭제에 실패했습니다." }
6. redirect('/auth/login') → 세션은 auth.users CASCADE 삭제로 자동 무효화
```

> **주의:** `auth.users` 삭제 시 DB 스키마의 CASCADE로 `profiles`, `participations` 등 자동 삭제됨

---

## 수정/생성 파일 목록

| 파일                    | 변경 유형                    |
| ----------------------- | ---------------------------- |
| `lib/supabase/admin.ts` | 신규 생성                    |
| `actions/auth.ts`       | 신규 생성                    |
| `.env.example`          | 수정 (SERVICE_ROLE_KEY 추가) |

---

## 검증 방법

1. `npm run type-check` — 타입 오류 없음 확인
2. `npm run lint` — ESLint 오류 없음 확인
3. **비밀번호 변경 테스트:**
   - 현재 비밀번호 틀린 경우 → 에러 메시지 반환 확인
   - 새 비밀번호 / 확인 불일치 → Zod 검증 에러 확인
   - 정상 변경 → 새 비밀번호로 로그인 가능한지 확인
4. **회원 탈퇴 테스트:**
   - "탈퇴합니다" 외 텍스트 → Zod 검증 에러 확인
   - 정상 탈퇴 → Supabase auth.users에서 삭제 확인
   - 탈퇴 후 `/auth/login` 리다이렉션 확인
   - Supabase DB에서 profiles, participations 등 CASCADE 삭제 확인
