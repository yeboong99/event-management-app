-- 관리자가 모든 이벤트의 정산 항목을 조회할 수 있도록 SELECT 정책 추가
CREATE POLICY "settlement_items_admin_select_policy" ON settlement_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );
