-- settlement_items 테이블에 작성자(created_by) 컬럼 추가
ALTER TABLE settlement_items
  ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- UPDATE 정책 재정의: 주최자 또는 항목 작성자
DROP POLICY "settlement_items_update_policy" ON settlement_items;
CREATE POLICY "settlement_items_update_policy" ON settlement_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = settlement_items.event_id
        AND host_id = (SELECT auth.uid())
    )
    OR created_by = (SELECT auth.uid())
  );

-- DELETE 정책 재정의: 주최자 또는 항목 작성자
DROP POLICY "settlement_items_delete_policy" ON settlement_items;
CREATE POLICY "settlement_items_delete_policy" ON settlement_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = settlement_items.event_id
        AND host_id = (SELECT auth.uid())
    )
    OR created_by = (SELECT auth.uid())
  );
