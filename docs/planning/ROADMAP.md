# ROADMAP.md

## 프로젝트 개요

**이벤트 관리 플랫폼 MVP** — 생일파티, 워크샵, 친구 모임 등 일회성 이벤트에서 발생하는 공지, 참여자 관리, 카풀, 정산 부담을 하나의 서비스로 통합 해결하는 플랫폼.

- **대상 사용자:** 소규모 일회성 이벤트를 주최하거나 참여하는 개인 사용자 (모바일 중심, 관리자는 PC)
- **기술 스택:** Next.js 16 (App Router) + React 19, TypeScript, TailwindCSS + shadcn/ui, Supabase (인증/DB/Storage), React Hook Form + Zod, Recharts
- **배포:** Vercel

---

## 현재 상태 (Current State)

### 구현 완료

- **인증 시스템:** 이메일/비밀번호 회원가입, 로그인, Google OAuth, 비밀번호 재설정, 로그아웃 (`app/auth/*`)
- **Supabase 클라이언트:** browser/server/proxy 3종 클라이언트 구성 완료 (`lib/supabase/`)
- **미들웨어:** 쿠키 기반 세션 관리, 비인증 사용자 리디렉션 (`proxy.ts`)
- **기본 shadcn/ui 컴포넌트:** button, card, badge, checkbox, dropdown-menu, input, label (`components/ui/`)
- **코드 품질 도구:** ESLint, Prettier, Husky + lint-staged, Knip 설정 완료
- **패키지:** react-hook-form, zod, date-fns, recharts, lucide-react 이미 설치됨

### 미구현 / Placeholder 상태

- **루트 페이지 (`app/page.tsx`):** Supabase 스타터 템플릿 기본 페이지 — 역할별 리디렉션 로직 없음
- **DB 스키마:** `profiles` 테이블만 존재, `role` 컬럼 없음, `full_name` 컬럼 사용 (PRD에서는 `name`으로 명세)
- **라우팅 구조:** `(host)/*`, `(participant)/*`, `admin/*` 라우트 그룹 전혀 없음
- **레이아웃:** 모바일 하단 탭, 관리자 사이드바/GNB 없음
- **핵심 기능 전체:** 이벤트 CRUD, 참여자 관리, 공지/댓글, 카풀, 정산 — 모두 미구현
- **TailwindCSS:** v3 사용 중 (PRD에서 v4 명세)
- **미들웨어 admin 접근 제어:** `/admin/*` 경로에 대한 role 기반 리디렉션 없음

---

## 목표 상태 (Target State)

3개 역할(관리자/주최자/참여자)이 각자의 뷰에서 이벤트를 생성, 탐색, 참여하고, 카풀 매칭과 1/N 정산까지 완료할 수 있는 MVP 서비스. 관리자는 PC에서 KPI 대시보드로 서비스 현황을 모니터링하고 사용자/이벤트를 관리할 수 있다.

---

## 마일스톤 (Milestones)

### Phase 0: 기반 설정 (Foundation Setup)

**기간:** 1주
**목표:** 모든 후속 Phase의 전제 조건이 되는 환경, 스키마, 레이아웃을 준비
**완료 기준:** TailwindCSS v4 동작, profiles 테이블에 role 컬럼 존재, 3개 레이아웃 라우트 그룹이 렌더링됨, 미들웨어에서 admin 접근 제어 동작

#### Tasks

- [x] **[TASK-001]** TailwindCSS v3 → v4 업그레이드
  - 파일: `package.json`, `postcss.config.mjs`, `tailwind.config.ts` (삭제), `app/globals.css`
  - 예상 시간: 3h
  - 의존성: 없음
  - 완료 기준: `npm run dev`에서 기존 스타일이 정상 렌더링됨, `tailwind.config.ts` 삭제 후 CSS 파일 기반 설정으로 전환, shadcn/ui 컴포넌트가 정상 동작
  - 상세: `npm install tailwindcss@next @tailwindcss/postcss@next`, `globals.css` 최상단 `@import "tailwindcss"` 적용, `@tailwind base/components/utilities` 지시어 제거

- [x] **[TASK-002]** 추가 shadcn/ui 컴포넌트 설치
  - 파일: `components/ui/` (자동 생성)
  - 예상 시간: 1h
  - 의존성: TASK-001
  - 완료 기준: textarea, select, separator, tabs, avatar, toast, skeleton, dialog, sheet 컴포넌트가 `components/ui/`에 추가됨
  - 상세: `npx shadcn@latest add textarea select separator tabs avatar toast skeleton dialog sheet`

- [x] **[TASK-003]** Migration 001 — profiles 스키마 정비 + ENUM 타입 생성
  - 파일: Supabase 마이그레이션 SQL
  - 예상 시간: 3h
  - 의존성: 없음
  - 완료 기준: profiles 테이블에 `role TEXT DEFAULT 'user'` 컬럼 추가, `full_name` → `name` 리네이밍 (또는 `name` alias 추가), `event_category`, `participation_status`, `carpool_request_status` ENUM 타입 생성
  - 주의: 기존 `profiles` 데이터 보존 필요. `full_name` 컬럼 리네이밍 시 기존 데이터 마이그레이션 포함. `role` 컬럼 부재 시 인증 시스템 전체가 동작하지 않음

- [x] **[TASK-004]** Migration 002 — events 테이블 생성 + RLS
  - 파일: Supabase 마이그레이션 SQL
  - 예상 시간: 2h
  - 의존성: TASK-003
  - 완료 기준: events 테이블 생성됨, RLS 정책 적용 (공개 이벤트 조회 / 주최자 CRUD)

- [x] **[TASK-005]** TypeScript 타입 재생성
  - 파일: `types/database.types.ts`
  - 예상 시간: 30m
  - 의존성: TASK-003, TASK-004
  - 완료 기준: `npx supabase gen types` 실행 후 새 테이블/ENUM이 타입에 반영됨

- [x] **[TASK-006]** 미들웨어 admin 접근 제어 추가
  - 파일: `lib/supabase/proxy.ts`
  - 예상 시간: 2h
  - 의존성: TASK-003 (role 컬럼 필요)
  - 완료 기준: `/admin/*` 경로 접근 시 DB에서 role을 조회하여 `admin`이 아닌 경우 홈으로 리디렉션, role = 'admin'은 통과

- [x] **[TASK-007]** 루트 페이지 역할별 리디렉션 구현
  - 파일: `app/page.tsx`
  - 예상 시간: 1h
  - 의존성: TASK-003, TASK-006
  - 완료 기준: 비로그인 → `/auth/login`, role = 'admin' → `/admin`, role = 'user' → `/discover`

- [x] **[TASK-008]** 참여자 레이아웃 + 하단 탭 내비게이션 구축
  - 파일: `app/(participant)/layout.tsx`, `components/mobile/mobile-bottom-nav.tsx`, `components/mobile/mobile-header.tsx`
  - 예상 시간: 3h
  - 의존성: TASK-001, TASK-002
  - 완료 기준: 참여자 라우트 그룹에 하단 탭(탐색/참여중/카풀/프로필) + 상단 바 레이아웃 렌더링, `usePathname`으로 활성 탭 하이라이트

- [x] **[TASK-009]** 주최자 레이아웃 + 하단 탭 내비게이션 구축
  - 파일: `app/(host)/layout.tsx`
  - 예상 시간: 2h
  - 의존성: TASK-008 (mobile-bottom-nav 재사용)
  - 완료 기준: 주최자 라우트 그룹에 하단 탭(홈/내이벤트/만들기/프로필) + 상단 바 레이아웃 렌더링

- [x] **[TASK-010]** 관리자 레이아웃 구축 (GNB + 사이드바)
  - 파일: `app/admin/layout.tsx`, `components/admin/admin-sidebar.tsx`, `components/admin/admin-header.tsx`
  - 예상 시간: 3h
  - 의존성: TASK-001, TASK-002
  - 완료 기준: 관리자 라우트에 좌측 사이드바(대시보드/이벤트관리/사용자관리) + 상단 GNB 렌더링, 데스크탑(1280px+) 최적화

#### 위험 요소 (Risks)

- **TailwindCSS v4 마이그레이션 호환성:** v3에서 v4로의 전환 시 기존 shadcn/ui 컴포넌트 스타일이 깨질 수 있음. 완화 방안: 업그레이드 후 모든 기존 UI 컴포넌트의 스타일을 수동 검증
- **profiles 마이그레이션 데이터 손실:** full_name → name 리네이밍 시 기존 데이터 유실 가능. 완화 방안: ALTER TABLE ... RENAME COLUMN 사용, 트랜잭션 내 실행

---

### Phase 1: 데이터 레이어 + 이벤트 CRUD (Data Layer + Event CRUD)

**기간:** 1.5주
**목표:** events 테이블 기반 이벤트 생성/조회/수정/삭제 전체 흐름 구현 + Supabase Storage 이미지 업로드
**완료 기준:** 이벤트 CRUD 전체 흐름이 실제 DB 데이터로 동작, 이벤트 카드 UI가 2열 그리드로 표시됨

#### Tasks

- [ ] **[TASK-011]** 이벤트 Zod 스키마 + 공통 타입 정의
  - 파일: `lib/validations/event.ts`, `types/event.ts`
  - 예상 시간: 1h
  - 의존성: TASK-005
  - 완료 기준: 이벤트 생성/수정 폼용 Zod 스키마 정의, 카테고리 ENUM 타입 매핑

- [ ] **[TASK-012]** Supabase Storage 버킷 설정 + 이미지 업로드 유틸리티
  - 파일: `lib/supabase/storage.ts`
  - 예상 시간: 2h
  - 의존성: TASK-005
  - 완료 기준: 커버 이미지 업로드/삭제/URL 반환 함수 구현, Storage RLS 정책 설정

- [ ] **[TASK-013]** Server Actions — 이벤트 CRUD 구현
  - 파일: `actions/events.ts`
  - 예상 시간: 4h
  - 의존성: TASK-011, TASK-012
  - 완료 기준: `createEvent`, `updateEvent`, `deleteEvent` Server Actions 구현, Zod 서버 검증, `revalidatePath()` 호출, 에러 처리

- [ ] **[TASK-014]** 이벤트 생성 페이지 (주최자)
  - 파일: `app/(host)/events/new/page.tsx`, `components/forms/event-form.tsx`
  - 예상 시간: 4h
  - 의존성: TASK-013, TASK-009
  - 완료 기준: React Hook Form + Zod 이중 검증 폼, 카테고리 Select, 날짜/시간 입력, 커버 이미지 업로드, 공개/비공개 토글 동작, 생성 성공 시 이벤트 상세로 리디렉션

- [ ] **[TASK-015]** 이벤트 상세 페이지 (주최자)
  - 파일: `app/(host)/events/[eventId]/page.tsx`
  - 예상 시간: 3h
  - 의존성: TASK-013
  - 완료 기준: 커버 이미지, 제목, 카테고리, 일시, 장소, 인원, 설명 표시, 하위 탭 내비게이션 구조 (참여자/공지댓글/카풀/정산), 수정/삭제 버튼

- [ ] **[TASK-016]** 이벤트 수정 페이지 (주최자)
  - 파일: `app/(host)/events/[eventId]/edit/page.tsx`
  - 예상 시간: 2h
  - 의존성: TASK-014 (event-form 재사용)
  - 완료 기준: 기존 데이터가 미리 채워진 폼, 수정 저장 시 DB 업데이트 + 이벤트 상세로 리디렉션

- [ ] **[TASK-017]** 이벤트 삭제 기능 + 확인 다이얼로그
  - 파일: `components/shared/confirm-dialog.tsx`, `app/(host)/events/[eventId]/page.tsx` (통합)
  - 예상 시간: 1.5h
  - 의존성: TASK-015
  - 완료 기준: 삭제 버튼 클릭 → 확인 다이얼로그 → 삭제 실행 → 내 이벤트 목록으로 리디렉션

- [ ] **[TASK-018]** 주최자 홈 페이지
  - 파일: `app/(host)/home/page.tsx`
  - 예상 시간: 2h
  - 의존성: TASK-013
  - 완료 기준: 내가 만든 이벤트 요약 카드 목록 (최근 순), 빈 상태 UI, FAB(이벤트 만들기 버튼)

- [ ] **[TASK-019]** 내 이벤트 목록 페이지 (주최자)
  - 파일: `app/(host)/events/page.tsx`, `components/mobile/event-card-mobile.tsx`, `components/mobile/event-category-badge.tsx`
  - 예상 시간: 3h
  - 의존성: TASK-013
  - 완료 기준: 내가 만든 이벤트 카드 목록 (2열, 썸네일, 카테고리 배지, 참여 현황), 카테고리 필터 탭, 빈 상태 UI

- [ ] **[TASK-020]** 이벤트 탐색 페이지 (참여자)
  - 파일: `app/(participant)/discover/page.tsx`, `components/mobile/segment-tabs.tsx`
  - 예상 시간: 3h
  - 의존성: TASK-019 (event-card-mobile 재사용), TASK-008
  - 완료 기준: 공개 이벤트 카드 2열 목록, 카테고리 세그먼트 탭 필터 (전체/생일파티/파티모임/워크샵/스터디/운동스포츠/기타), NEW 배지, 빈 상태 UI

- [ ] **[TASK-021]** 초대 링크 복사 기능
  - 파일: `components/shared/copy-link-button.tsx`
  - 예상 시간: 1h
  - 의존성: TASK-015
  - 완료 기준: 클립보드에 이벤트 고유 URL 복사, 복사 완료 토스트 표시

#### 위험 요소 (Risks)

- **Supabase Storage 설정:** Storage 버킷 생성 및 RLS 정책 설정이 필요. 완화 방안: Supabase 대시보드에서 수동 설정 후 코드에서 접근 확인
- **이미지 업로드 UX:** 대용량 이미지 업로드 시 지연. 완화 방안: 클라이언트 사이드 리사이즈 또는 파일 크기 제한 적용

---

### Phase 2: 참여자 관리 + 공지/댓글 (Participation + Posts)

**기간:** 1.5주
**목표:** 참여 신청/승인/거절/출석 체크 전체 흐름 + 공지/댓글 소통 기능 구현
**완료 기준:** 참여 신청 → 주최자 승인 → 출석 체크 전체 흐름 동작, 공지 작성 + 댓글 피드 동작

#### Tasks

- [ ] **[TASK-022]** Migration 003 — participations 테이블 + RLS + 인덱스
  - 파일: Supabase 마이그레이션 SQL
  - 예상 시간: 2h
  - 의존성: TASK-004
  - 완료 기준: participations 테이블 생성, `(event_id, user_id)` UNIQUE 제약, `participations(event_id)` + `participations(user_id, status)` 인덱스, RLS 정책 (본인 또는 주최자만 접근), `event_id` FK에 `ON DELETE CASCADE`

- [ ] **[TASK-023]** Migration 004 — posts 테이블 + RLS
  - 파일: Supabase 마이그레이션 SQL
  - 예상 시간: 1.5h
  - 의존성: TASK-022
  - 완료 기준: posts 테이블 생성, RLS 정책 (승인 참여자 + 주최자 접근, 공지는 주최자만 작성), `event_id` FK에 `ON DELETE CASCADE`

- [ ] **[TASK-024]** 참여 승인 동시성 제어 RPC 함수
  - 파일: Supabase 마이그레이션 SQL (PostgreSQL 함수)
  - 예상 시간: 3h
  - 의존성: TASK-022
  - 완료 기준: `approve_participation(p_participation_id, p_event_id)` RPC 함수 생성, 현재 승인 인원이 `max_participants` 미만일 때만 승인 처리 (원자적), 초과 시 에러 반환

- [ ] **[TASK-025]** TypeScript 타입 재생성 (participations, posts)
  - 파일: `types/database.types.ts`
  - 예상 시간: 30m
  - 의존성: TASK-022, TASK-023, TASK-024

- [ ] **[TASK-026]** Server Actions — 참여자 관리 구현
  - 파일: `actions/participations.ts`
  - 예상 시간: 4h
  - 의존성: TASK-025
  - 완료 기준: `applyParticipation`, `approveParticipation` (RPC 호출), `rejectParticipation`, `cancelParticipation`, `toggleAttendance` 구현

- [ ] **[TASK-027]** Server Actions — 공지/댓글 구현
  - 파일: `actions/posts.ts`
  - 예상 시간: 2h
  - 의존성: TASK-025
  - 완료 기준: `createPost`, `updatePost`, `deletePost` 구현, 공지는 주최자만 작성 가능 서버 검증

- [ ] **[TASK-028]** 참여자 관리 페이지 (주최자)
  - 파일: `app/(host)/events/[eventId]/participants/page.tsx`, `components/shared/participant-list.tsx`, `components/shared/participant-actions.tsx`, `components/shared/attendance-toggle.tsx`
  - 예상 시간: 4h
  - 의존성: TASK-026
  - 완료 기준: 참여 신청 목록 (상태별 필터), 승인/거절 버튼, 출석 체크 토글, 현재 승인 인원 / 최대 인원 표시

- [ ] **[TASK-029]** 공지 및 댓글 관리 페이지 (주최자)
  - 파일: `app/(host)/events/[eventId]/posts/page.tsx`, `components/shared/post-feed.tsx`, `components/shared/post-item.tsx`, `components/shared/post-actions.tsx`, `components/forms/post-form.tsx`
  - 예상 시간: 4h
  - 의존성: TASK-027
  - 완료 기준: 공지 피드 (배지 강조, 최신 순), 댓글 피드, 공지 작성 (주최자), 댓글 작성 (승인 참여자), 수정/삭제 액션

- [ ] **[TASK-030]** 이벤트 상세 페이지 (참여자)
  - 파일: `app/(participant)/events/[eventId]/page.tsx`, `components/forms/participation-form.tsx`
  - 예상 시간: 4h
  - 의존성: TASK-026, TASK-027
  - 완료 기준: 이벤트 정보 표시, 참여 신청 버튼 (메시지 입력), 신청 상태 표시 (대기/승인/거절), 승인 참여자 전용 탭 (공지댓글/카풀/정산) 노출, 공지 및 댓글 피드 조회/작성

- [ ] **[TASK-031]** 내가 참여한 이벤트 목록 페이지 (참여자)
  - 파일: `app/(participant)/my-events/page.tsx`
  - 예상 시간: 2h
  - 의존성: TASK-026
  - 완료 기준: 참여 신청한 이벤트 카드 목록, 상태별 필터 (전체/대기/승인/거절), 참여 취소 버튼 (pending), 빈 상태 UI

#### 위험 요소 (Risks)

- **동시성 제어 RPC 복잡도:** PostgreSQL 함수 작성 경험 부족 시 구현이 지연될 수 있음. 완화 방안: Supabase 문서의 RPC 예제를 참고하여 스파이크 작업 선행
- **RLS 정책 복잡도:** 참여 상태에 따른 접근 제어가 복잡함. 완화 방안: 각 시나리오별 RLS 정책을 사전 설계 후 SQL 작성

---

### Phase 3: 카풀 기능 (Carpool)

**기간:** 1주
**목표:** 카풀 등록/탑승 신청/승인/거절/취소 전체 흐름 + 잔여 좌석 표시
**완료 기준:** 주최자 카풀 등록 → 참여자 탑승 신청 → 승인 → 잔여 좌석 반영 전체 흐름 동작

#### Tasks

- [ ] **[TASK-032]** Migration 005 — carpools + carpool_requests 테이블 + RLS + 인덱스
  - 파일: Supabase 마이그레이션 SQL
  - 예상 시간: 3h
  - 의존성: TASK-022
  - 완료 기준: carpools, carpool_requests 테이블 생성, `(carpool_id, passenger_id)` UNIQUE 제약, `carpools(event_id)`, `carpool_requests(carpool_id)`, `carpool_requests(passenger_id)` 인덱스, RLS 정책, FK `ON DELETE CASCADE`

- [ ] **[TASK-033]** 카풀 좌석 동시성 제어 RPC 함수
  - 파일: Supabase 마이그레이션 SQL (PostgreSQL 함수)
  - 예상 시간: 2h
  - 의존성: TASK-032
  - 완료 기준: `approve_carpool_request(p_request_id, p_carpool_id)` RPC 함수 생성, 현재 승인 탑승자 수가 `total_seats` 미만일 때만 승인 처리 (원자적)

- [ ] **[TASK-034]** TypeScript 타입 재생성 (carpools, carpool_requests)
  - 파일: `types/database.types.ts`
  - 예상 시간: 30m
  - 의존성: TASK-032, TASK-033

- [ ] **[TASK-035]** Server Actions — 카풀 관리 구현
  - 파일: `actions/carpools.ts`
  - 예상 시간: 4h
  - 의존성: TASK-034
  - 완료 기준: `registerCarpool`, `deleteCarpool`, `requestCarpool`, `approveCarpoolRequest` (RPC 호출), `rejectCarpoolRequest`, `cancelCarpoolRequest` 구현

- [ ] **[TASK-036]** 카풀 관리 페이지 (주최자)
  - 파일: `app/(host)/events/[eventId]/carpool/page.tsx`, `components/shared/carpool-card.tsx`, `components/shared/carpool-actions.tsx`, `components/forms/carpool-register-form.tsx`
  - 예상 시간: 4h
  - 의존성: TASK-035
  - 완료 기준: 카풀 카드 목록 (드라이버, 출발지, 좌석 현황), 카풀 등록 폼, 탑승 신청 목록 + 승인/거절 버튼, 카풀 삭제 버튼

- [ ] **[TASK-037]** 카풀 탑승 신청 페이지 (참여자)
  - 파일: `app/(participant)/events/[eventId]/carpool/page.tsx`, `components/forms/carpool-request-form.tsx`
  - 예상 시간: 3h
  - 의존성: TASK-035
  - 완료 기준: 카풀 카드 목록 (잔여 좌석 표시), 탑승 신청 버튼 (잔여석 있을 때 활성화), 신청 상태 표시, 신청 취소

- [ ] **[TASK-038]** 내가 신청한 카풀 목록 페이지 (참여자)
  - 파일: `app/(participant)/carpools/page.tsx`
  - 예상 시간: 2h
  - 의존성: TASK-035
  - 완료 기준: 내가 탑승 신청한 카풀 카드 목록, 상태별 필터, 신청 취소 (pending), 빈 상태 UI

#### 위험 요소 (Risks)

- **좌석 동시성:** 다수의 사용자가 동시에 탑승 신청할 때 좌석 초과 승인 가능. 완화 방안: Phase 2에서 구현한 RPC 패턴을 동일하게 적용

---

### Phase 4: 정산 + 관리자 대시보드 (Settlement + Admin)

**기간:** 1.5주
**목표:** 1/N 균등 정산 알고리즘 구현 + 관리자 대시보드(KPI, 차트, 데이터 테이블)
**완료 기준:** 정산 항목 입력 → 1/N 계산 → 최소 거래 쌍 결과 표시 동작, 관리자 대시보드 KPI 카드 + 월별 차트 표시

#### Tasks

- [ ] **[TASK-039]** Migration 006 — settlement_items 테이블 + RLS + 인덱스
  - 파일: Supabase 마이그레이션 SQL
  - 예상 시간: 1.5h
  - 의존성: TASK-022
  - 완료 기준: settlement_items 테이블 생성, `settlement_items(event_id)` 인덱스, RLS 정책, `event_id` FK `ON DELETE CASCADE`

- [ ] **[TASK-040]** TypeScript 타입 재생성 (settlement_items)
  - 파일: `types/database.types.ts`
  - 예상 시간: 30m
  - 의존성: TASK-039

- [ ] **[TASK-041]** 정산 알고리즘 구현 (calculateSettlement)
  - 파일: `lib/settlement.ts`
  - 예상 시간: 3h
  - 의존성: TASK-040
  - 완료 기준: PRD 명세 기반 5단계 그리디 알고리즘 구현, `Math.floor` + 나머지 보정 처리 (올림 오차 방지), 단위 테스트 작성
  - 주의: `Math.ceil` 사용 시 총 부담액 > 실제 지출 문제 발생. `Math.floor` 사용 후 나머지를 첫 번째 debtor에게 할당하는 보정 로직 포함

- [ ] **[TASK-042]** Server Actions — 정산 관리 구현
  - 파일: `actions/settlements.ts`
  - 예상 시간: 3h
  - 의존성: TASK-041
  - 완료 기준: `createSettlementItem`, `updateSettlementItem`, `deleteSettlementItem`, `calculateSettlement` (lib 함수 호출) 구현

- [ ] **[TASK-043]** 정산 관리 페이지 (주최자)
  - 파일: `app/(host)/events/[eventId]/settlement/page.tsx`, `components/shared/settlement-table.tsx`, `components/shared/settlement-summary.tsx`, `components/forms/settlement-item-form.tsx`
  - 예상 시간: 4h
  - 의존성: TASK-042
  - 완료 기준: 지출 항목 목록 (추가/수정/삭제), 총 합계 표시, 정산 계산하기 버튼, 1인 균등 부담액 + 최소 거래 쌍 결과 테이블 표시

- [ ] **[TASK-044]** 정산 현황 페이지 (참여자)
  - 파일: `app/(participant)/events/[eventId]/settlement/page.tsx`
  - 예상 시간: 2h
  - 의존성: TASK-042
  - 완료 기준: 전체 지출 항목 목록 (읽기 전용), 1인 부담액, 내 정산 결과 (받을 돈/낼 돈/없음), 최소 거래 쌍 목록

- [ ] **[TASK-045]** 관리자 대시보드 — KPI 카드
  - 파일: `app/admin/page.tsx`, `components/admin/kpi-card.tsx`
  - 예상 시간: 3h
  - 의존성: TASK-010, TASK-005
  - 완료 기준: 4개 KPI 카드 표시 (총 이벤트 수/이번 달 생성, 총 사용자 수/이번 달 신규, 평균 참여율, 카풀 매칭률), DB 집계 쿼리로 실제 데이터 반영

- [ ] **[TASK-046]** 관리자 대시보드 — 이벤트 현황 차트
  - 파일: `components/admin/events-chart.tsx`
  - 예상 시간: 2h
  - 의존성: TASK-045
  - 완료 기준: recharts Bar 차트로 월별 이벤트 생성 현황 표시 (Client Component)

- [ ] **[TASK-047]** 관리자 대시보드 — 최근 가입자 테이블
  - 파일: `app/admin/page.tsx` (통합)
  - 예상 시간: 1h
  - 의존성: TASK-045
  - 완료 기준: 최근 가입자 5~10명 테이블 (이름, 이메일, 가입일)

- [ ] **[TASK-048]** 관리자 이벤트 관리 페이지
  - 파일: `app/admin/events/page.tsx`, `components/admin/events-table.tsx`
  - 예상 시간: 3h
  - 의존성: TASK-045
  - 완료 기준: 전체 이벤트 데이터 테이블, 카테고리 필터, 삭제 버튼 (확인 다이얼로그), 페이지네이션

- [ ] **[TASK-049]** 관리자 사용자 관리 페이지
  - 파일: `app/admin/users/page.tsx`, `components/admin/users-table.tsx`, `actions/admin.ts`
  - 예상 시간: 3h
  - 의존성: TASK-045
  - 완료 기준: 전체 사용자 데이터 테이블, 역할 변경 Select (user/admin), 이름/이메일 검색, 페이지네이션, `updateUserRole` Server Action

#### 위험 요소 (Risks)

- **정산 올림/내림 보정:** 원 단위 올림/내림 처리 시 합계 불일치 발생 가능. 완화 방안: 단위 테스트로 다양한 금액/인원 조합 검증
- **관리자 집계 쿼리 성능:** 데이터가 많아지면 KPI 집계 쿼리가 느려질 수 있음. 완화 방안: 적절한 인덱스 추가, 필요 시 Supabase View 활용

---

### Phase 5: 프로필 + 사용자 경험 + 보안 (Profile + UX + Security)

**기간:** 1주
**목표:** 프로필 관리, 반응형 디자인, 로딩/빈 상태 처리, 에러 핸들링, 접근 제어 강화
**완료 기준:** 프로필 수정 동작, 모든 페이지에서 로딩 스켈레톤 + 에러 바운더리 동작, 반응형 검증 통과

#### Tasks

- [ ] **[TASK-050]** 프로필 페이지 (주최자 + 참여자)
  - 파일: `app/(host)/profile/page.tsx`, `app/(participant)/profile/page.tsx`
  - 예상 시간: 3h
  - 의존성: TASK-005
  - 완료 기준: 프로필 이미지(아바타) 표시, 닉네임 수정, 이메일 표시 (수정 불가), 로그아웃 버튼, Supabase Storage 아바타 업로드

- [ ] **[TASK-051]** 빈 상태 UI 컴포넌트 통합
  - 파일: `components/shared/empty-state.tsx`
  - 예상 시간: 1h
  - 의존성: 없음
  - 완료 기준: 재사용 가능한 빈 상태 컴포넌트 (아이콘 + 메시지 + 액션 버튼), 모든 목록 페이지에 적용

- [ ] **[TASK-052]** 로딩 스켈레톤 + Suspense 경계 추가
  - 파일: 각 라우트의 `loading.tsx`, 컴포넌트 Skeleton 변형
  - 예상 시간: 3h
  - 의존성: 없음
  - 완료 기준: 주요 페이지에 Skeleton UI 로딩 상태 추가, `<Suspense>` 경계 설정

- [ ] **[TASK-053]** 에러 바운더리 추가
  - 파일: `app/(host)/error.tsx`, `app/(participant)/error.tsx`, `app/admin/error.tsx`, `app/not-found.tsx`
  - 예상 시간: 2h
  - 의존성: 없음
  - 완료 기준: 각 라우트 그룹별 error.tsx + 전역 not-found.tsx, 사용자 친화적 에러 메시지 + 재시도 버튼

- [ ] **[TASK-054]** 반응형 디자인 검증 및 보정
  - 파일: 전체 레이아웃/컴포넌트
  - 예상 시간: 3h
  - 의존성: Phase 1~4 완료
  - 완료 기준: 모바일(375px) 하단 탭 + 2열 카드, 태블릿(768px) 레이아웃 깨짐 없음, 데스크탑(1280px+) 관리자 사이드바 정상

- [ ] **[TASK-055]** 주최자 뷰 접근 제어 강화 (host_id 검증)
  - 파일: `app/(host)/events/[eventId]/*` 관련 페이지
  - 예상 시간: 2h
  - 의존성: Phase 1~4 완료
  - 완료 기준: 이벤트 상세/편집/관리 페이지에서 `host_id !== auth.uid()` 시 리디렉션 또는 403 처리

- [ ] **[TASK-056]** 참여자 뷰 접근 제어 강화 (승인 참여자 검증)
  - 파일: `app/(participant)/events/[eventId]/*` 관련 페이지
  - 예상 시간: 2h
  - 의존성: Phase 2 완료
  - 완료 기준: 카풀/정산 탭에서 미승인 참여자 접근 차단 (빈 결과 또는 접근 차단 UI 표시)

#### 위험 요소 (Risks)

- **반응형 보정 범위:** 모든 페이지에 걸친 반응형 보정이 예상보다 시간이 소요될 수 있음. 완화 방안: 주요 경로(이벤트 탐색 → 상세 → 참여)에 우선 집중

---

### Phase 6: 성능 최적화 + 런칭 준비 (Performance + Launch)

**기간:** 1주
**목표:** 빌드 검증, SEO 기본, 배포 환경 구성, 전체 E2E 검증
**완료 기준:** `npm run build` 성공, Vercel 배포 완료, 3개 역할별 E2E 시나리오 통과

#### Tasks

- [ ] **[TASK-057]** 코드 품질 최종 검증
  - 파일: 프로젝트 전체
  - 예상 시간: 2h
  - 의존성: Phase 0~5 완료
  - 완료 기준: `npm run type-check` 오류 없음, `npm run lint` 오류 없음, `npm run build` 성공, `npm run knip`으로 미사용 코드 정리

- [ ] **[TASK-058]** SEO 기본 설정
  - 파일: `app/layout.tsx`, 각 페이지 `metadata` export
  - 예상 시간: 2h
  - 의존성: 없음
  - 완료 기준: 전역 메타데이터 설정, 주요 페이지별 title/description 설정, OG 이미지 기본 설정

- [ ] **[TASK-059]** Vercel 배포 환경 구성
  - 파일: Vercel 대시보드, 환경 변수
  - 예상 시간: 2h
  - 의존성: 없음
  - 완료 기준: Vercel 프로젝트 연결, 환경 변수 설정 (Supabase URL/Key, Google OAuth), 프로덕션 빌드 배포 성공

- [ ] **[TASK-060]** E2E 시나리오 검증 (Playwright MCP)
  - 파일: 테스트 스크립트 또는 수동 검증
  - 예상 시간: 4h
  - 의존성: Phase 0~5 완료, TASK-059
  - 완료 기준:
    - 관리자: PC(1280px+) → /admin → KPI 확인 → 이벤트 관리 → 사용자 역할 변경
    - 주최자: 모바일(375px) → 이벤트 생성 → 초대 링크 복사 → 참여자 승인 → 출석 → 정산 → 결과 확인
    - 참여자: 모바일(375px) → 이벤트 탐색 → 참여 신청 → 승인 후 카풀 → 정산 현황 확인

- [ ] **[TASK-061]** Supabase RLS 보안 검증
  - 파일: Supabase 대시보드 + 테스트
  - 예상 시간: 2h
  - 의존성: Phase 0~5 완료
  - 완료 기준: 비로그인 → 이벤트 조회 시 리디렉션, 비주최자 → 편집 접근 차단, 미승인 참여자 → 카풀/정산 접근 차단, role='user' → /admin 접근 차단

- [ ] **[TASK-062]** 불필요한 템플릿 코드 정리
  - 파일: `components/tutorial/*`, `components/deploy-button.tsx`, `components/hero.tsx`, `components/env-var-warning.tsx`, `components/next-logo.tsx`, `components/supabase-logo.tsx`, `app/protected/*`
  - 예상 시간: 1h
  - 의존성: 없음
  - 완료 기준: Supabase 스타터 템플릿의 튜토리얼/데모 컴포넌트 및 protected 라우트 삭제, knip으로 미사용 코드 확인

#### 위험 요소 (Risks)

- **빌드 실패:** Phase 전반에 걸쳐 누적된 타입 오류나 import 오류가 빌드 시 발견될 수 있음. 완화 방안: 각 Phase 완료 시마다 `npm run build` 실행
- **Vercel 환경 변수:** Supabase URL/Key가 프로덕션 환경에서 다를 수 있음. 완화 방안: Vercel 환경 변수를 사전에 정리

---

## 기술 부채 & TODO

| 항목                          | 설명                                                                                                                           | 우선순위          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| Supabase 스타터 템플릿 코드   | `components/tutorial/*`, `deploy-button`, `hero`, `next-logo`, `supabase-logo`, `env-var-warning`, `app/protected/*` 삭제 필요 | TASK-062에서 처리 |
| TailwindCSS v3 → v4           | PRD 명세는 v4이나 현재 v3 사용 중                                                                                              | TASK-001에서 처리 |
| profiles 테이블 스키마 불일치 | 현재: `full_name`, `username`, `bio`, `website`, `email` / PRD: `name`, `avatar_url`, `role`                                   | TASK-003에서 처리 |
| 미들웨어 admin 제어 부재      | `/admin/*` 경로에 대한 role 검증 없음                                                                                          | TASK-006에서 처리 |
| 루트 페이지 리디렉션          | 현재 스타터 템플릿 홈 페이지 → 역할별 리디렉션 필요                                                                            | TASK-007에서 처리 |

---

## 환경 변수 체크리스트

| 변수명                                 | 용도                                   | 현재 상태                              |
| -------------------------------------- | -------------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase 프로젝트 URL                  | 설정됨 (.env.local)                    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 공개 키 (anon)                | 설정됨 (.env.local)                    |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase 서비스 역할 키 (admin 작업용) | [확인 필요]                            |
| Google OAuth Client ID                 | Google 로그인                          | Supabase 대시보드에서 설정 (구현 완료) |
| Google OAuth Client Secret             | Google 로그인                          | Supabase 대시보드에서 설정 (구현 완료) |
| `NEXT_PUBLIC_SITE_URL`                 | 초대 링크 생성 시 기본 URL             | [설정 필요]                            |

---

## 외부 서비스 설정 체크리스트

| 서비스                   | 용도                                | 현재 상태            | 필요 작업                               |
| ------------------------ | ----------------------------------- | -------------------- | --------------------------------------- |
| **Supabase Auth**        | 이메일/비밀번호 + Google OAuth 인증 | 설정 완료            | 없음                                    |
| **Supabase Database**    | PostgreSQL — 모든 테이블            | profiles만 존재      | Migration 001~006 실행 필요             |
| **Supabase Storage**     | 이벤트 커버 이미지, 프로필 아바타   | 미설정               | 버킷 생성 + RLS 정책 설정 필요          |
| **Supabase RLS**         | Row Level Security 정책             | profiles 기본 정책만 | 각 Migration에서 정책 추가 필요         |
| **Vercel**               | 프로덕션 배포                       | 미설정               | 프로젝트 연결 + 환경 변수 설정 필요     |
| **Google Cloud Console** | OAuth 2.0 클라이언트                | 설정 완료            | 프로덕션 배포 시 리디렉트 URI 추가 필요 |

---

## 성공 지표 (Success Metrics)

### 기능 완성도

- [ ] 12개 기능 (F001~F012) 전체 구현 완료
- [ ] 3개 역할(관리자/주최자/참여자) E2E 시나리오 통과

### 코드 품질

- [ ] `npm run type-check` — 오류 0건
- [ ] `npm run lint` — 오류 0건
- [ ] `npm run build` — 프로덕션 빌드 성공

### 보안

- [ ] 모든 테이블에 RLS 정책 적용
- [ ] 미인증 사용자 접근 차단 동작
- [ ] 역할별 접근 제어 동작 (admin/host/participant)

### 반응형

- [ ] 모바일 (375px) — 하단 탭, 2열 카드 정상
- [ ] 태블릿 (768px) — 레이아웃 깨짐 없음
- [ ] 데스크탑 (1280px+) — 관리자 사이드바 + 대시보드 정상

---

## PRD 기능 → 태스크 매핑

| 기능 ID | 기능명              | 관련 태스크                     |
| ------- | ------------------- | ------------------------------- |
| F001    | 이벤트 CRUD         | TASK-011~021                    |
| F002    | 참여자 관리         | TASK-022, 024~026, 028, 030~031 |
| F003    | 공지 및 댓글        | TASK-023, 027, 029~030          |
| F004    | 카풀 관리           | TASK-032~038                    |
| F005    | 정산 관리           | TASK-039~044                    |
| F006    | 이벤트 탐색         | TASK-020                        |
| F007    | 초대 링크 공유      | TASK-021                        |
| F008    | 관리자 대시보드     | TASK-045~047                    |
| F009    | 관리자 데이터 관리  | TASK-048~049                    |
| F010    | 기본 인증           | 구현 완료 (기존)                |
| F011    | 역할 기반 접근 제어 | TASK-003, 006~007, 055~056      |
| F012    | 프로필 기본 관리    | TASK-050                        |

---

## 변경 이력 (Changelog)

| 날짜       | 버전  | 변경 내용        | 작성자               |
| ---------- | ----- | ---------------- | -------------------- |
| 2026-03-18 | 1.0.0 | 초기 로드맵 생성 | prd-to-roadmap agent |
