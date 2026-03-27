-- settlement_items 테이블 생성
CREATE TABLE settlement_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  paid_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  amount     INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- amount 양의 정수 CHECK 제약조건
ALTER TABLE settlement_items
  ADD CONSTRAINT settlement_items_amount_positive CHECK (amount > 0);

-- 인덱스
CREATE INDEX idx_settlement_items_event_id ON settlement_items(event_id);

-- updated_at 트리거 (update_updated_at_column()은 이미 정의됨)
CREATE TRIGGER update_settlement_items_updated_at
  BEFORE UPDATE ON settlement_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE settlement_items ENABLE ROW LEVEL SECURITY;

-- SELECT: 주최자 또는 승인된 참여자
CREATE POLICY "settlement_items_select_policy" ON settlement_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = settlement_items.event_id
        AND host_id = (SELECT auth.uid())
    )
    OR is_approved_participant_for_event(event_id)
  );

-- INSERT: 주최자 또는 승인된 참여자
CREATE POLICY "settlement_items_insert_policy" ON settlement_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
        AND host_id = (SELECT auth.uid())
    )
    OR is_approved_participant_for_event(event_id)
  );

-- UPDATE: 주최자만
CREATE POLICY "settlement_items_update_policy" ON settlement_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = settlement_items.event_id
        AND host_id = (SELECT auth.uid())
    )
  );

-- DELETE: 주최자만
CREATE POLICY "settlement_items_delete_policy" ON settlement_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = settlement_items.event_id
        AND host_id = (SELECT auth.uid())
    )
  );
