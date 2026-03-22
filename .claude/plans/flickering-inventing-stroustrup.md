# Task 40: posts 테이블 RLS 정책 구현

## Context

Task 31에서 `posts` 테이블 스키마와 인덱스가 생성되었지만 RLS 정책이 없는 상태입니다.
이 작업은 posts 테이블에 행 수준 보안(Row Level Security)을 활성화하고, 주최자/승인 참여자 기반 접근 제어 정책 4개(SELECT/INSERT/UPDATE/DELETE)를 구현합니다.

## 담당 서브에이전트

- **nextjs-supabase-fullstack**: 전체 작업 담당 (순수 DB 마이그레이션 작업, UI 없음)
- nextjs-ui-markup: 해당 없음 (UI 변경 없음)

## 구현 계획

### 1. 새 마이그레이션 파일 생성

- **파일명**: `supabase/migrations/20260322000200_posts_rls.sql`
- `mcp__supabase__apply_migration`으로 적용

### 2. 마이그레이션 SQL 내용

```sql
-- RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: 주최자 + 승인 참여자만 조회
CREATE POLICY "주최자와 승인 참여자만 조회 가능"
  ON posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = posts.event_id AND events.host_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM participations
      WHERE participations.event_id = posts.event_id
        AND participations.user_id = auth.uid()
        AND participations.status = 'approved'
    )
  );

-- 2. INSERT: 공지(notice)=주최자만, 댓글(comment)=주최자+승인참여자
CREATE POLICY "주최자만 공지 작성 가능"
  ON posts FOR INSERT
  WITH CHECK (
    (type = 'notice' AND EXISTS (
      SELECT 1 FROM events WHERE events.id = event_id AND events.host_id = auth.uid()
    ))
    OR
    (type = 'comment' AND (
      EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.host_id = auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM participations
        WHERE participations.event_id = event_id
          AND participations.user_id = auth.uid()
          AND participations.status = 'approved'
      )
    ))
  );

-- 3. UPDATE: 본인 작성 게시물만
CREATE POLICY "본인 게시물만 수정 가능"
  ON posts FOR UPDATE
  USING (author_id = auth.uid());

-- 4. DELETE: 본인 또는 주최자
CREATE POLICY "본인 또는 주최자만 삭제 가능"
  ON posts FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events WHERE events.id = event_id AND events.host_id = auth.uid()
    )
  );
```

### 3. 주요 참고 사항

- `participations.user_id`는 `profiles(id)` 참조이지만 `auth.uid()`와 동일한 UUID 값 사용 → RLS에서 직접 비교 가능
- `posts.author_id`는 `auth.users(id)` 직접 참조 → `auth.uid()`와 직접 비교
- Task 30의 participations RLS 패턴과 동일한 스타일로 작성

### 4. 관련 파일

| 파일                                                           | 용도                     |
| -------------------------------------------------------------- | ------------------------ |
| `supabase/migrations/20260322000100_create_posts.sql`          | posts 테이블 원본 (참고) |
| `supabase/migrations/20260322000000_create_participations.sql` | RLS 패턴 참고            |

## 검증 방법

1. `mcp__supabase__list_migrations`으로 마이그레이션 적용 확인
2. `mcp__supabase__execute_sql`로 정책 적용 여부 확인:
   ```sql
   SELECT policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename = 'posts';
   ```
3. Task 40 상태를 'done'으로 업데이트
