# Task 56: carpools/carpool_requests 테이블 마이그레이션

## Context

카풀 기능 구현을 위한 DB 스키마 준비 단계입니다. Phase 3의 카풀 기능은 `carpools`, `carpool_requests` 두 테이블과 `carpool_request_status` ENUM 타입이 필요합니다. 이 작업은 Phase 0에서 누락된 ENUM 타입 보완과 함께 두 테이블 전체를 생성합니다.

## 구현 대상 파일

- **신규 생성**: `supabase/migrations/20260324000000_create_carpools.sql`
- **참고 패턴**: `supabase/migrations/20260322000000_create_participations.sql`
- **RLS 참고 패턴**: `supabase/migrations/20260322000200_posts_rls.sql`

## Step 1: [nextjs-supabase-fullstack] 마이그레이션 파일 생성

`supabase/migrations/20260324000000_create_carpools.sql` 파일을 아래 순서로 작성합니다.

### 1-1. ENUM 타입 생성

```sql
CREATE TYPE carpool_request_status AS ENUM ('pending', 'approved', 'rejected');
```

### 1-2. carpools 테이블 생성

```sql
CREATE TABLE carpools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  departure_place TEXT NOT NULL,
  departure_time TIMESTAMPTZ,
  total_seats INTEGER NOT NULL CHECK (total_seats >= 1 AND total_seats <= 10),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1-3. carpool_requests 테이블 생성

```sql
CREATE TABLE carpool_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carpool_id UUID NOT NULL REFERENCES carpools(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status carpool_request_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(carpool_id, passenger_id)
);
```

### 1-4. 인덱스 생성

```sql
CREATE INDEX idx_carpools_event_id ON carpools(event_id);
CREATE INDEX idx_carpool_requests_carpool_id ON carpool_requests(carpool_id);
CREATE INDEX idx_carpool_requests_passenger_id ON carpool_requests(passenger_id);
```

### 1-5. updated_at 트리거

`update_updated_at_column()` 함수는 participations 마이그레이션에서 이미 생성됨 → 재사용

```sql
CREATE TRIGGER update_carpools_updated_at
  BEFORE UPDATE ON carpools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carpool_requests_updated_at
  BEFORE UPDATE ON carpool_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 1-6. RLS 활성화 및 정책 적용

**carpools RLS:**

| 정책   | 허용 조건                                                          |
| ------ | ------------------------------------------------------------------ |
| SELECT | 이벤트 주최자 OR 해당 이벤트 승인된 참여자(status='approved')      |
| INSERT | 이벤트 주최자 OR 해당 이벤트 승인된 참여자(driver_id = auth.uid()) |
| DELETE | carpools.driver_id = auth.uid() OR 이벤트 주최자                   |

**carpool_requests RLS:**

| 정책   | 허용 조건                                                            |
| ------ | -------------------------------------------------------------------- |
| SELECT | 드라이버(carpools) OR passenger_id = auth.uid() OR 이벤트 주최자     |
| INSERT | passenger_id = auth.uid() AND 해당 이벤트 승인된 참여자              |
| UPDATE | 해당 carpool의 driver_id = auth.uid() OR 이벤트 주최자 (status 변경) |
| DELETE | passenger_id = auth.uid()                                            |

> 패턴 주의: posts_rls.sql처럼 participations 서브쿼리에 alias(`p`)를 사용하여 self-reference 방지

### 1-7. TypeScript 타입 재생성

마이그레이션 적용 후 Supabase MCP의 `generate_typescript_types`로 `types/database.types.ts` 재생성

## 검증 방법

1. Supabase MCP `apply_migration`으로 마이그레이션 실행
2. `list_tables`로 carpools, carpool_requests 테이블 생성 확인
3. `execute_sql`로 아래 검증 쿼리 실행:
   - ENUM 타입 존재 확인: `SELECT typname FROM pg_type WHERE typname = 'carpool_request_status'`
   - 인덱스 존재 확인: `SELECT indexname FROM pg_indexes WHERE tablename IN ('carpools', 'carpool_requests')`
   - UNIQUE 제약 위반 테스트: 동일 carpool_id + passenger_id 중복 INSERT
4. `generate_typescript_types` 실행 → `types/database.types.ts` 업데이트 확인
