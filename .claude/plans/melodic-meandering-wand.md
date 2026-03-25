# Task 45: cancelParticipation / toggleAttendance Server Actions 구현

## Context

태스크 45는 `actions/participations.ts`에 `cancelParticipation`(참여 취소)과 `toggleAttendance`(출석 체크) Server Action을 추가하는 작업입니다.

## 현황 분석

**두 함수 모두 이미 구현 완료되어 있습니다.**

`actions/participations.ts` (untracked 파일)를 확인한 결과, 태스크 요구사항과 일치하는 구현이 존재합니다:

### cancelParticipation (lines 157-203)

- ✅ 인증 확인
- ✅ `participationId`, `eventId` FormData 파싱
- ✅ 본인 소유 검증 (`participation.user_id !== user.id`)
- ✅ `pending` 상태만 취소 허용
- ✅ 삭제 후 `revalidatePath(`/events/${eventId}`)`

### toggleAttendance (lines 205-256)

- ✅ 인증 확인
- ✅ `toggleAttendanceSchema`로 Zod 검증
- ✅ 이벤트 호스트 권한 검증
- ✅ `attended` 컬럼 업데이트
- ✅ `revalidatePath(`/events/${eventId}/participants`)`

## 실행 계획

구현이 이미 완료되었으므로, **태스크 상태를 `done`으로 변경**하는 것이 유일한 작업입니다.

### Step 1: [nextjs-supabase-fullstack] 태스크 45 상태를 done으로 변경

`mcp__taskmaster-ai__set_task_status`로 태스크 45를 `done`으로 마킹합니다.

## 검증

태스크 테스트 전략에 따른 수동 검증 항목:

1. pending 상태 참여를 본인이 취소 → 삭제 확인
2. approved 상태 취소 시도 → "대기 중인 신청만 취소할 수 있습니다." 에러
3. 타인 참여 취소 시도 → "권한이 없습니다." 에러
4. 주최자가 attended 토글 → 즉시 반영
5. 비주최자 출석 체크 시도 → "권한이 없습니다." 에러

## 관련 파일

- `actions/participations.ts` — 이미 구현 완료
- `lib/validations/participation.ts` — `toggleAttendanceSchema` 정의됨
- `types/participation.ts` — 타입 정의
