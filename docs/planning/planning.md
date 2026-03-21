# 이벤트 관리 MVP 기획 플랜

## Context

생일파티, 워크샵, 친구 모임 등 **일회성 이벤트**에 특화된 관리 플랫폼.
주최자의 공지·참여자 관리·카풀·정산 부담을 하나의 서비스로 해결한다.

**3가지 역할 시스템**:

- **관리자 (Admin)**: PC 데스크탑 최적화 — 통계 대시보드, 전체 이벤트/사용자 관리
- **주최자 (Host)**: 모바일 최적화 — 이벤트 생성/운영/참여자 관리
- **참여자 (Participant)**: 모바일 최적화 — 이벤트 탐색/참여 신청/카풀/정산

**현재 상태**: 인증(이메일 + Google OAuth) 완료. 이벤트 관련 DB·페이지 없음.

---

## 1. 역할 시스템 설계

### 역할 구분

| 역할   | 접근 경로          | 최적화      | 주요 기능                                           |
| ------ | ------------------ | ----------- | --------------------------------------------------- |
| 관리자 | `/admin/*`         | PC 데스크탑 | 통계, 이벤트 전체 관리, 사용자 관리                 |
| 주최자 | `/(host)/*`        | 모바일      | 이벤트 생성/수정, 참여자 승인, 카풀 조율, 정산 관리 |
| 참여자 | `/(participant)/*` | 모바일      | 이벤트 탐색, 참여 신청, 카풀 신청, 정산 확인        |

### 역할 부여 방식

- 회원가입 시 기본값: `participant`
- 주최자: 이벤트를 생성하면 해당 이벤트의 host가 됨 (별도 승급 불필요)
- 관리자: DB에서 `profiles.role = 'admin'` 설정 (초기에는 수동 지정)

### profiles 테이블 확장

```sql
ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));
```

---

## 2. 모바일 UI 디자인 시스템 (주최자/참여자)

### 참고 이미지 UI 패턴 적용

이미지에서 추출한 핵심 UI 패턴:

```
┌─────────────────────────────┐
│  [위치/제목]    🔖 🔔 🔍    │  ← 상단 바
├─────────────────────────────┤
│  [탭1 ●] [탭2  ]            │  ← 세그먼트 탭 (초록 활성)
├─────────────────────────────┤
│  섹션 제목                  │
│  ┌──────────┐ ┌──────────┐  │
│  │  이미지  │ │  이미지  │  ← 2열 썸네일
│  └──────────┘ └──────────┘  │
│  🟢 NEW  이벤트 이름   🔖 🔔 │
│  태그 | 태그 | 태그          │
│  날짜/시간           인원    │
└─────────────────────────────┘
│  🏠    📋    📝    👤       │  ← 하단 탭 내비게이션
└─────────────────────────────┘
```

### 모바일 공통 컴포넌트 스타일

- **배경**: `bg-background` (흰색/다크모드 대응)
- **카드**: 흰 배경 + 하단 border-b 구분선 (그림자 최소화)
- **탭 활성**: `bg-primary text-primary-foreground` (초록 계열)
- **탭 비활성**: `bg-muted text-muted-foreground`
- **배지**: `NEW` → `bg-primary/10 text-primary text-xs font-bold`
- **하단 내비**: `fixed bottom-0` + safe-area-inset 적용
- **썸네일**: aspect-ratio 1:1, `rounded-xl object-cover`
- **타이포**: 제목 `text-base font-semibold`, 메타 `text-sm text-muted-foreground`

### 하단 탭 내비 구성 (모바일 공통)

**주최자 탭**:

```
🏠 홈  |  📅 내 이벤트  |  ➕ 만들기  |  👤 프로필
```

**참여자 탭**:

```
🏠 탐색  |  🎟 참여중  |  🚗 카풀  |  👤 프로필
```

---

## 3. 관리자 UI 디자인 시스템 (PC 데스크탑)

### 레이아웃 구조

```
┌──────────────────────────────────────────────────────────┐
│  LOGO    대시보드  이벤트  사용자  설정      [관리자 메뉴] │  ← 상단 GNB
├──────────────────────────────────────────────────────────┤
│          │                                               │
│  사이드   │   메인 콘텐츠 영역                           │
│  내비게   │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  이션     │   │ 통계1│ │ 통계2│ │ 통계3│ │ 통계4│     │  ← KPI 카드
│           │   └──────┘ └──────┘ └──────┘ └──────┘     │
│           │   ┌───────────────┐ ┌──────────────┐       │
│           │   │  이벤트 현황  │ │  최근 가입자 │       │  ← 차트/테이블
│           │   └───────────────┘ └──────────────┘       │
└──────────────────────────────────────────────────────────┘
```

### 관리자 KPI 지표 (대시보드)

- 총 이벤트 수 / 이번 달 생성 이벤트
- 총 참여자 수 / 이번 달 신규 가입
- 평균 참여율
- 카풀 매칭률

---

## 4. 이벤트 카테고리 (일회성 특화)

```
생일파티 🎂 | 파티/모임 🎉 | 워크샵 🛠 | 스터디 📚 | 운동/스포츠 💪 | 기타
```

---

## 5. 추가 설치 패키지

```bash
# 폼 처리
npm install react-hook-form @hookform/resolvers zod date-fns

# shadcn 추가 컴포넌트
npx shadcn@latest add textarea select separator tabs avatar toast skeleton dialog sheet

# 차트 (관리자 대시보드)
npm install recharts
```

---

## 6. Supabase DB 스키마 (마이그레이션)

### Migration 001 — 열거형 타입 + profiles 확장

```sql
-- profiles 역할 컬럼 추가
ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 열거형 타입
CREATE TYPE event_category AS ENUM ('생일파티', '파티/모임', '워크샵', '스터디', '운동/스포츠', '기타');
CREATE TYPE participation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE carpool_status AS ENUM ('pending', 'approved', 'rejected');
```

### Migration 002 — events 테이블

```sql
CREATE TABLE events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  category         event_category NOT NULL DEFAULT '기타',
  location         TEXT,
  cover_image_url  TEXT,                   -- 대표 이미지
  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  max_participants INTEGER CHECK (max_participants > 0),
  is_public        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_host_id ON events(host_id);
CREATE INDEX idx_events_started_at ON events(started_at);
CREATE INDEX idx_events_category ON events(category);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "공개 이벤트 조회" ON events FOR SELECT TO authenticated
  USING (is_public = true OR host_id = auth.uid());
CREATE POLICY "이벤트 생성" ON events FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());
CREATE POLICY "이벤트 수정" ON events FOR UPDATE TO authenticated
  USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());
CREATE POLICY "이벤트 삭제" ON events FOR DELETE TO authenticated
  USING (host_id = auth.uid());
```

### Migration 003 — participations 테이블

```sql
CREATE TABLE participations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     participation_status NOT NULL DEFAULT 'pending',
  attended   BOOLEAN NOT NULL DEFAULT false,
  message    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX idx_participations_event_id ON participations(event_id);
CREATE INDEX idx_participations_user_id ON participations(user_id);

CREATE TRIGGER participations_updated_at
  BEFORE UPDATE ON participations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "참여자 목록 조회" ON participations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events WHERE id = participations.event_id AND host_id = auth.uid()
  ));
CREATE POLICY "참여 신청" ON participations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "참여 상태 변경" ON participations FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events WHERE id = participations.event_id AND host_id = auth.uid()
  ));
CREATE POLICY "참여 취소" ON participations FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events WHERE id = participations.event_id AND host_id = auth.uid()
  ));
```

### Migration 004 — posts 테이블 (공지 + 댓글)

```sql
CREATE TABLE posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  is_notice  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_event_notice ON posts(event_id, is_notice, created_at DESC);

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "게시글 조회" ON posts FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM events WHERE id = posts.event_id AND host_id = auth.uid())
    OR EXISTS (SELECT 1 FROM participations
      WHERE event_id = posts.event_id AND user_id = auth.uid() AND status = 'approved')
  );
CREATE POLICY "게시글 작성" ON posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND (
      is_notice = false
      OR EXISTS (SELECT 1 FROM events WHERE id = posts.event_id AND host_id = auth.uid())
    )
  );
CREATE POLICY "게시글 수정" ON posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "게시글 삭제" ON posts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM events WHERE id = posts.event_id AND host_id = auth.uid()
  ));
```

### Migration 005 — carpools, carpool_requests 테이블

```sql
CREATE TABLE carpools (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id           UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  driver_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  departure_location TEXT NOT NULL,
  total_seats        INTEGER NOT NULL CHECK (total_seats > 0),
  note               TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, driver_id)
);

CREATE TABLE carpool_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carpool_id   UUID NOT NULL REFERENCES carpools(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       carpool_status NOT NULL DEFAULT 'pending',
  message      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (carpool_id, passenger_id)
);

ALTER TABLE carpools ENABLE ROW LEVEL SECURITY;
ALTER TABLE carpool_requests ENABLE ROW LEVEL SECURITY;
-- RLS: 이벤트 승인 참여자 + 주최자만 접근 (위 패턴과 동일)
```

### Migration 006 — settlement_items 테이블

```sql
CREATE TABLE settlement_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  paid_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  amount     INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settlement_items_event_id ON settlement_items(event_id);
ALTER TABLE settlement_items ENABLE ROW LEVEL SECURITY;
-- RLS: 승인 참여자 + 주최자 접근
```

---

## 7. 앱 라우팅 구조

```
app/
├── page.tsx                              # 루트 → 역할별 리다이렉트
├── auth/                                 # 인증 라우트 (기존 유지)
│
├── admin/                                # 관리자 전용 (PC 최적화)
│   ├── layout.tsx                        # 관리자 레이아웃 (GNB + 사이드바)
│   ├── page.tsx                          # 관리자 대시보드 (KPI + 차트)
│   ├── events/
│   │   └── page.tsx                      # 전체 이벤트 목록/관리
│   └── users/
│       └── page.tsx                      # 사용자 목록/관리
│
├── (host)/                               # 주최자 뷰 (모바일 최적화)
│   ├── layout.tsx                        # 하단 탭 내비 (홈/내이벤트/만들기/프로필)
│   ├── home/
│   │   └── page.tsx                      # 주최자 홈 (내 이벤트 요약)
│   ├── events/
│   │   ├── page.tsx                      # 내가 만든 이벤트 목록
│   │   ├── new/page.tsx                  # 이벤트 생성 폼
│   │   └── [eventId]/
│   │       ├── page.tsx                  # 이벤트 상세 (주최자 뷰)
│   │       ├── edit/page.tsx             # 이벤트 수정
│   │       ├── participants/page.tsx     # 참여자 관리 + 출석 체크
│   │       ├── carpool/page.tsx          # 카풀 관리
│   │       ├── settlement/page.tsx       # 정산 관리
│   │       └── posts/page.tsx            # 공지/댓글 관리
│   └── profile/
│       └── page.tsx                      # 주최자 프로필
│
└── (participant)/                        # 참여자 뷰 (모바일 최적화)
    ├── layout.tsx                        # 하단 탭 내비 (탐색/참여중/카풀/프로필)
    ├── discover/
    │   └── page.tsx                      # 이벤트 탐색 (카드 목록, 이미지 썸네일)
    ├── my-events/
    │   └── page.tsx                      # 내가 참여한 이벤트 목록
    ├── events/
    │   └── [eventId]/
    │       ├── page.tsx                  # 이벤트 상세 (참여자 뷰)
    │       ├── carpool/page.tsx          # 카풀 탑승 신청
    │       └── settlement/page.tsx       # 내 정산 현황
    └── profile/
        └── page.tsx                      # 참여자 프로필
```

---

## 8. 컴포넌트 구조

### 관리자 전용 (`components/admin/`)

```
admin-sidebar.tsx       # Server — 좌측 관리자 내비
admin-header.tsx        # Server — 상단 GNB
kpi-card.tsx            # Server — KPI 통계 카드
events-table.tsx        # Server — 이벤트 관리 테이블
users-table.tsx         # Server — 사용자 관리 테이블
events-chart.tsx        # Client — recharts 이벤트 현황 차트 (use client)
```

### 모바일 공통 (`components/mobile/`)

```
mobile-header.tsx             # Server — 상단 바 (제목 + 아이콘 버튼)
mobile-bottom-nav.tsx         # Client — 하단 탭 내비 (usePathname)
event-card-mobile.tsx         # Server — 카드형 이벤트 (썸네일 2열 + 배지)
event-category-badge.tsx      # Server — 카테고리 배지 (생일파티, 워크샵 등)
segment-tabs.tsx              # Client — 세그먼트 탭 스위처 (초록 활성)
```

### 폼 컴포넌트 (`components/forms/`)

```
event-form.tsx                # Client — 이벤트 생성/수정 (React Hook Form + Zod)
participation-form.tsx        # Client — 참여 신청
post-form.tsx                 # Client — 공지/댓글 작성
carpool-register-form.tsx     # Client — 드라이버 카풀 등록
carpool-request-form.tsx      # Client — 탑승 신청
settlement-item-form.tsx      # Client — 정산 항목 추가
```

### 공유 컴포넌트 (`components/shared/`)

```
participant-list.tsx          # Server — 참여자 목록
participant-actions.tsx       # Client — 승인/거절/출석 버튼
post-feed.tsx                 # Server — 공지+댓글 피드
post-item.tsx                 # Server — 공지/댓글 스타일 분기
post-actions.tsx              # Client — 게시글 수정/삭제
carpool-card.tsx              # Server — 카풀 카드
carpool-actions.tsx           # Client — 탑승 신청/승인/거절
settlement-table.tsx          # Server — 정산 항목 테이블
settlement-summary.tsx        # Server — 정산 결과 요약
confirm-dialog.tsx            # Client — 삭제/취소 확인 다이얼로그
copy-link-button.tsx          # Client — 초대 링크 복사
attendance-toggle.tsx         # Client — 출석 체크 토글
empty-state.tsx               # Server — 빈 상태 표시
```

---

## 9. Server Actions 목록

```
actions/events.ts
  createEvent / updateEvent / deleteEvent

actions/participations.ts
  applyParticipation / approveParticipation / rejectParticipation
  cancelParticipation / toggleAttendance

actions/posts.ts
  createPost / updatePost / deletePost

actions/carpools.ts
  registerCarpool / deleteCarpool
  requestCarpool / approveCarpoolRequest / rejectCarpoolRequest / cancelCarpoolRequest

actions/settlements.ts
  createSettlementItem / updateSettlementItem / deleteSettlementItem
  calculateSettlement / markSettled

actions/admin.ts
  updateUserRole    # 관리자 역할 변경
```

---

## 10. 정산 알고리즘 (calculateSettlement)

1. `settlement_items`에서 총 지출 합계 계산
2. approved 참여자 수 조회 (주최자 포함)
3. 1인 균등 부담액 = 총합 / 참여자 수
4. 각 참여자 순잔액 = 지출액 - 균등 부담액
   - 양수(+): 받을 돈 (creditor)
   - 음수(-): 낼 돈 (debtor)
5. 그리디 알고리즘으로 최소 거래 쌍 결정
6. 결과를 화면에 표시 (별도 테이블 저장 선택적)

---

## 11. 구현 단계 (4 Phase)

### Phase 1 — 기반 구축 + 이벤트 CRUD

1. 패키지 설치 (react-hook-form, zod, date-fns, recharts)
2. shadcn 컴포넌트 추가
3. Migration 001, 002 실행 + types 재생성
4. 모바일 공통 레이아웃 — `(host)/layout.tsx`, `(participant)/layout.tsx`
5. 관리자 레이아웃 — `admin/layout.tsx`
6. `lib/validations/event.ts`, `types/index.ts`
7. `actions/events.ts`, `lib/data/events.ts`
8. 이벤트 목록/생성/상세/수정/삭제 페이지
9. `event-card-mobile.tsx` (이미지 참고 카드 스타일)

**검증**: 이벤트 CRUD 전체 흐름 + 모바일 카드 UI 확인

### Phase 2 — 참여자 관리 + 공지/댓글

1. Migration 003, 004 실행 + types 재생성
2. `actions/participations.ts`, `actions/posts.ts`
3. 참여자 관리 페이지, 공지/댓글 피드 통합
4. 링크 공유 → 신청 → 승인/거절 → 출석 체크

**검증**: 참여 신청 흐름 전체 동작

### Phase 3 — 카풀 기능

1. Migration 005 실행 + types 재생성
2. `actions/carpools.ts`
3. 카풀 페이지 (드라이버 등록/탑승 신청)

**검증**: 카풀 등록 → 신청 → 승인/거절 → 좌석 현황

### Phase 4 — 정산 + 관리자 대시보드

1. Migration 006 실행 + types 재생성
2. `actions/settlements.ts` (1/N 알고리즘)
3. 정산 페이지 (항목 입력 → 결과 요약)
4. 관리자 대시보드 (KPI 카드 + recharts 차트)
5. 관리자 이벤트/사용자 관리 테이블
6. 전체 error.tsx, not-found.tsx 추가

**검증**: 정산 계산 + 관리자 대시보드 통계 확인

---

## 12. 검증 방법

### 역할별 E2E 시나리오

**관리자**: PC 브라우저로 `/admin` 접근 → KPI 확인 → 이벤트 목록 관리 → 사용자 관리

**주최자**: 모바일 뷰포트(375px)로 → 이벤트 생성 → 링크 공유 → 참여자 승인 → 출석 체크 → 정산

**참여자**: 모바일 뷰포트로 → 이벤트 탐색 → 참여 신청 → 카풀 신청 → 정산 확인

### 코드 품질 검증

```bash
npm run type-check
npm run lint
npm run build
```

### Supabase RLS 검증

- 비로그인 → 이벤트 조회 시 리다이렉트
- 비주최자 → 편집 페이지 접근 시 리다이렉트
- 미승인 참여자 → 카풀/정산 접근 시 빈 결과

### 반응형 검증

- 모바일 (375px): 하단 탭 내비, 카드 레이아웃 확인
- 태블릿 (768px): 중간 레이아웃 깨짐 없음 확인
- 데스크탑 (1280px+): 관리자 사이드바 + 대시보드 확인
