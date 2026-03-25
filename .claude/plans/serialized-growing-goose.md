# QUAL-001: RLS 정책 역할 불일치 해결 계획

## Context

`posts`와 `profiles` 테이블의 RLS 정책이 `TO public` (역할 미지정) 상태이지만, 내부 조건에 `(SELECT auth.uid())`를 사용하고 있습니다. 이는 두 가지 문제를 유발합니다:

1. **불필요한 연산**: 미인증 사용자 요청에도 PostgreSQL이 RLS 정책 평가를 수행 (auth.uid()=null로 결국 false이지만 평가 자체가 발생)
2. **코드 의도 불명확**: 정책 역할이 실제 접근 의도(인증 필수)를 반영하지 않음

보안 문제는 없으나, `TO authenticated`로 명시하면 미인증 요청을 정책 평가 전에 차단할 수 있어 성능과 가독성이 모두 개선됩니다.

**변경 범위**: `posts` 4개 정책, `profiles` 2개 정책 → `TO authenticated` 추가
**변경 제외**: `events`는 미인증 사용자도 공개 이벤트를 탐색해야 하므로 현행 유지

---

## 현재 상태 vs 변경 목표

| 테이블     | 정책                                      | 현재 역할      | 변경 역할       |
| ---------- | ----------------------------------------- | -------------- | --------------- |
| `posts`    | 주최자와 승인 참여자만 조회 가능 (SELECT) | 미지정(public) | `authenticated` |
| `posts`    | 주최자만 공지 작성 가능 (INSERT)          | 미지정(public) | `authenticated` |
| `posts`    | 본인 게시물만 수정 가능 (UPDATE)          | 미지정(public) | `authenticated` |
| `posts`    | 본인 또는 주최자만 삭제 가능 (DELETE)     | 미지정(public) | `authenticated` |
| `profiles` | users can view own profile (SELECT)       | 미지정(public) | `authenticated` |
| `profiles` | users can update own profile (UPDATE)     | 미지정(public) | `authenticated` |

---

## 구현 단계

### Step 1: [nextjs-supabase-fullstack] 마이그레이션 파일 생성 및 적용

**생성할 파일**: `supabase/migrations/20260325000400_fix_rls_role_consistency.sql`

마이그레이션 내용 — 이전 마이그레이션(`20260325000200`, `20260325000300`)의 정책 SQL을 기반으로 `TO authenticated`만 추가:

```sql
-- QUAL-001: posts/profiles RLS 역할 일관성 수정
-- TO public(미지정) → TO authenticated 변경 (auth.uid() 조건이 있는 정책)
-- events의 TO public은 미인증 사용자 공개 이벤트 탐색을 위해 의도적으로 유지

-- =============================================
-- posts 테이블: 4개 정책 TO authenticated 변경
-- =============================================

DROP POLICY IF EXISTS "주최자와 승인 참여자만 조회 가능" ON posts;
CREATE POLICY "주최자와 승인 참여자만 조회 가능"
  ON posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = posts.event_id
        AND events.host_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM participations
      WHERE participations.event_id = posts.event_id
        AND participations.user_id = (SELECT auth.uid())
        AND participations.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "주최자만 공지 작성 가능" ON posts;
CREATE POLICY "주최자만 공지 작성 가능"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    (type = 'notice' AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = posts.event_id
        AND events.host_id = (SELECT auth.uid())
    ))
    OR
    (type = 'comment' AND (
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = posts.event_id
          AND events.host_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM participations p
        WHERE p.event_id = posts.event_id
          AND p.user_id = (SELECT auth.uid())
          AND p.status = 'approved'
      )
    ))
  );

DROP POLICY IF EXISTS "본인 게시물만 수정 가능" ON posts;
CREATE POLICY "본인 게시물만 수정 가능"
  ON posts FOR UPDATE
  TO authenticated
  USING (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "본인 또는 주최자만 삭제 가능" ON posts;
CREATE POLICY "본인 또는 주최자만 삭제 가능"
  ON posts FOR DELETE
  TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
        AND events.host_id = (SELECT auth.uid())
    )
  );

-- =============================================
-- profiles 테이블: 2개 정책 TO authenticated 변경
-- =============================================

DROP POLICY IF EXISTS "users can view own profile" ON profiles;
CREATE POLICY "users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "users can update own profile" ON profiles;
CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);
```

Supabase MCP로 적용: `mcp__supabase__apply_migration`

적용 후 DB에서 정책 역할 확인 (`mcp__supabase__execute_sql`):

```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('posts', 'profiles')
ORDER BY tablename, cmd;
```

기대 결과:

- `posts` 4개 정책 모두 `roles = {authenticated}`
- `profiles`의 `users can view own profile`, `users can update own profile` → `roles = {authenticated}`

---

### Step 2: [nextjs-supabase-fullstack] Playwright MCP 브라우저 테스트

마이그레이션 적용 후 개발 서버(`http://localhost:3000`)에서 실제 동작을 검증합니다.

**테스트 시나리오**:

1. **로그인 테스트** — profiles RLS 유지 확인
   - `/auth/login` 페이지 접근
   - 테스트 계정으로 로그인
   - 로그인 성공 후 홈 화면 이동 확인 (profiles SELECT 정책 작동)

2. **이벤트 상세 페이지 게시판 테스트** — posts RLS 유지 확인
   - 승인된 참여자 또는 주최자 계정으로 로그인
   - 이벤트 상세 페이지(`/events/[eventId]`) 접근
   - 게시판 탭(공지, 댓글) 정상 조회 확인
   - 콘솔 에러 없음 확인

3. **프로필 페이지 테스트** — profiles UPDATE RLS 유지 확인
   - 프로필 정보 표시 정상 확인

**검증 포인트**:

- 브라우저 콘솔 에러 없음
- 화면 데이터 정상 렌더링
- 네트워크 요청 에러(401, 403, 500) 없음

---

### Step 3: [nextjs-supabase-fullstack] `docs/guides/supabase-rls.md` 최신화

**수정 파일**: `docs/guides/supabase-rls.md`

**변경 내용**:

1. **상단 갱신일** 업데이트:

   ```
   마지막 갱신: 2026-03-25 (QUAL-001 반영 — posts/profiles RLS 역할 authenticated 통일 완료)
   ```

2. **Section 3** `{public}` vs `{authenticated}` 역할 분리 테이블 수정:
   - `{public}` 사용 테이블에서 `posts`, `profiles` 제거 → `events`만 남김
   - `{authenticated}` 사용 테이블에 `posts`, `profiles` 추가

   변경 후:

   ```
   | {public}        | 미인증(anonymous) 포함 모든 사용자에게 정책 적용 | events (공개 이벤트 탐색 목적) |
   | {authenticated} | 로그인한 사용자에게만 정책 적용                 | profiles, participations, posts, carpools, carpool_requests |
   ```

3. **`posts` 테이블 정책 표** 역할 컬럼 수정: `{public}` → `{authenticated}` (4개 정책 모두)

4. **`profiles` 테이블 정책 표** 역할 컬럼 수정:
   - `users can view own profile`: `{public}` → `{authenticated}`
   - `users can update own profile`: `{public}` → `{authenticated}`

5. **"알려진 이슈" 섹션** — 기존 "4. posts 테이블의 {public} 역할 사용" 항목 삭제 (해결됨)

6. **관련 문서** 섹션에 QUAL-001 마이그레이션 파일 추가

---

### Step 4: [nextjs-supabase-fullstack] `docs/planning/PROJECT_ISSUES.md` 업데이트

- 이슈 현황 요약 테이블: QUAL-001 상태 `🔴 미해결` → `✅ 해결됨`
- QUAL-001 섹션에 해결 일자 및 해결 내용 추가:
  ```
  - **해결 일자**: 2026-03-25
  - **해결 내용**: `20260325000400_fix_rls_role_consistency.sql` 마이그레이션으로
    posts 4개 정책, profiles 2개 정책에 `TO authenticated` 명시 완료.
    미인증 요청의 불필요한 RLS 평가 제거 및 코드 의도 명확화.
  ```

---

## 검증 방법 요약

| 단계              | 검증 방법          | 기대 결과                                     |
| ----------------- | ------------------ | --------------------------------------------- |
| 마이그레이션 적용 | `pg_policies` 조회 | posts/profiles 정책 `roles = {authenticated}` |
| 브라우저 테스트   | Playwright MCP     | 로그인·게시판·프로필 에러 없음                |
| 문서 검토         | 파일 읽기          | RLS 가이드·이슈 문서 최신 상태 반영           |
