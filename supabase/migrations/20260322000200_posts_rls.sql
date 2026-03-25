-- RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: 주최자 + 승인 참여자만 조회
CREATE POLICY "주최자와 승인 참여자만 조회 가능"
  ON posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = posts.event_id AND events.host_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM participations
      WHERE participations.event_id = posts.event_id
        AND participations.user_id = auth.uid()
        AND participations.status = 'approved'
    )
  );

-- 2. INSERT: 공지(notice)=주최자만, 댓글(comment)=주최자+승인참여자
-- NOTE: participations subquery에 p alias 사용 — posts.event_id와 명확히 구분하여 self-reference 방지
CREATE POLICY "주최자만 공지 작성 가능"
  ON posts FOR INSERT
  WITH CHECK (
    (type = 'notice' AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = posts.event_id AND events.host_id = auth.uid()
    ))
    OR
    (type = 'comment' AND (
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = posts.event_id AND events.host_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM participations p
        WHERE p.event_id = posts.event_id
          AND p.user_id = auth.uid()
          AND p.status = 'approved'
      )
    ))
  );

-- 3. UPDATE: 본인 작성 게시물만
CREATE POLICY "본인 게시물만 수정 가능"
  ON posts FOR UPDATE
  USING (author_id = auth.uid());

-- 4. DELETE: 본인 또는 주최자
CREATE POLICY "본인 또는 주최자만 삭제 가능"
  ON posts FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events WHERE events.id = event_id AND events.host_id = auth.uid()
    )
  );
