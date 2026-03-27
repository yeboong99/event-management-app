-- 관리자가 모든 이벤트를 수정할 수 있는 RLS 정책 추가
-- (정산 확정 해제 등 관리자 이벤트 수정 기능에 필요)
CREATE POLICY "Admin can update any events"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );
