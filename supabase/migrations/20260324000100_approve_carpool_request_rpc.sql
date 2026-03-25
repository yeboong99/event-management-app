-- =============================================
-- approve_carpool_request RPC 함수
-- 카풀 탑승 신청 승인 시 좌석 초과를 원자적으로 방지
-- FOR UPDATE 잠금으로 동시성 제어
-- =============================================
CREATE OR REPLACE FUNCTION approve_carpool_request(
  p_request_id UUID,
  p_carpool_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_total_seats INTEGER;
BEGIN
  -- carpools 행에 대한 잠금 획득 (동시성 제어)
  SELECT total_seats INTO v_total_seats
  FROM carpools
  WHERE id = p_carpool_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'carpool_not_found';
  END IF;

  -- 현재 승인된 탑승자 수 조회
  SELECT COUNT(*) INTO v_current_count
  FROM carpool_requests
  WHERE carpool_id = p_carpool_id AND status = 'approved';

  -- 좌석 초과 체크
  IF v_current_count >= v_total_seats THEN
    RAISE EXCEPTION 'seats_full';
  END IF;

  -- 승인 처리
  UPDATE carpool_requests
  SET status = 'approved', updated_at = now()
  WHERE id = p_request_id AND carpool_id = p_carpool_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
