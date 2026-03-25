# Task 59: 카풀 Zod 검증 스키마 정의

## Context

카풀 기능 구현의 일환으로, Server Action에서 사용할 입력값 검증 스키마가 필요합니다.
`lib/validations/participation.ts`와 동일한 패턴으로 카풀 등록, 탑승 신청, 상태 변경 스키마를 정의합니다.

## 구현 대상

**신규 파일:** `lib/validations/carpool.ts`

## 참고 파일

- `lib/validations/participation.ts` — 동일한 Zod 스키마 패턴 (UUID 검증, enum, optional 필드 등)
- `types/carpool.ts` — 카풀 관련 타입 정의 (CarpoolRequestStatus enum 등)

## 구현 내용

### Step 1: [nextjs-supabase-fullstack] `lib/validations/carpool.ts` 파일 생성

아래 3개 스키마와 대응 타입을 정의:

1. **registerCarpoolSchema** — 카풀 등록
   - `eventId`: UUID 검증
   - `departurePlace`: 1~100자
   - `departureTime`: string, optional
   - `totalSeats`: 정수, 1~10
   - `description`: 최대 300자, optional

2. **requestCarpoolSchema** — 탑승 신청
   - `carpoolId`: UUID 검증
   - `message`: 최대 200자, optional

3. **updateCarpoolRequestStatusSchema** — 상태 변경
   - `requestId`: UUID 검증
   - `carpoolId`: UUID 검증
   - `status`: `"approved" | "rejected"` enum

4. 각 스키마에 대응하는 `z.infer` 타입 export

## 검증 방법

- `npm run type-check` — 타입 오류 없음 확인
- `npm run lint` — lint 오류 없음 확인
- `totalSeats` 경계값(0, 1, 10, 11) 및 UUID 형식 검증 동작 확인
