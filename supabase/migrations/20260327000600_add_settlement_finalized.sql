-- events 테이블에 정산 확정 컬럼 추가
ALTER TABLE events
  ADD COLUMN is_settlement_finalized BOOLEAN NOT NULL DEFAULT FALSE;
