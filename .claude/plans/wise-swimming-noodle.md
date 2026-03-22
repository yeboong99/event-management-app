# Task 41: posts 테이블 updated_at 트리거 적용 및 마이그레이션 검증

## Context

Task 30에서 생성된 `update_updated_at_column()` 함수가 participations 테이블에만 적용되어 있고, posts 테이블에는 아직 트리거가 없습니다. 이를 추가하고 전체 마이그레이션 체인(31→40→41)의 무결성을 검증합니다.

## 현재 마이그레이션 파일 현황

| 파일                                       | 내용                                                      |
| ------------------------------------------ | --------------------------------------------------------- |
| `20260322000000_create_participations.sql` | participations 테이블 + `update_updated_at_column()` 함수 |
| `20260322000100_create_posts.sql`          | posts 테이블 스키마 + 인덱스                              |
| `20260322000200_posts_rls.sql`             | posts 테이블 RLS 정책 4개                                 |
| `20260322000300_posts_trigger.sql`         | **[신규 생성 필요]** posts 트리거                         |

## 담당 서브에이전트

- **nextjs-supabase-fullstack**: 전체 작업 담당 (DB 트리거, 마이그레이션 검증)
- **nextjs-ui-markup**: 해당 없음 (UI 작업 없음)

---

## 구현 계획 (nextjs-supabase-fullstack 서브에이전트)

### Step 1: 마이그레이션 파일 생성

`supabase/migrations/20260322000300_posts_trigger.sql` 파일 생성:

```sql
-- posts 테이블 updated_at 자동 갱신 트리거
-- update_updated_at_column() 함수는 20260322000000_create_participations.sql에서 생성됨
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 2: Supabase MCP로 마이그레이션 적용

`mcp__supabase__apply_migration`으로 트리거 마이그레이션 적용

### Step 3: 마이그레이션 검증 (SQL 실행)

`mcp__supabase__execute_sql`로 아래 항목들을 순서대로 검증:

1. **posts 테이블 구조 확인**

   ```sql
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name = 'posts' ORDER BY ordinal_position;
   ```

2. **RLS 활성화 여부 확인**

   ```sql
   SELECT relrowsecurity FROM pg_class WHERE relname = 'posts';
   ```

3. **RLS 정책 목록 확인**

   ```sql
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'posts';
   ```

4. **트리거 존재 확인**

   ```sql
   SELECT trigger_name FROM information_schema.triggers
   WHERE event_object_table = 'posts';
   ```

5. **트리거 동작 테스트**

   ```sql
   -- 테스트용 INSERT 후 UPDATE
   -- (auth 컨텍스트 없이 직접 검증)
   SELECT trigger_name, event_manipulation, action_timing
   FROM information_schema.triggers
   WHERE event_object_table = 'posts' AND trigger_name = 'update_posts_updated_at';
   ```

6. **마이그레이션 적용 순서 확인**
   ```sql
   SELECT name, executed_at FROM supabase_migrations.schema_migrations ORDER BY name;
   ```

### Step 4: TypeScript 타입 검증

`npm run type-check` 실행하여 기존 타입 오류 없음 확인

---

## 핵심 파일 경로

- 신규: `supabase/migrations/20260322000300_posts_trigger.sql`
- 참조: `supabase/migrations/20260322000000_create_participations.sql` (update_updated_at_column 함수)
- 참조: `supabase/migrations/20260322000100_create_posts.sql` (posts 테이블 구조)
- 참조: `supabase/migrations/20260322000200_posts_rls.sql` (RLS 정책)

## 검증 방법

1. 마이그레이션 적용 후 `pg_triggers`에서 `update_posts_updated_at` 트리거 존재 확인
2. posts 테이블 구조, RLS, 정책 4개 모두 확인
3. `npm run type-check` 통과 확인
