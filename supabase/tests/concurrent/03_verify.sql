-- =============================================================
-- Task 43: approve_participation 동시성 테스트 - 결과 검증
-- =============================================================
-- 실행 방법: psql "$DB_URL" -f supabase/tests/concurrent/03_verify.sql
-- 목적: 동시성 테스트 후 승인 수가 max_participants를 초과하지 않는지 확인
-- =============================================================

-- -------------------------------------------------------------
-- STEP 1: 상태별 집계 쿼리
-- approved / pending / rejected 건수를 한눈에 확인
-- -------------------------------------------------------------
SELECT
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

-- -------------------------------------------------------------
-- STEP 2: PASS / FAIL 판정
-- 핵심 검증: approved_count <= max_participants 이어야 PASS
-- 동시성 제어(FOR UPDATE 락)가 정상 동작하면 approved 수는 5 이하
-- -------------------------------------------------------------
SELECT
  e.max_participants,
  COUNT(CASE WHEN p.status = 'approved' THEN 1 END) AS approved_count,
  CASE
    WHEN COUNT(CASE WHEN p.status = 'approved' THEN 1 END) <= e.max_participants
    THEN 'PASS ✓ — 동시성 제어 정상 동작'
    ELSE 'FAIL ✗ — max_participants 초과! 동시성 문제 발생'
  END AS test_result
FROM events e
LEFT JOIN participations p ON p.event_id = e.id
WHERE e.title = '[TEST] Concurrent Approval Test'
GROUP BY e.id, e.max_participants;

-- -------------------------------------------------------------
-- STEP 3: 승인된 참여자 상세 내역
-- ROW_NUMBER() OVER (ORDER BY updated_at) 로 승인 순서 확인
-- 어느 클라이언트가 먼저 승인되었는지 시간 순서로 파악
-- -------------------------------------------------------------
SELECT
  ROW_NUMBER() OVER (ORDER BY p.updated_at)  AS 승인_순서,
  pr.name                                     AS 참여자명,
  pr.email                                    AS 이메일,
  p.status                                    AS 상태,
  p.updated_at                                AS 승인_시각
FROM participations p
JOIN profiles pr ON pr.id = p.user_id
JOIN events e    ON e.id  = p.event_id
WHERE e.title = '[TEST] Concurrent Approval Test'
  AND p.status = 'approved'
ORDER BY p.updated_at;
