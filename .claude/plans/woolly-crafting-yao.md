# Task 5: TypeScript 타입 재생성 계획

## Context

TASK-003(profiles 스키마 정비)과 TASK-004(events 테이블 생성) 완료 후 DB 스키마가 변경되었습니다.
변경 내용:

- `profiles.full_name` → `profiles.name` 리네이밍
- `profiles.role` 컬럼 추가
- ENUM 타입 3개 생성 (`event_category`, `participation_status`, `carpool_request_status`)
- `events` 테이블 신규 생성

탐색 결과, `types/database.types.ts`는 이미 DB 스키마를 반영하고 있고, `full_name` 코드 참조도 없는 상태입니다.
그러나 타입 파일이 Supabase CLI로 공식 재생성되었는지 확인이 필요합니다.

## 현재 상태 파악

| 항목                      | 상태                   |
| ------------------------- | ---------------------- |
| `profiles.name` 타입 존재 | ✅ 이미 반영됨         |
| `events` 테이블 타입 존재 | ✅ 이미 반영됨         |
| ENUM 3개 타입 존재        | ✅ 이미 반영됨         |
| `full_name` 코드 참조     | ✅ 없음 확인           |
| `sign-up-form.tsx:49`     | ✅ 이미 `name` 사용 중 |

## 구현 계획

### Step 1: Supabase CLI로 타입 재생성

```bash
npx supabase gen types typescript --project-id hevzfzweqykilsxmwsyz > types/database.types.ts
```

- Project ID: `hevzfzweqykilsxmwsyz` (`.env.local`에서 확인)
- 기존 파일을 덮어쓰기 (자동생성 파일이므로 직접 수정 금지 원칙에 따라)

### Step 2: 재생성된 타입 검증

다음 항목을 확인:

- `profiles` 테이블: `name`, `role` 필드 존재 / `full_name` 없음
- `events` 테이블: 모든 컬럼 타입 반영
- Enums: `event_category`, `participation_status`, `carpool_request_status` 존재

### Step 3: `full_name` 잔여 참조 재확인

```bash
grep -r "full_name" app/ components/ lib/
```

- 탐색에서 이미 없는 것을 확인했으나 타입 재생성 후 재확인

### Step 4: TypeScript 타입 체크 실행

```bash
npm run type-check
```

- 타입 오류 0건 목표
- 오류 발생 시 해당 파일 수정

## 핵심 파일

- `types/database.types.ts` — 재생성 대상 (자동생성, 직접 수정 금지)
- `components/sign-up-form.tsx` — `full_name` → `name` 수정 (이미 완료된 것으로 보임)
- `.env.local` — Supabase Project ID 참조

## 검증 방법

1. `types/database.types.ts`에 `events` 테이블 타입 존재 확인
2. `profiles` 테이블 타입에 `name`, `role` 필드 존재 / `full_name` 없음 확인
3. Enums에 `event_category`, `participation_status`, `carpool_request_status` 존재 확인
4. `npm run type-check` 통과 (타입 오류 0건)
5. 코드에서 `full_name` 참조 제거 완료 확인
