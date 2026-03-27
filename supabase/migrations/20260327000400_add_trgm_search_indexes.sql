-- ILIKE '%...%' 검색 성능 개선을 위한 pg_trgm GIN 인덱스 추가
-- profiles.name, profiles.email, events.title 대상
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_profiles_name_trgm  ON profiles USING gin (name gin_trgm_ops);
CREATE INDEX idx_profiles_email_trgm ON profiles USING gin (email gin_trgm_ops);
CREATE INDEX idx_events_title_trgm   ON events   USING gin (title gin_trgm_ops);
