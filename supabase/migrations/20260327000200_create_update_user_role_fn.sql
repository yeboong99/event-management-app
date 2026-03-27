-- update_user_role: SECURITY DEFINER 함수로 RLS 우회하여 admin이 다른 사용자 역할 변경
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 호출자가 admin인지 검증
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- 자기 자신의 역할 변경 차단
  IF (SELECT auth.uid()) = target_user_id THEN
    RAISE EXCEPTION 'self_role_change_blocked';
  END IF;

  -- 역할 업데이트
  UPDATE profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
END;
$$;
