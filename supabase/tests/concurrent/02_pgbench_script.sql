-- =============================================================
-- Task 43: approve_participation 동시성 테스트 - pgbench 스크립트
-- =============================================================
-- 주의: 이 파일은 pgbench 커스텀 스크립트 문법을 사용합니다.
--
-- 실행 방법:
--   EVENT_ID=$(psql "$DB_URL" -t -c \
--     "SELECT id FROM events WHERE title = '[TEST] Concurrent Approval Test' LIMIT 1;" \
--     | tr -d ' \n')
--   pgbench -c 10 -t 1 -n \
--     --define event_id="$EVENT_ID" \
--     -f supabase/tests/concurrent/02_pgbench_script.sql "$DB_URL"
--
--   옵션 설명:
--     -c 10            : 동시 클라이언트 10개
--     -t 1             : 클라이언트당 트랜잭션 1회 실행
--     -n               : 초기화(VACUUM) 생략
--     --define key=val : pgbench 변수 외부 주입 (event_id)
--     -f               : 커스텀 스크립트 파일 지정
-- =============================================================

-- -------------------------------------------------------------
-- 단일 쿼리: participation 선택 + approve_participation 호출
--
-- :client_id  — pgbench 내장 변수 (0~9, 클라이언트 번호)
-- :'event_id' — --define 으로 주입된 event_id (quoted string)
--
-- 각 클라이언트가 OFFSET :client_id 로 서로 다른 pending 참여를 처리
-- max_participants=5 이므로 10개 중 5개만 성공하고 나머지는
-- 'max_participants_exceeded' 예외 발생 예상
-- -------------------------------------------------------------
SELECT approve_participation(
  (SELECT id
   FROM participations
   WHERE event_id = :'event_id'::uuid
     AND status = 'pending'
   ORDER BY created_at
   LIMIT 1 OFFSET :client_id),
  :'event_id'::uuid
) AS result;
