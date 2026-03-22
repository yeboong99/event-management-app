-- =============================================================
-- Task 43: approve_participation 동시성 테스트 - pgbench 스크립트
-- =============================================================
-- 주의: 이 파일은 pgbench 커스텀 스크립트 문법을 사용합니다.
--       일반 psql에서는 \gset 메타커맨드를 인식하지 못하므로 실행 불가합니다.
--
-- 실행 방법:
--   pgbench -c 10 -t 1 -n -f supabase/tests/concurrent/02_pgbench_script.sql "$DB_URL"
--
--   옵션 설명:
--     -c 10  : 동시 클라이언트 10개
--     -t 1   : 클라이언트당 트랜잭션 1회 실행
--     -n     : 초기화(VACUUM) 생략
--     -f     : 커스텀 스크립트 파일 지정
-- =============================================================

-- -------------------------------------------------------------
-- STEP 1: 테스트 이벤트 ID 조회
-- \gset 으로 결과값을 pgbench 변수에 저장 (event_id 변수 생성)
-- -------------------------------------------------------------
SELECT id AS event_id
FROM events
WHERE title = '[TEST] Concurrent Approval Test'
LIMIT 1
\gset

-- -------------------------------------------------------------
-- STEP 2: 각 클라이언트가 담당할 participation 선택
-- :client_id 는 pgbench 내장 변수 (0부터 시작, 클라이언트 번호)
-- OFFSET :client_id 로 각 클라이언트가 서로 다른 참여 신청을 처리
-- \gset 으로 participation_id 변수에 저장
-- -------------------------------------------------------------
SELECT id AS participation_id
FROM participations
WHERE event_id = :'event_id'
  AND status = 'pending'
ORDER BY created_at
LIMIT 1 OFFSET :client_id
\gset

-- -------------------------------------------------------------
-- STEP 3: approve_participation 함수 호출 (동시 승인 시도)
-- max_participants = 5 이므로 10개 중 5개만 성공하고 나머지는
-- 'max_participants_exceeded' 예외 발생 예상
-- -------------------------------------------------------------
SELECT approve_participation(
  :'participation_id'::uuid,
  :'event_id'::uuid
) AS result;
