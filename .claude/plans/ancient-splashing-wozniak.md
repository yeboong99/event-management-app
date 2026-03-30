# Task 86: 프로필 Server Actions 구현

## Context

Phase 5 프로필 기능 개발의 일환으로, 프로필 조회/수정 및 인증 공급자 확인을 위한 Server Actions를 구현합니다.
Task 84(타입·스키마 정의)와 Task 85(Storage 유틸 확장)가 완료되어 있어 이를 활용합니다.

## 현황 파악

| 항목                   | 상태       | 파일                         |
| ---------------------- | ---------- | ---------------------------- |
| `actions/profile.ts`   | **미구현** | 신규 생성 필요               |
| `ProfileData` 타입     | 완료       | `types/profile.ts`           |
| `updateProfileSchema`  | 완료       | `lib/validations/profile.ts` |
| `uploadAvatarImage`    | 완료       | `lib/supabase/storage.ts`    |
| `deleteAvatarImage`    | 완료       | `lib/supabase/storage.ts`    |
| `ActionResult<T>` 타입 | 완료       | `types/action.ts`            |

## 구현 범위

`actions/profile.ts` 신규 파일에 3개 함수 구현:

### 1. `getProfile()`

```
인증 확인 → profiles 테이블 조회 → ProfileData 반환
```

- `supabase.from('profiles').select('id, email, name, username, avatar_url, role, created_at').eq('id', userId).single()`
- 반환 타입: `Promise<ActionResult<ProfileData>>`

### 2. `updateProfile(formData: FormData)`

```
인증 확인 → FormData 파싱 → Zod 검증(updateProfileSchema) → 아바타 처리 → DB 업데이트 → revalidatePath
```

FormData 필드:

- `name` (string)
- `username` (string, optional)
- `avatar` (File, optional) — 새 아바타 업로드
- `removeAvatar` (`"true"` | `""`) — 기존 아바타 제거 플래그

아바타 처리 3가지 케이스:

1. `removeAvatar === "true"` → `deleteAvatarImage(기존 URL)` → `avatar_url = null`
2. `avatar instanceof File && size > 0` → 기존 아바타 있으면 삭제 → `uploadAvatarImage(file, userId)` → `avatar_url = newUrl`
3. 아무 것도 없음 → `avatar_url` 업데이트 필드에서 제외 (undefined)

- 반환 타입: `Promise<ActionResult>`

### 3. `getAuthProvider()`

```
supabase.auth.getUser() → user.app_metadata.provider 반환
```

- 반환 타입: `Promise<string>` (기본값: `"email"`)

## 참조 파일

- **패턴 참조**: `actions/events.ts` — updateEvent 함수 (FormData 처리, Zod 검증, 이미지 처리, DB 업데이트 패턴)
- **재사용 유틸**:
  - `lib/supabase/storage.ts` — `uploadAvatarImage(file, userId)`, `deleteAvatarImage(avatarUrl)`
  - `lib/supabase/server.ts` — `createClient()`
  - `lib/validations/profile.ts` — `updateProfileSchema`
  - `types/action.ts` — `ActionResult<T>`
  - `types/profile.ts` — `ProfileData`

## 구현 단계

**Step 1: [nextjs-supabase-fullstack] `actions/profile.ts` Server Actions 구현**

`getProfile`, `updateProfile`, `getAuthProvider` 3개 함수를 `actions/events.ts`의 패턴을 따라 구현.

## 검증

1. `getProfile()` — 로그인 상태에서 정상 조회, 비로그인 시 에러 반환 확인
2. `updateProfile()` — 닉네임만 수정, 아바타 업로드+닉네임 수정, 아바타 제거 시나리오 확인
3. `getAuthProvider()` — Google OAuth 계정과 이메일 계정에서 각각 provider 값 확인
