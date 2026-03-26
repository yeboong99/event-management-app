-- FLOW-001: 비공개 이벤트 초대 토큰 추가
-- events 테이블에 invite_token 컬럼 추가 (기존 행은 DEFAULT로 자동 채워짐)

ALTER TABLE events
  ADD COLUMN invite_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;

CREATE UNIQUE INDEX events_invite_token_idx ON events (invite_token);

-- RLS 우회 RPC: 초대 토큰으로 비공개 이벤트 기본 정보 조회
-- SECURITY DEFINER: RLS를 우회하여 비공개 이벤트도 조회 가능
-- 반환 컬럼에 invite_token 자체는 포함하지 않아 토큰 노출 방지
CREATE OR REPLACE FUNCTION get_event_by_invite_token(p_invite_token UUID)
RETURNS TABLE (
  id              UUID,
  title           TEXT,
  description     TEXT,
  category        event_category,
  event_date      TIMESTAMPTZ,
  location        TEXT,
  max_participants INTEGER,
  cover_image_url TEXT,
  host_id         UUID,
  host_name       TEXT,
  is_public       BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id,
    e.title,
    e.description,
    e.category,
    e.event_date,
    e.location,
    e.max_participants,
    e.cover_image_url,
    e.host_id,
    p.name AS host_name,
    e.is_public
  FROM events e
  LEFT JOIN profiles p ON p.id = e.host_id
  WHERE e.invite_token = p_invite_token
  LIMIT 1;
$$;
