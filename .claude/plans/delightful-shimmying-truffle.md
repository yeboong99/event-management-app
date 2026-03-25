# Task 57: approve_carpool_request RPC 함수 구현

## Context

카풀 탑승 신청 승인 시, 동시에 여러 드라이버/주최자가 승인 처리를 시도할 경우 좌석 수를 초과하는 문제가 발생할 수 있습니다. 이를 원자적으로 방지하기 위해 PostgreSQL의 `FOR UPDATE` 잠금을 활용한 RPC 함수를 마이그레이션으로 추가합니다.

Phase 2에서 `approve_participation` RPC 함수 (`20260322000400/500`)를 동일한 패턴으로 구현한 선례가 있으며, 이를 카풀 도메인에 적용합니다.

의존 태스크(Task 56)는 완료 상태로, `carpools` 및 `carpool_requests` 테이블이 이미 생성되어 있습니다.

## 참조 파일

- `supabase/migrations/20260322000400_create_approve_participation_rpc.sql` — FOR UPDATE 잠금 패턴
- `supabase/migrations/20260322000500_update_approve_participation_rpc.sql` — 검증 + UPDATE 완성 패턴
- `supabase/migrations/20260324000000_create_carpools.sql` — carpools/carpool_requests 테이블 구조

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] 마이그레이션 파일 생성

**파일**: `supabase/migrations/20260324000100_approve_carpool_request_rpc.sql`

아래 SQL을 작성합니다:

```sql
CREATE OR REPLACE FUNCTION approve_carpool_request(
  p_request_id UUID,
  p_carpool_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_total_seats INTEGER;
BEGIN
  -- carpools 행에 대한 잠금 획득 (동시성 제어)
  SELECT total_seats INTO v_total_seats
  FROM carpools
  WHERE id = p_carpool_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'carpool_not_found';
  END IF;

  -- 현재 승인된 탑승자 수 조회
  SELECT COUNT(*) INTO v_current_count
  FROM carpool_requests
  WHERE carpool_id = p_carpool_id AND status = 'approved';

  -- 좌석 초과 체크
  IF v_current_count >= v_total_seats THEN
    RAISE EXCEPTION 'seats_full';
  END IF;

  -- 승인 처리
  UPDATE carpool_requests
  SET status = 'approved', updated_at = now()
  WHERE id = p_request_id AND carpool_id = p_carpool_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2: [nextjs-supabase-fullstack] Supabase MCP로 마이그레이션 적용

`mcp__supabase__apply_migration` 도구를 사용하여 마이그레이션을 Supabase에 적용합니다.

## 검증

1. Supabase SQL 에디터에서 아래 시나리오 수동 테스트:
   - 좌석 수만큼 연속 승인 → 마지막 승인 후 추가 승인 시 `seats_full` 예외 확인
   - 잘못된 `carpool_id` 전달 → `carpool_not_found` 예외 확인
   - 잘못된 `request_id` 전달 → `request_not_found` 예외 확인
2. `mcp__supabase__list_migrations`로 마이그레이션 등록 확인
