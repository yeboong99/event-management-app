-- PERF-003: events/profiles RLS auth.uid() 최적화
-- auth.uid() → (SELECT auth.uid()) 변경으로 PostgreSQL init plan 최적화 적용
-- 영향 테이블: events (4개 정책), profiles (2개 정책)
-- 참고: 기존 마이그레이션 파일은 수정하지 않고, 정책을 DROP 후 재생성

-- =============================================
-- events RLS 최적화 (4개 정책)
-- =============================================

DROP POLICY "Host can view their private events" ON events;
DROP POLICY "Authenticated users can create events" ON events;
DROP POLICY "Host can update their events" ON events;
DROP POLICY "Host can delete their events" ON events;

-- SELECT: 주최자가 자신의 비공개 이벤트 조회 가능
CREATE POLICY "Host can view their private events"
  ON events FOR SELECT
  USING ((SELECT auth.uid()) = host_id);

-- INSERT: 인증 사용자는 자기 자신을 host로 이벤트 생성 가능
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = host_id);

-- UPDATE: 주최자만 자신의 이벤트 수정 가능
CREATE POLICY "Host can update their events"
  ON events FOR UPDATE
  USING ((SELECT auth.uid()) = host_id);

-- DELETE: 주최자만 자신의 이벤트 삭제 가능
CREATE POLICY "Host can delete their events"
  ON events FOR DELETE
  USING ((SELECT auth.uid()) = host_id);

-- =============================================
-- profiles RLS 최적화 (2개 정책)
-- =============================================

DROP POLICY "users can view own profile" ON profiles;
DROP POLICY "users can update own profile" ON profiles;

-- SELECT: 본인 프로필 조회 가능
CREATE POLICY "users can view own profile"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

-- UPDATE: 본인 프로필만 수정 가능
CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);
