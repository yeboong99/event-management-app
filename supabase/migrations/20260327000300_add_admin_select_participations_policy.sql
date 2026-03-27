-- Admin이 모든 participations를 조회할 수 있도록 RLS 정책 추가
CREATE POLICY "Admin can view all participations"
ON participations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  )
);
