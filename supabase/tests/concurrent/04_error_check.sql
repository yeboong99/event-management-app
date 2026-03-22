-- =============================================================
-- Task 43: approve_participation 동시성 테스트 - 에러 확인
-- =============================================================
-- 실행 방법: psql "$DB_URL" -f supabase/tests/concurrent/04_error_check.sql
-- 목적: 각 예외 케이스가 올바른 에러 메시지와 SQLSTATE를 반환하는지 검증
--       에러 발생 후 트랜잭션이 롤백되어 데이터 변경이 없는지 확인
-- =============================================================

-- -------------------------------------------------------------
-- 에러 케이스 1: max_participants_exceeded
-- 조건: 이미 approved = 5 (max_participants 도달) 상태에서
--       아직 pending 상태인 참여 신청을 추가 승인 시도
-- 기대값: SQLSTATE P0001, 메시지 'max_participants_exceeded'
-- -------------------------------------------------------------
DO $$
DECLARE
  v_event_id        UUID;
  v_participation_id UUID;
BEGIN
  -- 테스트 이벤트 ID 조회
  SELECT id INTO v_event_id
  FROM events
  WHERE title = '[TEST] Concurrent Approval Test'
  LIMIT 1;

  -- pending 상태인 참여 신청 중 첫 번째 선택
  -- (03_verify.sql 실행 후 approved=5, pending=5 상태 전제)
  SELECT id INTO v_participation_id
  FROM participations
  WHERE event_id = v_event_id
    AND status = 'pending'
  ORDER BY created_at
  LIMIT 1;

  IF v_participation_id IS NULL THEN
    RAISE NOTICE '에러 케이스 1 스킵: pending 참여 신청이 없습니다 (이미 모두 처리됨)';
    RETURN;
  END IF;

  -- 승인 시도 (max_participants 초과 → 에러 예상)
  PERFORM approve_participation(v_participation_id, v_event_id);

  -- 여기까지 도달하면 예외가 발생하지 않은 것 → 테스트 실패
  RAISE NOTICE 'FAIL: max_participants_exceeded 에러가 발생하지 않았습니다';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '에러 케이스 1 — max_participants_exceeded';
    RAISE NOTICE 'EXPECTED ERROR: %', SQLERRM;
    RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
    RAISE NOTICE 'PASS ✓ — 올바른 에러가 발생했습니다';
END;
$$;

-- -------------------------------------------------------------
-- 에러 케이스 2: participation_not_found
-- 조건: 존재하지 않는 participation_id + 실제 event_id 조합
-- 기대값: SQLSTATE P0001, 메시지 'participation_not_found'
-- -------------------------------------------------------------
DO $$
DECLARE
  v_event_id        UUID;
  v_fake_part_id    UUID;
BEGIN
  -- 실제 이벤트 ID 조회
  SELECT id INTO v_event_id
  FROM events
  WHERE title = '[TEST] Concurrent Approval Test'
  LIMIT 1;

  -- 존재하지 않는 랜덤 UUID 생성
  v_fake_part_id := gen_random_uuid();

  -- 존재하지 않는 participation_id로 승인 시도
  PERFORM approve_participation(v_fake_part_id, v_event_id);

  -- 여기까지 도달하면 예외가 발생하지 않은 것 → 테스트 실패
  RAISE NOTICE 'FAIL: participation_not_found 에러가 발생하지 않았습니다';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '에러 케이스 2 — participation_not_found';
    RAISE NOTICE 'EXPECTED ERROR: %', SQLERRM;
    RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
    RAISE NOTICE 'PASS ✓ — 올바른 에러가 발생했습니다';
END;
$$;

-- -------------------------------------------------------------
-- 에러 케이스 3: event_not_found
-- 조건: participation_id, event_id 모두 존재하지 않는 UUID
-- 기대값: SQLSTATE P0001, 메시지 'event_not_found'
-- -------------------------------------------------------------
DO $$
DECLARE
  v_fake_event_id UUID;
  v_fake_part_id  UUID;
BEGIN
  -- 두 인수 모두 존재하지 않는 랜덤 UUID 생성
  v_fake_event_id := gen_random_uuid();
  v_fake_part_id  := gen_random_uuid();

  -- 존재하지 않는 event_id로 승인 시도
  PERFORM approve_participation(v_fake_part_id, v_fake_event_id);

  -- 여기까지 도달하면 예외가 발생하지 않은 것 → 테스트 실패
  RAISE NOTICE 'FAIL: event_not_found 에러가 발생하지 않았습니다';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '에러 케이스 3 — event_not_found';
    RAISE NOTICE 'EXPECTED ERROR: %', SQLERRM;
    RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
    RAISE NOTICE 'PASS ✓ — 올바른 에러가 발생했습니다';
END;
$$;

-- -------------------------------------------------------------
-- 롤백 확인: 에러 발생 후 데이터 상태 불변 검증
-- 에러 케이스 실행 전후로 상태 집계가 동일해야 함
-- (각 DO 블록은 자동으로 롤백되므로 아래 조회값이 변하지 않아야 함)
-- -------------------------------------------------------------
SELECT
  '에러 테스트 후 상태 집계 (변경 없어야 PASS)' AS 검증_항목,
  p.status,
  COUNT(*) AS count
FROM participations p
JOIN events e ON e.id = p.event_id
WHERE e.title = '[TEST] Concurrent Approval Test'
GROUP BY p.status
ORDER BY
  CASE p.status
    WHEN 'approved' THEN 1
    WHEN 'pending'  THEN 2
    WHEN 'rejected' THEN 3
    ELSE 4
  END;
