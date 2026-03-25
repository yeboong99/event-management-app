# 프로젝트 기술 이슈 목록

알려진 기술 부채, 성능 개선 사항, 보안 강화 항목을 추적합니다.

## 이슈 현황 요약

| ID       | 카테고리  | 제목                                                  | 상태      |
| -------- | --------- | ----------------------------------------------------- | --------- |
| PERF-001 | 성능      | RLS `auth.uid()` 반복 평가                            | ✅ 해결됨 |
| PERF-002 | 성능      | `carpools.driver_id` 인덱스 누락                      | ✅ 해결됨 |
| PERF-003 | 성능      | `events`/`profiles` RLS `auth.uid()` 미최적화         | ✅ 해결됨 |
| QUAL-001 | 코드 품질 | RLS 정책 역할(`{public}` vs `{authenticated}`) 불일치 | ✅ 해결됨 |
| FEAT-001 | 기능 갭   | 비공개 이벤트 승인 참여자 조회 불가                   | ✅ 해결됨 |
| FEAT-002 | 기능 갭   | `carpools` 테이블 UPDATE 정책 없음                    | ✅ 해결됨 |
| FLOW-001 | UX/흐름   | 비공개 이벤트 참여 신청 흐름 단절                     | 🔴 미해결 |

---

## 성능(Performance)

### [PERF-001] RLS 정책의 `auth.uid()` 반복 평가 문제 ✅ 해결됨

- **발견 시점**: Task 56 (2026-03-25)
- **해결 일자**: 2026-03-25
- **영향 범위**: 모든 테이블의 RLS 정책 (`participations`, `posts`, `carpools`, `carpool_requests`)
- **심각도**: 중간 (트래픽 증가 시 체감)

#### 문제 설명

현재 RLS 정책은 `auth.uid()`를 직접 호출하는 형태로 작성되어 있습니다.

```sql
-- 현재 (비효율)
USING (user_id = auth.uid())
```

PostgreSQL은 이 경우 `auth.uid()`를 **행(row)마다 개별적으로 재평가**합니다.
결과가 항상 동일한 값(현재 세션의 사용자 ID)임에도 불구하고, 쿼리 실행 중 불필요하게 반복 호출됩니다.

#### 개선 방법

`(select auth.uid())`로 감싸면 PostgreSQL이 이를 **서브쿼리로 인식**하여 **실행 계획 수립 단계에서 1회만 평가(init plan)**합니다.

```sql
-- 개선 후
USING (user_id = (select auth.uid()))
```

#### 조치 방법

각 테이블의 RLS 정책을 DROP 후 재생성하는 마이그레이션 파일 추가가 필요합니다.

```sql
-- 예시: participations 테이블
DROP POLICY IF EXISTS "participations_select_policy" ON participations;
CREATE POLICY "participations_select_policy" ON participations
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR ...
  );
```

> 기존 마이그레이션 파일은 수정하지 않고, 새 마이그레이션 파일로 정책을 교체합니다.

#### 해결 내용

`20260325000200_fix_rls_auth_uid_optimization.sql` 마이그레이션으로 4개 테이블 전체 정책 및 `is_approved_participant_for_event` 헬퍼 함수의 `auth.uid()` 호출을 모두 `(SELECT auth.uid())`로 교체. 총 31곳 수정 완료.

---

### [PERF-003] `events` / `profiles` RLS 정책 `auth.uid()` 미최적화 ✅ 해결됨

- **발견 시점**: 2026-03-25 (RLS 전수 분석)
- **해결 일자**: 2026-03-25
- **영향 범위**: `events` 테이블 4개 정책, `profiles` 테이블 2개 정책
- **심각도**: 낮음 (PERF-001과 동일 원인, MVP 수준에서는 체감 미미)

#### 문제 설명

PERF-001에서 `participations`, `posts`, `carpools`, `carpool_requests` 4개 테이블의 `auth.uid()` 최적화를 적용했으나, `events`와 `profiles` 테이블은 누락됐습니다.

```sql
-- events 정책 (현재 — 미최적화)
USING (auth.uid() = host_id)

-- profiles 정책 (현재 — 미최적화)
USING (auth.uid() = id)
```

#### 조치 방법

신규 마이그레이션 파일로 `events`, `profiles` 정책을 DROP 후 재생성:

```sql
-- events 정책 예시
DROP POLICY "Host can update their events" ON events;
CREATE POLICY "Host can update their events"
  ON events FOR UPDATE
  USING ((SELECT auth.uid()) = host_id);

-- profiles 정책 예시
DROP POLICY "users can update own profile" ON profiles;
CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);
```

#### 해결 내용

`20260325000300_fix_events_profiles_rls_auth_uid_optimization.sql` 마이그레이션으로 `events` 테이블 4개 정책 및 `profiles` 테이블 2개 정책의 `auth.uid()` 호출을 모두 `(SELECT auth.uid())`로 교체. 총 6곳 수정 완료.

---

### [PERF-002] carpools 테이블 `driver_id` 인덱스 누락 ✅ 해결됨

- **발견 시점**: Phase 3 구현 중
- **해결 일자**: 2026-03-25
- **영향 범위**: `carpools` 테이블의 `driver_id` 컬럼 조회 성능
- **심각도**: 낮음 (초기 MVP 수준에서는 체감 미미)

#### 문제 설명

`carpools` 테이블에서 특정 드라이버의 카풀 목록을 조회할 때 (`driver_id = ?`) 인덱스가 없어 Sequential Scan이 발생.

#### 해결 방법

`20260325000000_add_carpools_driver_id_index.sql` 마이그레이션으로 `driver_id` 컬럼에 인덱스 추가:

```sql
CREATE INDEX IF NOT EXISTS carpools_driver_id_idx ON carpools(driver_id);
```

---

## 코드 품질(Quality)

### [QUAL-001] RLS 정책 역할 불일치 (`{public}` vs `{authenticated}`) ✅ 해결됨

- **발견 시점**: 2026-03-25 (RLS 전수 분석)
- **해결 일자**: 2026-03-25
- **영향 범위**: `posts`, `profiles` 테이블 정책
- **심각도**: 낮음 (기능 동작에는 문제 없음, 가독성·일관성 문제)

#### 문제 설명

RLS 정책의 `TO <역할>` 설정이 테이블마다 다릅니다.

| 테이블             | 현재 역할         | 실질 접근 범위                       | 의도와 일치 여부 |
| ------------------ | ----------------- | ------------------------------------ | ---------------- |
| `events`           | `{public}`        | 공개 이벤트는 미인증도 가능          | ✅ 의도적        |
| `posts`            | `{public}`        | auth.uid() 조건으로 사실상 인증 필요 | ⚠️ 불일치        |
| `profiles`         | `{public}`        | auth.uid() 조건으로 사실상 인증 필요 | ⚠️ 불일치        |
| `participations`   | `{authenticated}` | 인증 필수 명시                       | ✅ 명확          |
| `carpools`         | `{authenticated}` | 인증 필수 명시                       | ✅ 명확          |
| `carpool_requests` | `{authenticated}` | 인증 필수 명시                       | ✅ 명확          |

`posts`와 `profiles`는 미인증 사용자가 접근해도 `auth.uid() = NULL`로 인해 모든 조건이 `false`가 되어 보안 문제는 없습니다. 그러나 `TO public`으로 설정하면 PostgreSQL이 미인증 요청에도 정책을 평가하는 불필요한 연산이 발생하고, 코드 의도가 불명확해집니다.

#### 조치 방법

`posts`, `profiles` 테이블의 `auth.uid()` 조건이 있는 정책을 `TO authenticated`로 변경:

```sql
-- posts 정책 예시
DROP POLICY "본인 게시물만 수정 가능" ON posts;
CREATE POLICY "본인 게시물만 수정 가능"
  ON posts FOR UPDATE
  TO authenticated
  USING (author_id = (SELECT auth.uid()));
```

> `events`의 `{public}`은 미인증 사용자도 공개 이벤트를 탐색할 수 있어야 하므로 변경 불필요.

#### 해결 내용

`20260325000700_fix_rls_role_consistency.sql` 마이그레이션으로 `posts` 4개 정책, `profiles` 2개 정책에 `TO authenticated` 명시 완료.
미인증 요청의 불필요한 RLS 평가 제거 및 코드 의도 명확화. `events`의 `{public}` 역할은 공개 이벤트 탐색 목적으로 의도적 유지.

---

## UX / 흐름(Flow)

### [FLOW-001] 비공개 이벤트 참여 신청 흐름 단절 🔴 미해결

- **발견 시점**: 2026-03-25 (Playwright 브라우저 테스트)
- **영향 범위**: 비공개 이벤트 초대 → 참여 신청 전체 흐름
- **심각도**: 높음 (비공개 이벤트 기능 자체가 실질적으로 사용 불가)

#### 문제 설명

비공개 이벤트의 초대 → 참여 신청 흐름이 UI 레벨에서 완전히 단절되어 있습니다.

**현재 흐름 (broken):**

```
주최자: "초대 링크 복사" 클릭
  → 복사되는 URL: /events/{eventId}  ← 이벤트 상세 URL 그 자체

초대받은 사용자: 해당 URL 방문
  → events RLS SELECT 정책: is_public = true OR host_id = auth.uid() OR is_approved_participant(id)
  → 비승인 상태이므로 어떤 조건도 충족하지 못함
  → 서버에서 notFound() 반환 → 404 페이지 표시

결과: 초대받은 사용자가 참여 신청조차 할 수 없음
```

**브라우저 테스트 재현 결과:**

- testuser2(비승인)가 비공개 이벤트 URL 직접 방문 → 404
- testuser2가 `?invite=true` 쿼리 파라미터 추가 방문 → 동일하게 404
- 결론: UI 상에서 비공개 이벤트 참여 신청이 **불가능**. 테스트 시 DB에 직접 INSERT로 우회 필요

#### 근본 원인

`초대 링크 복사` 버튼이 단순 이벤트 상세 URL을 복사하도록 구현되어 있음. 비공개 이벤트 참여 신청을 위한 **별도 랜딩 페이지나 토큰 기반 초대 메커니즘이 없음**.

이 문제는 FEAT-001(승인된 참여자 SELECT 정책)이 해결되어도 남아있습니다. FEAT-001은 "이미 승인된" 참여자의 조회를 허용하지만, "아직 신청도 못 한" 사용자가 이벤트 페이지에 접근하는 문제를 해결하지 못합니다.

#### 해결 방안 후보

**Option A — 초대 토큰 기반 랜딩 페이지 (권장)**

별도 라우트(`/events/{eventId}/join?token={token}`)를 생성하여:

1. 이벤트 기본 정보만 노출하는 공개 랜딩 페이지 (RLS 우회용 SECURITY DEFINER RPC 또는 공개 조회 함수)
2. 해당 페이지에서 참여 신청 가능
3. 초대 토큰(UUID)을 `events` 테이블에 저장하고, 토큰 검증 후 이벤트 정보 반환

**Option B — 최소 구현: 비공개 이벤트 참여 신청 허용 RLS 정책**

`pending` 상태 참여 신청자도 이벤트 기본 정보를 볼 수 있게 정책 추가:

```sql
-- events: pending 참여 신청자도 이벤트 조회 가능 (기본 정보 확인 목적)
CREATE POLICY "참여 신청자도 이벤트 조회 가능"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participations
      WHERE participations.event_id = id
        AND participations.user_id = (SELECT auth.uid())
        -- status 조건 없음: pending 포함
    )
  );
```

단, 이 방법은 "어떻게 URL을 알았는가"라는 근본 문제를 해결하지 못함 (URL 추측/유출 시 누구나 신청 가능).

**Option C — 현재 구조 유지, UX 안내 개선**

비공개 이벤트 상세 페이지를 404 대신 "이 이벤트는 비공개입니다. 참여 신청을 하려면 주최자에게 직접 문의하세요." 페이지로 변경. 근본 흐름 문제는 미해결이지만 UX는 개선됨.

#### 현재 권장 조치

단기: Option B 또는 C로 최소한의 흐름 복구
장기: Option A(토큰 기반 초대)로 완전한 비공개 이벤트 참여 흐름 구현

---

## 기능 갭(Feature Gap)

### [FEAT-001] 비공개 이벤트 승인 참여자 조회 불가 ✅ 해결됨

- **발견 시점**: 2026-03-25 (RLS 전수 분석)
- **해결 일자**: 2026-03-25
- **영향 범위**: `events` 테이블 SELECT 정책
- **심각도**: 잠재적 (현재 MVP에서는 모든 이벤트가 공개이므로 미발현)

#### 문제 설명

`events` 테이블의 SELECT 정책은 두 가지입니다:

1. `is_public = true` → 누구나 조회 가능
2. `auth.uid() = host_id` → 주최자만 조회 가능

**승인된 참여자이지만 주최자가 아닌 사용자**는 비공개 이벤트(`is_public = false`)를 조회할 수 없습니다. 해당 이벤트의 상세 페이지, 게시판, 카풀 모두 접근 불가 상태가 됩니다.

```
예시:
- 비공개 이벤트 A (is_public = false, host = 유저1)
- 유저2: participations.status = 'approved'
- 유저2가 이벤트 A 상세 조회 시도 → RLS에 의해 차단 (404처럼 보임)
```

#### 현재 미발현 이유

MVP에서 `is_public`은 기본값 `true`이며, UI에서 비공개로 전환하는 기능이 없어 실제 비공개 이벤트가 존재하지 않습니다.

#### 조치 방법

비공개 이벤트 기능 활성화 시점에 아래 정책을 추가해야 합니다:

```sql
CREATE POLICY "승인된 참여자도 이벤트 조회 가능"
  ON events FOR SELECT
  USING (
    is_approved_participant_for_event(id)
  );
```

#### 해결 내용

`20260325000400_feat001_private_events_participant_select.sql` 마이그레이션으로 `events` 테이블에 `"승인된 참여자도 이벤트 조회 가능"` SELECT 정책 추가. `is_approved_participant_for_event(id)` 헬퍼 함수를 활용하여 재귀 RLS 순환 없이 비공개 이벤트 접근 허용.

---

### [FEAT-002] `carpools` 테이블 UPDATE 정책 없음 ✅ 해결됨

- **발견 시점**: 2026-03-25 (RLS 전수 분석)
- **해결 일자**: 2026-03-25
- **영향 범위**: `carpools` 테이블, 카풀 수정 UI 기능
- **심각도**: 낮음 (현재 UI에 수정 기능이 없어 미발현, 삭제 후 재등록으로 대응 중)

#### 문제 설명

`carpools` 테이블에는 SELECT, INSERT, DELETE 정책만 존재하고 UPDATE 정책이 없습니다. 이로 인해 카풀 등록 후 출발지, 시간, 좌석 수, 설명 등 모든 항목을 수정할 수 없습니다.

#### 항목별 수정 허용 범위 제안

| 컬럼                         | 수정 허용      | 이유                                          |
| ---------------------------- | -------------- | --------------------------------------------- |
| `departure_place` (출발지)   | ✅ 허용        | 단순 정보 변경                                |
| `departure_time` (출발 시간) | ✅ 허용        | 단순 정보 변경                                |
| `description` (설명)         | ✅ 허용        | 단순 정보 변경                                |
| `total_seats` (총 좌석 수)   | ⚠️ 조건부 허용 | 현재 승인된 탑승자 수보다 작게 줄이는 것 금지 |
| `driver_id` (드라이버)       | ❌ 금지        | 카풀 소유권 이전 → 악용 가능                  |
| `event_id` (이벤트)          | ❌ 금지        | 다른 이벤트로 카풀 이동 → 의미 없음           |

#### 조치 방법

**1단계 — RLS UPDATE 정책 추가** (드라이버 또는 주최자만 수정 가능):

```sql
CREATE POLICY "카풀 수정"
  ON carpools FOR UPDATE
  TO authenticated
  USING (
    driver_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = carpools.event_id
        AND events.host_id = (SELECT auth.uid())
    )
  );
```

**2단계 — `total_seats` 감소 방지 RPC 함수 추가** (`driver_id`, `event_id` 변경 차단 포함):

RLS만으로는 `total_seats`가 현재 승인 탑승자 수보다 작아지는 것을 막을 수 없습니다. `approve_carpool_request`와 동일하게 `FOR UPDATE` 잠금을 사용하는 SECURITY DEFINER RPC 함수(`update_carpool_info`)를 작성하고, Server Action에서 해당 함수를 통해서만 수정하도록 제한하는 것을 권장합니다.

#### 해결 내용

- `20260325000500_feat002_carpools_update_rls.sql` 마이그레이션으로 `carpools` 테이블에 `"카풀 수정"` UPDATE 정책 추가 (드라이버 본인 또는 이벤트 주최자)
- `20260325000600_feat002_update_carpool_info_rpc.sql` 마이그레이션으로 `update_carpool_info()` SECURITY DEFINER RPC 함수 추가 — `total_seats` 감소 방지(`seats_below_approved` 에러), `driver_id`/`event_id` 변경 차단
- 관련 컴포넌트: `components/forms/carpool-update-form.tsx`, `components/shared/carpool-tabs.tsx`

---
