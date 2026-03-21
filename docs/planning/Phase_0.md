# Phase 0: 기반 설정 (Foundation Setup) — PRD

> **생성일:** 2026-03-21
> **대상 Phase:** Phase 0
> **문서 목적:** TaskMaster AI `parse-prd` 입력용 격리 PRD

---

## 1. 전체 프로젝트 개요

### 프로젝트 명칭 및 목적

**이벤트 관리 플랫폼 MVP** — 생일파티, 워크샵, 친구 모임 등 일회성 이벤트에서 발생하는 공지, 참여자 관리, 카풀, 정산 부담을 하나의 서비스로 통합 해결하는 플랫폼.

- **대상 사용자:** 소규모 일회성 이벤트를 주최하거나 참여하는 개인 사용자 (모바일 중심, 관리자는 PC)
- **핵심 비즈니스 목표:** 3개 역할(관리자/주최자/참여자)이 각자의 뷰에서 이벤트를 생성, 탐색, 참여하고, 카풀 매칭과 1/N 정산까지 완료할 수 있는 MVP 서비스 구축

### 기술 스택 및 아키텍처

- **프론트엔드:** Next.js 16 (App Router) + React 19, TypeScript
- **스타일링:** TailwindCSS + shadcn/ui
- **백엔드/인프라:** Supabase (인증, PostgreSQL DB, Storage, RLS)
- **폼 처리:** React Hook Form + Zod
- **차트:** Recharts
- **배포:** Vercel

#### 아키텍처 요약

- Server Component 기본, `'use client'`는 인터랙션 필요 시만 사용
- Supabase 클라이언트 3종: browser(`createBrowserClient`), server(`createServerClient` + `cookies()`), proxy(미들웨어 전용 `updateSession()`)
- 쿠키 기반 세션 관리 (`@supabase/ssr`)
- `@/` 절대 경로 별칭 사용, camelCase 네이밍, 한국어 주석

### 전체 Phase 목록

| Phase       | 제목                             | 기간    | 핵심 목표                                                     |
| ----------- | -------------------------------- | ------- | ------------------------------------------------------------- |
| **Phase 0** | **기반 설정 (Foundation Setup)** | **1주** | **환경, DB 스키마, 레이아웃 준비 ← 현재 Phase**               |
| Phase 1     | 데이터 레이어 + 이벤트 CRUD      | 1.5주   | events 테이블 기반 이벤트 생성/조회/수정/삭제 + 이미지 업로드 |
| Phase 2     | 참여자 관리 + 공지/댓글          | 1.5주   | 참여 신청/승인/거절/출석 체크 + 공지/댓글 소통                |
| Phase 3     | 카풀 기능                        | 1주     | 카풀 등록/탑승 신청/승인/거절/취소 + 잔여 좌석                |
| Phase 4     | 정산 + 관리자 대시보드           | 1.5주   | 1/N 균등 정산 + 관리자 KPI 대시보드                           |
| Phase 5     | 프로필 + UX + 보안               | 1주     | 프로필 관리, 반응형, 로딩/에러 처리, 접근 제어                |
| Phase 6     | 성능 최적화 + 런칭 준비          | 1주     | 빌드 검증, SEO, Vercel 배포, E2E 검증                         |

---

## 2. 페이즈 전체 요약

### Phase 0의 위치와 역할

Phase 0은 전체 프로젝트의 **최초 진입점**으로, 모든 후속 Phase의 전제 조건이 되는 환경, DB 스키마, 레이아웃을 준비하는 단계입니다. 이 Phase가 완료되지 않으면 이벤트 CRUD(Phase 1), 참여자 관리(Phase 2) 등 핵심 기능 구현이 불가능합니다.

### Phase 0 목표

모든 후속 Phase의 전제 조건이 되는 환경, DB 스키마, 레이아웃을 준비합니다.

### 완료 기준 (Definition of Done)

- TailwindCSS v4가 정상 동작하며 기존 shadcn/ui 컴포넌트 스타일이 유지됨
- `profiles` 테이블에 `role` 컬럼이 존재하고, `name` 컬럼으로 리네이밍 완료
- `events` 테이블이 생성되고 RLS 정책이 적용됨
- `event_category`, `participation_status`, `carpool_request_status` ENUM 타입이 생성됨
- 3개 레이아웃 라우트 그룹(`(participant)`, `(host)`, `admin`)이 렌더링됨
- 미들웨어에서 `/admin/*` 경로에 대한 role 기반 접근 제어가 동작함
- 루트 페이지에서 역할별 리디렉션이 동작함

### 주요 산출물 (Deliverables)

- TailwindCSS v4 환경 + 추가 shadcn/ui 컴포넌트
- DB 마이그레이션 2건 (profiles 정비, events 생성)
- 업데이트된 TypeScript 타입 (`types/database.types.ts`)
- 미들웨어 admin 접근 제어 로직
- 루트 페이지 역할별 리디렉션
- 3개 역할별 레이아웃 (참여자 하단 탭, 주최자 하단 탭, 관리자 사이드바+GNB)

### 다음 Phase에 미치는 영향

- **Phase 1:** events 테이블(TASK-004)과 TypeScript 타입(TASK-005)이 이벤트 CRUD의 기반
- **Phase 2:** ENUM 타입(TASK-003)과 events 테이블이 participations/posts 테이블의 전제 조건
- **Phase 1~4:** 레이아웃 라우트 그룹(TASK-008~010)이 모든 페이지의 공통 프레임

---

## 3. 이전 Phase 완료 여부 및 진행된 작업

Phase 0은 프로젝트의 첫 번째 Phase이므로 이전 Phase는 존재하지 않습니다.

### 현재까지 구현 완료된 항목 (Phase 0 진입 전제 조건)

Phase 0 진입 전 이미 구현 완료된 기능들은 다음과 같습니다:

- **인증 시스템:** 이메일/비밀번호 회원가입, 로그인, Google OAuth, 비밀번호 재설정, 로그아웃 (`app/auth/*`)
- **Supabase 클라이언트:** browser/server/proxy 3종 클라이언트 구성 완료 (`lib/supabase/`)
- **미들웨어:** 쿠키 기반 세션 관리, 비인증 사용자 리디렉션 (`proxy.ts`)
- **기본 shadcn/ui 컴포넌트:** button, card, badge, checkbox, dropdown-menu, input, label (`components/ui/`)
- **코드 품질 도구:** ESLint, Prettier, Husky + lint-staged, Knip 설정 완료
- **패키지:** react-hook-form, zod, date-fns, recharts, lucide-react 설치됨

### 현재 미구현 / Placeholder 상태 (Phase 0에서 해결해야 할 항목)

- **루트 페이지 (`app/page.tsx`):** Supabase 스타터 템플릿 기본 페이지 — 역할별 리디렉션 로직 없음
- **DB 스키마:** `profiles` 테이블만 존재, `role` 컬럼 없음, `full_name` 컬럼 사용 중 (PRD에서는 `name`으로 명세)
- **라우팅 구조:** `(host)/*`, `(participant)/*`, `admin/*` 라우트 그룹 전혀 없음
- **레이아웃:** 모바일 하단 탭, 관리자 사이드바/GNB 없음
- **TailwindCSS:** v3 사용 중 (PRD에서 v4 명세)
- **미들웨어 admin 접근 제어:** `/admin/*` 경로에 대한 role 기반 리디렉션 없음

---

## 4. Phase 0 액션 아이템

### Task 의존성 다이어그램

```
TASK-001 (TailwindCSS v4)
  └─→ TASK-002 (shadcn/ui 컴포넌트)
        ├─→ TASK-008 (참여자 레이아웃)
        │     └─→ TASK-009 (주최자 레이아웃)
        └─→ TASK-010 (관리자 레이아웃)

TASK-003 (profiles 마이그레이션)
  ├─→ TASK-004 (events 테이블)
  │     └─→ TASK-005 (타입 재생성) ← TASK-003도 의존
  ├─→ TASK-006 (미들웨어 admin 접근 제어)
  │     └─→ TASK-007 (루트 페이지 리디렉션) ← TASK-003도 의존
  └─→ TASK-005 (타입 재생성)
```

### 권장 실행 순서

1. **병렬 트랙 A (프론트엔드):** TASK-001 → TASK-002 → TASK-008 → TASK-009 / TASK-010 (병렬)
2. **병렬 트랙 B (데이터):** TASK-003 → TASK-004 → TASK-005
3. **통합:** TASK-006 → TASK-007 (트랙 B 완료 후)

---

### TASK-001: TailwindCSS v3 에서 v4 업그레이드

**예상 시간:** 3h
**의존성:** 없음

#### 설명

현재 프로젝트는 TailwindCSS v3을 사용하고 있으며, PRD 명세에 따라 v4로 업그레이드해야 합니다. v4는 CSS 파일 기반 설정으로 전환되어 `tailwind.config.ts` 파일이 제거되고, `globals.css`에서 `@import "tailwindcss"` 지시어를 사용합니다.

#### 기술 요구사항

- TailwindCSS v4 및 PostCSS 플러그인 설치: `npm install tailwindcss@next @tailwindcss/postcss@next`
- `tailwind.config.ts` 파일 삭제 (v4에서는 CSS 파일 기반 설정 사용)
- `postcss.config.mjs`에서 TailwindCSS PostCSS 플러그인 설정 업데이트
- `app/globals.css` 최상단에 `@import "tailwindcss"` 적용
- 기존 `@tailwind base`, `@tailwind components`, `@tailwind utilities` 지시어 제거
- shadcn/ui 테마 변수 및 커스텀 스타일이 v4 문법에 맞게 마이그레이션

#### 구현 단계

1. TailwindCSS v4 패키지 설치
2. `tailwind.config.ts`의 설정 내용을 `globals.css`의 CSS 기반 설정으로 이전
3. `postcss.config.mjs` 업데이트
4. `globals.css`에서 `@tailwind` 지시어를 `@import "tailwindcss"`로 교체
5. shadcn/ui CSS 변수 및 테마 설정이 v4에서 정상 동작하는지 확인
6. `npm run dev` 실행하여 기존 스타일 정상 렌더링 검증
7. `npm run build` 실행하여 빌드 성공 확인

#### 완료 기준

- `npm run dev`에서 기존 스타일이 정상 렌더링됨
- `tailwind.config.ts` 파일이 삭제됨
- CSS 파일 기반 설정으로 전환 완료
- 기존 shadcn/ui 컴포넌트(button, card, badge, checkbox, dropdown-menu, input, label)가 정상 동작
- `npm run build` 성공

#### 예상 파일 변경

- `package.json` — TailwindCSS v4 의존성 업데이트
- `postcss.config.mjs` — PostCSS 플러그인 설정 변경
- `tailwind.config.ts` — 삭제
- `app/globals.css` — `@import "tailwindcss"` 적용, 기존 지시어 제거, CSS 변수 마이그레이션

#### 기술적 주의사항

- v3에서 v4로 전환 시 기존 shadcn/ui 컴포넌트 스타일이 깨질 수 있음. 업그레이드 후 모든 기존 UI 컴포넌트의 스타일을 수동 검증 필요
- shadcn/ui의 `components.json` 설정이 v4와 호환되는지 확인
- CSS 변수 기반 테마(`--background`, `--foreground` 등)가 v4 문법으로 올바르게 변환되었는지 확인

---

### TASK-002: 추가 shadcn/ui 컴포넌트 설치

**예상 시간:** 1h
**의존성:** TASK-001 (TailwindCSS v4 업그레이드 완료 필요)

#### 설명

후속 Phase에서 사용할 추가 shadcn/ui 컴포넌트를 사전 설치합니다. 기존에 설치된 button, card, badge, checkbox, dropdown-menu, input, label 외에 textarea, select, separator, tabs, avatar, toast, skeleton, dialog, sheet 컴포넌트를 추가합니다.

#### 기술 요구사항

- shadcn CLI를 사용하여 컴포넌트 설치: `npx shadcn@latest add textarea select separator tabs avatar toast skeleton dialog sheet`
- 설치된 컴포넌트가 TailwindCSS v4 환경에서 정상 렌더링되는지 확인
- `components/ui/` 디렉토리에 자동 생성된 파일은 직접 수정 금지 (shadcn 규칙)

#### 구현 단계

1. TailwindCSS v4 환경이 정상 동작하는지 확인 (TASK-001 완료 전제)
2. `npx shadcn@latest add textarea select separator tabs avatar toast skeleton dialog sheet` 실행
3. 설치된 각 컴포넌트의 import 및 렌더링 테스트
4. `npm run build` 실행하여 빌드 성공 확인

#### 완료 기준

- `components/ui/` 디렉토리에 textarea, select, separator, tabs, avatar, toast, skeleton, dialog, sheet 파일이 추가됨
- 각 컴포넌트가 import 가능하고 렌더링 시 스타일이 정상 적용됨
- `npm run build` 성공

#### 예상 파일 변경

- `components/ui/textarea.tsx` — 자동 생성
- `components/ui/select.tsx` — 자동 생성
- `components/ui/separator.tsx` — 자동 생성
- `components/ui/tabs.tsx` — 자동 생성
- `components/ui/avatar.tsx` — 자동 생성
- `components/ui/toast.tsx` (및 관련 파일) — 자동 생성
- `components/ui/skeleton.tsx` — 자동 생성
- `components/ui/dialog.tsx` — 자동 생성
- `components/ui/sheet.tsx` — 자동 생성

---

### TASK-003: Migration 001 — profiles 스키마 정비 + ENUM 타입 생성

**예상 시간:** 3h
**의존성:** 없음

#### 설명

기존 `profiles` 테이블의 스키마를 PRD 명세에 맞게 정비합니다. 역할 기반 접근 제어를 위한 `role` 컬럼을 추가하고, `full_name` 컬럼을 `name`으로 리네이밍합니다. 또한 후속 Phase에서 사용할 ENUM 타입들을 사전 생성합니다.

#### 기술 요구사항

- Supabase 마이그레이션 SQL 파일 작성
- `profiles` 테이블에 `role TEXT DEFAULT 'user'` 컬럼 추가
- `full_name` 컬럼을 `name`으로 리네이밍 (`ALTER TABLE profiles RENAME COLUMN full_name TO name`)
- PostgreSQL ENUM 타입 생성:
  - `event_category`: 생일파티, 파티모임, 워크샵, 스터디, 운동스포츠, 기타
  - `participation_status`: pending, approved, rejected
  - `carpool_request_status`: pending, approved, rejected
- 모든 변경은 트랜잭션 내에서 실행하여 원자성 보장
- 기존 `profiles` 데이터 보존 필수

#### 구현 단계

1. Supabase CLI로 새 마이그레이션 파일 생성: `npx supabase migration new profiles_schema_and_enums`
2. `event_category` ENUM 타입 생성 SQL 작성
3. `participation_status` ENUM 타입 생성 SQL 작성
4. `carpool_request_status` ENUM 타입 생성 SQL 작성
5. `profiles` 테이블에 `role TEXT DEFAULT 'user'` 컬럼 추가 SQL 작성
6. `full_name` → `name` 리네이밍 SQL 작성 (`ALTER TABLE profiles RENAME COLUMN full_name TO name`)
7. 기존 데이터에 대한 `role` 기본값 설정 확인
8. 마이그레이션 적용 및 검증

#### 완료 기준

- `profiles` 테이블에 `role TEXT DEFAULT 'user'` 컬럼이 존재
- `profiles` 테이블의 `full_name` 컬럼이 `name`으로 변경됨
- `event_category`, `participation_status`, `carpool_request_status` ENUM 타입이 PostgreSQL에 생성됨
- 기존 `profiles` 데이터가 보존됨 (기존 행의 `role` 값은 `'user'`로 설정)
- 마이그레이션이 오류 없이 적용됨

#### 예상 파일 변경

- `supabase/migrations/YYYYMMDDHHMMSS_profiles_schema_and_enums.sql` — 새 마이그레이션 파일

#### 기술적 주의사항

- `full_name` → `name` 리네이밍 시 기존 데이터 유실이 발생하지 않도록 `ALTER TABLE ... RENAME COLUMN` 사용 (DROP + ADD가 아닌)
- `role` 컬럼 부재 시 인증 시스템 전체가 동작하지 않으므로 반드시 성공 확인
- 기존 코드에서 `full_name`을 참조하는 부분이 있다면 `name`으로 변경 필요 (코드 검색 필요)
- Supabase Dashboard 또는 CLI로 마이그레이션 적용

---

### TASK-004: Migration 002 — events 테이블 생성 + RLS

**예상 시간:** 2h
**의존성:** TASK-003 (ENUM 타입 생성 필요)

#### 설명

이벤트 데이터를 저장할 `events` 테이블을 생성하고, Row Level Security(RLS) 정책을 적용합니다. 이 테이블은 Phase 1의 이벤트 CRUD 기능의 기반이 됩니다.

#### 기술 요구사항

- `events` 테이블 생성 (PRD 명세 기반 컬럼 구성):
  - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `host_id` UUID REFERENCES `profiles(id)` ON DELETE CASCADE — 주최자
  - `title` TEXT NOT NULL — 이벤트 제목
  - `description` TEXT — 이벤트 설명
  - `category` event_category NOT NULL — 카테고리 (TASK-003에서 생성한 ENUM)
  - `event_date` TIMESTAMPTZ NOT NULL — 이벤트 일시
  - `location` TEXT — 장소
  - `max_participants` INTEGER — 최대 참여 인원
  - `cover_image_url` TEXT — 커버 이미지 URL
  - `is_public` BOOLEAN DEFAULT true — 공개 여부
  - `created_at` TIMESTAMPTZ DEFAULT now()
  - `updated_at` TIMESTAMPTZ DEFAULT now()
- RLS 정책 설정:
  - SELECT: 공개 이벤트(`is_public = true`)는 모든 인증 사용자 조회 가능
  - SELECT: 비공개 이벤트는 주최자(`host_id = auth.uid()`)만 조회 가능
  - INSERT: 인증된 사용자만 생성 가능, `host_id = auth.uid()` 강제
  - UPDATE: 주최자(`host_id = auth.uid()`)만 수정 가능
  - DELETE: 주최자(`host_id = auth.uid()`)만 삭제 가능
- `events(host_id)` 인덱스 생성
- `updated_at` 자동 갱신 트리거 설정

#### 구현 단계

1. Supabase CLI로 새 마이그레이션 파일 생성: `npx supabase migration new create_events_table`
2. `events` 테이블 CREATE TABLE SQL 작성
3. `host_id` 인덱스 생성 SQL 작성
4. `updated_at` 자동 갱신 트리거 함수 및 트리거 생성
5. RLS 활성화 (`ALTER TABLE events ENABLE ROW LEVEL SECURITY`)
6. SELECT/INSERT/UPDATE/DELETE RLS 정책 SQL 작성
7. 마이그레이션 적용 및 검증

#### 완료 기준

- `events` 테이블이 생성되고 모든 컬럼이 PRD 명세와 일치
- RLS 정책이 적용되어 공개 이벤트 조회 / 주최자 CRUD가 올바르게 동작
- `host_id` 인덱스 존재
- `updated_at` 트리거 동작

#### 예상 파일 변경

- `supabase/migrations/YYYYMMDDHHMMSS_create_events_table.sql` — 새 마이그레이션 파일

---

### TASK-005: TypeScript 타입 재생성

**예상 시간:** 30m
**의존성:** TASK-003 (profiles 스키마 변경), TASK-004 (events 테이블 생성)

#### 설명

TASK-003과 TASK-004에서 변경/생성된 DB 스키마를 TypeScript 타입에 반영합니다. Supabase CLI의 타입 생성 명령어를 실행하여 `types/database.types.ts` 파일을 재생성합니다.

#### 기술 요구사항

- `npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.types.ts` 실행
- 생성된 타입에 다음 항목이 포함되는지 확인:
  - `profiles` 테이블의 `role`, `name` 컬럼 타입
  - `events` 테이블 전체 컬럼 타입
  - `event_category`, `participation_status`, `carpool_request_status` ENUM 타입

#### 구현 단계

1. TASK-003, TASK-004 마이그레이션이 적용된 상태 확인
2. `npx supabase gen types` 명령어 실행
3. `types/database.types.ts` 파일이 올바르게 업데이트되었는지 확인
4. `npm run type-check` 실행하여 기존 코드와의 호환성 확인

#### 완료 기준

- `types/database.types.ts`에 새 테이블(`events`)과 ENUM 타입이 반영됨
- `profiles` 테이블 타입에 `role`, `name` 필드가 포함됨
- `npm run type-check` 통과 (기존 코드에서 `full_name` 참조가 있다면 `name`으로 수정 필요)

#### 예상 파일 변경

- `types/database.types.ts` — Supabase CLI 자동 재생성 (직접 수정 금지, CLI 출력으로 덮어쓰기)

#### 기술적 주의사항

- `types/database.types.ts`는 자동생성 파일이므로 직접 수정하지 않음
- `full_name` → `name` 변경으로 인해 기존 코드에서 타입 오류가 발생할 수 있음. `npm run type-check`로 확인 후 참조 코드 수정 필요

---

### TASK-006: 미들웨어 admin 접근 제어 추가

**예상 시간:** 2h
**의존성:** TASK-003 (profiles 테이블에 role 컬럼 필요)

#### 설명

기존 미들웨어(`lib/supabase/proxy.ts`)에 admin 역할 기반 접근 제어 로직을 추가합니다. `/admin/*` 경로에 접근하는 사용자의 `role`을 DB에서 조회하여, `admin`이 아닌 경우 홈 페이지로 리디렉션합니다.

#### 기술 요구사항

- `lib/supabase/proxy.ts`의 `updateSession()` 함수 확장
- `/admin/*` 경로 패턴 매칭
- 세션에서 `user.id` 추출 후 `profiles` 테이블에서 `role` 조회
- `role !== 'admin'`인 경우 `/` (홈)으로 리디렉션
- `role === 'admin'`인 경우 정상 통과
- 비인증 사용자는 기존 로직대로 `/auth/login`으로 리디렉션 (이미 구현됨)

#### 구현 단계

1. `lib/supabase/proxy.ts` 파일의 `updateSession()` 함수 분석
2. `/admin/*` 경로 감지 로직 추가
3. Supabase server 클라이언트로 `profiles` 테이블에서 현재 사용자의 `role` 조회
4. `role !== 'admin'`인 경우 `NextResponse.redirect()` 반환
5. 에러 처리 (DB 조회 실패 시 안전한 리디렉션)
6. 테스트: admin 계정으로 `/admin` 접근 → 통과 / 일반 사용자로 접근 → 홈 리디렉션

#### 완료 기준

- `/admin/*` 경로 접근 시 DB에서 `role`을 조회하여 `admin`이 아닌 경우 `/`로 리디렉션
- `role = 'admin'`인 사용자는 `/admin/*` 경로에 정상 접근 가능
- 비인증 사용자 리디렉션 로직(기존)과 충돌 없이 동작
- DB 조회 실패 시 안전하게 홈으로 리디렉션

#### 예상 파일 변경

- `lib/supabase/proxy.ts` — admin 접근 제어 로직 추가

#### 기술적 주의사항

- 미들웨어에서 Supabase 클라이언트를 사용할 때 `proxy.ts`의 기존 패턴을 따를 것
- 매 요청마다 DB 조회가 발생하므로 성능 영향 고려 (MVP 단계에서는 허용 가능)
- `updateSession()` 함수의 기존 세션 갱신 로직을 깨뜨리지 않도록 주의

---

### TASK-007: 루트 페이지 역할별 리디렉션 구현

**예상 시간:** 1h
**의존성:** TASK-003 (role 컬럼 필요), TASK-006 (admin 접근 제어 미들웨어 필요)

#### 설명

현재 Supabase 스타터 템플릿 기본 페이지인 `app/page.tsx`를 역할별 리디렉션 로직으로 교체합니다. 사용자의 로그인 상태와 역할에 따라 적절한 페이지로 리디렉션합니다.

#### 기술 요구사항

- `app/page.tsx`를 Server Component로 구현
- Supabase server 클라이언트(`lib/supabase/server.ts`)로 현재 세션 확인
- 리디렉션 로직:
  - 비로그인 사용자 → `/auth/login`
  - `role = 'admin'` → `/admin`
  - `role = 'user'` (또는 기타) → `/discover`
- `redirect()` 함수 사용 (Next.js `next/navigation`)

#### 구현 단계

1. `app/page.tsx` 기존 내용 교체
2. Supabase server 클라이언트로 `auth.getUser()` 호출
3. 사용자가 없으면 `/auth/login`으로 `redirect()`
4. `profiles` 테이블에서 `role` 조회
5. `role` 값에 따라 `/admin` 또는 `/discover`로 `redirect()`

#### 완료 기준

- 비로그인 사용자가 `/`에 접근하면 `/auth/login`으로 리디렉션
- `role = 'admin'`인 사용자가 `/`에 접근하면 `/admin`으로 리디렉션
- `role = 'user'`인 사용자가 `/`에 접근하면 `/discover`로 리디렉션
- 기존 Supabase 스타터 템플릿 페이지가 제거됨

#### 예상 파일 변경

- `app/page.tsx` — 역할별 리디렉션 로직으로 전면 교체

---

### TASK-008: 참여자 레이아웃 + 하단 탭 내비게이션 구축

**예상 시간:** 3h
**의존성:** TASK-001 (TailwindCSS v4), TASK-002 (shadcn/ui 컴포넌트)

#### 설명

참여자 역할의 모바일 중심 레이아웃을 구축합니다. `(participant)` 라우트 그룹을 생성하고, 하단 탭 내비게이션과 상단 헤더를 포함하는 레이아웃을 구현합니다. 하단 탭 컴포넌트는 주최자 레이아웃(TASK-009)에서 재사용됩니다.

#### 기술 요구사항

- `app/(participant)/layout.tsx` — 참여자 라우트 그룹 레이아웃 (Server Component)
- `components/mobile/mobile-bottom-nav.tsx` — 하단 탭 내비게이션 (Client Component, `'use client'`)
  - 탭 항목: 탐색(`/discover`), 참여중(`/my-events`), 카풀(`/carpools`), 프로필(`/profile`)
  - `usePathname()`으로 현재 경로 감지하여 활성 탭 하이라이트
  - lucide-react 아이콘 사용
  - 모바일 최적화: 하단 고정, safe area 대응
- `components/mobile/mobile-header.tsx` — 상단 헤더 바
  - 페이지 제목 표시
  - 간결한 상단 바 디자인

#### 구현 단계

1. `app/(participant)/` 디렉토리 생성
2. `app/(participant)/layout.tsx` 작성 — children을 감싸는 레이아웃, 하단 탭 + 상단 헤더 포함
3. `components/mobile/mobile-bottom-nav.tsx` 작성 — 탭 항목 배열 정의, `usePathname()` 활용, 활성 상태 스타일링
4. `components/mobile/mobile-header.tsx` 작성 — 상단 바 UI
5. 참여자 라우트 그룹 내 placeholder 페이지 생성 (최소 하나, 예: `app/(participant)/discover/page.tsx`)
6. 하단 탭 전환 시 라우트 이동 검증
7. 모바일 뷰포트(375px)에서 레이아웃 렌더링 확인

#### 완료 기준

- `app/(participant)/` 라우트 그룹이 존재하고 레이아웃이 렌더링됨
- 하단 탭에 탐색/참여중/카풀/프로필 4개 항목이 표시됨
- `usePathname()`으로 현재 경로에 해당하는 탭이 활성 상태로 하이라이트됨
- 상단 헤더 바가 표시됨
- 모바일 뷰포트에서 레이아웃이 정상 렌더링됨

#### 예상 파일 변경

- `app/(participant)/layout.tsx` — 새 파일 생성
- `components/mobile/mobile-bottom-nav.tsx` — 새 파일 생성
- `components/mobile/mobile-header.tsx` — 새 파일 생성
- `app/(participant)/discover/page.tsx` — placeholder 페이지 (선택)

#### 기술적 주의사항

- `mobile-bottom-nav.tsx`는 `usePathname()` 사용을 위해 반드시 `'use client'` 지시어 필요
- 하단 탭의 탭 항목 배열을 props로 받도록 설계하여 주최자 레이아웃(TASK-009)에서 재사용 가능하도록 구현
- `cn()` 유틸리티를 사용하여 Tailwind 클래스 결합
- 시맨틱 색상 변수 사용 (`bg-primary`, `text-muted-foreground` 등)

---

### TASK-009: 주최자 레이아웃 + 하단 탭 내비게이션 구축

**예상 시간:** 2h
**의존성:** TASK-008 (mobile-bottom-nav 컴포넌트 재사용)

#### 설명

주최자 역할의 모바일 중심 레이아웃을 구축합니다. `(host)` 라우트 그룹을 생성하고, TASK-008에서 구현한 `mobile-bottom-nav` 컴포넌트를 재사용하되, 주최자 전용 탭 항목으로 구성합니다.

#### 기술 요구사항

- `app/(host)/layout.tsx` — 주최자 라우트 그룹 레이아웃 (Server Component)
- TASK-008에서 구현한 `mobile-bottom-nav.tsx` 재사용
  - 탭 항목: 홈(`/home`), 내이벤트(`/events`), 만들기(`/events/new`), 프로필(`/profile`)
  - 탭 항목 배열을 props로 전달하여 참여자와 다른 탭 구성 적용
- `mobile-header.tsx` 재사용

#### 구현 단계

1. `app/(host)/` 디렉토리 생성
2. `app/(host)/layout.tsx` 작성 — 주최자 전용 탭 항목 배열을 `mobile-bottom-nav`에 전달
3. 주최자 라우트 그룹 내 placeholder 페이지 생성 (최소 하나, 예: `app/(host)/home/page.tsx`)
4. 하단 탭 전환 시 라우트 이동 검증

#### 완료 기준

- `app/(host)/` 라우트 그룹이 존재하고 레이아웃이 렌더링됨
- 하단 탭에 홈/내이벤트/만들기/프로필 4개 항목이 표시됨
- `mobile-bottom-nav` 컴포넌트가 참여자/주최자 양쪽에서 재사용됨
- 상단 헤더 바가 표시됨

#### 예상 파일 변경

- `app/(host)/layout.tsx` — 새 파일 생성
- `app/(host)/home/page.tsx` — placeholder 페이지 (선택)

---

### TASK-010: 관리자 레이아웃 구축 (GNB + 사이드바)

**예상 시간:** 3h
**의존성:** TASK-001 (TailwindCSS v4), TASK-002 (shadcn/ui 컴포넌트)

#### 설명

관리자 역할의 데스크탑 중심 레이아웃을 구축합니다. `admin` 라우트에 좌측 사이드바와 상단 GNB(Global Navigation Bar)를 포함하는 레이아웃을 구현합니다. 관리자 뷰는 데스크탑(1280px+)에 최적화됩니다.

#### 기술 요구사항

- `app/admin/layout.tsx` — 관리자 라우트 레이아웃 (Server Component)
- `components/admin/admin-sidebar.tsx` — 좌측 사이드바 (Client Component)
  - 메뉴 항목: 대시보드(`/admin`), 이벤트 관리(`/admin/events`), 사용자 관리(`/admin/users`)
  - `usePathname()`으로 활성 메뉴 하이라이트
  - lucide-react 아이콘 사용
  - 고정 너비 사이드바, 데스크탑 최적화
- `components/admin/admin-header.tsx` — 상단 GNB
  - 서비스 로고/타이틀
  - 관리자 프로필 정보 (아바타, 이름)
  - 로그아웃 버튼

#### 구현 단계

1. `app/admin/` 디렉토리 확인 (이미 존재할 수 있음)
2. `app/admin/layout.tsx` 작성 — 사이드바 + GNB + main content 영역 구성
3. `components/admin/admin-sidebar.tsx` 작성 — 메뉴 항목 배열, 활성 상태 스타일링
4. `components/admin/admin-header.tsx` 작성 — 상단 GNB UI
5. 관리자 라우트 내 placeholder 페이지 생성 (예: `app/admin/page.tsx`)
6. 데스크탑(1280px+) 뷰포트에서 레이아웃 렌더링 검증

#### 완료 기준

- `app/admin/` 라우트에 좌측 사이드바 + 상단 GNB가 렌더링됨
- 사이드바에 대시보드/이벤트 관리/사용자 관리 3개 메뉴가 표시됨
- `usePathname()`으로 현재 경로에 해당하는 메뉴가 활성 상태로 하이라이트됨
- 데스크탑(1280px+)에서 레이아웃이 최적화되어 표시됨
- GNB에 서비스 타이틀과 관리자 정보가 표시됨

#### 예상 파일 변경

- `app/admin/layout.tsx` — 새 파일 생성 (또는 기존 파일 수정)
- `components/admin/admin-sidebar.tsx` — 새 파일 생성
- `components/admin/admin-header.tsx` — 새 파일 생성
- `app/admin/page.tsx` — placeholder 페이지 (선택)

#### 기술적 주의사항

- `admin-sidebar.tsx`와 `admin-header.tsx`는 `usePathname()` 사용을 위해 `'use client'` 지시어 필요
- 관리자 레이아웃은 모바일 대응이 필수는 아니지만, 최소한의 반응형 처리 권장 (사이드바 축소/숨김)
- shadcn/ui의 `sheet` 컴포넌트를 활용하여 모바일에서 사이드바를 드로어로 구현하는 것도 고려 가능
- `cn()` 유틸리티 사용, 시맨틱 색상 변수 사용

---

## 5. 코딩 컨벤션 및 기술 표준

Phase 0의 모든 Task를 구현할 때 다음 규칙을 준수해야 합니다:

- **언어:** 코드 주석은 한국어, 변수명/함수명은 영어 camelCase
- **경로:** `@/` 절대 경로 별칭 사용
- **컴포넌트:** Server Component 기본, `'use client'`는 인터랙션(hooks) 필요 시만 사용
- **스타일:** `cn()` 유틸리티로 Tailwind 클래스 결합, 시맨틱 색상 사용 (`bg-primary`, `text-destructive` 등)
- **shadcn/ui:** `components/ui/`는 자동생성 파일이므로 직접 수정 금지, `className` 오버라이드로 커스터마이징
- **코드 품질:** 변경 후 `npm run type-check` → `npm run lint` → `npm run build` 순서로 검증
- **Prettier:** 세미콜론 사용, 쌍따옴표, trailing comma, 80자 줄바꿈
- **DB 타입:** `types/database.types.ts`는 Supabase CLI로 자동생성, 직접 수정 금지

---

## 6. 위험 요소 (Risks)

| 위험 요소                                                          | 영향도 | 완화 방안                                                           |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------- |
| TailwindCSS v4 마이그레이션 시 기존 shadcn/ui 스타일 깨짐          | 높음   | 업그레이드 후 모든 기존 UI 컴포넌트 스타일 수동 검증                |
| profiles 마이그레이션 시 `full_name` → `name` 리네이밍 데이터 손실 | 높음   | `ALTER TABLE ... RENAME COLUMN` 사용, 트랜잭션 내 실행              |
| `full_name` 참조 코드 누락 수정                                    | 중간   | 타입 재생성(TASK-005) 후 `npm run type-check`로 모든 참조 오류 확인 |
| 미들웨어 DB 조회 성능                                              | 낮음   | MVP 단계에서는 허용 가능, 추후 캐싱 고려                            |
