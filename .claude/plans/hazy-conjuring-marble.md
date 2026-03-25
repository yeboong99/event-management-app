# Task 49: participant-list.tsx 리팩토링 및 관련 컴포넌트 구현

## Context

현재 `participant-list.tsx`는 `useState`로 클라이언트 로컬 상태 필터링을 구현하고 있습니다. 그러나 `participants/page.tsx`(Server Component)는 이미 URL `searchParams`의 `status` 값을 읽어 `getParticipations(eventId, status)`를 서버에서 호출하도록 구현되어 있습니다.

**문제:** 현재 구현은 서버-클라이언트 간 필터링이 중복되어 있고, URL 기반 필터링의 이점(딥링크, 새로고침 유지)을 활용하지 못합니다.

**목표:** 필터링을 URL SearchParams 기반으로 전환하고, 승인/거절 액션과 출석 토글을 별도 컴포넌트로 분리하여 유지보수성을 높입니다.

---

## 현재 상태

- `components/shared/participant-list.tsx` — 존재함 (로컬 state 필터링, 인라인 approve/reject 폼)
- `components/shared/participant-actions.tsx` — **없음**, 신규 생성 필요
- `components/shared/attendance-toggle.tsx` — **없음**, 신규 생성 필요
- `components/shared/copy-link-button.tsx` — 존재함 (재사용 가능)
- `components/shared/confirm-dialog.tsx` — 존재함 (재사용 가능)
- `app/(app)/events/[eventId]/participants/page.tsx` — 존재함 (이미 URL status 처리)

## 재사용할 기존 유틸리티

| 파일                                                  | 재사용 목적                      |
| ----------------------------------------------------- | -------------------------------- |
| `components/shared/copy-link-button.tsx`              | 빈 상태 UI의 초대 링크 복사 버튼 |
| `components/shared/confirm-dialog.tsx`                | 승인/거절 전 확인 다이얼로그     |
| `actions/participations.ts` - `approveParticipation`  | 참여 승인 Server Action          |
| `actions/participations.ts` - `rejectParticipation`   | 참여 거절 Server Action          |
| `actions/participations.ts` - `toggleAttendance`      | 출석 체크 Server Action          |
| `types/participation.ts` - `ParticipationWithProfile` | 참여자+프로필 조인 타입          |
| `components/ui/card.tsx`                              | 참여자 카드 UI                   |

---

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] `participant-actions.tsx` 신규 생성

**파일:** `components/shared/participant-actions.tsx`

- `"use client"` Client Component
- Props: `participation: ParticipationWithProfile`, `eventId: string`
- pending 상태인 경우 승인/거절 버튼 표시 (그 외 상태는 null 반환)
- 각 버튼 클릭 시 `ConfirmDialog`로 확인 후 Server Action 호출
- `approveParticipation(formData)` / `rejectParticipation(formData)` 호출
- `ActionResult` 기반 에러 처리: 실패 시 `toast.error()`, 성공 시 별도 처리 없음 (revalidatePath로 자동 반영)
- FormData 대신 `startTransition` + `bind` 또는 form action 패턴 사용

### Step 2: [nextjs-supabase-fullstack] `attendance-toggle.tsx` 신규 생성

**파일:** `components/shared/attendance-toggle.tsx`

- `"use client"` Client Component
- Props: `participation: ParticipationWithProfile`, `eventId: string`
- `approved` 상태의 참여자에게만 표시 (호출부에서 조건부 렌더링)
- 체크박스(Checkbox shadcn) 또는 Switch로 `attended` 상태 토글
- `toggleAttendance(formData)` Server Action 호출
- `participationId`, `eventId`, `attended`(반전값) FormData로 전달
- 낙관적 업데이트는 적용하지 않고 Server Action 완료 후 revalidatePath로 반영

### Step 3: [nextjs-ui-markup] `participant-list.tsx` 리팩토링

**파일:** `components/shared/participant-list.tsx`

변경 사항:

1. `useState` 제거 → `useRouter`, `useSearchParams` 도입
2. 로컬 필터링 로직 제거 (서버가 이미 필터링된 데이터 전달)
3. 탭 변경 시 `router.push()`로 URL 업데이트 (`?status=pending` 등)
4. 참여자 카드를 `Card`/`CardContent`로 교체
5. `ParticipantActions` import 및 사용
6. `AttendanceToggle` import 및 approved 참여자에게만 조건부 렌더링
7. 빈 상태 UI: `CopyLinkButton`으로 교체 (`window.location.href` 전달)

---

## 핵심 로직 흐름

```
탭 클릭
  → handleTabChange()
  → router.push(`?status=${value}`)
  → URL 변경
  → participants/page.tsx 재렌더링 (Server Component)
  → getParticipations(eventId, status) 재호출
  → 필터링된 participations를 ParticipantList에 전달
```

---

## 검증 방법

1. 필터 탭 클릭 → URL이 `?status=pending` 등으로 변경되는지 확인
2. URL 직접 접근 시 해당 탭이 활성화되는지 확인 (딥링크)
3. 승인 버튼 → ConfirmDialog 표시 → 확인 → 상태 변경 확인
4. 거절 버튼 → ConfirmDialog 표시 → 확인 → 상태 변경 확인
5. 승인된 참여자 카드에 출석 토글 표시 확인
6. 출석 토글 클릭 → DB attended 값 변경 확인
7. 참여자 없을 때 빈 상태 메시지 + CopyLinkButton 표시 확인
8. `npm run type-check` 및 `npm run lint` 통과 확인
