# Task 90: 회원 탈퇴 페이지 및 폼 구현

## Context

프로필 페이지(`ProfileForm`)에 이미 `/profile/delete-account` 링크가 존재하지만, 해당 경로의 페이지와 폼 컴포넌트가 구현되지 않아 404가 발생한다. `deleteAccount` Server Action과 `deleteAccountSchema` Zod 스키마는 이미 구현되어 있으므로, UI 레이어만 추가하면 된다.

## 이미 구현된 것 (재사용)

- **`actions/auth.ts`** — `deleteAccount(formData)`: "탈퇴합니다" 검증 → admin.deleteUser → `/auth/login` redirect
- **`lib/validations/profile.ts`** — `deleteAccountSchema`: `confirmation === "탈퇴합니다"` Zod 검증
- **`actions/events.ts`** — `getMyEvents()`: host_id 기반 사용자 이벤트 목록 조회
- **`actions/profile.ts`** — `getProfile()`: 인증 확인 + 프로필 조회

## 구현할 파일

1. `app/(app)/profile/delete-account/page.tsx` (신규)
2. `components/forms/delete-account-form.tsx` (신규)

## 구현 단계

### Step 1: [nextjs-supabase-fullstack] delete-account 페이지 및 폼 구현

**`app/(app)/profile/delete-account/page.tsx`** (Server Component):

- `getProfile()` 호출 → `success: false`이면 `redirect("/auth/login")`
- `getMyEvents()` 호출 → `id, title`만 추출하여 `hostedEvents` 배열 생성
- `<DeleteAccountForm hostedEvents={hostedEvents} />` 렌더링
- Metadata: `{ title: "회원 탈퇴" }`

**`components/forms/delete-account-form.tsx`** (Client Component):

- `'use client'` 선언
- Props: `hostedEvents: { id: string; title: string }[]`
- `useForm<DeleteAccountInput>` + `zodResolver(deleteAccountSchema)` (resolver as any 캐스팅)
- `useTransition` + `useState<boolean>(false)` (isDialogOpen)
- `confirmationValue = watch("confirmation")`
- `onSubmit`: handleSubmit 통해 Zod 검증 통과 시 `setIsDialogOpen(true)`
- `onConfirm`: FormData 구성 → `startTransition(async () => { const result = await deleteAccount(formData); if (result && !result.success) toast.error(result.error) })`
- `AlertDialog onOpenChange`: `isPending`이면 닫힘 방지

**UI 구성 순서:**

1. 비가역 경고 배너 (`text-destructive`, 아이콘 포함 권장)
2. [조건부] 주최 이벤트 경고 섹션 (`hostedEvents.length > 0`)
   - 이벤트 제목 목록 (`max-h-40 overflow-y-auto`)
   - "위 이벤트와 모든 관련 데이터가 삭제됩니다" 안내
3. "탈퇴합니다" 입력 필드 + Zod 에러 메시지
4. 버튼: [탈퇴 신청 `variant="destructive"`, type="submit"] + [취소 `Link href="/profile"`]
5. AlertDialog (controlled): 최종 확인 → `onConfirm` 실행

## 검증 방법

1. `/profile/delete-account` 접근 시 페이지 정상 렌더링 확인
2. 비인증 접근 시 `/auth/login` 리다이렉트 확인
3. 주최 이벤트 없는 계정: 이벤트 목록 섹션 미노출
4. 주최 이벤트 있는 계정: 이벤트 목록 + 경고 노출
5. "탈퇴합니다" 미입력 또는 오입력 시 AlertDialog가 열리지 않음
6. 올바르게 입력 후 AlertDialog 열림 → 취소 시 폼 유지
7. 최종 탈퇴 확인 후 `/auth/login`으로 이동 + 재로그인 불가 확인
8. `npm run type-check` + `npm run lint` 통과
