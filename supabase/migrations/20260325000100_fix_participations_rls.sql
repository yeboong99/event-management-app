-- 승인된 참여자 여부 확인 헬퍼 함수 (SECURITY DEFINER로 RLS 재귀 방지)
CREATE OR REPLACE FUNCTION is_approved_participant_for_event(event_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participations
    WHERE event_id = event_uuid
      AND user_id = auth.uid()
      AND status = 'approved'
  );
$$;

-- 기존 SELECT 정책 삭제 및 재생성 (트랜잭션 내 원자 실행)
DROP POLICY "참여자 목록 조회" ON participations;

CREATE POLICY "참여자 목록 조회" ON participations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()                                    -- 본인 참여 데이터
    OR EXISTS (
      SELECT 1 FROM events
      WHERE id = participations.event_id AND host_id = auth.uid()
    )                                                       -- 이벤트 주최자
    OR (
      status = 'approved'                                   -- 승인된 참여자끼리 조회 가능
      AND is_approved_participant_for_event(participations.event_id)
    )
  );
