-- =============================================
-- 카풀 기능 스키마 생성
-- carpools: 카풀 등록 테이블
-- carpool_requests: 카풀 탑승 요청 테이블
-- =============================================

-- 카풀 요청 상태 ENUM 타입
CREATE TYPE carpool_request_status AS ENUM ('pending', 'approved', 'rejected');

-- =============================================
-- carpools 테이블
-- 이벤트에 등록된 카풀 정보를 관리
-- =============================================
CREATE TABLE carpools (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  driver_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  departure_place  TEXT NOT NULL,
  departure_time   TIMESTAMPTZ,
  total_seats      INTEGER NOT NULL CHECK (total_seats >= 1 AND total_seats <= 10),
  description      TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- carpool_requests 테이블
-- 카풀 탑승 요청 정보를 관리
-- 동일한 카풀에 동일 사용자가 중복 요청 불가
-- =============================================
CREATE TABLE carpool_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carpool_id   UUID NOT NULL REFERENCES carpools(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       carpool_request_status NOT NULL DEFAULT 'pending',
  message      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(carpool_id, passenger_id)
);

-- =============================================
-- 인덱스
-- 자주 조회되는 외래 키 컬럼에 인덱스 생성
-- =============================================
CREATE INDEX idx_carpools_event_id ON carpools(event_id);
CREATE INDEX idx_carpool_requests_carpool_id ON carpool_requests(carpool_id);
CREATE INDEX idx_carpool_requests_passenger_id ON carpool_requests(passenger_id);

-- =============================================
-- updated_at 자동 갱신 트리거
-- update_updated_at_column 함수는 이미 존재하므로 재생성하지 않음
-- =============================================
CREATE TRIGGER update_carpools_updated_at
  BEFORE UPDATE ON carpools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carpool_requests_updated_at
  BEFORE UPDATE ON carpool_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS (Row Level Security) 설정 - carpools
-- =============================================
ALTER TABLE carpools ENABLE ROW LEVEL SECURITY;

-- SELECT: 이벤트 주최자 또는 해당 이벤트 승인된 참여자만 조회 가능
-- NOTE: participations 서브쿼리에 p alias 사용 — carpools.event_id와 명확히 구분하여 self-reference 방지
CREATE POLICY "카풀 조회"
  ON carpools FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = carpools.event_id
        AND events.host_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM participations p
      WHERE p.event_id = carpools.event_id
        AND p.user_id = auth.uid()
        AND p.status = 'approved'
    )
  );

-- INSERT: driver_id가 본인이며 이벤트 주최자 또는 승인된 참여자만 카풀 등록 가능
CREATE POLICY "카풀 등록"
  ON carpools FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = carpools.event_id
          AND events.host_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM participations p
        WHERE p.event_id = carpools.event_id
          AND p.user_id = auth.uid()
          AND p.status = 'approved'
      )
    )
  );

-- DELETE: 카풀 등록자(driver) 또는 이벤트 주최자만 삭제 가능
CREATE POLICY "카풀 삭제"
  ON carpools FOR DELETE
  TO authenticated
  USING (
    driver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = carpools.event_id
        AND events.host_id = auth.uid()
    )
  );

-- =============================================
-- RLS (Row Level Security) 설정 - carpool_requests
-- =============================================
ALTER TABLE carpool_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: 요청자 본인, 해당 카풀 드라이버, 이벤트 주최자만 조회 가능
-- NOTE: carpools/participations 서브쿼리에 c, p alias 사용 — self-reference 방지
CREATE POLICY "카풀 요청 조회"
  ON carpool_requests FOR SELECT
  TO authenticated
  USING (
    passenger_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM carpools c
      WHERE c.id = carpool_requests.carpool_id
        AND c.driver_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM carpools c
      JOIN events ON events.id = c.event_id
      WHERE c.id = carpool_requests.carpool_id
        AND events.host_id = auth.uid()
    )
  );

-- INSERT: passenger_id가 본인이며 해당 이벤트의 승인된 참여자만 탑승 요청 가능
CREATE POLICY "카풀 탑승 요청"
  ON carpool_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    passenger_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM carpools c
      JOIN participations p ON p.event_id = c.event_id
      WHERE c.id = carpool_requests.carpool_id
        AND p.user_id = auth.uid()
        AND p.status = 'approved'
    )
  );

-- UPDATE: 해당 카풀 드라이버 또는 이벤트 주최자만 요청 상태(status) 변경 가능
CREATE POLICY "카풀 요청 상태 변경"
  ON carpool_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carpools c
      WHERE c.id = carpool_requests.carpool_id
        AND c.driver_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM carpools c
      JOIN events ON events.id = c.event_id
      WHERE c.id = carpool_requests.carpool_id
        AND events.host_id = auth.uid()
    )
  );

-- DELETE: 요청자 본인만 취소 가능
CREATE POLICY "카풀 요청 취소"
  ON carpool_requests FOR DELETE
  TO authenticated
  USING (passenger_id = auth.uid());
