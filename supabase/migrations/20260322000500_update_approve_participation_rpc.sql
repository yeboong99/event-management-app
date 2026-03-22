CREATE OR REPLACE FUNCTION approve_participation(
  p_participation_id UUID,
  p_event_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INT;
  v_max INT;
BEGIN
  -- events 행에 대한 잠금 획득 (동시성 제어)
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

  -- max_participants가 NULL이면 무제한
  IF v_max IS NOT NULL AND v_current_count >= v_max THEN
    RAISE EXCEPTION 'max_participants_exceeded';
  END IF;

  -- 승인 처리
  UPDATE participations
  SET status = 'approved', updated_at = now()
  WHERE id = p_participation_id AND event_id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'participation_not_found';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
