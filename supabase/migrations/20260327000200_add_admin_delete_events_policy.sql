-- 관리자가 모든 이벤트를 삭제할 수 있는 RLS 정책 추가
CREATE POLICY "Admin can delete any events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );
