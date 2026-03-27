-- 관리자 대시보드 KPI 집계 RPC 함수
-- SECURITY DEFINER: RLS를 우회하여 전체 데이터 집계
-- admin role 검증 포함
CREATE OR REPLACE FUNCTION get_admin_kpi_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_result JSON;
BEGIN
  -- 호출자 admin 검증
  SELECT role INTO v_caller_role
  FROM profiles WHERE id = (SELECT auth.uid());

  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'permission_denied: admin role required';
  END IF;

  SELECT json_build_object(
    'total_events',           (SELECT COUNT(*) FROM events),
    'new_events_this_month',  (SELECT COUNT(*) FROM events
                               WHERE created_at >= date_trunc('month', now())),
    'total_users',            (SELECT COUNT(*) FROM profiles),
    'new_users_this_month',   (SELECT COUNT(*) FROM profiles
                               WHERE created_at >= date_trunc('month', now())),
    'avg_participation_rate', (
      SELECT COALESCE(ROUND(AVG(approved_count::NUMERIC / e.max_participants * 100), 1), 0)
      FROM events e
      JOIN (
        SELECT event_id, COUNT(*) AS approved_count
        FROM participations WHERE status = 'approved'
        GROUP BY event_id
      ) p ON p.event_id = e.id
      WHERE e.max_participants IS NOT NULL AND e.max_participants > 0
    ),
    'carpool_match_rate', (
      SELECT COALESCE(
        ROUND(COUNT(*) FILTER (WHERE status = 'approved')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1),
        0
      )
      FROM carpool_requests
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
