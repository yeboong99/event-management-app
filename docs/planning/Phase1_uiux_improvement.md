# Phase 1 추가: UI/UX 개선 작업 (Post-Phase 1 UI/UX Polish)

**생성일:** 2026-03-22
**대상 Phase:** Phase 1 완료 후 추가 개선 작업
**문서 용도:** TaskMaster AI `parse-prd` 입력용 PRD

---

## 0. 이 문서에 대하여

### 배경 및 목적

이 문서는 **Phase 0 + Phase 1이 모두 완료된 상태**에서, Playwright E2E 테스트(2026-03-22) 중 발견된 UI/UX 문제 9건을 해결하기 위한 추가 개선 작업을 정의합니다.

Phase 1까지의 구현으로 이벤트 CRUD 핵심 기능은 완성되었으나, 실제 사용성 테스트에서 아래와 같은 UX 결함이 확인되었습니다:

- 주최자/참여자 역할 전환 진입점 부재 (긴급)
- 카테고리 탭 및 전체 페이지에 의도하지 않은 스크롤바 노출 (높음)
- 404 페이지, 탭 타이틀, 시간 표시, 뒤로가기 버튼, 성공 피드백 부재 (중간)
- 이미지 미등록 이벤트의 Placeholder 단조로움 (낮음)

이 작업들은 Phase 2(참여자 관리 + 공지/댓글) 착수 전에 완료하여 서비스 완성도를 높이는 것을 목표로 합니다.

### 작업 AI를 위한 안내

- **Phase 0 및 Phase 1은 완료 상태입니다.** 기반 레이아웃, DB 스키마, 이벤트 CRUD 기능이 모두 구현되어 있습니다.
- 이 문서의 작업은 기존 코드 위에 개선을 가하는 **폴리싱(polishing) 작업**입니다.
- 새 DB 마이그레이션이나 Server Actions 재작성이 필요 없으며, 대부분 프론트엔드 레이아웃/컴포넌트/스타일 수정입니다.
- 각 Task는 독립적으로 실행 가능하며, 명시된 의존성이 없는 경우 병렬 처리 가능합니다.

---

## 1. 전체 프로젝트 개요

### 프로젝트 명칭 및 목적

**이벤트 관리 플랫폼 MVP** — 생일파티, 워크샵, 친구 모임 등 일회성 이벤트에서 발생하는 공지, 참여자 관리, 카풀, 정산 부담을 하나의 서비스로 통합 해결하는 플랫폼.

- **대상 사용자:** 소규모 일회성 이벤트를 주최하거나 참여하는 개인 사용자 (모바일 중심, 관리자는 PC)
- **핵심 비즈니스 목표:** 이벤트 생성부터 참여 관리, 카풀 매칭, 정산까지 원스톱으로 제공하여 이벤트 주최/참여의 불편함을 최소화

### 기술 스택 및 아키텍처

- **프론트엔드:** Next.js 16 (App Router) + React 19, TypeScript, TailwindCSS v4 + shadcn/ui
- **백엔드/DB:** Supabase (인증, PostgreSQL DB, Storage, RLS)
- **폼 처리:** React Hook Form + Zod (클라이언트 + 서버 이중 검증)
- **배포:** Vercel
- **코드 품질:** ESLint, Prettier, Husky + lint-staged

### 아키텍처 핵심 패턴

- Server Component 기본, `'use client'`는 인터랙션 필요 시만 사용
- Server Actions: Zod 검증 → 처리 → `revalidatePath()` → `redirect()`
- Supabase 클라이언트 3종: browser(`lib/supabase/client.ts`), server(`lib/supabase/server.ts`), proxy(`lib/supabase/proxy.ts`)
- `@/` 절대 경로 별칭, `cn()` 유틸리티로 Tailwind 클래스 결합
- 한국어 주석, 한국어 커밋 메시지, 변수명/함수명은 영어 camelCase

### 전체 Phase 목록

| Phase            | 제목                        | 한 줄 요약                                                          | 상태          |
| ---------------- | --------------------------- | ------------------------------------------------------------------- | ------------- |
| Phase 0          | 기반 설정                   | TailwindCSS v4, DB 스키마, 레이아웃 라우트 그룹, 미들웨어 접근 제어 | **완료**      |
| Phase 1          | 데이터 레이어 + 이벤트 CRUD | 이벤트 생성/조회/수정/삭제 전체 흐름 + Storage 이미지 업로드        | **완료**      |
| **Phase 1 추가** | **UI/UX 개선 (본 문서)**    | **E2E 테스트에서 발견된 UX 결함 9건 수정**                          | **현재 작업** |
| Phase 2          | 참여자 관리 + 공지/댓글     | 참여 신청/승인/거절/출석 + 공지/댓글 소통 기능                      | 미착수        |
| Phase 3          | 카풀 기능                   | 카풀 등록/탑승 신청/승인/거절/취소 + 잔여 좌석                      | 미착수        |
| Phase 4          | 정산 + 관리자 대시보드      | 1/N 균등 정산 + KPI 대시보드/차트/데이터 테이블                     | 미착수        |
| Phase 5          | 프로필 + UX + 보안          | 프로필 관리, 로딩/에러 처리, 반응형, 접근 제어 강화                 | 미착수        |
| Phase 6          | 성능 최적화 + 런칭 준비     | 빌드 검증, SEO, Vercel 배포, E2E 검증                               | 미착수        |

---

## 2. 이번 작업 전체 요약

### 위치 및 역할

Phase 0과 Phase 1이 완료된 상태에서, 실사용 E2E 테스트를 통해 발견된 **UI/UX 품질 결함을 해결**하는 폴리싱 단계. 새로운 기능을 추가하는 것이 아니라 기존 구현된 화면의 완성도와 사용성을 높이는 것이 목표.

### 목표

- `(host)` / `(participant)` 분리 라우트 구조를 통합 `(app)` 구조로 전환하여 역할 구분 제거
- 통합 하단 탭 5개(탐색/내활동/만들기/카풀/프로필)로 자연스러운 UX 플로우 구현
- 모바일 앱 UX에 맞게 스크롤바를 전역적으로 숨기고 탭 컨테이너 정리
- 브랜딩 반영 (앱 타이틀, 메타데이터)
- 한국 사용자를 위한 현지화 (한국어 404 페이지, KST 시간 표시)
- 이벤트 상세 페이지 네비게이션 개선 (뒤로가기 버튼)
- 사용자 행동에 대한 명확한 피드백 (성공 toast)
- 이미지 없는 이벤트의 시각적 다양성 제공

### 완료 기준 (Definition of Done)

- 통합 하단 탭 5개(탐색/내활동/만들기/카풀/프로필)로 모든 기능에 단일 네비게이션으로 접근 가능
- 전체 페이지에서 불필요한 브라우저 스크롤바가 표시되지 않음
- 카테고리 탭 아래 스크롤바 미표시, 테두리 라운딩 일관성 확보
- 잘못된 URL 접근 시 한국어 커스텀 404 페이지 표시
- 브라우저 탭 제목이 서비스명으로 표시됨 (예: "이벤트 매니저")
- 이벤트 수정 페이지에서 일시가 KST 기준으로 표시됨
- 이벤트 상세 페이지에 뒤로가기 버튼 존재
- 이벤트 수정 성공 시 toast 알림 표시
- 커버 이미지 없는 이벤트 카드가 카테고리별로 다른 색상 gradient 표시
- `npm run build` 성공, `npm run type-check` 통과

### 주요 산출물 (Deliverables)

- 통합 하단 네비게이션 컴포넌트 (`components/mobile/unified-bottom-nav.tsx`)
- 통합 앱 레이아웃 (`app/(app)/layout.tsx`)
- `/my-events` 내 참여 중/주최 중 서브탭 (`app/(app)/my-events/page.tsx`)
- 구 라우트 그룹 `(host)`, `(participant)` 제거 및 `(app)`으로 통합
- 전역 스크롤바 숨김 CSS (`app/globals.css`)
- 카테고리 탭 컨테이너 스타일 수정
- 커스텀 404 페이지 (`app/not-found.tsx`)
- 앱 메타데이터 업데이트 (`app/layout.tsx` + 각 페이지 `generateMetadata`)
- 이벤트 수정 폼 KST 변환 처리 (`components/forms/event-form.tsx` 또는 관련 페이지)
- 상세 페이지 뒤로가기 버튼 (`app/(host)/events/[eventId]/page.tsx`)
- 수정 성공 toast 처리 (Client Component 또는 searchParams 기반)
- 카테고리별 gradient placeholder (`components/mobile/event-card-mobile.tsx`)

### 이전 Phase와의 연관성

Phase 1에서 완료된 다음 항목 위에서 동작:

- 이벤트 CRUD 전체 흐름 (actions/events.ts, TASK-011~021)
- 이벤트 카드 컴포넌트 (`components/mobile/event-card-mobile.tsx`, TASK-019)
- 카테고리 탭/세그먼트 UI (`app/(app)/events/page.tsx` 이동 후, `app/(app)/discover/page.tsx`, TASK-019, TASK-020)
- 이벤트 폼 컴포넌트 (`components/forms/event-form.tsx`, TASK-014)
- 이벤트 상세 페이지 (`app/(app)/events/[eventId]/page.tsx` 이동 후, TASK-015)
- 통합 레이아웃 + 하단 탭 (`app/(app)/layout.tsx`, TASK-008 재구현)

### 다음 Phase에 미치는 영향

이 작업에서 수정되는 컴포넌트들은 Phase 2에서도 계속 사용됨:

- `UnifiedBottomNav`는 Phase 2 이후에도 동일하게 사용됨
- `/my-events` 내 "참여 중" 탭은 Phase 2의 참여자 관리 기능과 직접 연결됨
- 카테고리별 gradient placeholder는 Phase 2의 참여자 이벤트 목록에도 적용됨
- KST 시간 표시 패턴은 Phase 2의 공지/댓글 타임스탬프 표시에도 재사용 가능
- toast 성공 피드백 패턴은 Phase 2의 참여 신청/승인/거절 액션에도 동일 적용 예정

---

## 3. 이전 Phase 완료 상태

### Phase 0: 기반 설정 — **완료**

| Task ID  | 제목                                  | 상태     |
| -------- | ------------------------------------- | -------- |
| TASK-001 | TailwindCSS v3 → v4 업그레이드        | **완료** |
| TASK-002 | 추가 shadcn/ui 컴포넌트 설치          | **완료** |
| TASK-003 | profiles 스키마 정비 + ENUM 타입 생성 | **완료** |
| TASK-004 | events 테이블 생성 + RLS              | **완료** |
| TASK-005 | TypeScript 타입 재생성                | **완료** |
| TASK-006 | 미들웨어 admin 접근 제어              | **완료** |
| TASK-007 | 루트 페이지 역할별 리디렉션           | **완료** |
| TASK-008 | 참여자 레이아웃 + 하단 탭             | **완료** |
| TASK-009 | 주최자 레이아웃 + 하단 탭             | **완료** |
| TASK-010 | 관리자 레이아웃 (GNB + 사이드바)      | **완료** |

### Phase 1: 데이터 레이어 + 이벤트 CRUD — **완료**

| Task ID  | 제목                                                | 상태     |
| -------- | --------------------------------------------------- | -------- |
| TASK-011 | 이벤트 Zod 스키마 + 공통 타입 정의                  | **완료** |
| TASK-012 | Supabase Storage 버킷 설정 + 이미지 업로드 유틸리티 | **완료** |
| TASK-013 | Server Actions — 이벤트 CRUD 구현                   | **완료** |
| TASK-014 | 이벤트 생성 페이지 (주최자)                         | **완료** |
| TASK-015 | 이벤트 상세 페이지 (주최자)                         | **완료** |
| TASK-016 | 이벤트 수정 페이지 (주최자)                         | **완료** |
| TASK-017 | 이벤트 삭제 기능 + 확인 다이얼로그                  | **완료** |
| TASK-018 | 주최자 홈 페이지                                    | **완료** |
| TASK-019 | 내 이벤트 목록 페이지 (주최자)                      | **완료** |
| TASK-020 | 이벤트 탐색 페이지 (참여자)                         | **완료** |
| TASK-021 | 초대 링크 복사 기능                                 | **완료** |

### Phase 1 완료 산출물 요약

- **이벤트 CRUD:** `actions/events.ts` (createEvent, updateEvent, deleteEvent), Zod 스키마 (`lib/validations/event.ts`), 공통 타입 (`types/event.ts`)
- **Storage:** `lib/supabase/storage.ts` (uploadEventCoverImage, deleteEventCoverImage, validateImageFile)
- **주최자 페이지:** 홈(`/home`), 이벤트 목록(`/events`), 생성(`/events/new`), 상세(`/events/[eventId]`), 수정(`/events/[eventId]/edit`)
- **참여자 페이지:** 이벤트 탐색(`/discover`)
- **공용 컴포넌트:** `event-card-mobile.tsx`, `event-category-badge.tsx`, `confirm-dialog.tsx`, `copy-link-button.tsx`, 카테고리 세그먼트 탭

### 현재 작업 진입 전제 조건 충족 여부

- [x] 이벤트 CRUD 전체 흐름이 실제 DB 데이터로 동작
- [x] 주최자/참여자 레이아웃 + 하단 탭 내비게이션 렌더링 (→ 통합 (app) 레이아웃으로 전환 예정)
- [x] 이벤트 카드 컴포넌트 (`event-card-mobile.tsx`) 존재
- [x] 이벤트 폼 컴포넌트 (`components/forms/event-form.tsx`) 존재
- [x] 이벤트 상세 페이지 존재 (`app/(host)/events/[eventId]/page.tsx` → `app/(app)/events/[eventId]/page.tsx`로 이동 예정)
- [x] shadcn/ui toast(sonner) 컴포넌트 설치 완료

**모든 전제 조건 충족 — UI/UX 개선 작업 착수 가능**

---

## 4. UI/UX 개선 액션 아이템

> **우선순위 순서:** 긴급 → 높음 → 중간 → 낮음
> **원본 이슈 참조:** `docs/planning/uiux-improvement.md`

---

### Task 1: 통합 하단 네비게이션으로 라우트 구조 전환

- **원본 이슈:** UI-001
- **심각도:** 긴급
- **예상 시간:** 6h
- **의존성:** 없음
- **파일:**
  - `components/mobile/unified-bottom-nav.tsx` — 5탭 통합 네비게이션 컴포넌트 (신규)
  - `app/(app)/layout.tsx` — 통합 레이아웃 (신규)
  - `app/(app)/my-events/page.tsx` — "참여 중 | 주최 중" 내부 탭 추가
  - `app/(app)/discover/page.tsx` — (participant)에서 이동
  - `app/(app)/carpools/page.tsx` — (participant)에서 이동
  - `app/(app)/profile/page.tsx` — (participant)에서 이동
  - `app/(app)/events/new/page.tsx` — (host)에서 이동
  - `app/(app)/events/[eventId]/page.tsx` — (host)에서 이동
  - `app/(app)/events/[eventId]/edit/page.tsx` — (host)에서 이동
  - `app/page.tsx` — `/discover` 리다이렉트로 수정
  - `app/(host)/` — 전체 제거 (페이지 이동 후)
  - `app/(participant)/` — 전체 제거 (페이지 이동 후)

#### 배경 및 결정

초기 설계는 `(host)` / `(participant)` 두 라우트 그룹으로 역할을 물리적으로 분리하고, 헤더에 역할 전환 버튼을 추가하는 방식이었습니다. 그러나 이 방식은 사용자가 "주최자 모드 / 참여자 모드" 개념을 인지해야 하는 인지 부하를 발생시킵니다.

**채택 방향:** Meetup, Eventbrite 등 실제 이벤트 앱처럼 역할 구분 없이 기능 탭으로 통합. `(host)` / `(participant)` → 단일 `(app)` 라우트 그룹으로 전환.

#### 구현 요구사항

1. **통합 네비게이션 컴포넌트 신규 생성:**

   ```
   탭 구성 (UnifiedBottomNav):
   탐색   /discover     (Compass 아이콘)
   내활동 /my-events    (Calendar 아이콘)
   만들기 /events/new   (Plus 아이콘, FAB 스타일 — 중앙 강조)
   카풀   /carpools     (Car 아이콘)
   프로필 /profile      (User 아이콘)
   ```

   - `usePathname()`으로 활성 탭 감지
   - 만들기 탭은 시각적으로 강조 (FAB 스타일)

2. **라우트 그룹 통합:**
   - 기존 `(participant)`, `(host)` 그룹의 페이지를 `(app)` 그룹으로 이동
   - `(app)/layout.tsx`: `MobileHeader` + `UnifiedBottomNav`로 구성

3. **`/my-events` 내부 탭 추가:**
   - 상단 "참여 중 | 주최 중" 세그먼트 탭
   - `searchParams.tab` (`participating` | `hosting`)으로 분기
   - "주최 중": 기존 `/events` 페이지의 내가 만든 이벤트 목록 UI

4. **구 경로 리다이렉트:**
   - `/home` → `/discover`
   - `/events` (목록) → `/my-events?tab=hosting`
   - 루트 `/`: role = 'user' → `/discover` (기존 `/home` 대신)

#### 완료 기준 (Acceptance Criteria)

- [ ] 통합 하단 탭 5개 (탐색/내활동/만들기/카풀/프로필)가 모든 `(app)` 페이지에서 동일하게 표시됨
- [ ] `/my-events` 내 "참여 중" / "주최 중" 탭 전환 동작
- [ ] `/home`, `/events` 직접 접속 시 올바른 경로로 리다이렉트
- [ ] 로그인 후 `/discover`로 통합 진입
- [ ] 기존 이벤트 CRUD 기능 (생성/조회/수정/삭제) 정상 동작 유지
- [ ] `npm run type-check` + `npm run build` 통과

---

### Task 2: 전체 페이지 브라우저 스크롤바 숨김

- **원본 이슈:** UI-003
- **심각도:** 높음
- **예상 시간:** 1h
- **의존성:** 없음
- **파일:**
  - `app/globals.css` — 전역 스크롤바 스타일 추가

#### 구현 요구사항

1. **전역 스크롤바 숨김 CSS 적용:**
   - `app/globals.css`에 다음 스타일 추가:
     - Webkit 기반 브라우저(Chrome, Safari): `::-webkit-scrollbar { display: none; }` 또는 `width: 0`
     - Firefox: `scrollbar-width: none;`
     - IE/Edge legacy: `-ms-overflow-style: none;`
   - `html`, `body` 또는 전역 선택자에 적용
   - TailwindCSS v4 `@layer base` 또는 일반 CSS 규칙으로 작성

2. **스크롤 기능은 유지:**
   - 스크롤바 UI만 숨기고, 실제 스크롤 동작(`overflow-y: auto`/`scroll`)은 그대로 유지
   - 스크롤이 필요한 콘텐츠 영역(이벤트 목록, 상세 페이지 등)은 정상 스크롤 가능

3. **모바일 앱 UX 목표:**
   - PWA/모바일 앱처럼 스크롤바 없이 자연스러운 터치 스크롤 경험 제공
   - 레이아웃 여백 비대칭 문제 해결

#### 완료 기준 (Acceptance Criteria)

- [ ] `/home`, `/events`, `/events/[eventId]`, `/events/[eventId]/edit` 등 전체 페이지에서 브라우저 스크롤바 미표시
- [ ] 스크롤이 필요한 콘텐츠 영역에서 실제 스크롤 동작은 정상 작동
- [ ] 빌드 후 Chrome/Safari/Firefox 모두에서 스크롤바 미표시 확인

---

### Task 3: 카테고리 탭 스크롤바 및 테두리 라운딩 수정

- **원본 이슈:** UI-002
- **심각도:** 높음
- **예상 시간:** 1.5h
- **의존성:** Task 2 완료 후 확인 (전역 스크롤바 숨김으로 해결되는지 우선 확인)
- **파일:**
  - `app/(host)/events/page.tsx` — 카테고리 탭 컨테이너 스타일 수정
  - `app/(participant)/discover/page.tsx` — 카테고리 탭 컨테이너 스타일 수정
  - `components/mobile/segment-tabs.tsx` — 존재하는 경우 스타일 수정

#### 구현 요구사항

1. **스크롤바 숨김:**
   - 카테고리 탭 컨테이너에 `overflow-x: auto` + 스크롤바 숨김 클래스 적용
   - TailwindCSS 커스텀 유틸리티 또는 인라인 스타일: `scrollbar-hide` (필요 시 `tailwind-scrollbar-hide` 플러그인 또는 CSS)
   - 세로 스크롤 화살표(▲▼) 제거: `overflow-y: hidden` 적용

2. **테두리 라운딩 일관성:**
   - 탭 컨테이너의 `border-radius` 모든 모서리에 일관 적용
   - 개별 탭 아이템의 라운딩이 컨테이너 라운딩과 충돌하지 않도록 수정
   - 좌측 첫 탭과 우측 마지막 탭의 라운딩 처리 확인

3. **터치 스크롤 개선:**
   - 가로 스크롤은 터치 슬라이드로 동작하도록 `-webkit-overflow-scrolling: touch` 또는 동등한 처리 적용

#### 완료 기준 (Acceptance Criteria)

- [ ] `/events` 페이지 카테고리 탭 아래 가로 스크롤바 미표시
- [ ] `/discover` 페이지 카테고리 탭 아래 가로 스크롤바 미표시
- [ ] 탭 컨테이너 세로 스크롤 화살표(▲▼) 미표시
- [ ] 탭 컨테이너 border-radius가 모든 모서리에 일관되게 적용됨
- [ ] 탭 수가 화면보다 많을 때 가로 스와이프로 나머지 탭 접근 가능

---

### Task 4: 커스텀 404 페이지 생성

- **원본 이슈:** UI-004
- **심각도:** 중간
- **예상 시간:** 1h
- **의존성:** 없음
- **파일:**
  - `app/not-found.tsx` — 커스텀 404 페이지 생성

#### 구현 요구사항

1. **`app/not-found.tsx` 파일 생성:**
   - Next.js App Router의 `not-found.tsx` 컨벤션 사용
   - Server Component로 구현 (기본값)

2. **페이지 콘텐츠:**
   - 한국어 에러 메시지: "페이지를 찾을 수 없습니다" 또는 "요청하신 페이지가 존재하지 않습니다"
   - 서브 텍스트: "주소를 다시 확인해 주세요"
   - 에러 코드 표시: "404"
   - **홈으로 이동 버튼:** `Link` 컴포넌트로 `/` 경로 연결 (shadcn/ui Button 컴포넌트 사용)

3. **스타일:**
   - 기존 앱 디자인 언어(TailwindCSS + shadcn/ui)와 일관성 유지
   - 모바일 중앙 정렬 레이아웃
   - 시각적 요소: 숫자 "404" 크게 표시 또는 캘린더/이벤트 관련 아이콘 사용 (lucide-react)

4. **메타데이터:**
   - 브라우저 탭 제목: "페이지를 찾을 수 없습니다 | 이벤트 매니저"

#### 완료 기준 (Acceptance Criteria)

- [ ] 존재하지 않는 경로(`/nonexistent`) 접근 시 커스텀 404 페이지 표시
- [ ] 한국어 에러 메시지 표시
- [ ] "홈으로 이동" 버튼 클릭 시 `/` 경로로 이동
- [ ] 기존 앱 스타일과 일관성 있는 디자인
- [ ] `npm run type-check` 통과

---

### Task 5: 앱 메타데이터 및 페이지별 탭 타이틀 설정

- **원본 이슈:** UI-005
- **심각도:** 중간
- **예상 시간:** 1.5h
- **의존성:** 없음
- **파일:**
  - `app/layout.tsx` — 기본 metadata 업데이트
  - `app/(host)/home/page.tsx` — 페이지별 metadata
  - `app/(host)/events/page.tsx` — 페이지별 metadata
  - `app/(host)/events/new/page.tsx` — 페이지별 metadata
  - `app/(host)/events/[eventId]/page.tsx` — generateMetadata 적용
  - `app/(host)/events/[eventId]/edit/page.tsx` — generateMetadata 적용
  - `app/(participant)/discover/page.tsx` — 페이지별 metadata

#### 구현 요구사항

1. **`app/layout.tsx` 기본 metadata 수정:**
   - `title`: 기본값 "이벤트 매니저" (스타터킷 기본값 제거)
   - `title.template`: `"%s | 이벤트 매니저"` 패턴 적용
   - `description`: 서비스 설명 한국어로 업데이트

2. **각 페이지에 `metadata` 또는 `generateMetadata` 추가:**
   - 주최자 홈 (`/home`): `"홈"`
   - 내 이벤트 목록 (`/events`): `"내 이벤트"`
   - 이벤트 생성 (`/events/new`): `"이벤트 만들기"`
   - 이벤트 상세 (`/events/[eventId]`): `generateMetadata`로 `"[이벤트 제목]"` — DB에서 이벤트 제목 조회
   - 이벤트 수정 (`/events/[eventId]/edit`): `generateMetadata`로 `"[이벤트 제목] 수정"`
   - 이벤트 탐색 (`/discover`): `"이벤트 탐색"`

3. **`generateMetadata` 구현 (동적 타이틀 필요 페이지):**
   ```typescript
   export async function generateMetadata({
     params,
   }: {
     params: Promise<{ eventId: string }>;
   }): Promise<Metadata> {
     const { eventId } = await params;
     // Supabase server 클라이언트로 이벤트 제목 조회
     // 이벤트가 없으면 기본 제목 반환
   }
   ```

   - `params`는 반드시 `await`로 처리 (Next.js 16 규칙)
   - Supabase server 클라이언트(`lib/supabase/server.ts`) 사용

#### 완료 기준 (Acceptance Criteria)

- [ ] 브라우저 탭에 "이벤트 매니저" 기본 타이틀 표시 (스타터킷 기본값 제거)
- [ ] 각 페이지 접근 시 해당 페이지명이 탭에 표시됨 (예: "내 이벤트 | 이벤트 매니저")
- [ ] 이벤트 상세 페이지에서 해당 이벤트 제목이 탭에 표시됨
- [ ] `npm run type-check` 통과

---

### Task 6: 이벤트 수정 페이지 시간 표시 KST 변환

- **원본 이슈:** UI-006
- **심각도:** 중간
- **예상 시간:** 2h
- **의존성:** 없음
- **파일:**
  - `components/forms/event-form.tsx` — datetime-local input 값 변환 로직
  - `app/(host)/events/[eventId]/edit/page.tsx` — 초기값 전달 방식 수정 가능성

#### 구현 요구사항

1. **문제 원인:**
   - DB의 `event_date` 컬럼은 UTC로 저장됨 (`timestamptz` 타입)
   - `<input type="datetime-local">`의 `defaultValue`에 UTC 문자열을 그대로 전달하면 UTC 기준으로 표시
   - KST(UTC+9)는 UTC보다 9시간 앞서므로 10:00 UTC → 19:00 KST

2. **변환 로직 구현:**
   - DB에서 받은 UTC ISO 문자열을 `datetime-local` input에 맞는 로컬 시간 문자열로 변환하는 유틸리티 함수 작성:
     ```typescript
     // UTC ISO string → 로컬 datetime-local 포맷 (YYYY-MM-DDTHH:mm)
     function toLocalDatetimeString(utcIsoString: string): string {
       const date = new Date(utcIsoString);
       // 브라우저/서버 로컬 타임존 기준 처리
       // 또는 명시적으로 KST(UTC+9) 적용
     }
     ```
   - 서버 사이드에서는 `toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })` 활용 또는 UTC+9 오프셋 직접 계산
   - `datetime-local` input 포맷: `"YYYY-MM-DDTHH:mm"` (예: `"2026-03-22T19:00"`)

3. **적용 위치:**
   - `components/forms/event-form.tsx`에서 `defaultValues.eventDate` 설정 시 변환 함수 적용
   - 또는 수정 페이지(`edit/page.tsx`)에서 초기값 전달 전 변환

4. **저장 시 처리:**
   - `<input type="datetime-local">`에서 읽은 값은 로컬 시간 문자열이므로, Server Action 저장 시 `new Date(localString).toISOString()`으로 UTC 변환 후 DB 저장
   - 기존 `createEvent`/`updateEvent`에서 이미 처리 중이면 변경 불필요, 수정 페이지 표시만 수정

#### 완료 기준 (Acceptance Criteria)

- [ ] KST 19:00에 생성된 이벤트를 수정 페이지에서 열면 19:00으로 표시됨 (UTC 10:00 아님)
- [ ] 수정 후 저장 시 시간이 올바르게 DB에 저장됨
- [ ] 이벤트 상세 페이지에서도 일시가 KST 기준으로 표시됨 (일관성)
- [ ] `npm run type-check` 통과

---

### Task 7: 이벤트 상세 페이지 뒤로가기 버튼 추가

- **원본 이슈:** UI-007
- **심각도:** 중간
- **예상 시간:** 1h
- **의존성:** 없음
- **파일:**
  - `app/(host)/events/[eventId]/page.tsx` — 뒤로가기 버튼 추가

#### 구현 요구사항

1. **뒤로가기 버튼 위치:**
   - 페이지 최상단 또는 커버 이미지 영역 위에 배치
   - 커버 이미지가 있는 경우: 이미지 위에 오버레이 형태로 배치 (iOS/Android 네이티브 앱 스타일)
   - 커버 이미지가 없는 경우: 페이지 헤더 영역 좌측

2. **동작:**
   - `router.back()` 사용 (이전 페이지로 이동) → Client Component(`'use client'`) 필요
   - 또는 `Link href="/events"` 정적 링크 사용 (뒤로가기 이력이 없는 경우 대비)
   - 권장: `router.back()` 우선 사용, URL 직접 접근 시 fallback으로 `/events` 이동

3. **버튼 스타일:**
   - 아이콘: `lucide-react`의 `ChevronLeft` 또는 `ArrowLeft`
   - 커버 이미지 위 오버레이 시: 반투명 흰색/검정 배경 원형 버튼 (예: `bg-black/40 rounded-full`)
   - shadcn/ui Button 컴포넌트 사용 (variant: `ghost` 또는 커스텀)

4. **컴포넌트 분리:**
   - 뒤로가기 버튼 로직만을 위한 별도 Client Component 분리 권장 (페이지는 Server Component 유지)
   - 예: `components/shared/back-button.tsx` 또는 페이지 내 인라인 Client Component

#### 완료 기준 (Acceptance Criteria)

- [ ] 이벤트 상세 페이지에 뒤로가기 버튼이 표시됨
- [ ] 버튼 클릭 시 이전 페이지(이벤트 목록 등)로 이동
- [ ] 커버 이미지가 있는 경우 이미지 위에 오버레이 형태로 표시
- [ ] 모바일 앱 UX 스타일과 일관성 있는 디자인
- [ ] `npm run type-check` 통과

---

### Task 8: 이벤트 수정/생성 성공 시 Toast 알림 추가

- **원본 이슈:** UI-008
- **심각도:** 중간
- **예상 시간:** 2h
- **의존성:** 없음
- **파일:**
  - `app/(host)/events/[eventId]/page.tsx` — 수정 성공 toast 표시
  - `app/(host)/events/page.tsx` — 생성 성공 toast 표시 (필요 시)
  - `components/forms/event-form.tsx` — 성공 콜백 처리 또는 searchParams 감지

#### 구현 요구사항

1. **Toast 표시 방법 (2가지 중 선택):**

   **방법 A — searchParams 기반 (권장, Server Action + Client 조합):**
   - Server Action(`updateEvent`) 성공 시 `redirect('/events/[eventId]?updated=true')`로 리다이렉트
   - 이벤트 상세 페이지를 감싸는 Client Component에서 `useSearchParams()`로 `updated=true` 감지
   - 감지 시 `toast.success("이벤트가 수정되었습니다")` 호출
   - `useEffect`에서 searchParams를 감지하고, 표시 후 URL에서 파라미터 제거 (`router.replace`)

   **방법 B — onSuccess 콜백 (Client Component 폼):**
   - `event-form.tsx`가 이미 Client Component인 경우 Server Action 완료 후 toast 직접 호출

2. **이벤트 생성 성공 toast:**
   - 생성 후 상세 페이지로 이동 시 동일한 searchParams 패턴 적용
   - 메시지: "이벤트가 생성되었습니다"

3. **Toast 컴포넌트:**
   - 이미 설치된 shadcn/ui `sonner` (toast) 컴포넌트 사용
   - `app/layout.tsx`에 `<Toaster />` 컴포넌트가 이미 추가되어 있는지 확인, 없으면 추가
   - `toast.success("...")` 호출

4. **에러 케이스도 고려:**
   - 수정 실패 시 `toast.error("이벤트 수정에 실패했습니다. 다시 시도해 주세요.")` 표시

#### 완료 기준 (Acceptance Criteria)

- [ ] 이벤트 수정 완료 후 상세 페이지 이동 시 성공 toast 표시됨
- [ ] 이벤트 생성 완료 후 성공 toast 표시됨
- [ ] Toast 메시지가 한국어로 표시됨
- [ ] Toast가 일정 시간 후 자동으로 사라짐
- [ ] `npm run type-check` 통과

---

### Task 9: 이벤트 카테고리별 커버 이미지 Placeholder 개선

- **원본 이슈:** UI-009
- **심각도:** 낮음
- **예상 시간:** 1.5h
- **의존성:** 없음
- **파일:**
  - `components/mobile/event-card-mobile.tsx` — 카테고리별 gradient placeholder 적용
  - `app/(host)/events/[eventId]/page.tsx` — 상세 페이지 placeholder도 동일하게 적용

#### 구현 요구사항

1. **카테고리별 gradient 색상 정의:**
   - `생일파티`: 핑크/보라 gradient (`from-pink-400 to-purple-500`)
   - `파티모임`: 주황/노랑 gradient (`from-orange-400 to-yellow-400`)
   - `워크샵`: 파란색 gradient (`from-blue-400 to-indigo-500`)
   - `스터디`: 초록/청록 gradient (`from-green-400 to-teal-500`)
   - `운동스포츠`: 빨강/주황 gradient (`from-red-400 to-orange-500`)
   - `기타`: 회색 gradient (`from-slate-400 to-gray-500`, 기존 유지 또는 개선)

2. **카테고리별 아이콘 (선택적 추가):**
   - 각 gradient 위에 카테고리 관련 lucide-react 아이콘 중앙 배치
   - 생일파티: `PartyPopper` 또는 `Gift`
   - 파티모임: `Music` 또는 `Users`
   - 워크샵: `Briefcase` 또는 `Lightbulb`
   - 스터디: `BookOpen`
   - 운동스포츠: `Dumbbell` 또는 `Trophy`
   - 기타: `CalendarDays`

3. **구현 방식:**
   - 카테고리 → gradient 클래스 매핑 객체 정의:
     ```typescript
     const categoryGradients: Record<EventCategory, string> = {
       생일파티: "from-pink-400 to-purple-500",
       파티모임: "from-orange-400 to-yellow-400",
       // ...
     };
     ```
   - `cover_image_url`이 없을 때 위 gradient 적용
   - `bg-gradient-to-br` + 카테고리별 from/to 클래스 조합

4. **상세 페이지 동기화:**
   - 이벤트 상세 페이지의 커버 이미지 영역도 동일한 gradient placeholder 적용
   - 카드와 상세 페이지 간 시각적 일관성 확보

#### 완료 기준 (Acceptance Criteria)

- [ ] 커버 이미지 없는 이벤트 카드가 카테고리별로 다른 색상 gradient 배경으로 표시됨
- [ ] 6개 카테고리 각각 다른 gradient 색상 적용
- [ ] 이벤트 상세 페이지의 placeholder도 동일한 카테고리별 gradient 적용
- [ ] 커버 이미지가 있는 경우 기존대로 이미지 표시 (변경 없음)
- [ ] `npm run type-check` 통과

---

## 5. 위험 요소 (Risks)

| 위험                                                         | 가능성 | 영향 | 완화 방안                                                                                  |
| ------------------------------------------------------------ | ------ | ---- | ------------------------------------------------------------------------------------------ |
| 전역 스크롤바 숨김으로 스크롤 필요 영역에서 콘텐츠 접근 불가 | 낮음   | 높음 | 스크롤바만 숨기고 overflow는 유지. 이벤트 목록 등 스크롤 영역 직접 테스트                  |
| searchParams 기반 toast에서 URL 파라미터 잔존                | 낮음   | 낮음 | useEffect에서 toast 표시 후 `router.replace(pathname)`으로 파라미터 제거                   |
| KST 변환 로직이 서버/클라이언트 환경 간 불일치               | 중간   | 중간 | 명시적 UTC+9 오프셋 계산 사용, `date-fns-tz` 라이브러리 활용 가능 (`date-fns` 이미 설치됨) |
| `router.back()` 이용 시 이전 페이지가 없는 경우              | 낮음   | 낮음 | fallback 링크(`/events`)와 함께 구현                                                       |
| generateMetadata에서 DB 조회 실패                            | 낮음   | 낮음 | try-catch로 처리, 실패 시 기본 타이틀("이벤트 매니저") 반환                                |

---

## 6. 작업 순서 권장사항

독립적으로 진행 가능하므로 병렬 처리 가능하나, 아래 순서를 권장:

1. **Task 2 (전역 스크롤바)** — 가장 간단하며 Task 3에 영향
2. **Task 3 (카테고리 탭)** — Task 2 완료 후 나머지 수정 확인
3. **Task 1 (역할 전환)** — 가장 복잡, 레이아웃 수정
4. **Task 4, 5 (404 / 메타데이터)** — 독립적, 언제든 가능
5. **Task 6 (KST 시간)** — 이벤트 수정 폼 관련
6. **Task 7, 8 (뒤로가기 / Toast)** — 이벤트 상세/수정 페이지 관련
7. **Task 9 (Placeholder)** — 시각적 개선, 마지막에 처리

---

## 7. 검증 체크리스트

모든 Task 완료 후 아래 항목을 순서대로 확인:

- [ ] `npm run type-check` — TypeScript 에러 없음
- [ ] `npm run lint` — ESLint 에러 없음
- [ ] `npm run build` — 빌드 성공
- [ ] 브라우저에서 `/home`, `/events`, `/discover`, `/events/new`, `/events/[id]`, `/events/[id]/edit` 직접 접근 확인
- [ ] 브라우저 스크롤바 미표시 확인 (Chrome, Safari, Firefox)
- [ ] 역할 전환 버튼 동작 확인 (주최자 ↔ 참여자)
- [ ] 잘못된 URL(`/nonexistent`) 접근 시 한국어 404 페이지 확인
- [ ] 이벤트 수정 후 성공 toast 표시 확인
- [ ] 이벤트 수정 페이지에서 KST 기준 시간 표시 확인
- [ ] 커버 이미지 없는 이벤트 카드의 카테고리별 gradient 확인
