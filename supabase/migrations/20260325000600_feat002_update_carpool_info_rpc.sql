-- 카풀 정보 수정 RPC
-- driver_id, event_id 파라미터 제외로 변경 원천 차단
-- total_seats는 현재 승인된 탑승자 수 이상으로만 변경 가능
CREATE OR REPLACE FUNCTION update_carpool_info(
  p_carpool_id      UUID,
  p_departure_place TEXT,
  p_departure_time  TIMESTAMPTZ,
  p_total_seats     INTEGER,
  p_description     TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approved_count INTEGER;
BEGIN
  -- FOR UPDATE 잠금 (동시성 제어)
  PERFORM id FROM carpools WHERE id = p_carpool_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'carpool_not_found';
  END IF;

  -- 현재 승인된 탑승자 수 조회
  SELECT COUNT(*) INTO v_approved_count
  FROM carpool_requests
  WHERE carpool_id = p_carpool_id AND status = 'approved';

  -- total_seats 감소 방지
  IF p_total_seats < v_approved_count THEN
    RAISE EXCEPTION 'seats_below_approved';
  END IF;

  -- driver_id, event_id 파라미터 제외로 변경 원천 차단
  UPDATE carpools SET
    departure_place = p_departure_place,
    departure_time  = p_departure_time,
    total_seats     = p_total_seats,
    description     = p_description
  WHERE id = p_carpool_id;

  RETURN TRUE;
END;
$$;
