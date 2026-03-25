# Task 62: Server Actions — 카풀 조회 함수 구현

## Context

Task 61에서 카풀 등록/삭제/신청/승인/거절/취소 등 쓰기 작업을 `actions/carpools.ts`에 구현했습니다.
Task 62는 이 파일에 조회 함수 4개를 추가하는 작업입니다.
이 조회 함수들은 이후 카풀 목록 UI, 내 카풀 현황, 탑승 신청 관리 페이지에서 사용됩니다.

## 수정 대상 파일

- **`actions/carpools.ts`** — 조회 함수 4개 추가 (기존 파일 끝에 append)
- **`types/carpool.ts`** — 이미 필요한 타입 정의 완료 (수정 불필요)

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] 카풀 조회 함수 4개 구현

`actions/carpools.ts` 파일 끝에 아래 함수를 순서대로 추가합니다.

#### 1. `getCarpoolsByEventId(eventId: string): Promise<CarpoolWithDetails[]>`

- `carpools` 테이블에서 `event_id` 필터
- `profiles!driver_id` 조인 (id, name, avatar_url)
- `created_at` 오름차순 정렬
- `Promise.all`로 각 카풀의 `approved_count` 계산 (carpool_requests COUNT where status='approved')
- 반환 타입: `CarpoolWithDetails[]`

#### 2. `getCarpoolRequests(carpoolId: string): Promise<CarpoolRequestWithProfile[]>`

- `carpool_requests` 테이블에서 `carpool_id` 필터
- `profiles!passenger_id` 조인 (id, name, avatar_url, email)
- `status` 오름차순, `created_at` 내림차순 정렬
- 반환 타입: `CarpoolRequestWithProfile[]`

#### 3. `getMyCarpoolRequests(userId: string, status?: string): Promise<CarpoolRequestWithCarpool[]>`

- `carpool_requests` 테이블에서 `passenger_id` 필터
- `carpools` 조인 → `profiles!driver_id` + `events` 조인 → `profiles!host_id`
- `status` 파라미터가 있고 'all'이 아닐 때만 `.eq("status", status)` 적용
- `created_at` 내림차순 정렬
- 반환 타입: `CarpoolRequestWithCarpool[]`

#### 4. `getMyCarpools(userId: string): Promise<CarpoolWithEvent[]>`

- `carpools` 테이블에서 `driver_id` 필터
- `events` 조인 → `profiles!host_id`
- `created_at` 내림차순 정렬
- `Promise.all`로 각 카풀의 `approved_count` 계산
- 반환 타입: `CarpoolWithEvent[]`

## 참조 패턴

- `actions/participations.ts`의 `getParticipations()`, `getMyParticipations()` 구조를 그대로 따름
- 기존 `actions/carpools.ts` 상단 import 재사용 (`createClient`, 타입들)

## 검증 방법

1. `npm run type-check` — 타입 오류 없는지 확인
2. `npm run lint` — ESLint 오류 없는지 확인
3. 각 조회 함수 반환 타입이 `types/carpool.ts` 정의와 일치하는지 확인
