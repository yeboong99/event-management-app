CREATE OR REPLACE FUNCTION approve_participation(
  p_participation_id UUID,
  p_event_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INT;
  v_max INT;
BEGIN
  -- events 행에 대한 잠금 획득 (동시성 제어)
  -- FOR UPDATE: 트랜잭션 종료 전까지 다른 세션의 동일 행 잠금 차단
  SELECT max_participants INTO v_max
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  -- 현재 승인된 참여자 수 조회
  SELECT COUNT(*) INTO v_current_count
  FROM participations
  WHERE event_id = p_event_id AND status = 'approved';

  -- max_participants 검증 및 승인 처리는 Task 42에서 구현
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
