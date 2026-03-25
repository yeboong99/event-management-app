-- 승인된 참여자도 비공개 이벤트 조회 가능 정책 추가
-- is_approved_participant_for_event() 함수는 20260325000200 마이그레이션에서 이미 생성됨
CREATE POLICY "승인된 참여자도 이벤트 조회 가능"
  ON events FOR SELECT
  USING (is_approved_participant_for_event(id));
