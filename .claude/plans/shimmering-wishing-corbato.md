# Task 61: 카풀 탑승 신청/승인/거절/취소 Server Actions 구현

## Context

Task 60에서 카풀 등록(`registerCarpool`)과 삭제(`deleteCarpool`)가 구현된 상태입니다.
이제 카풀 탑승 신청자(passenger) 입장의 4가지 액션을 `actions/carpools.ts`에 추가합니다.
`approve_carpool_request` RPC가 이미 DB에 존재하며, `requestCarpoolSchema`도 `lib/validations/carpool.ts`에 정의되어 있습니다.

## 구현 대상 파일

- **`actions/carpools.ts`** — 기존 파일에 4개 함수 추가 (append)

## 의존 관계 확인

- `requestCarpoolSchema` → `@/lib/validations/carpool.ts` ✅ 존재
- `ActionResult` → `@/types/action` ✅ 존재
- `approve_carpool_request` RPC → `supabase/migrations/20260324000100_approve_carpool_request_rpc.sql` ✅ 존재
- `carpool_requests` 테이블 → `supabase/migrations/20260324000000_create_carpools.sql` ✅ 존재

## 구현 단계

### Step 1: [nextjs-supabase-fullstack] `actions/carpools.ts`에 4개 Server Action 추가

`requestCarpool`, `approveCarpoolRequest`, `rejectCarpoolRequest`, `cancelCarpoolRequest` 함수를 기존 파일 하단에 추가합니다.

#### 1-1. `requestCarpool(formData: FormData)`

- `requestCarpoolSchema` 검증 (carpoolId, message?)
- 본인 카풀 신청 방지 (`carpool.driver_id === user.id`)
- 승인된 참여자 여부 확인 (`participations` 테이블, status === 'approved')
- `carpool_requests` INSERT, 중복 시 `error.code === '23505'` 처리
- `revalidatePath(\`/events/${carpool.event_id}\`)`

#### 1-2. `approveCarpoolRequest(requestId, carpoolId, eventId)`

- 드라이버 또는 주최자 권한 확인
- `approve_carpool_request` RPC 호출
- 에러 메시지 분기: `seats_full`, `carpool_not_found`, `request_not_found`
- `revalidatePath(\`/events/${eventId}\`)`

#### 1-3. `rejectCarpoolRequest(requestId, carpoolId, eventId)`

- 드라이버 또는 주최자 권한 확인
- `carpool_requests` UPDATE `status = 'rejected'`
- `revalidatePath(\`/events/${eventId}\`)`

#### 1-4. `cancelCarpoolRequest(requestId, eventId)`

- 본인 신청인지 확인 (`passenger_id === user.id`)
- `pending` 상태인지 확인
- `carpool_requests` DELETE
- `revalidatePath(\`/events/${eventId}\`)`

## 검증 방법

1. `npm run type-check` — TypeScript 타입 오류 없음 확인
2. `npm run lint` — ESLint 오류 없음 확인
3. 브라우저에서 카풀 탑승 신청 → 중복 신청 시 "이미 신청한 카풀입니다." 메시지 확인
4. 드라이버로 로그인 후 승인 → RPC 정상 호출 확인
5. pending 상태 취소 → 성공, approved 상태 취소 → 거부 확인
