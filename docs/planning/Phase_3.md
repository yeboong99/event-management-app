# Phase 3: 카풀 기능 (Carpool)

**생성일:** 2026-03-24
**대상 Phase:** Phase 3
**상태:** 완료

---

## 1. 전체 프로젝트 개요

### 프로젝트 명칭 및 목적

**이벤트 관리 플랫폼 MVP** — 생일파티, 워크샵, 친구 모임 등 일회성 이벤트에서 발생하는 공지, 참여자 관리, 카풀, 정산 부담을 하나의 서비스로 통합 해결하는 플랫폼.

- **대상 사용자:** 소규모 일회성 이벤트를 주최하거나 참여하는 개인 사용자 (모바일 중심, 관리자는 PC)
- **핵심 비즈니스 목표:** 3개 역할(관리자/주최자/참여자)이 각자의 뷰에서 이벤트를 생성, 탐색, 참여하고, 카풀 매칭과 1/N 정산까지 완료할 수 있는 MVP 서비스 제공

### 기술 스택

- **프레임워크:** Next.js 16 (App Router) + React 19
- **언어:** TypeScript
- **스타일링:** TailwindCSS v4 + shadcn/ui
- **백엔드:** Supabase (인증/DB/Storage)
- **폼 처리:** React Hook Form + Zod
- **차트:** Recharts
- **배포:** Vercel

### 아키텍처 요약

- **Supabase 클라이언트 3종:** browser (`lib/supabase/client.ts`), server (`lib/supabase/server.ts`), proxy (`lib/supabase/proxy.ts`)
- **인증:** 쿠키 기반 세션 관리 (`@supabase/ssr`), 미들웨어에서 매 요청 세션 체크
- **라우트 구조:** `(app)` 통합 라우트 그룹 (주최자/참여자 통합), `admin` 별도 라우트
- **DB 타입:** `types/database.types.ts` — Supabase CLI 자동생성

### 전체 Phase 목록

| Phase       | 제목                                                  | 상태     |
| ----------- | ----------------------------------------------------- | -------- |
| Phase 0     | 기반 설정 (Foundation Setup)                          | 완료     |
| Phase 1     | 데이터 레이어 + 이벤트 CRUD                           | 완료     |
| Phase 2     | 참여자 관리 + 공지/댓글 (Participation + Posts)       | 완료     |
| **Phase 3** | **카풀 기능 (Carpool)**                               | **완료** |
| Phase 4     | 정산 + 관리자 대시보드 (Settlement + Admin)           | 미착수   |
| Phase 5     | 프로필 + 사용자 경험 + 보안 (Profile + UX + Security) | 미착수   |
| Phase 6     | 성능 최적화 + 런칭 준비 (Performance + Launch)        | 미착수   |

### 코딩 컨벤션

- 주석 및 문서: 한국어
- 변수명/함수명: 영어, camelCase
- 절대 경로: `@/` 별칭 사용
- Server Component 기본, `'use client'`는 인터랙션 필요 시만
- `params`/`searchParams`는 Promise → 반드시 `await`
- Server Actions: Zod 검증 → 처리 → `revalidatePath()` → `redirect()`
- 폼: 클라이언트(UX) + 서버(보안) 이중 Zod 검증
- `cn()` 유틸리티로 Tailwind 클래스 결합
- 시맨틱 색상 사용 (`bg-primary`, `text-destructive` 등)

---

## 2. 페이즈 전체 요약

### 현재 Phase의 위치와 역할

Phase 3는 Phase 2에서 구현된 참여자 관리 시스템 위에 **카풀 등록 및 탑승 신청/승인/거절/취소** 전체 흐름을 구축하는 단계입니다. 이벤트 참여자 간의 실질적인 이동 수단 매칭 기능을 제공하여, "이벤트 참여"에서 "이벤트 장소까지의 이동"까지 하나의 서비스 내에서 해결할 수 있게 합니다.

### 현재 Phase의 목표

카풀 등록/탑승 신청/승인/거절/취소 전체 흐름 + 잔여 좌석 표시

### 완료 기준 (Definition of Done)

- `carpools`, `carpool_requests` 테이블이 생성되고 RLS 정책이 적용됨
- `approve_carpool_request` RPC 함수로 좌석 초과 승인이 원자적으로 방지됨
- 주최자 또는 승인된 참여자가 카풀을 등록할 수 있음
- 승인된 참여자가 카풀 탑승을 신청할 수 있음
- 드라이버가 탑승 신청을 승인/거절할 수 있음
- 탑승 신청자가 pending 상태의 신청을 취소할 수 있음
- 잔여 좌석이 실시간으로 반영되어 표시됨
- 하단 탭 "카풀" 탭에서 내 카풀 현황(드라이버/탑승자)을 확인할 수 있음
- 주최자 카풀 등록 → 참여자 탑승 신청 → 승인 → 잔여 좌석 반영 전체 흐름 동작

### 주요 산출물 (Deliverables)

- Supabase 마이그레이션: `carpools` 테이블, `carpool_requests` 테이블, `approve_carpool_request` RPC 함수
- Server Actions: `actions/carpools.ts`
- Zod 스키마: `lib/validations/carpool.ts`
- 도메인 타입: `types/carpool.ts`
- 컴포넌트: `carpool-card`, `carpool-actions`, `carpool-request-form`, `carpool-register-form`, `carpool-list`, `my-carpools-view`
- 페이지: 이벤트 상세 카풀 탭 (등록/신청/관리), 내 카풀 목록 페이지 (`app/(app)/carpools/page.tsx`)

### 이전 Phase와의 연관성

- Phase 0에서 생성한 `carpool_request_status` ENUM (`pending`, `approved`, `rejected`)을 그대로 사용함
- Phase 1에서 구현한 이벤트 CRUD, 이벤트 상세 페이지의 탭 구조에 카풀 탭 기능을 채움
- Phase 2에서 구현한 참여자 관리의 `participations` 테이블을 기반으로, 승인된 참여자(`status = 'approved'`)만 카풀 신청 자격이 있음
- Phase 2의 `approve_participation` RPC 함수와 동일한 동시성 제어 패턴을 카풀 좌석 관리에 적용함
- Phase 2의 Server Actions 패턴(`actions/participations.ts`), Zod 검증 패턴(`lib/validations/participation.ts`), 도메인 타입 패턴(`types/participation.ts`)을 동일하게 따름

### 다음 Phase에 미치는 영향

- Phase 4 (정산): 카풀 드라이버의 주유비 등이 정산 항목에 포함될 수 있음
- Phase 4 (관리자 대시보드): 카풀 매칭률 KPI 카드에 `carpools`, `carpool_requests` 데이터가 사용됨
- Phase 5 (접근 제어): 카풀 관련 접근 제어 정책이 추가될 수 있음

---

## 3. 이전 Phase 완료 상태

### Phase 0: 기반 설정 — 완료

구현된 항목:

- [x] TailwindCSS v3 → v4 업그레이드
- [x] 추가 shadcn/ui 컴포넌트 설치 (textarea, select, separator, tabs, avatar, toast, skeleton, dialog, sheet)
- [x] Migration 001 — profiles 스키마 정비 + ENUM 타입 생성 (`role`, `event_category`, `participation_status`, `carpool_request_status`)
- [x] Migration 002 — events 테이블 생성 + RLS
- [x] TypeScript 타입 재생성
- [x] 미들웨어 admin 접근 제어 추가
- [x] 루트 페이지 역할별 리디렉션 구현
- [x] 통합 앱 레이아웃 + 하단 탭 내비게이션 구축 (`(app)` 통합 구조)
- [x] 관리자 레이아웃 구축 (GNB + 사이드바)

산출물:

- `app/(app)/layout.tsx` — 통합 라우트 레이아웃
- `components/mobile/unified-bottom-nav.tsx` — 하단 5탭 내비게이션 (탐색/내활동/만들기/카풀/프로필)
- `components/mobile/mobile-header.tsx` — 모바일 상단 헤더
- `app/admin/layout.tsx` — 관리자 레이아웃
- DB: profiles 테이블 (role 컬럼 포함), events 테이블, ENUM 타입들 (`carpool_request_status` 포함)
- `types/database.types.ts` — 자동생성 타입

### Phase 1: 데이터 레이어 + 이벤트 CRUD — 완료

구현된 항목:

- [x] 이벤트 Zod 스키마 + 공통 타입 정의 (`lib/validations/event.ts`, `types/event.ts`)
- [x] Supabase Storage 버킷 설정 + 이미지 업로드 유틸리티 (`lib/supabase/storage.ts`)
- [x] Server Actions — 이벤트 CRUD (`actions/events.ts`: `createEvent`, `updateEvent`, `deleteEvent`)
- [x] 이벤트 생성/상세/수정 페이지, 삭제 기능
- [x] 내 이벤트 목록 페이지 (`app/(app)/my-events/page.tsx` — 주최 중 탭/참여 중 탭 통합)
- [x] 이벤트 탐색 페이지 (`app/(app)/discover/page.tsx`)
- [x] 초대 링크 복사 기능

산출물:

- `actions/events.ts` — 이벤트 CRUD Server Actions
- `lib/validations/event.ts` — 이벤트 Zod 스키마
- `types/event.ts` — 이벤트 공통 타입
- `components/forms/event-form.tsx` — 이벤트 생성/수정 공통 폼
- `components/mobile/event-card-mobile.tsx` — 이벤트 카드 컴포넌트

### Phase 2: 참여자 관리 + 공지/댓글 — 완료

구현된 항목:

- [x] Migration 003 — participations 테이블 + RLS + 인덱스 (`(event_id, user_id)` UNIQUE)
- [x] Migration 004 — posts 테이블 + RLS
- [x] 참여 승인 동시성 제어 RPC 함수 (`approve_participation`)
- [x] TypeScript 타입 재생성
- [x] Server Actions — 참여자 관리 (`actions/participations.ts`)
- [x] Server Actions — 공지/댓글 (`actions/posts.ts`)
- [x] 참여자 관리 UI (참여자 탭 통합), 게시판 UI (게시판 탭 통합)
- [x] 참여 신청 폼, 접근 제한 안내 컴포넌트

산출물:

- `supabase/migrations/20260322000400_create_approve_participation_rpc.sql`
- `supabase/migrations/20260322000500_update_approve_participation_rpc.sql`
- `actions/participations.ts` — 참여 신청/승인/거절/취소/출석 토글
- `actions/posts.ts` — 게시물 CRUD
- `lib/validations/participation.ts`, `lib/validations/post.ts`
- `types/participation.ts`, `types/post.ts`
- `components/shared/participant-list.tsx`, `components/shared/participant-actions.tsx`, `components/shared/attendance-toggle.tsx`
- `components/shared/posts-section.tsx`, `components/shared/post-feed.tsx`, `components/shared/post-item.tsx`, `components/shared/post-actions.tsx`
- `components/forms/participation-form.tsx`, `components/forms/post-form.tsx`
- `components/shared/access-restricted-notice.tsx`

### 이월 항목 / 기술 부채

- 없음. Phase 0, Phase 1, Phase 2 모두 정상 완료.

### Phase 3 진입 전제 조건 충족 여부

- [x] `events` 테이블 존재 (Phase 0에서 생성)
- [x] `participations` 테이블 존재 (Phase 2에서 생성) — 카풀 신청 자격 확인에 사용
- [x] `carpool_request_status` ENUM 타입 존재 (Phase 0에서 생성, 값: `pending`, `approved`, `rejected`)
- [x] `approve_participation` RPC 함수 패턴 검증 완료 (Phase 2) — 동일 패턴으로 `approve_carpool_request` 구현
- [x] 이벤트 상세 페이지 탭 구조 확립 (Phase 1~2) — 카풀 탭 UI 자리는 있으나 기능 미구현
- [x] 하단 탭 "카풀" 내비게이션 존재 (Phase 0) — 실제 페이지 미구현
- [x] `(app)` 통합 라우트 그룹 구조 확립 (Phase 0)
- [x] Server Actions + Zod 검증 패턴 확립 (Phase 1~2)

---

## 4. Phase 3 액션 아이템

> **중요 경로 참고:** ROADMAP.md에서는 `(host)`, `(participant)` 분리 라우트 구조를 사용하지만, 실제 프로젝트는 Phase 0 추가 작업에서 `(app)` 통합 라우트 구조로 전환되었습니다. 따라서 모든 페이지 경로는 `app/(app)/` 하위에 생성합니다.

> **카풀 비즈니스 규칙:** 카풀 등록은 이벤트 주최자뿐만 아니라 승인된 참여자(드라이버)도 가능합니다. 카풀 탑승 신청은 승인된 참여자만 가능합니다. 드라이버 본인이 자신의 카풀에 탑승 신청할 수 없습니다.

---

### Task 1: Migration 005 — carpools + carpool_requests 테이블 + RLS + 인덱스

**ROADMAP 참조:** TASK-032
**의존성:** 없음 (Phase 2 완료 전제)
**예상 시간:** 3h
**우선순위:** 최상 (후속 모든 Task의 기반)

#### 상세 요구사항

Supabase 마이그레이션 SQL 파일을 작성하여 `carpools` 테이블과 `carpool_requests` 테이블을 생성합니다.

**`carpools` 테이블 스키마:**

```sql
CREATE TABLE carpools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  driver_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  departure_place TEXT NOT NULL,          -- 출발지
  departure_time  TIMESTAMPTZ,            -- 출발 시간
  total_seats     INTEGER NOT NULL,       -- 총 좌석 수 (드라이버 제외)
  description     TEXT,                   -- 추가 안내사항 (차량 정보, 특이사항 등)
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

**`carpool_requests` 테이블 스키마:**

```sql
CREATE TABLE carpool_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carpool_id    UUID NOT NULL REFERENCES carpools(id) ON DELETE CASCADE,
  passenger_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        carpool_request_status NOT NULL DEFAULT 'pending',
  message       TEXT,                   -- 탑승 신청 메시지
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(carpool_id, passenger_id)      -- 동일 카풀에 중복 신청 방지
);
```

**인덱스:**

```sql
CREATE INDEX idx_carpools_event_id ON carpools(event_id);
CREATE INDEX idx_carpool_requests_carpool_id ON carpool_requests(carpool_id);
CREATE INDEX idx_carpool_requests_passenger_id ON carpool_requests(passenger_id);
```

**RLS 정책:**

- `carpools` 테이블:
  - SELECT: 같은 이벤트의 승인된 참여자(`participations.status = 'approved'`) 또는 이벤트 주최자가 조회 가능
  - INSERT: 이벤트 주최자 또는 해당 이벤트의 승인된 참여자가 등록 가능 (드라이버 = 본인)
  - DELETE: 카풀 드라이버 본인 또는 이벤트 주최자만 삭제 가능
- `carpool_requests` 테이블:
  - SELECT: 카풀 드라이버, 탑승 신청자 본인, 또는 이벤트 주최자가 조회 가능
  - INSERT: 해당 이벤트의 승인된 참여자만 신청 가능 (본인이 드라이버인 카풀에는 신청 불가)
  - UPDATE: 카풀 드라이버 또는 이벤트 주최자만 상태 변경 가능
  - DELETE: 탑승 신청자 본인만 삭제 가능 (pending 상태에서 취소 시)

**파일:** `supabase/migrations/YYYYMMDDHHMMSS_create_carpools_and_requests.sql`

#### 완료 기준

- [ ] `carpools` 테이블이 정상 생성되고 모든 컬럼과 제약 조건이 적용됨
- [ ] `carpool_requests` 테이블이 정상 생성되고 `(carpool_id, passenger_id)` UNIQUE 제약이 적용됨
- [ ] 3개 인덱스가 정상 생성됨
- [ ] RLS 정책이 활성화되고 각 역할별 접근 제어가 정상 동작함
- [ ] FK `ON DELETE CASCADE`가 적용되어 이벤트/카풀 삭제 시 연쇄 삭제됨
- [ ] `carpool_request_status` ENUM (Phase 0에서 생성됨)이 `carpool_requests.status` 컬럼에 정상 적용됨

#### 기술적 고려사항

- `carpool_request_status` ENUM은 Phase 0 (`supabase/migrations/20260321000000_base_schema.sql`)에서 이미 생성됨. 별도 생성하지 말 것
- Phase 2의 `participations` 테이블 마이그레이션 패턴을 참고하여 일관된 스타일로 작성
- RLS 정책에서 `participations` 테이블을 서브쿼리로 참조하여 승인된 참여자 여부를 확인

---

### Task 2: 카풀 좌석 동시성 제어 RPC 함수

**ROADMAP 참조:** TASK-033
**의존성:** Task 1
**예상 시간:** 2h
**우선순위:** 최상 (Server Actions에서 호출 필수)

#### 상세 요구사항

Phase 2에서 구현한 `approve_participation` RPC 함수와 동일한 패턴으로, 카풀 탑승 신청 승인 시 좌석 초과를 원자적으로 방지하는 PostgreSQL 함수를 작성합니다.

**함수 시그니처:**

```sql
CREATE OR REPLACE FUNCTION approve_carpool_request(
  p_request_id UUID,
  p_carpool_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_total_seats INTEGER;
BEGIN
  -- carpools 행에 대한 잠금 획득 (동시성 제어)
  SELECT total_seats INTO v_total_seats
  FROM carpools
  WHERE id = p_carpool_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'carpool_not_found';
  END IF;

  -- 현재 승인된 탑승자 수 조회
  SELECT COUNT(*) INTO v_current_count
  FROM carpool_requests
  WHERE carpool_id = p_carpool_id AND status = 'approved';

  -- 좌석 초과 체크
  IF v_current_count >= v_total_seats THEN
    RAISE EXCEPTION 'seats_full';
  END IF;

  -- 승인 처리
  UPDATE carpool_requests
  SET status = 'approved', updated_at = now()
  WHERE id = p_request_id AND carpool_id = p_carpool_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**파일:** `supabase/migrations/YYYYMMDDHHMMSS_create_approve_carpool_request_rpc.sql`

#### 완료 기준

- [ ] `approve_carpool_request(p_request_id, p_carpool_id)` RPC 함수가 정상 생성됨
- [ ] `FOR UPDATE` 잠금으로 동시 승인 요청 시 좌석 초과가 방지됨
- [ ] `total_seats` 이상의 승인 시도 시 `seats_full` 예외가 발생함
- [ ] 존재하지 않는 카풀/요청에 대해 적절한 예외가 발생함
- [ ] `SECURITY DEFINER`로 RLS를 우회하여 함수 내에서 직접 데이터를 조작함

#### 기술적 고려사항

- `approve_participation` RPC 함수(`supabase/migrations/20260322000500_update_approve_participation_rpc.sql`)의 패턴을 동일하게 따름
- 예외 메시지 문자열(`carpool_not_found`, `seats_full`, `request_not_found`)은 Server Actions에서 매핑하여 사용자 친화적 에러 메시지로 변환

---

### Task 3: TypeScript 타입 재생성 + 도메인 타입 정의

**ROADMAP 참조:** TASK-034
**의존성:** Task 1, Task 2
**예상 시간:** 1h
**우선순위:** 높음 (Server Actions 및 UI 구현의 전제)

#### 상세 요구사항

**3-1. Supabase 타입 재생성**

```bash
npx supabase gen types typescript --local > types/database.types.ts
```

또는 원격 프로젝트 기준:

```bash
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
```

`types/database.types.ts`에 `carpools`, `carpool_requests` 테이블 타입과 `approve_carpool_request` RPC 함수 타입이 반영되었는지 확인합니다.

**3-2. 도메인 타입 파일 생성 (`types/carpool.ts`)**

Phase 2의 `types/participation.ts` 패턴을 따라 카풀 관련 도메인 타입을 정의합니다.

```typescript
import { Database } from "@/types/database.types";
import { EventWithHost } from "@/types/event";

// DB 기본 타입
export type Carpool = Database["public"]["Tables"]["carpools"]["Row"];
export type CarpoolInsert = Database["public"]["Tables"]["carpools"]["Insert"];
export type CarpoolRequest =
  Database["public"]["Tables"]["carpool_requests"]["Row"];
export type CarpoolRequestInsert =
  Database["public"]["Tables"]["carpool_requests"]["Insert"];
export type CarpoolRequestStatus =
  Database["public"]["Enums"]["carpool_request_status"];

// 드라이버 프로필 정보가 포함된 카풀 조인 타입
export type CarpoolWithDriver = Carpool & {
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
};

// 카풀 + 드라이버 + 승인된 탑승자 수 (카드 표시용)
export type CarpoolWithDetails = CarpoolWithDriver & {
  approved_count: number;
  carpool_requests?: CarpoolRequestWithProfile[];
};

// 탑승자 프로필 정보가 포함된 요청 조인 타입
export type CarpoolRequestWithProfile = CarpoolRequest & {
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
};

// 카풀 + 이벤트 정보가 포함된 조인 타입 (내 카풀 목록 조회용)
export type CarpoolRequestWithCarpool = CarpoolRequest & {
  carpools: CarpoolWithDriver & {
    events: EventWithHost;
  };
};

// 내가 등록한 카풀 + 이벤트 정보 (드라이버로서의 내 카풀 목록)
export type CarpoolWithEvent = Carpool & {
  events: EventWithHost;
  approved_count: number;
};
```

**파일:**

- `types/database.types.ts` (재생성)
- `types/carpool.ts` (신규 생성)

#### 완료 기준

- [ ] `types/database.types.ts`에 `carpools`, `carpool_requests` 테이블 타입이 반영됨
- [ ] `types/database.types.ts`에 `approve_carpool_request` RPC 함수 타입이 반영됨
- [ ] `types/carpool.ts`에 모든 도메인 타입이 정의되고 타입 오류 없이 빌드됨
- [ ] 기존 `CarpoolRequestStatus` 타입이 `carpool_request_status` ENUM과 일치함 (`pending`, `approved`, `rejected`)

---

### Task 4: 카풀 Zod 검증 스키마 정의

**ROADMAP 참조:** 별도 TASK 없음 (TASK-035의 전제 작업)
**의존성:** Task 3
**예상 시간:** 1h
**우선순위:** 높음 (Server Actions에서 사용)

#### 상세 요구사항

Phase 2의 `lib/validations/participation.ts` 패턴을 따라 카풀 관련 Zod 스키마를 정의합니다.

**파일:** `lib/validations/carpool.ts`

```typescript
import { z } from "zod";

// 카풀 등록 스키마
export const registerCarpoolSchema = z.object({
  eventId: z.string().uuid("유효한 이벤트 ID가 아닙니다"),
  departurePlace: z
    .string()
    .min(1, "출발지를 입력해주세요")
    .max(100, "출발지는 100자 이내로 입력해주세요"),
  departureTime: z.string().optional(), // ISO 문자열, 선택 입력
  totalSeats: z
    .number({ message: "좌석 수를 입력해주세요" })
    .int("좌석 수는 정수여야 합니다")
    .min(1, "최소 1석 이상이어야 합니다")
    .max(10, "최대 10석까지 등록 가능합니다"),
  description: z
    .string()
    .max(300, "안내사항은 300자 이내로 입력해주세요")
    .optional(),
});

// 카풀 탑승 신청 스키마
export const requestCarpoolSchema = z.object({
  carpoolId: z.string().uuid("유효한 카풀 ID가 아닙니다"),
  message: z.string().max(200, "메시지는 200자 이내로 입력해주세요").optional(),
});

// 카풀 요청 상태 변경 스키마 (승인/거절)
export const updateCarpoolRequestStatusSchema = z.object({
  requestId: z.string().uuid("유효한 요청 ID가 아닙니다"),
  carpoolId: z.string().uuid("유효한 카풀 ID가 아닙니다"),
  status: z.enum(["approved", "rejected"], {
    error: () => ({ message: "승인 또는 거절만 선택 가능합니다" }),
  }),
});

export type RegisterCarpoolInput = z.infer<typeof registerCarpoolSchema>;
export type RequestCarpoolInput = z.infer<typeof requestCarpoolSchema>;
export type UpdateCarpoolRequestStatusInput = z.infer<
  typeof updateCarpoolRequestStatusSchema
>;
```

#### 완료 기준

- [ ] 카풀 등록, 탑승 신청, 상태 변경 3개 스키마가 정의됨
- [ ] 각 스키마의 타입 추론(`z.infer`)이 export됨
- [ ] 한국어 에러 메시지가 모든 필드에 포함됨
- [ ] `npm run type-check` 통과

---

### Task 5: Server Actions — 카풀 관리 구현

**ROADMAP 참조:** TASK-035
**의존성:** Task 3, Task 4
**예상 시간:** 4h
**우선순위:** 높음 (UI 컴포넌트에서 호출)

#### 상세 요구사항

Phase 2의 `actions/participations.ts` 패턴을 따라 카풀 관련 Server Actions를 구현합니다. 모든 함수는 `ActionResult<T>` 타입(`types/action.ts`)을 반환합니다.

**파일:** `actions/carpools.ts`

**구현할 함수 목록:**

1. **`registerCarpool(formData: FormData): Promise<ActionResult>`**
   - 인증 확인 → Zod 서버 검증 → 권한 확인 (주최자 또는 승인된 참여자) → `carpools` INSERT → `revalidatePath` → 결과 반환
   - driver_id는 현재 로그인 사용자의 ID로 설정

2. **`deleteCarpool(carpoolId: string, eventId: string): Promise<ActionResult>`**
   - 인증 확인 → 권한 확인 (드라이버 본인 또는 주최자) → `carpools` DELETE → `revalidatePath` → 결과 반환
   - 카풀 삭제 시 `carpool_requests`도 CASCADE로 삭제됨

3. **`requestCarpool(formData: FormData): Promise<ActionResult>`**
   - 인증 확인 → Zod 서버 검증 → 승인된 참여자 여부 확인 → 본인 카풀 아닌지 확인 → `carpool_requests` INSERT → `revalidatePath` → 결과 반환
   - 중복 신청 시 (23505 에러) 사용자 친화적 에러 메시지 반환

4. **`approveCarpoolRequest(requestId: string, carpoolId: string, eventId: string): Promise<ActionResult>`**
   - 인증 확인 → 권한 확인 (드라이버 또는 주최자) → `approve_carpool_request` RPC 호출 → `revalidatePath` → 결과 반환
   - RPC 예외 매핑: `seats_full` → "좌석이 모두 찼습니다", `carpool_not_found` → "카풀을 찾을 수 없습니다"

5. **`rejectCarpoolRequest(requestId: string, carpoolId: string, eventId: string): Promise<ActionResult>`**
   - 인증 확인 → 권한 확인 (드라이버 또는 주최자) → `carpool_requests` UPDATE (status → `rejected`) → `revalidatePath` → 결과 반환

6. **`cancelCarpoolRequest(requestId: string, eventId: string): Promise<ActionResult>`**
   - 인증 확인 → 본인 확인 → pending 상태 확인 → `carpool_requests` DELETE → `revalidatePath` → 결과 반환
   - pending 상태가 아닌 경우 에러 반환

**데이터 조회 함수 (Server Component에서 호출):**

7. **`getCarpoolsByEventId(eventId: string): Promise<CarpoolWithDetails[]>`**
   - 이벤트에 등록된 모든 카풀 목록 조회 (드라이버 프로필, 승인된 탑승자 수 포함)
   - 생성일 기준 오름차순 정렬

8. **`getCarpoolRequests(carpoolId: string): Promise<CarpoolRequestWithProfile[]>`**
   - 특정 카풀의 모든 탑승 신청 목록 조회 (탑승자 프로필 포함)
   - pending → approved → rejected 순서로 정렬

9. **`getMyCarpoolRequests(userId: string): Promise<CarpoolRequestWithCarpool[]>`**
   - 내가 탑승 신청한 카풀 목록 조회 (카풀 + 이벤트 정보 포함)
   - 상태별 필터 지원 (선택적 status 파라미터)

10. **`getMyCarpools(userId: string): Promise<CarpoolWithEvent[]>`**
    - 내가 드라이버로 등록한 카풀 목록 조회 (이벤트 정보 + 승인된 탑승자 수 포함)

**공통 패턴:**

- 모든 mutate 함수는 `revalidatePath(`/events/${eventId}`)` 호출
- 에러 처리: `try/catch`로 Supabase 에러를 캐치하여 `ActionResult` 형태로 반환
- Zod 검증 실패 시 첫 번째 에러 메시지를 반환

#### 완료 기준

- [ ] 6개 mutation 함수와 4개 조회 함수가 구현됨
- [ ] 모든 mutation 함수에 인증 및 권한 확인이 포함됨
- [ ] `approveCarpoolRequest`가 RPC 함수를 호출하여 동시성 제어가 적용됨
- [ ] 중복 신청, 좌석 초과, 권한 없음 등 에러 케이스에 대한 한국어 에러 메시지가 반환됨
- [ ] `revalidatePath`가 올바른 경로로 호출됨
- [ ] `npm run type-check` 통과

---

### Task 6: 이벤트 상세 카풀 탭 — 카풀 목록 및 등록 UI

**ROADMAP 참조:** TASK-036
**의존성:** Task 5
**예상 시간:** 4h
**우선순위:** 중간 (사용자 대면 UI)

#### 상세 요구사항

이벤트 상세 페이지(`app/(app)/events/[eventId]/page.tsx`)의 카풀 탭에 카풀 관련 UI를 구현합니다. 이 탭은 주최자와 승인된 참여자 모두가 접근할 수 있으며, 역할에 따라 다른 기능이 노출됩니다.

**6-1. 카풀 카드 컴포넌트 (`components/shared/carpool-card.tsx`)**

- 드라이버 이름 + 아바타
- 출발지, 출발 시간
- 잔여 좌석 표시: `{승인된 탑승자 수} / {총 좌석 수}석`
- 좌석이 모두 찬 경우 "마감" 배지 표시
- 설명(description)이 있으면 표시
- 역할에 따른 액션 버튼 영역 (slot 또는 children)

**6-2. 카풀 등록 폼 (`components/forms/carpool-register-form.tsx`)**

- `'use client'` 컴포넌트 (React Hook Form + Zod)
- 입력 필드: 출발지(필수), 출발 시간(선택), 좌석 수(필수, 1~10), 안내사항(선택)
- `registerCarpool` Server Action 호출
- 등록 성공 시 토스트 표시 + 폼 초기화
- 주최자 또는 승인된 참여자에게만 노출

**6-3. 카풀 관리 액션 컴포넌트 (`components/shared/carpool-actions.tsx`)**

- 드라이버 본인 또는 주최자에게 노출
- 탑승 신청 목록 표시 (pending/approved/rejected)
- 승인 버튼 → `approveCarpoolRequest` 호출 (잔여석 있을 때만 활성화)
- 거절 버튼 → `rejectCarpoolRequest` 호출
- 카풀 삭제 버튼 → 확인 다이얼로그 → `deleteCarpool` 호출

**6-4. 카풀 탭 섹션 컴포넌트 (`components/shared/carpool-section.tsx`)**

- 이벤트 상세 페이지의 카풀 탭 전체 레이아웃을 관리
- 카풀 등록 폼 + 카풀 카드 목록을 조합
- 비승인 사용자 접근 시 `AccessRestrictedNotice` 컴포넌트 표시 (Phase 2에서 구현된 것 재사용)
- 카풀이 없을 때 빈 상태 UI

**파일:**

- `components/shared/carpool-card.tsx`
- `components/shared/carpool-actions.tsx`
- `components/shared/carpool-section.tsx`
- `components/forms/carpool-register-form.tsx`
- `app/(app)/events/[eventId]/page.tsx` (카풀 탭 영역 수정)

#### 완료 기준

- [ ] 카풀 카드에 드라이버 정보, 출발지, 좌석 현황이 정상 표시됨
- [ ] 잔여 좌석이 0이면 "마감" 배지가 표시됨
- [ ] 주최자 또는 승인된 참여자가 카풀을 등록할 수 있음
- [ ] 드라이버가 탑승 신청을 승인/거절할 수 있음
- [ ] 카풀 삭제 시 확인 다이얼로그가 표시됨
- [ ] 비승인 사용자에게 접근 제한 안내가 표시됨
- [ ] 카풀이 없을 때 빈 상태 UI가 표시됨
- [ ] React Hook Form + Zod 클라이언트 검증이 동작함
- [ ] 폼 제출 후 `revalidatePath`로 목록이 갱신됨
- [ ] `npm run type-check` 및 `npm run lint` 통과

#### 기술적 고려사항

- Phase 2에서 구현한 `AccessRestrictedNotice` 컴포넌트를 재사용
- Phase 2의 `participant-list.tsx`, `participant-actions.tsx` 컴포넌트 구조를 참고
- 카풀 카드의 잔여 좌석 계산은 Server Component에서 조회 시 `approved_count`로 전달하여 클라이언트에서 단순 렌더링
- 삭제 확인 다이얼로그는 Phase 1에서 구현한 `components/shared/confirm-dialog.tsx` 재사용

---

### Task 7: 이벤트 상세 카풀 탭 — 탑승 신청 UI

**ROADMAP 참조:** TASK-037
**의존성:** Task 5, Task 6
**예상 시간:** 3h
**우선순위:** 중간 (사용자 대면 UI)

#### 상세 요구사항

승인된 참여자가 카풀에 탑승을 신청하고, 신청 상태를 확인하며, pending 상태의 신청을 취소할 수 있는 UI를 구현합니다.

**7-1. 카풀 탑승 신청 폼 (`components/forms/carpool-request-form.tsx`)**

- `'use client'` 컴포넌트 (React Hook Form + Zod)
- 입력 필드: 메시지(선택, 200자 이내)
- `requestCarpool` Server Action 호출
- 잔여석이 없으면 버튼 비활성화 + "마감" 표시
- 이미 신청한 카풀이면 버튼 대신 현재 신청 상태 표시
- 본인이 드라이버인 카풀이면 "탑승 신청" 버튼 비노출

**7-2. 신청 상태 표시 및 취소 (`components/shared/carpool-request-status.tsx`)**

- 현재 사용자의 해당 카풀 신청 상태를 배지로 표시:
  - `pending`: 노란색 "대기 중" 배지 + 취소 버튼
  - `approved`: 초록색 "승인됨" 배지
  - `rejected`: 빨간색 "거절됨" 배지
- 취소 버튼 클릭 → `cancelCarpoolRequest` 호출

**7-3. 카풀 카드 내 탑승 신청 영역 통합**

- `carpool-card.tsx`에 참여자 뷰 확장:
  - 잔여석이 있고 미신청 상태이면 → 탑승 신청 폼 표시
  - 이미 신청한 상태이면 → 신청 상태 표시 + (pending이면 취소 버튼)
  - 본인이 드라이버이면 → "내 카풀" 표시

**파일:**

- `components/forms/carpool-request-form.tsx`
- `components/shared/carpool-request-status.tsx`
- `components/shared/carpool-card.tsx` (수정 — 참여자 뷰 추가)
- `components/shared/carpool-section.tsx` (수정 — 현재 사용자 신청 상태 전달)

#### 완료 기준

- [ ] 승인된 참여자가 잔여석이 있는 카풀에 탑승 신청할 수 있음
- [ ] 이미 신청한 카풀에는 중복 신청 버튼이 표시되지 않음
- [ ] 신청 상태가 배지로 올바르게 표시됨 (pending/approved/rejected)
- [ ] pending 상태의 신청만 취소할 수 있음
- [ ] 잔여석이 0인 카풀은 신청 버튼이 비활성화됨
- [ ] 본인이 드라이버인 카풀에는 탑승 신청 버튼이 표시되지 않음
- [ ] 중복 신청 시 사용자 친화적 에러 메시지가 토스트로 표시됨
- [ ] `npm run type-check` 및 `npm run lint` 통과

---

### Task 8: 내 카풀 목록 페이지 (하단 탭 "카풀")

**ROADMAP 참조:** TASK-038
**의존성:** Task 5, Task 6, Task 7
**예상 시간:** 3h
**우선순위:** 중간 (독립 페이지)

#### 상세 요구사항

하단 5탭 내비게이션의 "카풀" 탭에 연결되는 페이지를 구현합니다. 내가 탑승 신청한 카풀과 내가 드라이버로 등록한 카풀을 모두 확인할 수 있습니다.

**8-1. 페이지 라우트 (`app/(app)/carpools/page.tsx`)**

- Server Component로 구현
- 상단에 2개 뷰 전환 탭: "탑승 신청" / "내가 등록한 카풀"
- URL 쿼리 파라미터로 탭 상태 관리: `?tab=requests` (기본), `?tab=driver`
- `getMyCarpoolRequests(userId)` 및 `getMyCarpools(userId)` 호출

**8-2. 탑승 신청 뷰 (기본 탭)**

- 내가 탑승 신청한 카풀 카드 목록
- 각 카드에 표시: 이벤트명, 드라이버명, 출발지, 출발 시간, 신청 상태 배지
- 상태별 필터: 전체 / 대기 / 승인 / 거절
- pending 상태의 신청에 취소 버튼
- 카드 클릭 시 해당 이벤트 상세 페이지로 이동
- 빈 상태 UI: "탑승 신청한 카풀이 없습니다"

**8-3. 내가 등록한 카풀 뷰 (드라이버 탭)**

- 내가 드라이버로 등록한 카풀 카드 목록
- 각 카드에 표시: 이벤트명, 출발지, 출발 시간, 좌석 현황 (`{승인}/{총}석`)
- 카드 클릭 시 해당 이벤트 상세 페이지로 이동
- 빈 상태 UI: "등록한 카풀이 없습니다"

**파일:**

- `app/(app)/carpools/page.tsx`
- `components/shared/my-carpool-requests-view.tsx` (탑승 신청 뷰)
- `components/shared/my-carpools-driver-view.tsx` (드라이버 뷰)

#### 완료 기준

- [ ] 하단 탭 "카풀" 클릭 시 `/carpools` 페이지가 정상 렌더링됨
- [ ] "탑승 신청" 탭에서 내가 신청한 카풀 목록이 표시됨
- [ ] "내가 등록한 카풀" 탭에서 내가 드라이버로 등록한 카풀 목록이 표시됨
- [ ] 상태별 필터(전체/대기/승인/거절)가 동작함
- [ ] pending 상태의 신청에서 취소가 가능함
- [ ] 카드 클릭 시 이벤트 상세 페이지로 이동함
- [ ] 빈 상태 UI가 각 뷰에서 올바르게 표시됨
- [ ] 탭 전환이 URL 쿼리 파라미터로 관리됨
- [ ] `npm run type-check` 및 `npm run lint` 통과

#### 기술적 고려사항

- 하단 탭 "카풀"의 라우트 경로가 `components/mobile/unified-bottom-nav.tsx`에서 `/carpools`로 설정되어 있는지 확인 필요
- Phase 2의 `app/(app)/my-events/page.tsx` (주최 중/참여 중 탭 전환) 패턴을 참고하여 URL 기반 탭 전환 구현
- 카풀 카드는 Task 6에서 만든 `carpool-card.tsx`를 확장하여 이벤트 정보를 추가로 표시하거나, 별도의 목록용 카드 컴포넌트를 작성

---

## 5. Task 의존성 및 권장 실행 순서

```
Task 1 (DB 마이그레이션)
  └─> Task 2 (RPC 함수)
       └─> Task 3 (타입 재생성 + 도메인 타입)
            └─> Task 4 (Zod 스키마)
                 └─> Task 5 (Server Actions)
                      ├─> Task 6 (카풀 탭 — 등록/관리 UI)
                      │    └─> Task 7 (카풀 탭 — 탑승 신청 UI)
                      └─> Task 8 (내 카풀 목록 페이지)
```

**권장 실행 순서:** Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8

- Task 1~5는 순차적으로 실행 (각 Task가 이전 Task의 산출물에 의존)
- Task 6, 7은 순차적 (Task 7이 Task 6의 컴포넌트를 확장)
- Task 8은 Task 5 이후 독립 실행 가능하나, Task 6/7의 카드 컴포넌트 재사용 시 이후 실행 권장

---

## 6. 위험 요소 및 완화 방안

| 위험                                      | 영향도 | 완화 방안                                                                          |
| ----------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| 좌석 동시성 제어 실패                     | 높음   | Phase 2의 `approve_participation` RPC 패턴을 동일하게 적용, `FOR UPDATE` 잠금 사용 |
| RLS 정책 복잡도 (participations 서브쿼리) | 중간   | 각 시나리오별 RLS 정책을 사전 설계 후 SQL 작성, 테스트 데이터로 검증               |
| 하단 탭 "카풀" 라우트 불일치              | 낮음   | `unified-bottom-nav.tsx`의 카풀 탭 href가 `/carpools`인지 사전 확인                |
| 카풀 삭제 시 CASCADE 영향                 | 중간   | 삭제 전 확인 다이얼로그로 사용자 실수 방지, CASCADE 동작을 마이그레이션에서 명시   |

---

## 7. 파일 변경 총괄

### 신규 생성 파일

| 파일 경로                                                                   | 설명                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------- |
| `supabase/migrations/YYYYMMDDHHMMSS_create_carpools_and_requests.sql`       | carpools + carpool_requests 테이블 + RLS + 인덱스 |
| `supabase/migrations/YYYYMMDDHHMMSS_create_approve_carpool_request_rpc.sql` | 카풀 좌석 동시성 제어 RPC 함수                    |
| `types/carpool.ts`                                                          | 카풀 도메인 타입 정의                             |
| `lib/validations/carpool.ts`                                                | 카풀 Zod 검증 스키마                              |
| `actions/carpools.ts`                                                       | 카풀 Server Actions                               |
| `components/shared/carpool-card.tsx`                                        | 카풀 카드 컴포넌트                                |
| `components/shared/carpool-actions.tsx`                                     | 카풀 관리 액션 (승인/거절/삭제)                   |
| `components/shared/carpool-section.tsx`                                     | 이벤트 상세 카풀 탭 섹션                          |
| `components/shared/carpool-request-status.tsx`                              | 카풀 신청 상태 표시 + 취소                        |
| `components/forms/carpool-register-form.tsx`                                | 카풀 등록 폼                                      |
| `components/forms/carpool-request-form.tsx`                                 | 카풀 탑승 신청 폼                                 |
| `app/(app)/carpools/page.tsx`                                               | 내 카풀 목록 페이지                               |
| `components/shared/my-carpool-requests-view.tsx`                            | 탑승 신청 뷰                                      |
| `components/shared/my-carpools-driver-view.tsx`                             | 드라이버 뷰                                       |

### 수정 파일

| 파일 경로                             | 변경 내용                                               |
| ------------------------------------- | ------------------------------------------------------- |
| `types/database.types.ts`             | Supabase CLI로 재생성 (carpools, carpool_requests 반영) |
| `app/(app)/events/[eventId]/page.tsx` | 카풀 탭 영역에 `CarpoolSection` 컴포넌트 통합           |
