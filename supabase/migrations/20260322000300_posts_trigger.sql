-- posts 테이블 updated_at 자동 갱신 트리거
-- update_updated_at_column() 함수는 20260322000000_create_participations.sql에서 생성됨
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
