# Task 4: Migration 002 — events 테이블 생성 + RLS

## Context

이벤트 관리 플랫폼의 핵심 데이터인 이벤트를 저장하는 `events` 테이블이 아직 존재하지 않는다.
Task 3의 DB 변경(profiles.name, profiles.role, ENUM 3개)은 이미 반영되어 있으므로 Task 4에 바로 착수할 수 있다.
Supabase MCP(`mcp__supabase__apply_migration`)를 사용해 마이그레이션을 적용하고, TypeScript 타입을 재생성한다.

## 전제 조건

- Task 3 DB 적용 완료 확인 ✅ (database.types.ts에 ENUM 3개 및 profiles.role, name 반영됨)
- Supabase 프로젝트 연결됨 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 확인됨)

## 구현 계획

### Step 1: events 테이블 생성 마이그레이션 적용

`mcp__supabase__apply_migration`으로 다음 SQL 실행:

```sql
-- events 테이블 생성
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category event_category NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  max_participants INTEGER,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_events_host_id ON events(host_id);

-- updated_at 자동 갱신 함수 (존재하지 않을 경우만 생성)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

### Step 2: RLS 활성화 및 정책 5개 적용

```sql
-- RLS 활성화
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- SELECT: 공개 이벤트는 모든 사용자
CREATE POLICY "Public events are viewable by everyone"
ON events FOR SELECT
USING (is_public = true);

-- SELECT: 주최자는 본인의 비공개 이벤트도 조회 가능
CREATE POLICY "Host can view their private events"
ON events FOR SELECT
USING (auth.uid() = host_id);

-- INSERT: 인증 사용자만 생성 가능, host_id는 본인이어야 함
CREATE POLICY "Authenticated users can create events"
ON events FOR INSERT
WITH CHECK (auth.uid() = host_id);

-- UPDATE: 주최자만 수정 가능
CREATE POLICY "Host can update their events"
ON events FOR UPDATE
USING (auth.uid() = host_id);

-- DELETE: 주최자만 삭제 가능
CREATE POLICY "Host can delete their events"
ON events FOR DELETE
USING (auth.uid() = host_id);
```

### Step 3: TypeScript 타입 재생성

`mcp__supabase__generate_typescript_types`로 타입 재생성 후 `types/database.types.ts`에 덮어쓰기.

수정 대상 파일:

- **`types/database.types.ts`** — 자동생성 파일, 덮어쓰기

### Step 4: 검증

- `mcp__supabase__execute_sql`로 events 테이블 스키마 확인
- RLS 정책 5개 존재 확인
- types/database.types.ts에 events 테이블 타입 반영 확인
- `npm run type-check` 성공 확인

## 수정될 파일

| 파일                      | 변경 유형                                          |
| ------------------------- | -------------------------------------------------- |
| `types/database.types.ts` | 자동생성 덮어쓰기 (events 테이블 + ENUM 타입 반영) |

## 검증 방법

1. Supabase Dashboard에서 events 테이블 12개 컬럼 확인
2. `SELECT * FROM pg_policies WHERE tablename = 'events';` — 5개 정책 확인
3. `npm run type-check` — 타입 오류 0건
4. `npm run build` — 빌드 성공
