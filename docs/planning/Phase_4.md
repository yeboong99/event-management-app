# Phase 4: 정산 + 관리자 대시보드 (Settlement + Admin)

**생성일:** 2026-03-27
**대상 Phase:** Phase 4
**상태:** 미착수

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

| Phase       | 제목                                                  | 상태          |
| ----------- | ----------------------------------------------------- | ------------- |
| Phase 0     | 기반 설정 (Foundation Setup)                          | 완료          |
| Phase 1     | 데이터 레이어 + 이벤트 CRUD                           | 완료          |
| Phase 2     | 참여자 관리 + 공지/댓글 (Participation + Posts)       | 완료          |
| Phase 3     | 카풀 기능 (Carpool)                                   | 완료          |
| **Phase 4** | **정산 + 관리자 대시보드 (Settlement + Admin)**       | **진행 예정** |
| Phase 5     | 프로필 + 사용자 경험 + 보안 (Profile + UX + Security) | 미착수        |
| Phase 6     | 성능 최적화 + 런칭 준비 (Performance + Launch)        | 미착수        |

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

Phase 4는 Phase 0~3에서 구축된 이벤트 생성/참여/카풀 기능 위에 **1/N 균등 정산 알고리즘**과 **관리자 대시보드(KPI, 차트, 데이터 테이블)**를 구축하는 단계입니다. 이 단계가 완료되면 주최자가 이벤트 지출 항목을 입력하고 자동으로 정산 결과를 계산할 수 있으며, 관리자가 서비스 전반의 현황을 KPI 카드와 차트로 모니터링할 수 있게 됩니다. MVP의 핵심 비즈니스 가치인 "이벤트 정산 자동화"를 실현하는 마지막 핵심 기능 단계입니다.

### 현재 Phase의 목표

1/N 균등 정산 알고리즘 구현 + 관리자 대시보드(KPI, 차트, 데이터 테이블)

### 완료 기준 (Definition of Done)

- `settlement_items` 테이블이 생성되고 RLS 정책이 적용됨
- 주최자가 지출 항목(항목명, 금액, 지출자)을 추가/수정/삭제할 수 있음
- "정산 계산하기" 버튼 클릭 시 1/N 균등 부담액과 최소 거래 쌍이 계산되어 표시됨
- `Math.floor` 기반 나머지 보정 로직으로 합계 불일치 없이 정산 결과가 출력됨
- 참여자가 정산 탭에서 자신의 납부/수령 금액을 확인할 수 있음
- 관리자 대시보드에 4개 KPI 카드(총 이벤트, 총 사용자, 평균 참여율, 카풀 매칭률)가 실제 DB 데이터로 표시됨
- 관리자 대시보드에 월별 이벤트 생성 현황 Bar 차트가 표시됨 (Recharts)
- 관리자 대시보드에 최근 가입자 5~10명 테이블이 표시됨
- 관리자 이벤트 관리 페이지에 전체 이벤트 데이터 테이블(카테고리 필터, 삭제, 페이지네이션)이 구현됨
- 관리자 사용자 관리 페이지에 역할 변경 Select, 이름/이메일 검색, 페이지네이션이 구현됨

### 주요 산출물 (Deliverables)

- Supabase 마이그레이션: `settlement_items` 테이블 + RLS + 인덱스
- 정산 알고리즘: `lib/settlement.ts` (그리디 최소 거래 쌍 알고리즘)
- Server Actions: `actions/settlements.ts`, `actions/admin.ts`
- Zod 스키마: `lib/validations/settlement.ts`
- 도메인 타입: `types/settlement.ts`
- 관리자 컴포넌트: `kpi-card`, `events-chart`, `events-table`, `users-table`
- 정산 컴포넌트: `settlement-section`, `settlement-item-form`, `settlement-summary`, `settlement-result`
- 페이지: 이벤트 상세 정산 탭 (주최자/참여자), 관리자 대시보드/이벤트관리/사용자관리

### 이전 Phase와의 연관성

- Phase 0에서 생성한 `profiles` 테이블 (role 컬럼)과 관리자 레이아웃을 기반으로 관리자 기능 구현
- Phase 1에서 구현한 이벤트 CRUD의 `events` 테이블과 이벤트 상세 페이지 탭 구조에 정산 탭 기능을 채움
- Phase 2에서 구현한 `participations` 테이블의 `status = 'approved'` 데이터를 기반으로 정산 대상자(주최자 + 승인 참여자)를 결정
- Phase 3에서 구현한 `carpools`, `carpool_requests` 테이블을 기반으로 카풀 매칭률 KPI를 계산
- Phase 1~3의 Server Actions + Zod 검증 패턴(`actions/*.ts`, `lib/validations/*.ts`, `types/*.ts`)을 동일하게 따름

### 다음 Phase에 미치는 영향

- Phase 5 (프로필 + UX): 관리자 대시보드가 완성되어 관리자 관련 추가 UX 개선이 용이해짐
- Phase 5 (접근 제어): 정산 탭 접근 제어 정책이 추가될 수 있음
- Phase 6 (E2E 검증): 주최자의 전체 흐름(이벤트 생성 → 참여자 승인 → 카풀 → 정산)이 완성되어 E2E 테스트 가능

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
- `components/mobile/unified-bottom-nav.tsx` — 하단 5탭 내비게이션
- `app/admin/layout.tsx` — 관리자 레이아웃 (AdminSidebar + AdminHeader)
- DB: profiles 테이블 (role 컬럼 포함), events 테이블, ENUM 타입들

### Phase 1: 데이터 레이어 + 이벤트 CRUD — 완료

구현된 항목:

- [x] 이벤트 Zod 스키마 + 공통 타입 정의 (`lib/validations/event.ts`, `types/event.ts`)
- [x] Supabase Storage 버킷 설정 + 이미지 업로드 유틸리티 (`lib/supabase/storage.ts`)
- [x] Server Actions — 이벤트 CRUD (`actions/events.ts`: `createEvent`, `updateEvent`, `deleteEvent`)
- [x] 이벤트 생성/상세/수정 페이지, 삭제 기능
- [x] 내 이벤트 목록 페이지 (`app/(app)/my-events/page.tsx` — 주최 중/참여 중 탭 통합)
- [x] 이벤트 탐색 페이지 (`app/(app)/discover/page.tsx`)
- [x] 초대 링크 복사 기능

산출물:

- `actions/events.ts` — 이벤트 CRUD Server Actions
- `lib/validations/event.ts` — 이벤트 Zod 스키마
- `types/event.ts` — 이벤트 공통 타입
- `components/forms/event-form.tsx` — 이벤트 생성/수정 공통 폼

### Phase 2: 참여자 관리 + 공지/댓글 — 완료

구현된 항목:

- [x] Migration 003 — participations 테이블 + RLS + 인덱스
- [x] Migration 004 — posts 테이블 + RLS
- [x] 참여 승인 동시성 제어 RPC 함수 (`approve_participation`)
- [x] TypeScript 타입 재생성
- [x] Server Actions — 참여자 관리 (`actions/participations.ts`)
- [x] Server Actions — 공지/댓글 (`actions/posts.ts`)
- [x] 참여자 관리 UI (참여자 탭 통합), 게시판 UI (게시판 탭 통합)
- [x] 참여 신청 폼, 접근 제한 안내 컴포넌트

산출물:

- `actions/participations.ts` — 참여 신청/승인/거절/취소/출석 토글
- `actions/posts.ts` — 게시물 CRUD
- `lib/validations/participation.ts`, `lib/validations/post.ts`
- `types/participation.ts`, `types/post.ts`
- `components/shared/participant-list.tsx`, `components/shared/attendance-toggle.tsx`
- `components/shared/posts-section.tsx`, `components/shared/post-feed.tsx`

### Phase 3: 카풀 기능 — 완료

구현된 항목:

- [x] Migration 005 — carpools + carpool_requests 테이블 + RLS + 인덱스
- [x] 카풀 좌석 동시성 제어 RPC 함수 (`approve_carpool_request`)
- [x] 카풀 수정 RPC 함수 (`update_carpool_info`)
- [x] TypeScript 타입 재생성
- [x] Server Actions — 카풀 관리 (`actions/carpools.ts`)
- [x] 카풀 관리 UI (이벤트 상세 카풀 탭 통합)
- [x] 내 카풀 목록 페이지 (`app/(app)/carpools/page.tsx` — 탑승 신청/드라이버 탭)
- [x] 비공개 이벤트 초대 토큰 기반 랜딩 페이지 (`app/(app)/events/[eventId]/join/page.tsx`)

산출물:

- `actions/carpools.ts` — 카풀 등록/삭제/탑승 신청/승인/거절/취소
- `lib/validations/carpool.ts` — 카풀 Zod 스키마
- `types/carpool.ts` — 카풀 공통 타입
- `components/shared/carpool-section.tsx`, `carpool-tabs.tsx`, `carpool-card.tsx`, `carpool-actions.tsx`
- `components/forms/carpool-register-form.tsx`, `carpool-request-form.tsx`
- DB: carpools 테이블, carpool_requests 테이블, `approve_carpool_request` RPC, `update_carpool_info` RPC, `get_event_by_invite_token` RPC

### 이월 항목 / 기술 부채

- 관리자 대시보드 레이아웃만 구현, KPI 카드/차트/최근 가입자 테이블 미구현 → Phase 4에서 구현
- 관리자 이벤트 관리, 사용자 관리 페이지 기본 CRUD만 구현, 필터/검색/페이지네이션/역할 변경 미구현 → Phase 4에서 강화
- 이벤트 상세 페이지 정산 탭 자리 존재하나 기능 미구현 → Phase 4에서 구현

### Phase 4 진입 전제 조건 충족 여부

- [x] `events` 테이블 존재 (Phase 0에서 생성)
- [x] `participations` 테이블 존재 (Phase 2에서 생성) — 정산 대상자 결정에 사용
- [x] `carpools`, `carpool_requests` 테이블 존재 (Phase 3에서 생성) — 카풀 매칭률 KPI 계산에 사용
- [x] `profiles` 테이블에 `role` 컬럼 존재 (Phase 0) — 관리자 식별에 사용
- [x] 관리자 레이아웃 및 라우트 구조 확립 (`app/admin/layout.tsx`, Phase 0)
- [x] 이벤트 상세 페이지 탭 구조 확립 (Phase 1~3) — 정산 탭 UI 자리 존재
- [x] `(app)` 통합 라우트 그룹 구조 확립 (Phase 0)
- [x] Server Actions + Zod 검증 패턴 확립 (Phase 1~3)
- [x] `approve_participation`, `approve_carpool_request` RPC 패턴 검증 완료 — 동시성 제어 패턴 참고

---

## 4. Phase 4 액션 아이템

> **중요 경로 참고:** ROADMAP.md에서는 `(host)`, `(participant)` 분리 라우트 구조를 사용하지만, 실제 프로젝트는 Phase 0 추가 작업에서 `(app)` 통합 라우트 구조로 전환되었습니다. 따라서 정산 관련 모든 페이지 경로는 `app/(app)/events/[eventId]/page.tsx`의 정산 탭에 통합합니다. 관리자 페이지는 기존 `app/admin/` 구조를 그대로 사용합니다.

> **정산 비즈니스 규칙:**
>
> - 정산 대상자는 이벤트 주최자(host) + 승인된 참여자(approved participants)입니다.
> - 지출 항목 추가/수정/삭제는 주최자만 가능합니다.
> - 지출자(paid_by)는 정산 대상자 중 한 명이어야 합니다.
> - 1/N 균등 분배에서 `Math.floor` 사용 후 나머지를 첫 번째 debtor에게 할당하여 합계 불일치를 방지합니다.
> - 정산 결과는 실시간 계산(DB에 저장하지 않음)으로, 항목이 변경되면 다시 계산합니다.

---

### Task 1: Migration 006 — settlement_items 테이블 + RLS + 인덱스

**ROADMAP 참조:** TASK-039
**의존성:** 없음 (Phase 3 완료 전제)
**예상 시간:** 1.5h
**우선순위:** 최상 (후속 정산 Task의 기반)

#### 상세 요구사항

Supabase 마이그레이션 SQL 파일을 작성하여 `settlement_items` 테이블을 생성합니다.

**`settlement_items` 테이블 스키마:**

```sql
CREATE TABLE settlement_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  paid_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,              -- 항목명 (예: "식대", "장소 대관료")
  amount     INTEGER NOT NULL,           -- 금액 (원 단위, 양의 정수)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**CHECK 제약조건:**

```sql
ALTER TABLE settlement_items ADD CONSTRAINT settlement_items_amount_positive CHECK (amount > 0);
```

**인덱스:**

```sql
CREATE INDEX idx_settlement_items_event_id ON settlement_items(event_id);
```

**updated_at 자동 갱신 트리거:**

```sql
CREATE TRIGGER update_settlement_items_updated_at
  BEFORE UPDATE ON settlement_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**RLS 정책:**

- SELECT: 이벤트 주최자 또는 해당 이벤트의 승인된 참여자(`is_approved_participant_for_event(event_id)`)가 조회 가능
- INSERT: 이벤트 주최자만 추가 가능 (`events.host_id = auth.uid()`)
- UPDATE: 이벤트 주최자만 수정 가능
- DELETE: 이벤트 주최자만 삭제 가능

**파일:** `supabase/migrations/YYYYMMDDHHMMSS_create_settlement_items.sql`

#### 완료 기준

- [ ] `settlement_items` 테이블이 정상 생성되고 모든 컬럼과 제약 조건(PK, FK, CHECK)이 적용됨
- [ ] `amount > 0` CHECK 제약이 적용되어 음수/0 금액 입력이 차단됨
- [ ] `idx_settlement_items_event_id` 인덱스가 정상 생성됨
- [ ] `update_settlement_items_updated_at` 트리거가 정상 동작하여 수정 시 `updated_at`이 자동 갱신됨
- [ ] RLS 정책이 활성화되고 주최자만 CRUD, 승인 참여자는 조회만 가능
- [ ] FK `ON DELETE CASCADE`가 적용되어 이벤트 삭제 시 정산 항목도 연쇄 삭제됨

#### 기술적 고려사항

- `update_updated_at_column()` 트리거 함수는 Phase 2에서 이미 생성됨 (`participations`, `posts` 테이블에서 사용 중). 별도 생성하지 말 것
- `is_approved_participant_for_event()` 함수도 이미 존재 — RLS SELECT 정책에서 재사용
- Phase 2의 `participations` 테이블 마이그레이션 패턴을 참고하여 일관된 스타일로 작성
- `paid_by`가 해당 이벤트의 주최자 또는 승인 참여자인지 검증은 애플리케이션(Server Action) 레이어에서 수행

---

### Task 2: TypeScript 타입 재생성 (settlement_items)

**ROADMAP 참조:** TASK-040
**의존성:** Task 1
**예상 시간:** 30m
**우선순위:** 최상 (후속 Task에서 타입 필요)

#### 상세 요구사항

Supabase CLI를 사용하여 `types/database.types.ts` 파일을 재생성합니다.

```bash
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
```

재생성 후 `settlement_items` 관련 타입이 `Database['public']['Tables']['settlement_items']`에 올바르게 반영되었는지 확인합니다.

#### 도메인 타입 정의

`types/settlement.ts` 파일을 새로 생성합니다:

```typescript
import type { Database } from "@/types/database.types";

// DB Row 타입
export type SettlementItem =
  Database["public"]["Tables"]["settlement_items"]["Row"];
export type SettlementItemInsert =
  Database["public"]["Tables"]["settlement_items"]["Insert"];
export type SettlementItemUpdate =
  Database["public"]["Tables"]["settlement_items"]["Update"];

// 지출자 이름이 포함된 조인 타입
export type SettlementItemWithPayer = SettlementItem & {
  payer: {
    id: string;
    name: string | null;
  };
};

// 정산 계산 결과 타입
export type SettlementTransaction = {
  from: string; // debtor 이름
  fromId: string; // debtor user ID
  to: string; // creditor 이름
  toId: string; // creditor user ID
  amount: number; // 거래 금액 (원)
};

export type SettlementResult = {
  totalAmount: number; // 총 지출 금액
  participantCount: number; // 정산 대상자 수 (주최자 포함)
  perPerson: number; // 1인 균등 부담액
  transactions: SettlementTransaction[]; // 최소 거래 쌍 목록
};
```

**파일:** `types/database.types.ts` (재생성), `types/settlement.ts` (신규)

#### 완료 기준

- [ ] `types/database.types.ts`에 `settlement_items` 테이블 타입이 반영됨
- [ ] `types/settlement.ts` 도메인 타입이 생성되고 `SettlementItem`, `SettlementItemWithPayer`, `SettlementTransaction`, `SettlementResult` 타입이 정의됨
- [ ] `npm run type-check` 통과

---

### Task 3: 정산 알고리즘 구현 (calculateSettlement)

**ROADMAP 참조:** TASK-041
**의존성:** Task 2
**예상 시간:** 3h
**우선순위:** 최상 (정산 기능의 핵심 비즈니스 로직)

#### 상세 요구사항

PRD에 명시된 5단계 그리디 알고리즘을 구현합니다. 이 함수는 순수 계산 함수로, DB 호출 없이 입력 데이터를 받아 정산 결과를 반환합니다.

**파일:** `lib/settlement.ts`

**함수 시그니처:**

```typescript
type ParticipantPayment = {
  userId: string;
  name: string;
  totalPaid: number; // 해당 참여자가 지출한 총액 (지출 항목이 없으면 0)
};

export function calculateSettlement(
  payments: ParticipantPayment[],
  totalAmount: number,
): SettlementResult;
```

**알고리즘 상세 (5단계):**

1. **총 지출 집계:** `totalAmount` 파라미터로 전달 (호출자가 합산)
2. **참여자 수 확인:** `payments.length` (주최자 포함, 0명이면 빈 결과 반환)
3. **1인 균등 부담액 계산:** `perPerson = Math.floor(totalAmount / participantCount)`. 나머지(`totalAmount % participantCount`)는 별도 보정
4. **각 참여자 순잔액(balance) 계산:**
   - `balance = totalPaid - perPerson`
   - `balance > 0`: creditor (받을 돈)
   - `balance < 0`: debtor (낼 돈)
   - `balance === 0`: 정산 완료 (목록에서 제외)
5. **나머지 보정 + 그리디 알고리즘으로 최소 거래 쌍 결정:**
   - 나머지(`remainder = totalAmount % participantCount`)가 존재하면, debtors 배열의 첫 번째 debtor부터 순서대로 1원씩 추가 부담 (debtor.balance를 1원씩 감소)
   - creditors 배열을 balance 큰 순으로 정렬
   - debtors 배열을 절댓값 큰 순으로 정렬
   - while 루프로 creditor와 debtor를 매칭하여 최소 거래 쌍 생성

**중요 주의사항:**

- `Math.ceil` 사용 시 총 부담액 > 실제 지출 문제 발생 → 반드시 `Math.floor` 사용
- 나머지 보정을 통해 `totalAmount === sum(perPerson) + remainder`가 항상 성립해야 함
- 참여자가 0명이거나 totalAmount가 0인 경우 빈 결과(`transactions: []`) 반환
- 단위 테스트가 가능하도록 순수 함수로 구현 (DB 의존성 없음)

#### 완료 기준

- [ ] `lib/settlement.ts` 파일에 `calculateSettlement` 함수가 구현됨
- [ ] `Math.floor` + 나머지 보정 로직이 올바르게 동작하여 합계 불일치가 없음
- [ ] 그리디 알고리즘으로 최소 거래 쌍이 정확히 계산됨
- [ ] 엣지 케이스 처리: 참여자 0명, totalAmount 0, 한 명만 지출, 모든 참여자가 동일하게 지출
- [ ] 반환 타입이 `SettlementResult`와 일치함
- [ ] `npm run type-check` 통과

#### 기술적 고려사항

- 이 함수는 Server Action과 클라이언트 양쪽에서 사용할 수 있도록 순수 함수로 작성
- `SettlementResult` 타입은 `types/settlement.ts`에서 import
- 부동소수점 오류를 방지하기 위해 모든 금액은 정수(원 단위)로 처리

---

### Task 4: 정산 Zod 스키마 정의

**ROADMAP 참조:** TASK-042의 전제
**의존성:** Task 2
**예상 시간:** 30m
**우선순위:** 높음 (Server Actions에서 사용)

#### 상세 요구사항

정산 항목 생성/수정 폼용 Zod 스키마를 정의합니다.

**파일:** `lib/validations/settlement.ts`

```typescript
import { z } from "zod";

// 정산 항목 생성/수정 폼 스키마
export const settlementItemFormSchema = z.object({
  label: z
    .string()
    .min(1, "항목명을 입력해주세요")
    .max(100, "항목명은 100자 이내로 입력해주세요"),
  amount: z
    .number()
    .int("금액은 정수여야 합니다")
    .positive("금액은 1원 이상이어야 합니다")
    .max(100_000_000, "금액은 1억원을 초과할 수 없습니다"),
  paidBy: z.string().uuid("유효하지 않은 사용자입니다"),
});

export type SettlementItemFormData = z.infer<typeof settlementItemFormSchema>;
```

#### 완료 기준

- [ ] `lib/validations/settlement.ts` 파일에 `settlementItemFormSchema`가 정의됨
- [ ] label, amount, paidBy 각 필드에 적절한 검증 규칙과 한국어 에러 메시지가 설정됨
- [ ] `SettlementItemFormData` 타입이 export됨

---

### Task 5: Server Actions — 정산 관리 구현

**ROADMAP 참조:** TASK-042
**의존성:** Task 1, Task 2, Task 3, Task 4
**예상 시간:** 3h
**우선순위:** 높음 (UI에서 호출하는 핵심 액션)

#### 상세 요구사항

`actions/settlements.ts` 파일을 생성하여 정산 관리 Server Actions를 구현합니다.

**파일:** `actions/settlements.ts`

**구현할 함수 목록:**

1. **`getSettlementItems(eventId: string)`**
   - 이벤트의 전체 정산 항목을 조회 (지출자 프로필 join)
   - 반환: `SettlementItemWithPayer[]`

2. **`createSettlementItem(formData: FormData)`**
   - 정산 항목 생성 (Zod 서버 검증)
   - 주최자 권한 검증 필수
   - `revalidatePath(`/events/${eventId}`)` 호출
   - 반환: `ActionResult<SettlementItem>`

3. **`updateSettlementItem(formData: FormData)`**
   - 정산 항목 수정 (Zod 서버 검증)
   - 주최자 권한 검증 필수
   - `revalidatePath()` 호출
   - 반환: `ActionResult<SettlementItem>`

4. **`deleteSettlementItem(formData: FormData)`**
   - 정산 항목 삭제
   - 주최자 권한 검증 필수
   - `revalidatePath()` 호출
   - 반환: `ActionResult<null>`

5. **`getSettlementResult(eventId: string)`**
   - 정산 항목 조회 + 참여자 목록 조회(주최자 포함) + `calculateSettlement()` 호출
   - `participations`에서 `status = 'approved'`인 참여자 + 주최자를 대상으로 함
   - 각 참여자별 `settlement_items`의 지출 총액을 집계
   - 반환: `SettlementResult | null` (항목 없으면 null)

**공통 패턴:**

- 파일 최상단: `'use server'`
- 인증 확인: `createClient()` → `supabase.auth.getUser()` → 미인증 시 에러
- 주최자 검증: `events` 테이블에서 `host_id === user.id` 확인
- Zod 검증: `settlementItemFormSchema.safeParse()`
- 에러 처리: `ActionResult<T>` 타입의 `{ success, data?, error? }` 반환
- 캐시 무효화: `revalidatePath(`/events/${eventId}`)` 또는 적절한 경로

#### 완료 기준

- [ ] `actions/settlements.ts` 파일이 생성되고 5개 함수가 구현됨
- [ ] 모든 CUD 함수에서 주최자 권한 검증이 수행됨
- [ ] Zod 서버 검증이 create/update에 적용됨
- [ ] `getSettlementResult`가 `calculateSettlement` 라이브러리 함수를 올바르게 호출하여 결과를 반환함
- [ ] `revalidatePath()`가 CUD 액션 후 올바르게 호출됨
- [ ] `ActionResult<T>` 반환 타입을 사용하여 기존 패턴과 일관됨

#### 기술적 고려사항

- `getSettlementResult`에서 참여자 목록 조회 시, `participations` 테이블의 RLS에 의해 현재 사용자 기준으로만 조회될 수 있음 → SECURITY DEFINER 함수가 필요하지 않은지 확인. 만약 승인된 참여자가 다른 참여자의 정산 결과를 보려면 `is_approved_participant_for_event()` RLS 정책이 적절히 설정되어 있어야 함
- `paid_by`가 해당 이벤트의 정산 대상자(주최자 또는 승인 참여자)인지 검증은 `createSettlementItem`/`updateSettlementItem`에서 수행
- `get_event_participant_count` RPC 함수는 이미 존재하므로 참여자 수 확인에 활용 가능

---

### Task 6: 정산 관리 UI — 주최자 정산 탭

**ROADMAP 참조:** TASK-043
**의존성:** Task 5
**예상 시간:** 4h
**우선순위:** 높음

#### 상세 요구사항

이벤트 상세 페이지(`app/(app)/events/[eventId]/page.tsx`)의 정산 탭에 주최자용 정산 관리 기능을 구현합니다. Phase 2~3에서 참여자 탭, 게시판 탭, 카풀 탭을 구현한 패턴과 동일한 구조를 따릅니다.

**생성할 컴포넌트:**

1. **`components/shared/settlement-section.tsx`** (Server Component)
   - 정산 탭의 최상위 컴포넌트
   - `getSettlementItems(eventId)`와 `getSettlementResult(eventId)`를 호출하여 데이터 페칭
   - 주최자/참여자 여부에 따라 하위 컴포넌트 분기
   - Props: `eventId`, `isHost`, `isApproved`, `participants` (정산 대상자 목록)

2. **`components/forms/settlement-item-form.tsx`** (Client Component, `'use client'`)
   - React Hook Form + Zod 이중 검증
   - 필드: 항목명(label) 텍스트 입력, 금액(amount) 숫자 입력, 지출자(paidBy) Select
   - 지출자 Select에는 정산 대상자(주최자 + 승인 참여자) 목록이 표시됨
   - 생성/수정 모드 전환 가능 (초기값이 있으면 수정 모드)
   - `createSettlementItem` / `updateSettlementItem` Server Action 호출
   - 제출 후 폼 리셋 + 성공 토스트

3. **`components/shared/settlement-item-list.tsx`** (Client Component)
   - 정산 항목 목록 테이블/카드 UI
   - 각 항목: 항목명, 금액(원 단위 포맷), 지출자 이름
   - 주최자에게만 수정/삭제 버튼 표시
   - 수정 클릭 시 `settlement-item-form`을 인라인 수정 모드로 전환
   - 삭제 클릭 시 확인 다이얼로그 → `deleteSettlementItem` 호출
   - 총 지출 합계 하단 표시

4. **`components/shared/settlement-result.tsx`** (Server/Client Component)
   - 정산 계산 결과 표시 영역
   - 정산 항목이 1개 이상일 때만 표시
   - 표시 내용:
     - 총 지출 금액
     - 정산 대상자 수 (N명)
     - 1인 균등 부담액 (N원)
     - 최소 거래 쌍 테이블: "A → B에게 N원" 형태
     - 현재 사용자의 개인 정산 결과 강조 (받을 돈 / 낼 돈 / 정산 완료)

**이벤트 상세 페이지 통합:**

기존 `app/(app)/events/[eventId]/page.tsx`에서 정산 탭에 `SettlementSection` 컴포넌트를 렌더링합니다. 카풀 탭 통합 패턴(`CarpoolSection`)과 동일한 구조를 따릅니다:

- 주최자(`isHost = true`): 항목 추가 폼 + 항목 목록(수정/삭제) + 정산 결과
- 승인 참여자(`isApproved = true`, `isHost = false`): 항목 목록(읽기 전용) + 정산 결과 (내 결과 강조)
- 미승인 참여자: `AccessRestrictedNotice` 표시

#### 완료 기준

- [ ] 주최자가 정산 탭에서 지출 항목을 추가/수정/삭제할 수 있음
- [ ] 지출 항목 추가 시 항목명, 금액, 지출자(Select)를 입력할 수 있음
- [ ] 총 지출 합계가 올바르게 표시됨
- [ ] 정산 결과(1인 부담액, 최소 거래 쌍)가 올바르게 계산되어 표시됨
- [ ] 금액이 원 단위 포맷(예: "12,500원")으로 표시됨
- [ ] React Hook Form + Zod 이중 검증이 정상 동작 (클라이언트 + 서버)
- [ ] 수정/삭제 시 확인 다이얼로그가 표시됨 (삭제 시)
- [ ] 모바일(375px) 레이아웃에서 정상 표시됨

#### 기술적 고려사항

- Phase 3의 `CarpoolSection` → `CarpoolTabs` 패턴을 참고: Server Component에서 데이터 페칭 → Client Component에 props 전달
- 금액 입력 시 쉼표 포맷팅은 디스플레이에서만 적용, 실제 값은 정수(number)로 관리
- 지출자 Select의 옵션 목록은 Server Component에서 참여자 목록을 조회하여 Client Component에 전달
- `components/shared/confirm-dialog.tsx` 재사용 (이벤트 삭제, 카풀 삭제에서 이미 사용)

---

### Task 7: 정산 현황 UI — 참여자 정산 탭

**ROADMAP 참조:** TASK-044
**의존성:** Task 5, Task 6
**예상 시간:** 2h
**우선순위:** 높음

#### 상세 요구사항

Task 6에서 구현한 정산 탭의 참여자 뷰를 구현합니다. 승인된 참여자가 이벤트 상세 페이지의 정산 탭에서 자신의 납부/수령 금액을 확인할 수 있습니다.

**참여자 뷰 구성 (SettlementSection에서 `isHost = false` 분기):**

1. **전체 지출 항목 목록 (읽기 전용)**
   - 항목명, 금액, 지출자 이름 표시
   - 수정/삭제 버튼 미표시
   - 총 지출 합계 하단 표시

2. **정산 결과 영역**
   - 1인 균등 부담액 표시
   - 최소 거래 쌍 전체 목록 표시
   - **내 정산 결과 강조 표시:**
     - 내가 받을 돈이 있는 경우: "N원을 받을 수 있습니다" (포지티브 스타일)
     - 내가 낼 돈이 있는 경우: "A에게 N원을 보내야 합니다" (경고 스타일)
     - 정산 완료(balance = 0): "정산이 완료되었습니다" (중립 스타일)

**참고:** 미승인 참여자는 정산 탭 접근 시 `AccessRestrictedNotice` 컴포넌트가 표시됩니다 (Task 6에서 이미 분기 처리).

#### 완료 기준

- [ ] 승인된 참여자가 정산 탭에서 전체 지출 항목을 읽기 전용으로 확인할 수 있음
- [ ] 1인 균등 부담액과 최소 거래 쌍 목록이 표시됨
- [ ] 현재 사용자의 개인 정산 결과가 시각적으로 강조 표시됨 (받을 돈/낼 돈/완료)
- [ ] 항목 수정/삭제 UI가 참여자에게 노출되지 않음
- [ ] 미승인 참여자에게 접근 제한 안내가 표시됨

---

### Task 8: 관리자 대시보드 — KPI 카드

**ROADMAP 참조:** TASK-045
**의존성:** 없음 (Phase 0~3 완료 전제, 정산 Task와 독립)
**예상 시간:** 3h
**우선순위:** 중간 (정산 Task와 병렬 진행 가능)

#### 상세 요구사항

기존 관리자 대시보드 페이지(`app/admin/page.tsx`)에 4개 KPI 카드를 실제 DB 집계 데이터로 구현합니다.

**생성/수정할 파일:**

1. **`components/admin/kpi-card.tsx`** (Server Component)
   - 재사용 가능한 KPI 카드 컴포넌트
   - Props: `title` (지표명), `value` (주요 수치), `subValue` (보조 수치, 예: "이번 달 +5"), `icon` (Lucide 아이콘)
   - 시맨틱 색상 사용, 다크 모드 대응

2. **`app/admin/page.tsx`** 수정 (Server Component)
   - 4개 KPI 카드를 그리드로 배치 (데스크탑: 4열, 태블릿: 2열)
   - 각 KPI 데이터를 Supabase 쿼리로 조회

**4개 KPI 카드 상세:**

| KPI          | 주요 수치                           | 보조 수치            | 쿼리 대상                          |
| ------------ | ----------------------------------- | -------------------- | ---------------------------------- |
| 총 이벤트 수 | `events` COUNT                      | 이번 달 생성 수      | `events` 테이블                    |
| 총 사용자 수 | `profiles` COUNT                    | 이번 달 신규 가입 수 | `profiles` 테이블                  |
| 평균 참여율  | (승인 참여자 수 / 최대 인원) 평균 % | -                    | `events` + `participations` 테이블 |
| 카풀 매칭률  | (승인된 탑승 / 전체 신청) %         | -                    | `carpool_requests` 테이블          |

**Supabase 쿼리 구현:**

- 총 이벤트 수: `supabase.from('events').select('*', { count: 'exact', head: true })`
- 이번 달 이벤트: `.gte('created_at', firstDayOfMonth)`
- 총 사용자 수: `supabase.from('profiles').select('*', { count: 'exact', head: true })`
- 평균 참여율: `max_participants`가 NULL이 아닌 이벤트들에 대해 `approved 참여자 수 / max_participants`의 평균
- 카풀 매칭률: `carpool_requests`에서 `approved / total` 비율

**주의:** 관리자 페이지에서는 RLS를 우회해야 할 수 있습니다. `SUPABASE_SERVICE_ROLE_KEY`를 사용하는 admin client가 필요하거나, 또는 DB 함수(SECURITY DEFINER)로 집계 쿼리를 구현합니다. 현재 프로젝트에서는 profiles RLS가 인증된 사용자에게 모든 프로필 조회를 허용하므로, 기본 server client로 충분한지 확인이 필요합니다.

#### 완료 기준

- [ ] `components/admin/kpi-card.tsx` 재사용 가능 컴포넌트가 생성됨
- [ ] 관리자 대시보드에 4개 KPI 카드가 실제 DB 데이터로 표시됨
- [ ] 이번 달 생성 수 / 신규 가입 수가 올바르게 계산됨
- [ ] 평균 참여율과 카풀 매칭률이 퍼센트(%)로 올바르게 표시됨
- [ ] 데스크탑(1280px+) 4열 그리드, 태블릿(768px) 2열 그리드 레이아웃이 정상 동작함
- [ ] 다크 모드에서 카드가 올바르게 표시됨

#### 기술적 고려사항

- KPI 집계 쿼리는 데이터가 많아지면 성능 저하 가능 → 필요 시 Supabase View 또는 DB 함수로 전환 고려
- `max_participants = NULL`인 이벤트는 평균 참여율 계산에서 제외
- 카풀 매칭률: `carpool_requests`가 0건이면 "N/A" 또는 0% 표시
- 관리자 페이지는 Server Component로 구현하여 클라이언트에 DB 쿼리 결과만 전달

---

### Task 9: 관리자 대시보드 — 이벤트 현황 차트

**ROADMAP 참조:** TASK-046
**의존성:** Task 8
**예상 시간:** 2h
**우선순위:** 중간

#### 상세 요구사항

관리자 대시보드에 월별 이벤트 생성 현황 Bar 차트를 추가합니다. Recharts 라이브러리를 사용하며, Client Component로 구현합니다.

**생성할 파일:**

1. **`components/admin/events-chart.tsx`** (Client Component, `'use client'`)
   - Recharts `BarChart` 사용
   - X축: 월 (최근 6~12개월)
   - Y축: 이벤트 생성 수
   - 바 색상: 시맨틱 primary 색상 사용
   - 반응형: 컨테이너 너비에 따라 차트 크기 자동 조절 (`ResponsiveContainer`)
   - Props: `data: { month: string; count: number }[]`

2. **`app/admin/page.tsx`** 수정
   - KPI 카드 아래에 차트 영역 배치
   - Server Component에서 월별 이벤트 생성 데이터를 조회하여 Client Component에 전달

**데이터 조회:**

```typescript
// 최근 6개월 월별 이벤트 생성 수
// events 테이블에서 created_at 기준으로 GROUP BY 월
```

#### 완료 기준

- [ ] `components/admin/events-chart.tsx` Client Component가 생성됨
- [ ] Recharts BarChart로 월별 이벤트 생성 현황이 표시됨
- [ ] 차트가 반응형으로 동작하여 컨테이너 크기에 맞게 조절됨
- [ ] 데이터가 없는 월에도 0으로 표시됨
- [ ] 다크 모드에서 차트 색상/텍스트가 올바르게 표시됨

#### 기술적 고려사항

- Recharts는 이미 `package.json`에 포함되어 있음 (PRD 기술 스택에 명시)
- Client Component이므로 `'use client'` 선언 필수
- 차트 데이터는 Server Component(admin page)에서 조회 후 props로 전달하는 패턴 사용
- TailwindCSS 시맨틱 색상 변수를 Recharts fill/stroke에 적용 (CSS 변수 참조)

---

### Task 10: 관리자 대시보드 — 최근 가입자 테이블

**ROADMAP 참조:** TASK-047
**의존성:** Task 8
**예상 시간:** 1h
**우선순위:** 중간

#### 상세 요구사항

관리자 대시보드에 최근 가입자 5~10명 테이블을 추가합니다.

**`app/admin/page.tsx`** 수정 (차트 아래 영역):

- `profiles` 테이블에서 `created_at DESC` 순으로 최근 10명 조회
- 테이블 컬럼: 이름(`name`), 이메일(`email`), 가입일(`created_at` 포맷팅)
- 간단한 HTML 테이블 또는 shadcn/ui 스타일의 테이블 UI
- 이름이 없는 경우(`name = null`) "이름 미설정" 표시

#### 완료 기준

- [ ] 관리자 대시보드에 최근 가입자 테이블이 표시됨
- [ ] 이름, 이메일, 가입일이 올바르게 표시됨
- [ ] 가입일이 한국어 날짜 포맷(예: "2026.03.27")으로 표시됨
- [ ] 빈 상태 처리 (사용자가 없는 경우)

---

### Task 11: 관리자 이벤트 관리 페이지 강화

**ROADMAP 참조:** TASK-048
**의존성:** Task 8 (공통 admin 패턴 확립)
**예상 시간:** 3h
**우선순위:** 중간

#### 상세 요구사항

기존 관리자 이벤트 관리 페이지(`app/admin/events/page.tsx`)를 데이터 테이블 형태로 강화합니다.

**생성/수정할 파일:**

1. **`components/admin/events-table.tsx`** (Server 또는 Client Component)
   - 전체 이벤트 데이터 테이블
   - 컬럼: 이벤트명(`title`), 카테고리(`category`), 주최자(`host.name`), 일시(`event_date`), 참여 인원(승인/최대), 공개 여부(`is_public`)
   - 카테고리 필터 (Select 또는 탭)
   - 삭제 버튼 (확인 다이얼로그 포함) — `deleteEvent` Server Action 호출
   - 페이지네이션 (서버 사이드 offset/limit 기반)
   - 행 클릭 시 이벤트 상세 페이지로 이동 (선택 사항)

2. **`app/admin/events/page.tsx`** 수정
   - URL searchParams로 필터/페이지 상태 관리 (`?category=...&page=1`)
   - Supabase 쿼리에 필터/페이지네이션 적용

**페이지네이션 구현:**

- 한 페이지당 10~20개 행
- `searchParams.page`로 현재 페이지 관리
- `supabase.from('events').range(from, to)` 사용
- "이전/다음" 버튼 또는 페이지 번호 표시

**카테고리 필터:**

- "전체" + 6개 카테고리 (`event_category` ENUM 값)
- URL searchParams로 상태 관리 (`?category=생일파티`)
- 필터 변경 시 페이지를 1로 리셋

#### 완료 기준

- [ ] 전체 이벤트 데이터 테이블이 올바르게 표시됨
- [ ] 카테고리 필터가 정상 동작함
- [ ] 이벤트 삭제 시 확인 다이얼로그가 표시되고 삭제 후 목록이 갱신됨
- [ ] 페이지네이션이 정상 동작하며 URL searchParams에 반영됨
- [ ] 데스크탑(1280px+) 레이아웃에서 테이블이 올바르게 표시됨

#### 기술적 고려사항

- 이벤트 목록 조회 시 `profiles` 테이블과 join하여 주최자 이름을 가져옴
- 참여 인원은 `get_events_participant_counts` RPC 함수를 활용하여 N+1 방지
- `deleteEvent` Server Action은 기존 `actions/events.ts`에 이미 구현됨 — 재사용
- 관리자는 본인이 주최하지 않은 이벤트도 삭제할 수 있어야 함 → RLS 정책 확인 필요 (admin role에 대한 별도 정책이 없다면 service role key 사용 또는 RLS에 admin 예외 추가)

---

### Task 12: 관리자 사용자 관리 페이지 강화

**ROADMAP 참조:** TASK-049
**의존성:** Task 8 (공통 admin 패턴 확립)
**예상 시간:** 3h
**우선순위:** 중간

#### 상세 요구사항

기존 관리자 사용자 관리 페이지(`app/admin/users/page.tsx`)를 강화하고, 역할 변경 Server Action을 구현합니다.

**생성/수정할 파일:**

1. **`components/admin/users-table.tsx`** (Client Component, `'use client'`)
   - 전체 사용자 데이터 테이블
   - 컬럼: 이름(`name`), 이메일(`email`), 역할(`role`), 가입일(`created_at`), 주최 이벤트 수
   - 역할 변경 Select (user / admin) — 변경 시 `updateUserRole` Server Action 호출
   - 이름/이메일 검색 (디바운스 적용, URL searchParams 연동)
   - 페이지네이션 (서버 사이드 offset/limit 기반)

2. **`actions/admin.ts`** (신규)
   - `updateUserRole(formData: FormData)` Server Action
   - 현재 사용자가 admin인지 검증
   - `profiles` 테이블의 `role` 컬럼 업데이트
   - 자기 자신의 역할 변경은 차단 (안전 장치)
   - `revalidatePath('/admin/users')` 호출
   - 반환: `ActionResult<null>`

3. **`app/admin/users/page.tsx`** 수정
   - URL searchParams로 검색/페이지 상태 관리 (`?search=...&page=1`)
   - Supabase 쿼리에 검색/페이지네이션 적용

**검색 구현:**

- 이름 또는 이메일로 검색 (부분 일치)
- `supabase.from('profiles').or('name.ilike.%keyword%,email.ilike.%keyword%')`
- 디바운스 300ms 적용 (Client Component에서 URL push)

**역할 변경 규칙:**

- 현재 사용자(`auth.uid()`)가 `role = 'admin'`인지 검증
- 대상 사용자의 역할을 `user` ↔ `admin` 토글
- 자기 자신의 역할 변경 불가 (시스템 안전장치)
- 변경 성공 시 토스트 메시지 표시

#### 완료 기준

- [ ] 전체 사용자 데이터 테이블이 올바르게 표시됨
- [ ] 역할 변경 Select가 정상 동작하고 DB에 반영됨
- [ ] 자기 자신의 역할 변경이 차단됨
- [ ] 이름/이메일 검색이 디바운스로 동작하고 URL searchParams에 반영됨
- [ ] 페이지네이션이 정상 동작함
- [ ] `actions/admin.ts`에 `updateUserRole` Server Action이 구현됨

#### 기술적 고려사항

- `profiles` 테이블의 `role` 컬럼 UPDATE는 RLS 정책에서 "본인만 수정 가능"으로 설정되어 있을 수 있음 → 관리자가 다른 사용자의 역할을 변경하려면 SECURITY DEFINER 함수 또는 service role key가 필요할 수 있음
- 주최 이벤트 수는 `events` 테이블에서 `host_id` 기준으로 COUNT → 성능을 위해 별도 쿼리 또는 서브쿼리 사용
- 검색 기능은 Client Component에서 `useSearchParams` + `useRouter`로 URL 기반 상태 관리

---

## Task 의존성 및 권장 실행 순서

```
[정산 트랙] (순차)
Task 1: settlement_items 테이블 생성
  └─→ Task 2: TypeScript 타입 재생성 + 도메인 타입
       ├─→ Task 3: 정산 알고리즘 구현
       └─→ Task 4: Zod 스키마 정의
            └─→ Task 5: Server Actions 구현 (depends on Task 3, 4)
                 └─→ Task 6: 주최자 정산 UI (depends on Task 5)
                      └─→ Task 7: 참여자 정산 UI (depends on Task 6)

[관리자 트랙] (순차, 정산 트랙과 병렬 가능)
Task 8: KPI 카드 구현
  ├─→ Task 9: 이벤트 현황 차트 (depends on Task 8)
  ├─→ Task 10: 최근 가입자 테이블 (depends on Task 8)
  ├─→ Task 11: 이벤트 관리 페이지 강화 (depends on Task 8)
  └─→ Task 12: 사용자 관리 페이지 강화 (depends on Task 8)
```

**병렬 실행 가능 조합:**

- Task 1~7 (정산 트랙)과 Task 8~12 (관리자 트랙)는 독립적이므로 병렬 진행 가능
- Task 3과 Task 4는 병렬 진행 가능 (둘 다 Task 2에만 의존)
- Task 9, 10, 11, 12는 Task 8 이후 병렬 진행 가능

---

## 위험 요소 (Risks)

| 위험                            | 영향                               | 완화 방안                                                            |
| ------------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| 정산 올림/내림 보정 합계 불일치 | 정산 결과 신뢰도 저하              | `Math.floor` + 나머지 보정 로직 필수, 다양한 금액/인원 조합으로 검증 |
| 관리자 집계 쿼리 성능           | 대시보드 로딩 지연                 | 적절한 인덱스 추가, 필요 시 Supabase View 또는 DB 함수 활용          |
| RLS 정책으로 관리자 쿼리 차단   | 관리자 기능 미동작                 | admin role에 대한 RLS 예외 추가 또는 SECURITY DEFINER 함수 사용      |
| Recharts SSR 호환성             | 차트 렌더링 오류                   | Client Component(`'use client'`)로 격리, dynamic import 활용         |
| 정산 대상자 변동 시 결과 불일치 | 참여자 승인 취소 후 정산 결과 변화 | 정산 결과는 실시간 계산으로, 항상 현재 참여자 기준 재계산            |
