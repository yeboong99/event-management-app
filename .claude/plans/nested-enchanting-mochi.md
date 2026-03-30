# Task 88: 프로필 페이지 및 폼 UI 구현

## Context

현재 `app/(app)/profile/page.tsx`는 플레이스홀더 상태로, 실제 프로필 조회·수정 기능이 없습니다.
Server Actions(`getProfile`, `updateProfile`, `getAuthProvider`), Zod 스키마, 타입 등 백엔드 레이어는 이미 완성되어 있으므로 **UI 레이어 구현에 집중**합니다.

## 수정/생성 대상 파일

| 파일                                | 작업                  |
| ----------------------------------- | --------------------- |
| `app/(app)/profile/page.tsx`        | Server Component 수정 |
| `components/forms/profile-form.tsx` | 신규 생성             |

## 재사용할 기존 코드

- `actions/profile.ts` — `getProfile()`, `updateProfile()`, `getAuthProvider()`
- `lib/validations/profile.ts` — `updateProfileSchema`
- `types/profile.ts` — `ProfileData`, `UpdateProfileInput`
- `lib/supabase/storage.ts` — `uploadAvatarImage()`, `deleteAvatarImage()`
- `lib/validations/image.ts` — `validateImageFile()`
- `components/logout-button.tsx` — `LogoutButton`
- `components/ui/avatar.tsx` — `Avatar`, `AvatarImage`, `AvatarFallback`
- `components/forms/event-form.tsx` — 파일 업로드 + FileReader 패턴 참고

## 구현 현황

> **✅ 구현 완료** — `profile-form.tsx` (UI 마크업 + 비즈니스 로직), `profile/page.tsx` 모두 작성됨.
> 남은 작업: 타입 검사 + 린트 통과 확인 후 완료 처리.

## 구현 단계

### Step 1: [nextjs-ui-markup] ProfileForm 정적 UI 마크업

`components/forms/profile-form.tsx`를 순수 UI 마크업으로 작성합니다.

**레이아웃 구성:**

- **아바타 섹션**: Avatar(lg) + 현재 아바타 표시, "변경" 버튼(버튼 클릭 → `input[type="file"]` 트리거), "제거" 버튼 (아바타 있을 때만 노출), 미리보기용 `<input type="file" accept="image/*" hidden ref={fileInputRef} />`
- **프로필 정보 섹션**: 이름 Input, 닉네임 Input(선택), 이메일 Input(disabled), 역할 Badge, 가입일 표시
- **저장하기 Button** (full-width, loading 상태 포함)
- **설정 메뉴 섹션** (Separator 구분):
  - 비밀번호 변경 링크 (`/profile/change-password`, OAuth 계정 조건부 숨김)
  - 회원 탈퇴 링크 (`/profile/delete-account`, `text-destructive`)
  - `LogoutButton` 컴포넌트

**Props 타입:**

```typescript
type ProfileFormProps = {
  profile: ProfileData;
  authProvider: string; // "email" | "google" 등
};
```

### Step 2: [nextjs-supabase-fullstack] 프로필 페이지 + ProfileForm 비즈니스 로직 구현

**2-1. `app/(app)/profile/page.tsx` 수정**

- Server Component
- `getProfile()` + `getAuthProvider()` 병렬 호출 (`Promise.all`)
- 에러 시 적절한 fallback
- `ProfileForm`에 `profile`, `authProvider` props 전달

**2-2. `components/forms/profile-form.tsx` 비즈니스 로직 추가**

- `'use client'`
- `useRef<HTMLInputElement>` — 파일 input ref
- `useState<string | null>` — 아바타 미리보기 URL (FileReader)
- `useState<boolean>` — removeAvatar flag
- `useTransition` — Server Action pending 상태
- React Hook Form + `zodResolver(updateProfileSchema)`
- `handleImageChange`: 파일 선택 시 `validateImageFile()` → `FileReader.readAsDataURL()` → 미리보기 업데이트
- `handleRemoveAvatar`: 미리보기 초기화 + removeAvatar flag 설정
- `onSubmit`: `FormData` 구성 → `updateProfile(formData)` 호출 → 성공/실패 `toast()`

## 검증 방법

1. `/profile` 접속 → 현재 프로필 데이터 정상 로드 확인
2. 닉네임 수정 → 저장 → 성공 토스트 + 데이터 반영 확인
3. 아바타 이미지 변경 → 미리보기 표시 → 저장 → 업로드 확인
4. 아바타 제거 → 저장 → 기본 아바타(Fallback) 표시 확인
5. Google OAuth 로그인 계정에서 비밀번호 변경 링크 비노출 확인
6. 유효성 에러(닉네임 특수문자 등) → 폼 에러 메시지 확인
7. 모바일(375px) 반응형 레이아웃 확인
