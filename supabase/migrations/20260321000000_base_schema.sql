-- =============================================================
-- 기반 스키마: profiles, events 테이블 및 enum 타입 정의
-- (원격 Supabase 스키마에서 역추출하여 로컬 테스트용으로 작성)
-- =============================================================

-- event_category enum
CREATE TYPE event_category AS ENUM (
  '생일파티', '파티모임', '워크샵', '스터디', '운동스포츠', '기타'
);

-- participation_status enum
CREATE TYPE participation_status AS ENUM (
  'pending', 'approved', 'rejected'
);

-- profiles 테이블
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  name       TEXT,
  username   TEXT,
  avatar_url TEXT,
  bio        TEXT,
  website    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  role       TEXT DEFAULT 'user'
);

-- events 테이블
CREATE TABLE events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  category         event_category NOT NULL,
  event_date       TIMESTAMPTZ NOT NULL,
  location         TEXT,
  max_participants INTEGER,
  cover_image_url  TEXT,
  is_public        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
