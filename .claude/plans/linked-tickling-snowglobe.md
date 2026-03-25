# Task 44: approveParticipation / rejectParticipation Server Actions 구현

## Context

주최자가 이벤트 참여 신청을 승인하거나 거절할 수 있는 Server Actions가 필요합니다.
`applyParticipation`은 이미 구현되어 있으며, 이번 태스크에서는 승인/거절 액션 2개를 추가합니다.

## 현재 상태

- `actions/participations.ts`: `applyParticipation` 함수만 존재
- `lib/validations/participation.ts`: `updateParticipationStatusSchema` 이미 정의됨 (재사용 가능)
- `types/action.ts`: `ActionResult` 타입 정의됨
- `types/participation.ts`: DB 타입 정의됨

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] `approveParticipation` 구현

**파일:** `actions/participations.ts`에 추가

흐름:

1. `createClient()`로 Supabase 클라이언트 생성
2. `supabase.auth.getUser()`로 인증 확인
3. `formData`에서 `participationId`, `eventId` 추출
4. `updateParticipationStatusSchema.safeParse()`로 Zod 검증 (`status: "approved"` 포함)
5. `events` 테이블에서 `host_id` 조회 → 현재 사용자와 비교하여 권한 검증
6. `supabase.rpc("approve_participation", { p_participation_id, p_event_id })` 호출
7. 에러 처리: `"max_participants_exceeded"` 포함 시 → "최대 참여 인원을 초과했습니다." 반환
8. `revalidatePath(`/events/${eventId}/participants`)` 후 `{ success: true }` 반환

### Step 2: [nextjs-supabase-fullstack] `rejectParticipation` 구현

**파일:** `actions/participations.ts`에 추가

흐름:

1. `createClient()`로 Supabase 클라이언트 생성
2. `supabase.auth.getUser()`로 인증 확인
3. `formData`에서 `participationId`, `eventId` 추출
4. `events` 테이블에서 `host_id` 조회 → 권한 검증
5. `supabase.from("participations").update({ status: "rejected" }).eq("id", participationId)` 실행
6. `revalidatePath(`/events/${eventId}/participants`)` 후 `{ success: true }` 반환

> ※ `rejectParticipation`은 직접 UPDATE를 사용하므로 Zod 검증은 생략 가능하나, participationId/eventId UUID 형식 검증을 위해 별도 스키마 적용도 고려

## 수정 파일

- `actions/participations.ts` — 함수 2개 추가 (기존 `applyParticipation` 아래)

## 재사용하는 기존 코드

- `lib/validations/participation.ts` → `updateParticipationStatusSchema` (approveParticipation에서 사용)
- `lib/supabase/server.ts` → `createClient()`
- `types/action.ts` → `ActionResult`

## 검증 방법

1. **승인 테스트**: 주최자 계정으로 pending 참여를 승인 → DB에서 status `approved` 확인
2. **거절 테스트**: 주최자 계정으로 pending 참여를 거절 → DB에서 status `rejected` 확인
3. **권한 테스트**: 비주최자 계정으로 승인/거절 시도 → "권한이 없습니다." 에러 반환 확인
4. **max_participants 초과 테스트**: 정원이 꽉 찬 이벤트에서 승인 시도 → "최대 참여 인원을 초과했습니다." 에러 확인
5. `npm run type-check` & `npm run lint` 통과 확인
