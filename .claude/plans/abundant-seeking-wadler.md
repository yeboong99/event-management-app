# Task 37: participants/page.tsx Server Component 구현 (주최자 뷰)

## Context

이벤트 주최자가 자신의 이벤트에 신청한 참여자 목록을 확인하고 승인/거절을 처리할 수 있는 전용 페이지가 필요합니다. 현재 이벤트 상세 페이지의 "participants" 탭은 "준비 중" 상태이며, 이 태스크에서 `/events/[eventId]/participants` 라우트와 UI 컴포넌트를 구현합니다.

## 상태 확인

- **의존 태스크 46**: `done` — `getParticipations`, `approveParticipation`, `rejectParticipation` 모두 구현 완료

## Critical Files

| 파일                                               | 상태      | 역할                                                                    |
| -------------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `app/(app)/events/[eventId]/participants/page.tsx` | 새로 생성 | 주최자 전용 참여자 관리 Server Component                                |
| `components/shared/participant-list.tsx`           | 새로 생성 | 참여자 목록 + 승인/거절 Client Component                                |
| `actions/participations.ts`                        | 기존      | `getParticipations`, `approveParticipation`, `rejectParticipation` 참조 |
| `actions/events.ts`                                | 기존      | `getEventById(eventId)` 참조 (명세의 `getEvent` 아님)                   |
| `types/participation.ts`                           | 기존      | `ParticipationWithProfile`, `ParticipationStatus` 타입                  |
| `app/(app)/events/[eventId]/page.tsx`              | 수정      | participants 탭 → 해당 라우트로 이동 링크 추가                          |

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] `participants/page.tsx` Server Component 구현

**처리 흐름:**

1. `await params`, `await searchParams` 처리 (Next.js 16 규칙)
2. `createClient()` → `supabase.auth.getUser()` 인증 확인
3. `getEventById(eventId)` 조회 → 없으면 `notFound()`
4. `event.host_id !== user.id` → `redirect(\`/events/${eventId}\`)` (주최자 권한 체크)
5. `getParticipations(eventId, searchParams.status)` 전체 참여자 조회 (status 없이 전체)
6. `approvedCount` 계산: `participations.filter(p => p.status === 'approved').length`
7. 레이아웃: 헤더(이벤트 제목, 승인 현황), `<ParticipantList>` 렌더

**기존 상세 페이지 participants 탭 수정:**

- `app/(app)/events/[eventId]/page.tsx`의 "준비 중" → `/events/${eventId}/participants` 로 이동하는 Link 버튼으로 교체

### Step 2: [nextjs-ui-markup] `participant-list.tsx` Client Component 구현

**Props:**

```typescript
{ participations: ParticipationWithProfile[]; eventId: string }
```

**UI 구성:**

- 상태 필터 탭: 전체 / 대기(pending) / 승인(approved) / 거절(rejected) — `useState`로 클라이언트 필터링
- 참여자 카드: `Avatar` (폴백: 이름 이니셜) + 이름 + 이메일 + `Badge` + 신청 메시지(선택)
- Badge 매핑: `pending` → secondary, `approved` → default, `rejected` → destructive, `cancelled` → outline
- 액션 버튼 (pending만): `<form action={approveParticipation}>` / `<form action={rejectParticipation}>` + hidden inputs (`participationId`, `eventId`)
- 빈 목록 처리: "해당 상태의 참여자가 없습니다." 텍스트

## 주의사항

- 명세의 `getEvent`는 실제 함수명 `getEventById`로 사용할 것
- 클라이언트 필터링 방식 → 서버에서 전체 목록 받아 `useState`로 필터
- `approveParticipation`/`rejectParticipation`은 이미 `revalidatePath(\`/events/${eventId}/participants\`)` 포함됨

## 검증

1. 주최자 접근 → 참여자 목록 표시 확인
2. 비주최자 접근 → 이벤트 상세 페이지 리다이렉트 확인
3. 승인 현황 (N / max_participants 명 승인, null → "무제한") 표시 확인
4. 상태 필터 탭 동작 확인
5. 승인/거절 버튼 클릭 후 목록 갱신 확인
6. `npm run type-check` / `npm run lint` 통과 확인
