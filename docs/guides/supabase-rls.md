# Supabase RLS (Row Level Security) 가이드

> 이 문서는 프로젝트에 적용된 모든 RLS 정책을 AI 및 개발자가 참조할 수 있도록 분석·정리한 문서입니다.
> 마지막 갱신: 2026-03-25 (QUAL-001 반영 — posts/profiles RLS 역할 authenticated 통일 완료)

---

## 개요

### RLS란

Row Level Security(RLS)는 PostgreSQL의 기능으로, 테이블의 **각 행(row)에 대해 사용자별 접근 권한**을 제어합니다. Supabase에서는 클라이언트 요청이 직접 DB에 닿기 때문에 RLS가 사실상 유일한 데이터 접근 제어 레이어입니다.

- RLS가 **활성화**되어 있으면 정책을 통과하지 못한 행은 존재하지 않는 것처럼 처리됩니다.
- RLS가 활성화되어 있고 **정책이 없으면** 아무도 해당 테이블에 접근할 수 없습니다.
- 정책은 `OR` 논리로 합산됩니다 — 여러 정책 중 하나라도 통과하면 접근 허용.

### 현재 적용 현황

| 테이블             | RLS 활성화 | 정책 수 | 주요 접근 주체                       |
| ------------------ | :--------: | :-----: | ------------------------------------ |
| `profiles`         |     ✅     |    3    | 본인, 인증된 모든 사용자             |
| `events`           |     ✅     |    6    | 공개(anonymous), 주최자, 승인 참여자 |
| `participations`   |     ✅     |    4    | 본인, 주최자, 승인 참여자            |
| `posts`            |     ✅     |    4    | 주최자, 승인 참여자                  |
| `carpools`         |     ✅     |    4    | 주최자, 승인 참여자                  |
| `carpool_requests` |     ✅     |    5    | 탑승자, 드라이버, 주최자             |

---

## 핵심 패턴

### 1. `(SELECT auth.uid())` 최적화 패턴

```sql
-- ❌ 비효율: 행마다 함수 재호출
USING (user_id = auth.uid())

-- ✅ 최적화: init plan으로 1회만 평가
USING (user_id = (SELECT auth.uid()))
```

PostgreSQL은 `(SELECT ...)` 서브쿼리를 **실행 계획 수립 시 1회만 평가(init plan)** 합니다.
`auth.uid()`는 세션 중 불변이므로 `(SELECT auth.uid())`로 감싸는 것이 표준 패턴입니다.

### 2. SECURITY DEFINER 함수를 통한 RLS 우회

RLS 정책 내에서 다른 RLS 보호 테이블을 조회하면 **재귀 순환 문제**가 발생할 수 있습니다.
이를 방지하기 위해 `SECURITY DEFINER` 함수를 사용합니다.

```sql
-- is_approved_participant_for_event: participations 테이블을 RLS 없이 조회
CREATE OR REPLACE FUNCTION is_approved_participant_for_event(event_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participations
    WHERE event_id = event_uuid
      AND user_id = (SELECT auth.uid())
      AND status = 'approved'
  );
$$;
```

`participations`의 SELECT 정책 내에서 `participations` 자신을 다시 조회할 때 이 함수를 사용합니다.

### 3. `{public}` vs `{authenticated}` 역할 분리

| 역할              | 의미                                             | 사용 테이블                                                           |
| ----------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `{public}`        | 미인증(anonymous) 포함 모든 사용자에게 정책 적용 | `events` (공개 이벤트 탐색 목적)                                      |
| `{authenticated}` | 로그인한 사용자에게만 정책 적용                  | `profiles`, `participations`, `posts`, `carpools`, `carpool_requests` |

`events`의 `{public}` 역할은 미인증 사용자도 공개 이벤트를 탐색할 수 있어야 하므로 의도적으로 유지합니다.
`auth.uid()` 조건이 있는 정책은 `{authenticated}`로 명시하여 미인증 요청의 불필요한 RLS 평가를 차단합니다.

---

## 테이블별 정책 상세

### `profiles`

사용자 프로필 정보. `auth.users` 테이블과 1:1 연결.

| 정책명                                      | 동작   | 역할              | 조건                       |
| ------------------------------------------- | ------ | ----------------- | -------------------------- |
| `users can view own profile`                | SELECT | `{authenticated}` | `(SELECT auth.uid()) = id` |
| `authenticated users can view all profiles` | SELECT | `{authenticated}` | `true` (전체 허용)         |
| `users can update own profile`              | UPDATE | `{authenticated}` | `(SELECT auth.uid()) = id` |

**설계 의도:**

- INSERT 정책 없음 — `handle_new_user` 트리거가 `auth.users` 신규 생성 시 자동으로 `profiles` 행을 삽입
- DELETE 정책 없음 — 프로필 직접 삭제 불가 (`auth.users` CASCADE로 연동)
- 인증된 사용자는 모든 프로필 조회 가능 — 이벤트 참여자 목록 표시 등에 필요

---

### `events`

이벤트 정보. `is_public` 플래그로 공개/비공개 구분.

| 정책명                                   | 동작   | 역할       | 조건                                         |
| ---------------------------------------- | ------ | ---------- | -------------------------------------------- |
| `Public events are viewable by everyone` | SELECT | `{public}` | `is_public = true`                           |
| `Host can view their private events`     | SELECT | `{public}` | `(SELECT auth.uid()) = host_id`              |
| `승인된 참여자도 이벤트 조회 가능`       | SELECT | `{public}` | `is_approved_participant_for_event(id)`      |
| `Authenticated users can create events`  | INSERT | `{public}` | `(SELECT auth.uid()) = host_id` (with_check) |
| `Host can update their events`           | UPDATE | `{public}` | `(SELECT auth.uid()) = host_id`              |
| `Host can delete their events`           | DELETE | `{public}` | `(SELECT auth.uid()) = host_id`              |

**설계 의도:**

- 공개 이벤트(`is_public = true`)는 미인증 사용자도 조회 가능 → 탐색(discover) 페이지에 활용
- 비공개 이벤트는 주최자 또는 승인된 참여자가 조회 가능
- 이벤트 생성 시 `host_id = (SELECT auth.uid())` WITH CHECK → 타인 명의로 이벤트 생성 불가

---

### `participations`

이벤트 참여 신청. `status`: `pending` → `approved` / `rejected`.

| 정책명             | 동작   | 역할              | 조건                                                                  |
| ------------------ | ------ | ----------------- | --------------------------------------------------------------------- |
| `참여자 목록 조회` | SELECT | `{authenticated}` | 본인 데이터 OR 이벤트 주최자 OR (status='approved' AND 승인된 참여자) |
| `참여 신청`        | INSERT | `{authenticated}` | `user_id = (SELECT auth.uid())`                                       |
| `참여 상태 변경`   | UPDATE | `{authenticated}` | 이벤트 주최자만                                                       |
| `참여 취소`        | DELETE | `{authenticated}` | 본인의 `pending` 상태만                                               |

**설계 의도:**

- 승인된 참여자들은 서로의 참여 정보를 조회 가능 (참여자 목록 공유)
- `is_approved_participant_for_event()` 헬퍼로 재귀 RLS 순환 방지
- 상태 변경(`approved`/`rejected`)은 주최자 전용 — 참여자는 자신의 상태를 직접 변경 불가
- 삭제는 `pending` 상태만 가능 — 이미 승인/거절된 참여는 취소 불가

---

### `posts`

이벤트 내 공지(`notice`) 및 댓글(`comment`).

| 정책명                             | 동작   | 역할              | 조건                                                     |
| ---------------------------------- | ------ | ----------------- | -------------------------------------------------------- |
| `주최자와 승인 참여자만 조회 가능` | SELECT | `{authenticated}` | 이벤트 주최자 OR 승인된 참여자                           |
| `주최자만 공지 작성 가능`          | INSERT | `{authenticated}` | 공지(notice)=주최자만 / 댓글(comment)=주최자+승인 참여자 |
| `본인 게시물만 수정 가능`          | UPDATE | `{authenticated}` | `author_id = (SELECT auth.uid())`                        |
| `본인 또는 주최자만 삭제 가능`     | DELETE | `{authenticated}` | 본인 OR 이벤트 주최자                                    |

**설계 의도:**

- 게시판은 이벤트 내부 전용 — 외부 공개 없음 (is_public 무관)
- 공지는 주최자만 작성, 댓글은 승인된 참여자 모두 작성 가능
- 주최자는 타인 댓글도 삭제 가능 (모더레이션 권한)

---

### `carpools`

이벤트 내 카풀 등록. 드라이버가 좌석 정보를 등록.

| 정책명      | 동작   | 역할              | 조건                                                            |
| ----------- | ------ | ----------------- | --------------------------------------------------------------- |
| `카풀 조회` | SELECT | `{authenticated}` | 이벤트 주최자 OR 승인된 참여자                                  |
| `카풀 등록` | INSERT | `{authenticated}` | `driver_id = (SELECT auth.uid())` AND (주최자 OR 승인된 참여자) |
| `카풀 수정` | UPDATE | `{authenticated}` | `driver_id = auth.uid() OR events.host_id = auth.uid()`         |
| `카풀 삭제` | DELETE | `{authenticated}` | 드라이버 본인 OR 이벤트 주최자                                  |

**설계 의도:**

- 카풀은 이벤트 내부 정보 — 승인된 참여자만 조회 가능
- 수정은 드라이버 본인 또는 이벤트 주최자만 가능 — `update_carpool_info()` RPC를 통해 `total_seats` 감소 제한 및 `driver_id`/`event_id` 변경 차단
- 드라이버 조건: 자신이 해당 이벤트의 주최자이거나 승인된 참여자여야 등록 가능

---

### `carpool_requests`

카풀 탑승 요청. 탑승자가 특정 카풀에 신청.

| 정책명                                  | 동작   | 역할              | 조건                                         |
| --------------------------------------- | ------ | ----------------- | -------------------------------------------- |
| `카풀 요청 조회`                        | SELECT | `{authenticated}` | 탑승자 본인 OR 드라이버 OR 이벤트 주최자     |
| `카풀 탑승 요청`                        | INSERT | `{authenticated}` | 본인이 탑승자 AND 해당 이벤트 승인된 참여자  |
| `카풀 요청 상태 변경`                   | UPDATE | `{authenticated}` | 드라이버 OR 이벤트 주최자                    |
| `카풀 요청 취소`                        | DELETE | `{authenticated}` | 탑승자 본인만                                |
| `카풀 거절 신청 삭제 (드라이버/주최자)` | DELETE | `{authenticated}` | `status='rejected'` AND (드라이버 OR 주최자) |

**설계 의도:**

- 탑승 요청은 이벤트 승인 참여자만 가능 — 이벤트에 참여하지 않은 사람은 카풀 신청 불가
- 상태 변경(승인/거절)은 드라이버 또는 주최자만 가능
- 거절된 요청은 드라이버/주최자가 정리 가능, 탑승자 본인은 pending 상태만 취소 가능
- `UNIQUE(carpool_id, passenger_id)` 제약으로 중복 신청은 DB 레벨에서 차단

---

## SECURITY DEFINER 함수 목록

RLS를 우회하거나 동시성 제어가 필요한 로직은 `SECURITY DEFINER` 함수로 처리합니다.

| 함수명                              | 용도                                                          | 비고                       |
| ----------------------------------- | ------------------------------------------------------------- | -------------------------- |
| `is_approved_participant_for_event` | RLS 정책 내 participations 재귀 조회 방지                     | SELECT 정책에서 호출       |
| `approve_participation`             | 참여 승인 — 정원 초과 방지 (FOR UPDATE 잠금)                  | Server Action에서 RPC 호출 |
| `approve_carpool_request`           | 탑승 승인 — 좌석 초과 방지 (FOR UPDATE 잠금)                  | Server Action에서 RPC 호출 |
| `update_carpool_info`               | 카풀 정보 수정 — 좌석 감소 방지, driver_id/event_id 변경 차단 | Server Action에서 RPC 호출 |
| `get_event_participant_count`       | 이벤트 참여자 수 조회 (주최자 +1 포함)                        | participations RLS 우회    |
| `get_events_participant_counts`     | 이벤트 목록의 참여자 수 일괄 조회                             | participations RLS 우회    |
| `handle_new_user`                   | auth.users 신규 생성 시 profiles 자동 삽입                    | 트리거 함수                |

> `SECURITY DEFINER` 함수는 함수 소유자(superuser) 권한으로 실행되므로 RLS를 우회합니다.
> 이 때문에 함수 로직 내에서 사용자 검증을 직접 수행해야 합니다.

---

---

## 새 테이블 추가 시 체크리스트

```sql
-- 1. RLS 활성화 (필수)
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- 2. auth.uid() 는 반드시 (SELECT auth.uid()) 형태로 사용
USING (user_id = (SELECT auth.uid()))

-- 3. 역할은 {authenticated} 사용 (비인증 접근이 필요한 경우에만 {public})
TO authenticated

-- 4. RLS 정책 내에서 다른 RLS 보호 테이블을 조회할 경우
--    → SECURITY DEFINER 헬퍼 함수 작성
CREATE OR REPLACE FUNCTION check_something(...)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$ ... $$;

-- 5. 정원/좌석 등 동시성 제어가 필요한 쓰기는
--    → SECURITY DEFINER + FOR UPDATE 잠금을 사용하는 RPC 함수로 처리
```

---

## 관련 문서

- `docs/planning/PROJECT_ISSUES.md` — PERF-001(auth.uid 최적화), PERF-002(carpools 인덱스), QUAL-001(역할 일관성) 이슈 추적
- `supabase/migrations/20260325000200_fix_rls_auth_uid_optimization.sql` — PERF-001 수정 마이그레이션
- `supabase/migrations/20260325000100_fix_participations_rls.sql` — participations RLS 헬퍼 함수 도입
- `supabase/migrations/20260325000700_fix_rls_role_consistency.sql` — QUAL-001: posts/profiles 역할 authenticated 통일
