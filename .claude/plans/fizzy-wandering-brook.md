# Task 89: 비밀번호 변경 페이지 및 폼 구현

## Context

로그인된 사용자가 현재 비밀번호를 확인한 후 새 비밀번호로 변경할 수 있는 전용 페이지를 구현합니다.

**기존 구현과의 구분:**

| 파일                                        | 용도                        | 흐름                                                              |
| ------------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| `components/update-password-form.tsx`       | 비밀번호 **재설정**         | 이메일 링크 클릭 → `/auth/update-password` (현재 비밀번호 불필요) |
| `components/forms/change-password-form.tsx` | 비밀번호 **변경** (Task 89) | 로그인 상태 → `/profile/change-password` (현재 비밀번호 필요)     |

`profile-form.tsx:278`에 `/profile/change-password` 링크가 이미 추가되어 있으나 해당 페이지/폼이 미존재합니다.

---

## 갭 분석: 요구사항 vs 현재 상태

### 이미 구현됨 ✅

| 항목                              | 파일                                    |
| --------------------------------- | --------------------------------------- |
| `changePassword` Server Action    | `actions/auth.ts:22`                    |
| `changePasswordSchema` Zod 스키마 | `lib/validations/profile.ts:22`         |
| `getAuthProvider()`               | `actions/profile.ts:173`                |
| 프로필 페이지 링크                | `components/forms/profile-form.tsx:278` |
| 비밀번호 재설정 페이지 (별도)     | `components/update-password-form.tsx`   |

### 구현 필요 ❌

| 항목                                    | 파일                                         |
| --------------------------------------- | -------------------------------------------- |
| 비밀번호 변경 페이지 (Server Component) | `app/(app)/profile/change-password/page.tsx` |
| 비밀번호 변경 폼 (Client Component)     | `components/forms/change-password-form.tsx`  |

---

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] change-password 페이지 생성

**파일:** `app/(app)/profile/change-password/page.tsx` (신규)

- `getAuthProvider()` 호출하여 OAuth 계정 여부 확인
- OAuth 계정(`provider !== 'email'`)이면 `redirect('/profile')` 처리
- `<ChangePasswordForm />` 렌더링
- `metadata: { title: "비밀번호 변경" }`

### Step 2: [nextjs-ui-markup] ChangePasswordForm UI 마크업 구현

**파일:** `components/forms/change-password-form.tsx` (신규, 정적 UI)

- `'use client'` 선언
- `profile-form.tsx` 폼 패턴 참고 (Label + Input + error p 태그 구조)
- 입력 필드 3개:
  - 현재 비밀번호 (`type="password"`)
  - 새 비밀번호 (`type="password"`)
  - 새 비밀번호 확인 (`type="password"`)
- 비밀번호 변경 버튼 + 뒤로 가기 링크 (`/profile`)

### Step 3: [nextjs-supabase-fullstack] ChangePasswordForm 로직 연동

**파일:** `components/forms/change-password-form.tsx` (Step 2 결과물에 로직 추가)

- React Hook Form + `zodResolver(changePasswordSchema)` 적용 (`profile-form.tsx` 패턴 동일)
- `changePassword` Server Action 호출 시 FormData 변환 필요
- 성공 시: `toast.success("비밀번호가 변경되었습니다.")` + `router.push('/profile')`
- 실패 시: 서버 에러 인라인 표시 (`errors.root?.message`)
- 버튼 로딩 상태: `useTransition` + `isPending` 활용 (`profile-form.tsx:63` 패턴)

---

## 참조 파일

| 목적             | 경로                                                     |
| ---------------- | -------------------------------------------------------- |
| Server Action    | `actions/auth.ts:22` — `changePassword`                  |
| Zod 스키마       | `lib/validations/profile.ts:22` — `changePasswordSchema` |
| OAuth 체크       | `actions/profile.ts:173` — `getAuthProvider`             |
| 폼 패턴 참고     | `components/forms/profile-form.tsx`                      |
| 페이지 패턴 참고 | `app/(app)/profile/page.tsx`                             |

---

## 검증 방법

1. Google OAuth 계정으로 `/profile/change-password` 직접 접근 → `/profile` 리다이렉트 확인
2. 이메일 계정으로 `/profile/change-password` 접근 → 폼 정상 렌더링 확인
3. 현재 비밀번호 틀린 경우 → "현재 비밀번호가 올바르지 않습니다." 에러 표시
4. 새 비밀번호와 확인 불일치 → 클라이언트 Zod 에러 표시
5. 6자 미만 입력 → 클라이언트 Zod 에러 표시
6. 정상 변경 → 토스트 + `/profile` 리다이렉트 확인
