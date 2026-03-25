-- carpools.driver_id 외래 키 인덱스 추가
-- 드라이버별 카풀 목록 조회 및 RLS 정책 평가 성능 개선
CREATE INDEX idx_carpools_driver_id ON carpools(driver_id);
