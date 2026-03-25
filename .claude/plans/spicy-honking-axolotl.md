# PERF-003: events/profiles RLS auth.uid() 최적화 계획

## Context

PERF-001에서 `participations`, `posts`, `carpools`, `carpool_requests` 4개 테이블의 `auth.uid()` 반복 평가 문제를 해결했으나, `events`와 `profiles` 테이블이 누락됐다.

두 테이블의 RLS 정책 중 `auth.uid()`를 직접 호출하는 6개 정책을 `(SELECT auth.uid())`로 교체하여 PostgreSQL init plan 최적화를 적용한다.

**문제:** `auth.uid()`는 행(row)마다 개별 재평가됨
**해결:** `(SELECT auth.uid())`로 감싸면 실행 계획 수립 시 1회만 평가됨
**참조:** `supabase/migrations/20260325000200_fix_rls_auth_uid_optimization.sql` (PERF-001 패턴)

---

## 최적화 대상 정책 (총 6개)

### events 테이블 (4개 정책)

| 정책명                                  | 동작   | 현재 조건                           | 변경 후                         |
| --------------------------------------- | ------ | ----------------------------------- | ------------------------------- |
| `Host can view their private events`    | SELECT | `auth.uid() = host_id`              | `(SELECT auth.uid()) = host_id` |
| `Authenticated users can create events` | INSERT | `auth.uid() = host_id` (WITH CHECK) | `(SELECT auth.uid()) = host_id` |
| `Host can update their events`          | UPDATE | `auth.uid() = host_id`              | `(SELECT auth.uid()) = host_id` |
| `Host can delete their events`          | DELETE | `auth.uid() = host_id`              | `(SELECT auth.uid()) = host_id` |

> `Public events are viewable by everyone` (SELECT, `is_public = true`)은 `auth.uid()` 미사용 → 변경 불필요

### profiles 테이블 (2개 정책)

| 정책명                         | 동작   | 현재 조건         | 변경 후                    |
| ------------------------------ | ------ | ----------------- | -------------------------- |
| `users can view own profile`   | SELECT | `auth.uid() = id` | `(SELECT auth.uid()) = id` |
| `users can update own profile` | UPDATE | `auth.uid() = id` | `(SELECT auth.uid()) = id` |

> `authenticated users can view all profiles` (SELECT, `true`)은 `auth.uid()` 미사용 → 변경 불필요

---

## 구현 단계

### Step 1: [nextjs-supabase-fullstack] 마이그레이션 파일 작성

**파일 경로:** `supabase/migrations/20260325000300_fix_events_profiles_rls_auth_uid_optimization.sql`

**파일 구조:**

```sql
-- PERF-003: events/profiles RLS auth.uid() 최적화
-- auth.uid() → (SELECT auth.uid()) 변경

-- =============================================
-- events RLS 최적화 (4개 정책)
-- =============================================

DROP POLICY "Host can view their private events" ON events;
DROP POLICY "Authenticated users can create events" ON events;
DROP POLICY "Host can update their events" ON events;
DROP POLICY "Host can delete their events" ON events;

CREATE POLICY "Host can view their private events"
  ON events FOR SELECT
  USING ((SELECT auth.uid()) = host_id);

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = host_id);

CREATE POLICY "Host can update their events"
  ON events FOR UPDATE
  USING ((SELECT auth.uid()) = host_id);

CREATE POLICY "Host can delete their events"
  ON events FOR DELETE
  USING ((SELECT auth.uid()) = host_id);

-- =============================================
-- profiles RLS 최적화 (2개 정책)
-- =============================================

DROP POLICY "users can view own profile" ON profiles;
DROP POLICY "users can update own profile" ON profiles;

CREATE POLICY "users can view own profile"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);
```

**적용 방법:** Supabase MCP `mcp__supabase__apply_migration` 으로 원격 적용

### Step 2: 문서 업데이트

- `docs/guides/supabase-rls.md`
  - 핵심 패턴 1 주의사항 제거: `⚠️ 현재 미적용 테이블: events, profiles`
  - `profiles` 테이블 주의사항 제거: `⚠️ raw auth.uid() 사용 중 (미최적화)`
  - `events` 테이블 주의사항 제거: `⚠️ raw auth.uid() 사용 중 (미최적화)`
  - 알려진 이슈 섹션 1번 (`events/profiles 미최적화`) 삭제
  - 마지막 갱신 날짜 업데이트

- `docs/planning/PROJECT_ISSUES.md`
  - 이슈 현황 요약 테이블: PERF-003 상태 `🔴 미해결` → `✅ 해결됨`
  - PERF-003 섹션에 해결 내용 추가

---

## 검증 방법

1. **마이그레이션 성공 확인**
   - Supabase MCP `mcp__supabase__list_migrations` 로 `20260325000300_fix_events_profiles_rls_auth_uid_optimization` 존재 확인

2. **정책 적용 확인**
   - Supabase MCP `mcp__supabase__execute_sql` 로 아래 쿼리 실행:

   ```sql
   SELECT policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename IN ('events', 'profiles')
   ORDER BY tablename, policyname;
   ```

   - `(SELECT auth.uid())` 패턴이 적용됐는지 확인

3. **기능 동작 확인 (Playwright MCP)**

   개발 서버(`npm run dev`) 실행 후 Playwright MCP로 아래 시나리오를 검증한다.

   **events 정책 검증:**
   - `mcp__playwright__browser_navigate` → 로그인 페이지 이동
   - `mcp__playwright__browser_fill_form` + `mcp__playwright__browser_click` → 테스트 계정 로그인
   - `mcp__playwright__browser_navigate` → 이벤트 목록 페이지(`/events`) 이동 후 `mcp__playwright__browser_snapshot`으로 이벤트가 정상 표시되는지 확인
   - `mcp__playwright__browser_navigate` → 이벤트 상세 페이지(`/events/[id]`) 이동 후 스냅샷으로 상세 정보가 정상 표시되는지 확인
   - (주최자 계정) 이벤트 수정 폼 접근 후 수정 시도 → 성공 확인
   - (주최자 계정) 이벤트 삭제 시도 → 성공 확인

   **profiles 정책 검증:**
   - `mcp__playwright__browser_navigate` → 내 프로필 페이지 이동 후 스냅샷으로 프로필 정보가 정상 표시되는지 확인
   - 프로필 수정 폼에서 이름 변경 시도 → 성공 확인

   **콘솔 에러 확인:**
   - 각 시나리오 완료 후 `mcp__playwright__browser_console_messages`로 RLS 관련 에러(401, 403) 없음 확인

---

## 수정 파일 목록

| 파일                                                                                   | 변경 유형                     |
| -------------------------------------------------------------------------------------- | ----------------------------- |
| `supabase/migrations/20260325000300_fix_events_profiles_rls_auth_uid_optimization.sql` | 신규 생성                     |
| `docs/guides/supabase-rls.md`                                                          | 주의사항 제거, 날짜 업데이트  |
| `docs/planning/PROJECT_ISSUES.md`                                                      | PERF-003 상태 해결됨으로 변경 |
