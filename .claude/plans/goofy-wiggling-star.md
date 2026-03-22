# Task 31: posts 테이블 스키마 및 인덱스 생성

## Context

공지(notice)와 댓글(comment)을 관리하는 posts 테이블 기본 구조를 구축합니다.
RLS 정책(Task 40)과 updated_at 트리거(Task 41)는 별도 태스크에서 구현하므로 이번 작업에서는 제외합니다.
의존성인 Task 30(participations 테이블)은 이미 완료된 상태입니다.

## 현재 상태

- 마이그레이션 파일: `supabase/migrations/20260322000000_create_participations.sql` (1개 존재)
- events 테이블: Supabase에 존재 (id 타입: UUID)
- posts 타입: `types/database.types.ts`에 없음 → 마이그레이션 후 재생성 필요

## 서브에이전트 활용

`nextjs-supabase-fullstack` 서브에이전트가 아래 구현 단계 전체를 담당합니다.
(Supabase 마이그레이션 생성 및 적용, TypeScript 타입 재생성이 모두 이 에이전트의 전문 영역)

## 구현 계획

### 1. 마이그레이션 파일 생성

**파일**: `supabase/migrations/20260322000100_create_posts.sql`

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'comment' CHECK (type IN ('notice', 'comment')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_event_id_created ON posts(event_id, created_at DESC);
```

### 2. Supabase MCP로 마이그레이션 적용

`mcp__supabase__apply_migration` 도구로 마이그레이션 실행

### 3. TypeScript 타입 재생성

`mcp__supabase__generate_typescript_types` 도구로 `types/database.types.ts` 업데이트

## 검증 계획

1. `mcp__supabase__execute_sql`로 테이블 구조 확인
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'posts' ORDER BY ordinal_position;
   ```
2. CHECK 제약 테스트: `INSERT INTO posts(type=...) VALUES('invalid', ...)` → 에러 확인
3. 인덱스 존재 확인:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'posts';
   ```

## 수정 파일

- **신규**: `supabase/migrations/20260322000100_create_posts.sql`
- **업데이트**: `types/database.types.ts` (자동생성)
