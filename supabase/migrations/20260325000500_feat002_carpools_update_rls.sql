-- 카풀 UPDATE RLS 정책 추가 (드라이버 본인 또는 이벤트 주최자)
CREATE POLICY "카풀 수정"
  ON carpools FOR UPDATE
  TO authenticated
  USING (
    driver_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = carpools.event_id
        AND events.host_id = (SELECT auth.uid())
    )
  );
