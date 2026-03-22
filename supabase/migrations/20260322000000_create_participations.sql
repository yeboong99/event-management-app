-- participations 테이블 생성
CREATE TABLE participations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     participation_status NOT NULL DEFAULT 'pending',
  message    TEXT,
  attended   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 인덱스
CREATE INDEX idx_participations_event_id ON participations(event_id);
CREATE INDEX idx_participations_user_id_status ON participations(user_id, status);

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_participations_updated_at
  BEFORE UPDATE ON participations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 참여 데이터 + 이벤트 주최자는 해당 이벤트 전체 조회 가능
CREATE POLICY "참여자 목록 조회" ON participations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events
      WHERE id = participations.event_id AND host_id = auth.uid()
    )
  );

-- INSERT: 인증 사용자는 자기 자신으로만 참여 신청 가능
CREATE POLICY "참여 신청" ON participations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: 이벤트 주최자만 status/attended 변경 가능
CREATE POLICY "참여 상태 변경" ON participations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = participations.event_id AND host_id = auth.uid()
    )
  );

-- DELETE: 본인의 pending 상태 참여만 삭제 가능
CREATE POLICY "참여 취소" ON participations
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'pending'
  );
