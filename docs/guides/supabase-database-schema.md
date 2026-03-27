# Supabase 데이터베이스 스키마 가이드

> 이 문서는 프로젝트에 적용된 전체 DB 스키마를 AI 및 개발자가 참조할 수 있도록 정리한 문서입니다.
> 마지막 갱신: 2026-03-28 (Phase 4 완료 — settlement_items.created_by 추가, events.is_settlement_finalized 추가, admin 기능, trgm 인덱스)

---

## 목차

1. [ENUM 타입](#1-enum-타입)
2. [테이블 상세](#2-테이블-상세)
3. [인덱스 목록](#3-인덱스-목록)
4. [테이블 관계 다이어그램](#4-테이블-관계-다이어그램)
5. [트리거 목록](#5-트리거-목록)
6. [함수(Function) 목록](#6-함수function-목록)

---

## 1. ENUM 타입

### `event_category`

이벤트 카테고리 분류.

```sql
CREATE TYPE event_category AS ENUM (
  '생일파티', '파티모임', '워크샵', '스터디', '운동스포츠', '기타'
);
```

### `participation_status`

이벤트 참여 신청 상태.

```sql
CREATE TYPE participation_status AS ENUM (
  'pending',    -- 대기 중 (기본값)
  'approved',   -- 승인됨
  'rejected'    -- 거절됨
);
```

### `carpool_request_status`

카풀 탑승 신청 상태.

```sql
CREATE TYPE carpool_request_status AS ENUM (
  'pending',    -- 대기 중 (기본값)
  'approved',   -- 승인됨
  'rejected'    -- 거절됨
);
```

---

## 2. 테이블 상세

### `profiles`

사용자 프로필. `auth.users`와 1:1 연결.

| 컬럼명       | 타입          | NULL | 기본값   | 제약조건                                    |
| ------------ | ------------- | :--: | -------- | ------------------------------------------- |
| `id`         | `UUID`        |  NO  | -        | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `email`      | `TEXT`        | YES  | -        | -                                           |
| `name`       | `TEXT`        | YES  | -        | -                                           |
| `username`   | `TEXT`        | YES  | -        | -                                           |
| `avatar_url` | `TEXT`        | YES  | -        | -                                           |
| `bio`        | `TEXT`        | YES  | -        | -                                           |
| `website`    | `TEXT`        | YES  | -        | -                                           |
| `role`       | `TEXT`        | YES  | `'user'` | -                                           |
| `created_at` | `TIMESTAMPTZ` |  NO  | `now()`  | -                                           |
| `updated_at` | `TIMESTAMPTZ` | YES  | -        | -                                           |

**설계 노트:**

- INSERT는 `handle_new_user` 트리거가 자동 처리 (`auth.users` 신규 생성 시)
- DELETE는 `auth.users` CASCADE로 연동 (직접 삭제 불가)
- `role = 'admin'`인 경우 관리자 페이지 접근 가능

---

### `events`

이벤트 정보. `is_public` 플래그로 공개/비공개 구분.

| 컬럼명                    | 타입             | NULL | 기본값              | 제약조건                              |
| ------------------------- | ---------------- | :--: | ------------------- | ------------------------------------- |
| `id`                      | `UUID`           |  NO  | `gen_random_uuid()` | PK                                    |
| `host_id`                 | `UUID`           |  NO  | -                   | FK → `profiles(id)` ON DELETE CASCADE |
| `title`                   | `TEXT`           |  NO  | -                   | -                                     |
| `description`             | `TEXT`           | YES  | -                   | -                                     |
| `category`                | `event_category` |  NO  | -                   | -                                     |
| `event_date`              | `TIMESTAMPTZ`    |  NO  | -                   | -                                     |
| `location`                | `TEXT`           | YES  | -                   | -                                     |
| `max_participants`        | `INTEGER`        | YES  | -                   | NULL이면 무제한                       |
| `cover_image_url`         | `TEXT`           | YES  | -                   | -                                     |
| `is_public`               | `BOOLEAN`        | YES  | `TRUE`              | -                                     |
| `invite_token`            | `UUID`           |  NO  | `gen_random_uuid()` | UNIQUE                                |
| `is_settlement_finalized` | `BOOLEAN`        |  NO  | `FALSE`             | -                                     |
| `created_at`              | `TIMESTAMPTZ`    | YES  | `now()`             | -                                     |
| `updated_at`              | `TIMESTAMPTZ`    | YES  | `now()`             | -                                     |

**설계 노트:**

- `max_participants = NULL`이면 참여 인원 무제한
- `invite_token`은 비공개 이벤트 초대 링크 생성에 사용 (`/events/{id}/join?token={token}`)
- 비공개 이벤트 초대 흐름: 주최자가 초대 링크 복사 → 초대받은 사용자가 `/join` 랜딩 페이지 방문 → 참여 신청
- `is_settlement_finalized = TRUE`이면 정산이 확정된 상태 — 주최자가 확정 후 수정 불가 처리에 활용

---

### `participations`

이벤트 참여 신청. `status`는 `pending → approved / rejected` 흐름.

| 컬럼명       | 타입                   | NULL | 기본값              | 제약조건                              |
| ------------ | ---------------------- | :--: | ------------------- | ------------------------------------- |
| `id`         | `UUID`                 |  NO  | `gen_random_uuid()` | PK                                    |
| `event_id`   | `UUID`                 |  NO  | -                   | FK → `events(id)` ON DELETE CASCADE   |
| `user_id`    | `UUID`                 |  NO  | -                   | FK → `profiles(id)` ON DELETE CASCADE |
| `status`     | `participation_status` |  NO  | `'pending'`         | -                                     |
| `message`    | `TEXT`                 | YES  | -                   | 참여 신청 메시지                      |
| `attended`   | `BOOLEAN`              | YES  | `FALSE`             | 출석 여부                             |
| `created_at` | `TIMESTAMPTZ`          | YES  | `now()`             | -                                     |
| `updated_at` | `TIMESTAMPTZ`          | YES  | `now()`             | -                                     |

**제약조건:**

- `UNIQUE(event_id, user_id)` — 동일 이벤트에 중복 참여 신청 불가

**설계 노트:**

- 참여자 수는 `status = 'approved'` 행 수 + 1(주최자) 로 계산
- 승인은 `approve_participation()` RPC 함수 경유 (정원 초과 방지)
- 삭제(취소)는 `pending` 상태만 가능

---

### `posts`

이벤트 내 공지(`notice`) 및 댓글(`comment`).

| 컬럼명       | 타입          | NULL | 기본값              | 제약조건                                |
| ------------ | ------------- | :--: | ------------------- | --------------------------------------- |
| `id`         | `UUID`        |  NO  | `gen_random_uuid()` | PK                                      |
| `event_id`   | `UUID`        |  NO  | -                   | FK → `events(id)` ON DELETE CASCADE     |
| `author_id`  | `UUID`        |  NO  | -                   | FK → `auth.users(id)` ON DELETE CASCADE |
| `type`       | `TEXT`        |  NO  | `'comment'`         | CHECK (`type IN ('notice', 'comment')`) |
| `content`    | `TEXT`        |  NO  | -                   | -                                       |
| `created_at` | `TIMESTAMPTZ` | YES  | `now()`             | -                                       |
| `updated_at` | `TIMESTAMPTZ` | YES  | `now()`             | -                                       |

**설계 노트:**

- `type = 'notice'`(공지)는 주최자만 작성 가능
- `type = 'comment'`(댓글)은 주최자 + 승인된 참여자 작성 가능
- 주최자는 모든 게시물 삭제 가능 (모더레이션 권한)

---

### `carpools`

이벤트 내 카풀 등록. 드라이버가 좌석 정보를 등록.

| 컬럼명            | 타입          | NULL | 기본값              | 제약조건                                         |
| ----------------- | ------------- | :--: | ------------------- | ------------------------------------------------ |
| `id`              | `UUID`        |  NO  | `gen_random_uuid()` | PK                                               |
| `event_id`        | `UUID`        |  NO  | -                   | FK → `events(id)` ON DELETE CASCADE              |
| `driver_id`       | `UUID`        |  NO  | -                   | FK → `profiles(id)` ON DELETE CASCADE            |
| `departure_place` | `TEXT`        |  NO  | -                   | -                                                |
| `departure_time`  | `TIMESTAMPTZ` | YES  | -                   | -                                                |
| `total_seats`     | `INTEGER`     |  NO  | -                   | CHECK (`total_seats >= 1 AND total_seats <= 10`) |
| `description`     | `TEXT`        | YES  | -                   | -                                                |
| `created_at`      | `TIMESTAMPTZ` | YES  | `now()`             | -                                                |
| `updated_at`      | `TIMESTAMPTZ` | YES  | `now()`             | -                                                |

**설계 노트:**

- 수정은 `update_carpool_info()` RPC를 통해서만 가능 — `total_seats` 감소 방지 및 `driver_id`/`event_id` 변경 차단
- 탑승 가능 잔여석은 `total_seats - (승인된 carpool_requests 수)`로 계산
- 드라이버는 해당 이벤트의 주최자 또는 승인된 참여자여야 등록 가능

---

### `settlement_items`

이벤트 정산 항목. 주최자가 비용 항목을 등록하고 참여자 간 정산에 활용.

| 컬럼명       | 타입          | NULL | 기본값              | 제약조건                                            |
| ------------ | ------------- | :--: | ------------------- | --------------------------------------------------- |
| `id`         | `UUID`        |  NO  | `gen_random_uuid()` | PK                                                  |
| `event_id`   | `UUID`        |  NO  | -                   | FK → `events(id)` ON DELETE CASCADE                 |
| `paid_by`    | `UUID`        |  NO  | -                   | FK → `profiles(id)` ON DELETE CASCADE               |
| `label`      | `TEXT`        |  NO  | -                   | 비용 항목명                                         |
| `amount`     | `INTEGER`     |  NO  | -                   | CHECK (`amount > 0`)                                |
| `created_by` | `UUID`        | YES  | -                   | FK → `profiles(id)` ON DELETE SET NULL, 항목 작성자 |
| `created_at` | `TIMESTAMPTZ` | YES  | `now()`             | -                                                   |
| `updated_at` | `TIMESTAMPTZ` | YES  | `now()`             | -                                                   |

**설계 노트:**

- `paid_by`는 해당 비용을 실제로 지불한 참여자(또는 주최자)를 가리킴
- `created_by`는 항목을 등록한 사람 — 주최자 또는 승인된 참여자 모두 등록 가능
- `amount`는 양의 정수만 허용 (CHECK 제약조건)
- 등록: 주최자 또는 승인된 참여자 가능 / 수정·삭제: 주최자 또는 항목 작성자(`created_by`) 가능

---

### `carpool_requests`

카풀 탑승 신청. 탑승자가 특정 카풀에 신청.

| 컬럼명         | 타입                     | NULL | 기본값              | 제약조건                              |
| -------------- | ------------------------ | :--: | ------------------- | ------------------------------------- |
| `id`           | `UUID`                   |  NO  | `gen_random_uuid()` | PK                                    |
| `carpool_id`   | `UUID`                   |  NO  | -                   | FK → `carpools(id)` ON DELETE CASCADE |
| `passenger_id` | `UUID`                   |  NO  | -                   | FK → `profiles(id)` ON DELETE CASCADE |
| `status`       | `carpool_request_status` |  NO  | `'pending'`         | -                                     |
| `message`      | `TEXT`                   | YES  | -                   | 탑승 신청 메시지                      |
| `created_at`   | `TIMESTAMPTZ`            | YES  | `now()`             | -                                     |
| `updated_at`   | `TIMESTAMPTZ`            | YES  | `now()`             | -                                     |

**제약조건:**

- `UNIQUE(carpool_id, passenger_id)` — 동일 카풀에 중복 탑승 신청 불가

**설계 노트:**

- 탑승 신청은 해당 이벤트의 승인된 참여자만 가능
- 승인은 `approve_carpool_request()` RPC 함수 경유 (좌석 초과 방지)
- 거절된 신청(`rejected`)은 드라이버/주최자가 정리 가능

---

## 3. 인덱스 목록

| 인덱스명                            | 대상 테이블        | 컬럼                          | 비고                              |
| ----------------------------------- | ------------------ | ----------------------------- | --------------------------------- |
| `events_invite_token_idx`           | `events`           | `(invite_token)`              | 초대 토큰으로 이벤트 조회         |
| `idx_participations_event_id`       | `participations`   | `(event_id)`                  | 이벤트별 참여 목록 조회           |
| `idx_participations_user_id_status` | `participations`   | `(user_id, status)`           | 유저별 상태 필터 조회             |
| `idx_posts_event_id_created`        | `posts`            | `(event_id, created_at DESC)` | 이벤트별 최신 게시물 조회         |
| `idx_carpools_event_id`             | `carpools`         | `(event_id)`                  | 이벤트별 카풀 목록 조회           |
| `idx_carpools_driver_id`            | `carpools`         | `(driver_id)`                 | 드라이버별 카풀 조회 (PERF-002)   |
| `idx_carpool_requests_carpool_id`   | `carpool_requests` | `(carpool_id)`                | 카풀별 신청 목록 조회             |
| `idx_carpool_requests_passenger_id` | `carpool_requests` | `(passenger_id)`              | 탑승자별 신청 목록 조회           |
| `idx_settlement_items_event_id`     | `settlement_items` | `(event_id)`                  | 이벤트별 정산 항목 목록 조회      |
| `idx_profiles_name_trgm`            | `profiles`         | `(name)` GIN trgm             | 이름 ILIKE 검색 최적화 (관리자)   |
| `idx_profiles_email_trgm`           | `profiles`         | `(email)` GIN trgm            | 이메일 ILIKE 검색 최적화 (관리자) |
| `idx_events_title_trgm`             | `events`           | `(title)` GIN trgm            | 제목 ILIKE 검색 최적화 (관리자)   |

---

## 4. 테이블 관계 다이어그램

```
auth.users (Supabase 관리)
    │
    │ 1:1 (on insert → handle_new_user 트리거)
    ▼
profiles
    │
    ├──────────────────────────────────────────────────────────────────────┐
    │ 1:N (host_id)                                                        │ 1:N (user_id)
    ▼                                                                      ▼
events ──────────────────────────────────────────────────────── participations
    │                                                                      │
    │ 1:N (event_id)                                                       │ (is_approved_participant_for_event 헬퍼로 참조)
    ▼                                                                      │
  posts                                                                    │
                                                                          ▼
events ──────────────────────────────────────────────────────── carpools
    │                                                              │ 1:N (carpool_id)
    │ 1:N (event_id)                                               ▼
    │                                                       carpool_requests
    │                                                              │
    │                                                    profiles (passenger_id)
    │
    │ 1:N (event_id)
    ▼
settlement_items
    │
profiles (paid_by) ──────────────────────────────────── settlement_items

profiles (driver_id) ──────────────────────────────────── carpools
```

### FK 관계 요약

| 자식 테이블        | FK 컬럼        | 부모 테이블  | 부모 컬럼 | ON DELETE |
| ------------------ | -------------- | ------------ | --------- | --------- |
| `profiles`         | `id`           | `auth.users` | `id`      | CASCADE   |
| `events`           | `host_id`      | `profiles`   | `id`      | CASCADE   |
| `participations`   | `event_id`     | `events`     | `id`      | CASCADE   |
| `participations`   | `user_id`      | `profiles`   | `id`      | CASCADE   |
| `posts`            | `event_id`     | `events`     | `id`      | CASCADE   |
| `posts`            | `author_id`    | `auth.users` | `id`      | CASCADE   |
| `carpools`         | `event_id`     | `events`     | `id`      | CASCADE   |
| `carpools`         | `driver_id`    | `profiles`   | `id`      | CASCADE   |
| `carpool_requests` | `carpool_id`   | `carpools`   | `id`      | CASCADE   |
| `carpool_requests` | `passenger_id` | `profiles`   | `id`      | CASCADE   |
| `settlement_items` | `event_id`     | `events`     | `id`      | CASCADE   |
| `settlement_items` | `paid_by`      | `profiles`   | `id`      | CASCADE   |
| `settlement_items` | `created_by`   | `profiles`   | `id`      | SET NULL  |

---

## 5. 트리거 목록

| 트리거명                             | 대상 테이블        | 스키마   | 이벤트 | 타이밍 | 실행 함수                    |
| ------------------------------------ | ------------------ | -------- | ------ | ------ | ---------------------------- |
| `on_auth_user_created`               | `auth.users`       | `auth`   | INSERT | AFTER  | `handle_new_user()`          |
| `set_profiles_updated_at`            | `profiles`         | `public` | UPDATE | BEFORE | `handle_updated_at()`        |
| `events_updated_at`                  | `events`           | `public` | UPDATE | BEFORE | `update_updated_at()`        |
| `update_participations_updated_at`   | `participations`   | `public` | UPDATE | BEFORE | `update_updated_at_column()` |
| `update_posts_updated_at`            | `posts`            | `public` | UPDATE | BEFORE | `update_updated_at_column()` |
| `update_carpools_updated_at`         | `carpools`         | `public` | UPDATE | BEFORE | `update_updated_at_column()` |
| `update_carpool_requests_updated_at` | `carpool_requests` | `public` | UPDATE | BEFORE | `update_updated_at_column()` |
| `update_settlement_items_updated_at` | `settlement_items` | `public` | UPDATE | BEFORE | `update_updated_at_column()` |

---

## 6. 함수(Function) 목록

### `updated_at` 자동 갱신 트리거 함수

세 가지 함수가 동일한 역할(`updated_at = now()`)을 수행하며, 각기 다른 테이블의 트리거에 연결되어 있습니다.

| 함수명                       | SECURITY DEFINER | 연결 테이블                                                                   |
| ---------------------------- | :--------------: | ----------------------------------------------------------------------------- |
| `handle_updated_at()`        |       YES        | `profiles`                                                                    |
| `update_updated_at()`        |        NO        | `events`                                                                      |
| `update_updated_at_column()` |        NO        | `participations`, `posts`, `carpools`, `carpool_requests`, `settlement_items` |

---

### `handle_new_user()`

**역할:** `auth.users` 신규 가입 시 `profiles` 행 자동 생성.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;
```

| 항목             | 값                                               |
| ---------------- | ------------------------------------------------ |
| 파라미터         | 없음 (트리거 함수)                               |
| 반환 타입        | `TRIGGER`                                        |
| SECURITY DEFINER | YES                                              |
| 호출 트리거      | `on_auth_user_created` (auth.users AFTER INSERT) |

---

### `is_approved_participant_for_event(event_uuid UUID)`

**역할:** 현재 사용자가 해당 이벤트의 승인된 참여자인지 확인. RLS 정책 내 `participations` 재귀 조회 방지 목적.

```sql
CREATE OR REPLACE FUNCTION public.is_approved_participant_for_event(event_uuid UUID)
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

| 항목             | 값                                                               |
| ---------------- | ---------------------------------------------------------------- |
| 파라미터         | `event_uuid UUID`                                                |
| 반환 타입        | `BOOLEAN`                                                        |
| SECURITY DEFINER | YES                                                              |
| 사용 위치        | `participations`, `carpools`, `carpool_requests` RLS SELECT 정책 |

---

### `approve_participation(p_participation_id UUID, p_event_id UUID)`

**역할:** 참여 신청 승인. `FOR UPDATE` 잠금으로 정원 초과 방지.

```sql
CREATE OR REPLACE FUNCTION public.approve_participation(
  p_participation_id UUID,
  p_event_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INT;
  v_max INT;
BEGIN
  -- events 행 잠금 (동시 승인 방지)
  SELECT max_participants INTO v_max
  FROM events WHERE id = p_event_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'event_not_found'; END IF;

  SELECT COUNT(*) INTO v_current_count
  FROM participations WHERE event_id = p_event_id AND status = 'approved';

  -- max_participants가 NULL이면 무제한
  IF v_max IS NOT NULL AND v_current_count >= v_max THEN
    RAISE EXCEPTION 'max_participants_exceeded';
  END IF;

  UPDATE participations
  SET status = 'approved', updated_at = now()
  WHERE id = p_participation_id AND event_id = p_event_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'participation_not_found'; END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

| 항목             | 값                                                                        |
| ---------------- | ------------------------------------------------------------------------- |
| 파라미터         | `p_participation_id UUID`, `p_event_id UUID`                              |
| 반환 타입        | `BOOLEAN`                                                                 |
| SECURITY DEFINER | YES                                                                       |
| 예외 코드        | `event_not_found`, `max_participants_exceeded`, `participation_not_found` |
| 호출 위치        | Server Action (`actions/events.ts` 참여 승인 처리)                        |

---

### `get_event_participant_count(p_event_id UUID)`

**역할:** 단일 이벤트의 참여자 수 조회. 주최자를 포함하여 +1 반환.

```sql
CREATE OR REPLACE FUNCTION public.get_event_participant_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count  -- +1: 주최자 포함
  FROM participations
  WHERE event_id = p_event_id AND status = 'approved';
  RETURN v_count;
END;
$$;
```

| 항목             | 값                                            |
| ---------------- | --------------------------------------------- |
| 파라미터         | `p_event_id UUID`                             |
| 반환 타입        | `INTEGER`                                     |
| SECURITY DEFINER | YES                                           |
| 반환값           | 승인된 참여자 수 + 1 (주최자 포함)            |
| 사용 목적        | `participations` RLS 우회 없이 참여자 수 노출 |

---

### `get_events_participant_counts(p_event_ids UUID[])`

**역할:** 여러 이벤트의 참여자 수를 일괄 조회. 이벤트 목록 페이지에서 N+1 방지.

```sql
CREATE OR REPLACE FUNCTION public.get_events_participant_counts(p_event_ids UUID[])
RETURNS TABLE(event_id UUID, participant_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.event_id,
    (COUNT(*) + 1)::INTEGER AS participant_count  -- +1: 주최자 포함
  FROM participations p
  WHERE p.event_id = ANY(p_event_ids) AND p.status = 'approved'
  GROUP BY p.event_id;
END;
$$;
```

| 항목             | 값                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| 파라미터         | `p_event_ids UUID[]`                                                            |
| 반환 타입        | `TABLE(event_id UUID, participant_count INTEGER)`                               |
| SECURITY DEFINER | YES                                                                             |
| 반환값           | 이벤트별 (승인된 참여자 수 + 1) — `GROUP BY` 결과에 없는 이벤트는 포함되지 않음 |
| 사용 목적        | 이벤트 목록 페이지의 참여자 수 일괄 조회                                        |

---

### `approve_carpool_request(p_request_id UUID, p_carpool_id UUID)`

**역할:** 카풀 탑승 신청 승인. `FOR UPDATE` 잠금으로 좌석 초과 방지.

```sql
CREATE OR REPLACE FUNCTION public.approve_carpool_request(
  p_request_id UUID,
  p_carpool_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_total_seats INTEGER;
BEGIN
  -- carpools 행 잠금 (동시 승인 방지)
  SELECT total_seats INTO v_total_seats
  FROM carpools WHERE id = p_carpool_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'carpool_not_found'; END IF;

  SELECT COUNT(*) INTO v_current_count
  FROM carpool_requests WHERE carpool_id = p_carpool_id AND status = 'approved';

  IF v_current_count >= v_total_seats THEN
    RAISE EXCEPTION 'seats_full';
  END IF;

  UPDATE carpool_requests
  SET status = 'approved', updated_at = now()
  WHERE id = p_request_id AND carpool_id = p_carpool_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'request_not_found'; END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

| 항목             | 값                                                     |
| ---------------- | ------------------------------------------------------ |
| 파라미터         | `p_request_id UUID`, `p_carpool_id UUID`               |
| 반환 타입        | `BOOLEAN`                                              |
| SECURITY DEFINER | YES                                                    |
| 예외 코드        | `carpool_not_found`, `seats_full`, `request_not_found` |
| 호출 위치        | Server Action (`actions/carpools.ts` 탑승 승인 처리)   |

---

### `get_event_by_invite_token(p_invite_token UUID)`

**역할:** 초대 토큰으로 비공개 이벤트 기본 정보 조회. SECURITY DEFINER로 RLS 우회하여 비공개 이벤트도 조회 가능.

```sql
CREATE OR REPLACE FUNCTION get_event_by_invite_token(p_invite_token UUID)
RETURNS TABLE (
  id UUID, title TEXT, description TEXT, category event_category,
  event_date TIMESTAMPTZ, location TEXT, max_participants INTEGER,
  cover_image_url TEXT, host_id UUID, host_name TEXT, is_public BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.title, e.description, e.category, e.event_date,
         e.location, e.max_participants, e.cover_image_url,
         e.host_id, p.name AS host_name, e.is_public
  FROM events e
  LEFT JOIN profiles p ON p.id = e.host_id
  WHERE e.invite_token = p_invite_token
  LIMIT 1;
$$;
```

| 항목             | 값                                                                    |
| ---------------- | --------------------------------------------------------------------- |
| 파라미터         | `p_invite_token UUID`                                                 |
| 반환 타입        | `TABLE` (이벤트 기본 정보, `invite_token` 자체는 미포함)              |
| SECURITY DEFINER | YES                                                                   |
| 사용 위치        | Server Action (`actions/events.ts` → `/events/{id}/join` 랜딩 페이지) |

**보안 설계:**

- 반환 컬럼에 `invite_token` 자체는 포함하지 않아 토큰 재노출 방지
- 토큰이 올바르지 않으면 빈 결과 반환 (에러 없음)

---

### `update_carpool_info(p_carpool_id, p_departure_place, p_departure_time, p_total_seats, p_description)`

- **설명**: 카풀 정보를 수정합니다. 드라이버 본인 또는 이벤트 주최자만 호출 가능합니다.
- **SECURITY DEFINER**: O
- **파라미터**:
  - `p_carpool_id` (UUID): 수정할 카풀 ID
  - `p_departure_place` (TEXT): 출발 장소
  - `p_departure_time` (TIMESTAMPTZ, nullable): 출발 시간
  - `p_total_seats` (INTEGER): 총 좌석 수 (승인된 탑승자 수 이상이어야 함)
  - `p_description` (TEXT, nullable): 카풀 설명
- **반환값**: BOOLEAN (성공 시 TRUE)
- **에러 코드**:
  - `carpool_not_found`: 카풀이 존재하지 않음
  - `seats_below_approved`: 총 좌석 수가 현재 승인된 탑승자 수보다 적음

---

### `get_admin_kpi_stats()`

**역할:** 관리자 대시보드용 KPI 집계 데이터 반환. admin role 검증 포함. SECURITY DEFINER로 RLS 우회하여 전체 데이터 집계.

| 항목             | 값                                                   |
| ---------------- | ---------------------------------------------------- |
| 파라미터         | 없음                                                 |
| 반환 타입        | `JSON`                                               |
| SECURITY DEFINER | YES                                                  |
| 호출 위치        | Server Action (`actions/admin.ts` → 관리자 대시보드) |

**반환 JSON 구조:**

```json
{
  "total_events": 42,
  "new_events_this_month": 5,
  "total_users": 120,
  "new_users_this_month": 10,
  "avg_participation_rate": 73.2,
  "carpool_match_rate": 85.0
}
```

**보안 설계:**

- 함수 내에서 `profiles.role = 'admin'` 검증 — 비관리자 호출 시 `permission_denied` 예외 발생

---

### `update_user_role(target_user_id UUID, new_role TEXT)`

**역할:** admin이 다른 사용자의 역할을 변경. SECURITY DEFINER로 RLS를 우회하여 프로필 직접 수정.

| 항목             | 값                                                                          |
| ---------------- | --------------------------------------------------------------------------- |
| 파라미터         | `target_user_id UUID`, `new_role TEXT`                                      |
| 반환 타입        | `VOID`                                                                      |
| SECURITY DEFINER | YES                                                                         |
| 예외 코드        | `unauthorized` (비관리자 호출), `self_role_change_blocked` (본인 변경 시도) |
| 호출 위치        | Server Action (`actions/admin.ts` → 관리자 사용자 관리 페이지)              |

**보안 설계:**

- 호출자가 `admin`인지 검증
- 자기 자신의 역할 변경 차단 (실수 방지)

---

## 관련 문서

- `docs/guides/supabase-rls.md` — 테이블별 RLS 정책 전체 상세
- `docs/planning/PROJECT_ISSUES.md` — 기술 부채 및 성능 이슈 추적
- `supabase/migrations/` — 전체 마이그레이션 SQL 파일
  - `20260327000000` — settlement_items 테이블 생성
  - `20260327000100` — get_admin_kpi_stats() RPC 함수
  - `20260327000200` — admin 이벤트 삭제 정책, update_user_role() 함수
  - `20260327000300` — admin 참여 데이터 조회 정책
  - `20260327000400` — pg_trgm GIN 인덱스 추가
  - `20260327000500` — settlement_items.created_by 컬럼 추가
  - `20260327000600` — events.is_settlement_finalized 컬럼 추가
  - `20260327000700` — admin 정산 항목 조회 정책
  - `20260327000800` — admin 이벤트 수정 정책
