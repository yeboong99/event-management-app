# Task 3: Migration 001 — profiles 스키마 정비 + ENUM 타입 생성

## Context

현재 `profiles` 테이블은 최초 마이그레이션(`20260317071154_create_profiles_table`)으로 생성된 상태로, 다음 두 가지 문제가 있다:

1. `role` 컬럼 없음 → 향후 admin/user 역할 기반 접근 제어(미들웨어, 라우팅)가 불가능
2. `full_name` 컬럼명이 프로젝트 명세(`name`)와 불일치

또한 이후 마이그레이션(events, participations, carpools)에서 사용할 ENUM 타입 3개가 아직 없어, 이 시점에 미리 정의해야 한다.

## 현재 상태

- **DB 마이그레이션**: `20260317071154_create_profiles_table` 1개만 존재
- **profiles 테이블 컬럼**: id, email, **full_name**, username, avatar_url, bio, website, created_at, updated_at
- **ENUM 타입**: 없음 (`Enums: {}`)
- **기존 데이터**: 2개 row (리네이밍 시 데이터 보존 확인 필요)
- **full_name 참조 코드**: `components/sign-up-form.tsx:49` — auth.signUp 메타데이터에 `full_name` 키 사용

## 수정 대상 파일

| 파일                              | 작업                                            |
| --------------------------------- | ----------------------------------------------- |
| Supabase DB (MCP apply_migration) | 마이그레이션 SQL 실행                           |
| `types/database.types.ts`         | Supabase MCP generate_typescript_types로 재생성 |
| `components/sign-up-form.tsx`     | `full_name: fullName` → `name: fullName` 변경   |

## 구현 주체

**`nextjs-supabase-fullstack` 서브에이전트**가 아래 모든 작업을 수행한다.

## 구현 계획

### Step 1. Supabase MCP로 마이그레이션 적용

`mcp__supabase__apply_migration` 으로 아래 SQL 실행:

```sql
-- ENUM 타입 3개 생성
CREATE TYPE event_category AS ENUM (
  '생일파티', '파티모임', '워크샵', '스터디', '운동스포츠', '기타'
);

CREATE TYPE participation_status AS ENUM (
  'pending', 'approved', 'rejected'
);

CREATE TYPE carpool_request_status AS ENUM (
  'pending', 'approved', 'rejected'
);

-- profiles 테이블: role 컬럼 추가
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';

-- profiles 테이블: full_name → name 리네이밍
ALTER TABLE profiles RENAME COLUMN full_name TO name;
```

마이그레이션 이름: `profiles_schema_and_enums`

### Step 2. TypeScript 타입 재생성

`mcp__supabase__generate_typescript_types` 실행 후, 결과를 `types/database.types.ts`에 덮어쓰기

기대 변경 사항:

- `full_name` → `name`
- `role: string | null` 컬럼 추가
- `Enums` 섹션에 3개 ENUM 타입 추가

### Step 3. sign-up-form.tsx 수정

`components/sign-up-form.tsx:49`에서 auth 메타데이터 키 수정:

```typescript
// Before
data: {
  full_name: fullName;
}

// After
data: {
  name: fullName;
}
```

## 검증 방법

1. **DB 스키마 확인**: `mcp__supabase__list_tables` 로 profiles 컬럼에 `name`, `role` 존재 확인, `full_name` 제거 확인
2. **ENUM 타입 확인**: Supabase MCP `execute_sql`로 `SELECT typname FROM pg_type WHERE typtype = 'e';` 실행 → 3개 타입 존재 확인
3. **기존 데이터 보존 확인**: `SELECT id, name FROM profiles;` 로 기존 2개 row의 name 값 확인
4. **TypeScript 타입 확인**: `types/database.types.ts`에 ENUM 및 변경된 컬럼 타입 반영 여부 확인
5. **빌드 검증**: `npm run type-check` → `npm run lint` 순서로 에러 없음 확인
