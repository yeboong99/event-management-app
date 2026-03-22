-- =============================================================
-- Task 43: approve_participation 동시성 테스트 - 데이터 준비
-- =============================================================
-- 실행 방법: psql "$DB_URL" -f supabase/tests/concurrent/01_setup.sql
-- 주의: 로컬 Supabase가 실행 중이어야 합니다 (npx supabase start)
-- =============================================================

-- -------------------------------------------------------------
-- STEP 1: cleanup-first 패턴 — 기존 테스트 데이터 삭제
-- FK 역순 삭제: participations → events → profiles → auth.users
-- -------------------------------------------------------------

-- 참여 데이터 삭제
DELETE FROM participations
WHERE event_id IN (
  SELECT id FROM events
  WHERE title = '[TEST] Concurrent Approval Test'
);

-- 이벤트 삭제
DELETE FROM events
WHERE title = '[TEST] Concurrent Approval Test';

-- 테스트용 프로필 삭제 (고정 UUID 패턴으로 식별)
DELETE FROM profiles
WHERE id::text LIKE '00000000-0000-0000-%';

-- 테스트용 auth.users 삭제
DELETE FROM auth.users
WHERE id::text LIKE '00000000-0000-0000-%';

-- -------------------------------------------------------------
-- STEP 2: auth.users 삽입
-- 호스트 1명 + 참여자 10명 (총 11명)
-- ON CONFLICT (id) DO NOTHING → 재실행 안전성 확보
-- -------------------------------------------------------------

-- 호스트 계정
INSERT INTO auth.users (id, email, created_at, updated_at, confirmation_token, email_confirmed_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test-host@example.com',
  now(), now(), '', now()
)
ON CONFLICT (id) DO NOTHING;

-- 참여자 10명
INSERT INTO auth.users (id, email, created_at, updated_at, confirmation_token, email_confirmed_at)
VALUES
  ('00000000-0000-0000-0001-000000000001', 'test-user-01@example.com', now(), now(), '', now()),
  ('00000000-0000-0000-0001-000000000002', 'test-user-02@example.com', now(), now(), '', now()),
  ('00000000-0000-0000-0001-000000000003', 'test-user-03@example.com', now(), now(), '', now()),
  ('00000000-0000-0000-0001-000000000004', 'test-user-04@example.com', now(), now(), '', now()),
  ('00000000-0000-0000-0001-000000000005', 'test-user-05@example.com', now(), now(), '', now()),
  ('00000000-0000-0000-0001-000000000006', 'test-user-06@example.com', now(), now(), '', now()),
  ('00000000-0000-0000-0001-000000000007', 'test-user-07@example.com', now(), now(), '', now()),
  ('00000000-0000-0000-0001-000000000008', 'test-user-08@example.com', now(), now(), '', now()),
  ('00000000-0000-0000-0001-000000000009', 'test-user-09@example.com', now(), now(), '', now()),
  ('00000000-0000-0000-0001-000000000010', 'test-user-10@example.com', now(), now(), '', now())
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- STEP 3: profiles 삽입
-- auth.users와 동일한 UUID 사용 (FK 연결)
-- -------------------------------------------------------------

-- 호스트 프로필
INSERT INTO profiles (id, email, name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test-host@example.com',
  '테스트 호스트'
)
ON CONFLICT (id) DO NOTHING;

-- 참여자 10명 프로필
INSERT INTO profiles (id, email, name)
VALUES
  ('00000000-0000-0000-0001-000000000001', 'test-user-01@example.com', '테스트 참여자 01'),
  ('00000000-0000-0000-0001-000000000002', 'test-user-02@example.com', '테스트 참여자 02'),
  ('00000000-0000-0000-0001-000000000003', 'test-user-03@example.com', '테스트 참여자 03'),
  ('00000000-0000-0000-0001-000000000004', 'test-user-04@example.com', '테스트 참여자 04'),
  ('00000000-0000-0000-0001-000000000005', 'test-user-05@example.com', '테스트 참여자 05'),
  ('00000000-0000-0000-0001-000000000006', 'test-user-06@example.com', '테스트 참여자 06'),
  ('00000000-0000-0000-0001-000000000007', 'test-user-07@example.com', '테스트 참여자 07'),
  ('00000000-0000-0000-0001-000000000008', 'test-user-08@example.com', '테스트 참여자 08'),
  ('00000000-0000-0000-0001-000000000009', 'test-user-09@example.com', '테스트 참여자 09'),
  ('00000000-0000-0000-0001-000000000010', 'test-user-10@example.com', '테스트 참여자 10')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- STEP 4: 테스트 이벤트 생성
-- max_participants = 5 (10명 중 5명만 승인 가능 → 동시성 테스트 핵심)
-- category = '기타' (event_category enum 값)
-- -------------------------------------------------------------
INSERT INTO events (id, host_id, title, category, event_date, max_participants)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '[TEST] Concurrent Approval Test',
  '기타',
  now() + INTERVAL '7 days',
  5
)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- STEP 5: 참여 신청 데이터 생성 (10명 모두 pending 상태)
-- created_at에 미세한 시간 차이를 두어 ORDER BY 정렬 보장
-- -------------------------------------------------------------
INSERT INTO participations (id, event_id, user_id, status)
SELECT
  gen_random_uuid(),
  e.id,
  u.id,
  'pending'
FROM events e
CROSS JOIN (
  VALUES
    ('00000000-0000-0000-0001-000000000001'::uuid),
    ('00000000-0000-0000-0001-000000000002'::uuid),
    ('00000000-0000-0000-0001-000000000003'::uuid),
    ('00000000-0000-0000-0001-000000000004'::uuid),
    ('00000000-0000-0000-0001-000000000005'::uuid),
    ('00000000-0000-0000-0001-000000000006'::uuid),
    ('00000000-0000-0000-0001-000000000007'::uuid),
    ('00000000-0000-0000-0001-000000000008'::uuid),
    ('00000000-0000-0000-0001-000000000009'::uuid),
    ('00000000-0000-0000-0001-000000000010'::uuid)
) AS u(id)
WHERE e.title = '[TEST] Concurrent Approval Test';

-- -------------------------------------------------------------
-- STEP 6: 생성 확인 SELECT
-- 이벤트 정보와 pending 참여 수를 출력
-- -------------------------------------------------------------
SELECT
  e.id        AS event_id,
  e.title,
  e.max_participants,
  COUNT(p.id) AS pending_count
FROM events e
LEFT JOIN participations p
  ON p.event_id = e.id AND p.status = 'pending'
WHERE e.title = '[TEST] Concurrent Approval Test'
GROUP BY e.id, e.title, e.max_participants;
