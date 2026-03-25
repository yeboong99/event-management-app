-- PERF-001: RLS 정책의 auth.uid() 반복 평가 최적화
-- auth.uid() → (select auth.uid()) 변경으로 쿼리 실행 시 1회만 평가(init plan)되도록 수정
-- 영향 테이블: participations, posts, carpools, carpool_requests
-- 참고: 기존 마이그레이션 파일은 수정하지 않고, 정책을 DROP 후 재생성

-- =============================================
-- 헬퍼 함수 최적화 (is_approved_participant_for_event)
-- =============================================

CREATE OR REPLACE FUNCTION is_approved_participant_for_event(event_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participations
    WHERE event_id = event_uuid
      AND user_id = (SELECT auth.uid())
      AND status = 'approved'
  );
$$;

-- =============================================
-- participations RLS 최적화
-- =============================================

DROP POLICY "참여자 목록 조회" ON participations;
DROP POLICY "참여 신청" ON participations;
DROP POLICY "참여 상태 변경" ON participations;
DROP POLICY "참여 취소" ON participations;

-- SELECT: 본인 + 이벤트 주최자 + 승인된 참여자끼리 조회 가능
CREATE POLICY "참여자 목록 조회" ON participations
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM events
      WHERE id = participations.event_id
        AND host_id = (SELECT auth.uid())
    )
    OR (
      status = 'approved'
      AND is_approved_participant_for_event(participations.event_id)
    )
  );

-- INSERT: 인증 사용자는 자기 자신으로만 참여 신청 가능
CREATE POLICY "참여 신청" ON participations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE: 이벤트 주최자만 status/attended 변경 가능
CREATE POLICY "참여 상태 변경" ON participations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = participations.event_id
        AND host_id = (SELECT auth.uid())
    )
  );

-- DELETE: 본인의 pending 상태 참여만 삭제 가능
CREATE POLICY "참여 취소" ON participations
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND status = 'pending'
  );

-- =============================================
-- posts RLS 최적화
-- =============================================

DROP POLICY "주최자와 승인 참여자만 조회 가능" ON posts;
DROP POLICY "주최자만 공지 작성 가능" ON posts;
DROP POLICY "본인 게시물만 수정 가능" ON posts;
DROP POLICY "본인 또는 주최자만 삭제 가능" ON posts;

-- SELECT: 주최자 + 승인 참여자만 조회
CREATE POLICY "주최자와 승인 참여자만 조회 가능"
  ON posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = posts.event_id
        AND events.host_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM participations
      WHERE participations.event_id = posts.event_id
        AND participations.user_id = (SELECT auth.uid())
        AND participations.status = 'approved'
    )
  );

-- INSERT: 공지(notice)=주최자만, 댓글(comment)=주최자+승인참여자
CREATE POLICY "주최자만 공지 작성 가능"
  ON posts FOR INSERT
  WITH CHECK (
    (type = 'notice' AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = posts.event_id
        AND events.host_id = (SELECT auth.uid())
    ))
    OR
    (type = 'comment' AND (
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = posts.event_id
          AND events.host_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM participations p
        WHERE p.event_id = posts.event_id
          AND p.user_id = (SELECT auth.uid())
          AND p.status = 'approved'
      )
    ))
  );

-- UPDATE: 본인 작성 게시물만 수정 가능
CREATE POLICY "본인 게시물만 수정 가능"
  ON posts FOR UPDATE
  USING (author_id = (SELECT auth.uid()));

-- DELETE: 본인 또는 주최자
CREATE POLICY "본인 또는 주최자만 삭제 가능"
  ON posts FOR DELETE
  USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
        AND events.host_id = (SELECT auth.uid())
    )
  );

-- =============================================
-- carpools RLS 최적화
-- =============================================

DROP POLICY "카풀 조회" ON carpools;
DROP POLICY "카풀 등록" ON carpools;
DROP POLICY "카풀 삭제" ON carpools;

-- SELECT: 이벤트 주최자 또는 승인된 참여자만 조회 가능
CREATE POLICY "카풀 조회"
  ON carpools FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = carpools.event_id
        AND events.host_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM participations p
      WHERE p.event_id = carpools.event_id
        AND p.user_id = (SELECT auth.uid())
        AND p.status = 'approved'
    )
  );

-- INSERT: driver_id가 본인이며 이벤트 주최자 또는 승인된 참여자만 등록 가능
CREATE POLICY "카풀 등록"
  ON carpools FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_id = (SELECT auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = carpools.event_id
          AND events.host_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM participations p
        WHERE p.event_id = carpools.event_id
          AND p.user_id = (SELECT auth.uid())
          AND p.status = 'approved'
      )
    )
  );

-- DELETE: 카풀 등록자(driver) 또는 이벤트 주최자만 삭제 가능
CREATE POLICY "카풀 삭제"
  ON carpools FOR DELETE
  TO authenticated
  USING (
    driver_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = carpools.event_id
        AND events.host_id = (SELECT auth.uid())
    )
  );

-- =============================================
-- carpool_requests RLS 최적화
-- =============================================

DROP POLICY "카풀 요청 조회" ON carpool_requests;
DROP POLICY "카풀 탑승 요청" ON carpool_requests;
DROP POLICY "카풀 요청 상태 변경" ON carpool_requests;
DROP POLICY "카풀 요청 취소" ON carpool_requests;

-- SELECT: 요청자 본인, 해당 카풀 드라이버, 이벤트 주최자만 조회 가능
CREATE POLICY "카풀 요청 조회"
  ON carpool_requests FOR SELECT
  TO authenticated
  USING (
    passenger_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM carpools c
      WHERE c.id = carpool_requests.carpool_id
        AND c.driver_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM carpools c
      JOIN events ON events.id = c.event_id
      WHERE c.id = carpool_requests.carpool_id
        AND events.host_id = (SELECT auth.uid())
    )
  );

-- INSERT: passenger_id가 본인이며 해당 이벤트의 승인된 참여자만 탑승 요청 가능
CREATE POLICY "카풀 탑승 요청"
  ON carpool_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    passenger_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM carpools c
      JOIN participations p ON p.event_id = c.event_id
      WHERE c.id = carpool_requests.carpool_id
        AND p.user_id = (SELECT auth.uid())
        AND p.status = 'approved'
    )
  );

-- UPDATE: 해당 카풀 드라이버 또는 이벤트 주최자만 요청 상태 변경 가능
CREATE POLICY "카풀 요청 상태 변경"
  ON carpool_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carpools c
      WHERE c.id = carpool_requests.carpool_id
        AND c.driver_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM carpools c
      JOIN events ON events.id = c.event_id
      WHERE c.id = carpool_requests.carpool_id
        AND events.host_id = (SELECT auth.uid())
    )
  );

-- DELETE: 요청자 본인만 취소 가능
CREATE POLICY "카풀 요청 취소"
  ON carpool_requests FOR DELETE
  TO authenticated
  USING (passenger_id = (SELECT auth.uid()));

-- DELETE: 드라이버 또는 이벤트 주최자가 거절된 신청 삭제 가능
-- NOTE: 이 정책은 DB에만 존재하고 이전 마이그레이션 파일에 누락되어 있어 여기에 포함
CREATE POLICY "카풀 거절 신청 삭제 (드라이버/주최자)"
  ON carpool_requests FOR DELETE
  TO authenticated
  USING (
    status = 'rejected'
    AND (
      EXISTS (
        SELECT 1 FROM carpools c
        WHERE c.id = carpool_requests.carpool_id
          AND c.driver_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM carpools c
        JOIN events e ON e.id = c.event_id
        WHERE c.id = carpool_requests.carpool_id
          AND e.host_id = (SELECT auth.uid())
      )
    )
  );
