-- QUAL-001: posts/profiles RLS 역할 일관성 수정
-- TO public(미지정) → TO authenticated 변경 (auth.uid() 조건이 있는 정책)
-- events의 TO public은 미인증 사용자 공개 이벤트 탐색을 위해 의도적으로 유지

-- =============================================
-- posts 테이블: 4개 정책 TO authenticated 변경
-- =============================================

DROP POLICY IF EXISTS "주최자와 승인 참여자만 조회 가능" ON posts;
CREATE POLICY "주최자와 승인 참여자만 조회 가능"
  ON posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = posts.event_id
        AND events.host_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM participations
      WHERE participations.event_id = posts.event_id
        AND participations.user_id = (SELECT auth.uid())
        AND participations.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "주최자만 공지 작성 가능" ON posts;
CREATE POLICY "주최자만 공지 작성 가능"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    (type = 'notice' AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = posts.event_id
        AND events.host_id = (SELECT auth.uid())
    ))
    OR
    (type = 'comment' AND (
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = posts.event_id
          AND events.host_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM participations p
        WHERE p.event_id = posts.event_id
          AND p.user_id = (SELECT auth.uid())
          AND p.status = 'approved'
      )
    ))
  );

DROP POLICY IF EXISTS "본인 게시물만 수정 가능" ON posts;
CREATE POLICY "본인 게시물만 수정 가능"
  ON posts FOR UPDATE
  TO authenticated
  USING (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "본인 또는 주최자만 삭제 가능" ON posts;
CREATE POLICY "본인 또는 주최자만 삭제 가능"
  ON posts FOR DELETE
  TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
        AND events.host_id = (SELECT auth.uid())
    )
  );

-- =============================================
-- profiles 테이블: 2개 정책 TO authenticated 변경
-- =============================================

DROP POLICY IF EXISTS "users can view own profile" ON profiles;
CREATE POLICY "users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "users can update own profile" ON profiles;
CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);
