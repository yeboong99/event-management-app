# Phase 5: 프로필 + 사용자 경험 + 보안 (Profile + UX + Security)

**생성일:** 2026-03-28
**대상 Phase:** Phase 5
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
- **스토리지:** `lib/supabase/storage.ts` — 이벤트 커버 이미지 업로드/삭제 유틸 (Supabase Storage `event-covers` 버킷)
- **인증:** 쿠키 기반 세션 관리 (`@supabase/ssr`), 미들웨어에서 매 요청 세션 체크
- **라우트 구조:** `(app)` 통합 라우트 그룹 (주최자/참여자 통합), `admin` 별도 라우트
- **DB 타입:** `types/database.types.ts` — Supabase CLI 자동생성

### 전체 Phase 목록

| Phase       | 제목                                                      | 상태          |
| ----------- | --------------------------------------------------------- | ------------- |
| Phase 0     | 기반 설정 (Foundation Setup)                              | 완료          |
| Phase 1     | 데이터 레이어 + 이벤트 CRUD                               | 완료          |
| Phase 2     | 참여자 관리 + 공지/댓글 (Participation + Posts)           | 완료          |
| Phase 3     | 카풀 기능 (Carpool)                                       | 완료          |
| Phase 4     | 정산 + 관리자 대시보드 (Settlement + Admin)               | 완료          |
| **Phase 5** | **프로필 + 사용자 경험 + 보안 (Profile + UX + Security)** | **진행 예정** |
| Phase 6     | 성능 최적화 + 런칭 준비 (Performance + Launch)            | 미착수        |

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

Phase 5는 Phase 0~4에서 구축된 핵심 비즈니스 기능(이벤트 CRUD, 참여자 관리, 카풀, 정산, 관리자 대시보드) 위에 **사용자 프로필 관리**, **사용자 경험 개선(로딩/빈 상태/에러 처리)**, **보안 강화(접근 제어/비밀번호 변경/회원 탈퇴)**를 구축하는 단계입니다. MVP의 비즈니스 로직은 Phase 4까지 완성되었으며, Phase 5는 서비스 품질과 안정성을 높이는 마감 단계입니다.

### 현재 Phase의 목표

프로필 관리(닉네임/아바타 수정, 비밀번호 변경, 회원 탈퇴) + 로딩 스켈레톤/빈 상태 UI/에러 바운더리 + 반응형 디자인 검증 + 접근 제어 강화

### 완료 기준 (Definition of Done)

- 프로필 페이지에서 닉네임과 아바타를 수정할 수 있음
- Supabase Storage `avatars` 버킷에 프로필 이미지가 업로드/삭제됨
- 비밀번호 변경 페이지에서 새 비밀번호를 설정할 수 있음 (Google OAuth 전용 계정은 UI 비노출)
- 회원 탈퇴 시 확인 다이얼로그 → Auth + profiles 삭제 → 로그인 페이지 리디렉션
- 재사용 가능한 빈 상태 컴포넌트가 모든 목록 페이지에 적용됨
- 주요 페이지에 `loading.tsx` 스켈레톤 UI가 추가됨
- 각 라우트 그룹별 `error.tsx`가 추가되어 사용자 친화적 에러 메시지와 재시도 버튼이 표시됨
- 모바일(375px), 태블릿(768px), 데스크탑(1280px+) 반응형 검증 통과
- 이벤트 상세/편집/관리 페이지에서 `host_id !== auth.uid()` 시 접근 차단 동작
- 카풀/정산 탭에서 미승인 참여자 접근 차단 동작

### 주요 산출물 (Deliverables)

1. 프로필 관리 페이지 (프로필 수정, 아바타 업로드)
2. 비밀번호 변경 페이지 + Server Action
3. 회원 탈퇴 페이지 + Server Action
4. 빈 상태 공통 컴포넌트 (`components/shared/empty-state.tsx`)
5. 로딩 스켈레톤 (`loading.tsx`) 파일들
6. 에러 바운더리 (`error.tsx`, `not-found.tsx`) 파일들
7. 반응형 디자인 보정
8. 접근 제어 강화 (주최자 뷰 + 참여자 뷰)

### 이전 Phase와의 연관성

- Phase 0~4의 모든 핵심 기능(이벤트 CRUD, 참여자 관리, 카풀, 정산, 관리자)이 구현된 상태에서 UX/보안 품질을 높임
- `profiles` 테이블(Phase 0), `participations` 테이블(Phase 2), Supabase Storage(Phase 1)를 기반으로 프로필 기능 구현
- `isEventHost()`, `isApprovedParticipant()` 헬퍼 함수(Phase 2)를 접근 제어 강화에 활용

### 다음 Phase에 미치는 영향

- Phase 6(성능 최적화 + 런칭 준비)에서 E2E 시나리오 검증, 빌드 검증, SEO, Vercel 배포를 진행하기 위한 전제 조건
- Phase 5 완료 시 모든 기능이 구현되고 UX/보안 수준이 런칭 기준을 충족해야 함

---

## 3. 이전 Phase 완료 여부 및 진행된 작업

### Phase 0: 기반 설정 — 완료

- TailwindCSS v3 → v4 마이그레이션 완료
- `profiles` 테이블 `role` 컬럼 추가, `name` 리네이밍
- `(app)` 통합 라우트 그룹 + 하단 5탭 내비게이션 구축
- 미들웨어 admin 접근 제어, 역할별 리디렉션 구현
- 관리자 레이아웃(사이드바 + GNB) 구축

### Phase 1: 데이터 레이어 + 이벤트 CRUD — 완료

- `events` 테이블 + RLS 정책 + 인덱스 생성
- 이벤트 CRUD Server Actions (`actions/events.ts`)
- Supabase Storage `event-covers` 버킷 + 이미지 업로드 유틸 (`lib/supabase/storage.ts`)
- 이벤트 생성/상세/수정/삭제 페이지, 탐색 페이지 (카테고리 필터)
- 내 활동 페이지 (주최 중 / 참여 중 탭), 초대 링크 복사

### Phase 2: 참여자 관리 + 공지/댓글 — 완료

- `participations`, `posts` 테이블 + RLS + 인덱스
- `approve_participation` RPC 함수 (동시성 제어)
- 참여 신청/승인/거절/취소/출석 토글 Server Actions
- 공지/댓글 CRUD + 페이지네이션 Server Actions
- `isEventHost()`, `isApprovedParticipant()` 권한 헬퍼 함수
- 참여자 관리 UI (상태별 필터, 승인/거절, 출석 토글)
- 게시판 UI (공지 피드, 댓글 피드, 인라인 수정)
- 접근 제한 안내 컴포넌트 (`AccessRestrictedNotice`)

### Phase 3: 카풀 기능 — 완료

- `carpools`, `carpool_requests` 테이블 + RLS + 인덱스
- `approve_carpool_request` RPC 함수 (좌석 동시성 제어)
- 카풀 등록/삭제/탑승 신청/승인/거절/취소 Server Actions
- 카풀 관리 탭 (이벤트 상세 내 통합), 탑승 신청 폼
- 내 카풀 현황 페이지 (탑승 신청 / 내가 등록한 카풀 탭)

### Phase 4: 정산 + 관리자 대시보드 — 완료

- `settlement_items` 테이블 + RLS + 인덱스
- 1/N 균등 정산 알고리즘 (`lib/settlement.ts`) — `Math.floor` + 나머지 보정
- 정산 CRUD Server Actions + 정산 관리/현황 페이지
- 관리자 대시보드 KPI 카드 4개 + 월별 이벤트 Bar 차트 (Recharts) + 최근 가입자 테이블
- 관리자 이벤트 관리 (데이터 테이블 + 카테고리 필터 + 페이지네이션)
- 관리자 사용자 관리 (역할 변경, 검색, 페이지네이션)

### 이월 항목 / 기술 부채

- 프로필 페이지는 현재 placeholder만 존재 (`app/(app)/profile/page.tsx`에 제목만 표시)
- `actions/auth.ts` 파일 미존재 — 비밀번호 변경/회원 탈퇴 Server Action 신규 작성 필요
- `loading.tsx`, `error.tsx` 파일 미존재 — 모든 라우트 그룹에 신규 작성 필요
- `components/shared/empty-state.tsx` 미존재 — 각 목록 페이지에서 인라인으로 빈 상태 처리 중
- `app/not-found.tsx` 존재하나 커스터마이징 필요 여부 확인

### Phase 5 진입 전제 조건 충족 여부

- **충족됨.** Phase 0~4의 모든 TASK(TASK-001 ~ TASK-049)가 완료 상태이며, 핵심 기능이 모두 구현됨.

---

## 4. Phase 5 액션 아이템

### Task 1: 프로필 Zod 스키마 + 타입 정의 + 아바타 Storage 유틸

**TASK ID:** TASK-050-A
**의존성:** 없음
**권장 실행 순서:** 1번째 (다른 프로필 관련 태스크의 기반)
**예상 시간:** 2h
**서브에이전트:** `[nextjs-supabase-fullstack]`

**상세 설명:**
프로필 수정 폼에 사용할 Zod 검증 스키마, 프로필 도메인 타입, 그리고 아바타 이미지 업로드/삭제를 위한 Supabase Storage 유틸리티를 구현합니다.

**구현 요구사항:**

1. **Zod 스키마 정의** (`lib/validations/profile.ts`)
   - `updateProfileSchema`: `name` (string, 1~30자, trim), `username` (string, optional, 2~20자, 영소문자/숫자/언더스코어만)
   - `changePasswordSchema`: `currentPassword` (string, 6자 이상), `newPassword` (string, 6자 이상), `confirmPassword` — `newPassword`와 일치 검증 (`.refine()`)
   - `deleteAccountSchema`: `confirmation` (string, "탈퇴합니다" 일치 검증)

2. **도메인 타입 정의** (`types/profile.ts`)
   - `ProfileData`: `id`, `email`, `name`, `username`, `avatar_url`, `role`, `created_at`
   - `UpdateProfileInput`: Zod 스키마에서 `z.infer<>` 추출

3. **아바타 Storage 유틸 확장** (`lib/supabase/storage.ts`)
   - 기존 `event-covers` 버킷 유틸과 동일 패턴으로 `avatars` 버킷용 함수 추가
   - `uploadAvatarImage(file: File, userId: string): Promise<string>` — 파일 경로: `{userId}/{timestamp}_{sanitizedFileName}`
   - `deleteAvatarImage(avatarUrl: string): Promise<void>` — 기존 아바타 삭제
   - Supabase Storage에 `avatars` 버킷이 존재해야 함 (public 버킷)

**완료 기준:**

- `lib/validations/profile.ts`에 3개 Zod 스키마 정의됨
- `types/profile.ts`에 프로필 관련 타입 정의됨
- `lib/supabase/storage.ts`에 아바타 업로드/삭제 함수 추가됨
- `npm run type-check` 통과

**기술적 고려사항:**

- 아바타 업로드는 기존 `uploadEventCoverImage` 패턴을 참고하되, 버킷명과 경로 구조만 변경
- Supabase 대시보드에서 `avatars` 버킷을 public으로 생성하고 RLS 정책 설정 필요 (인증된 사용자 본인 경로만 업로드/삭제 가능)

---

### Task 2: 프로필 관리 Server Actions

**TASK ID:** TASK-050-B
**의존성:** Task 1 (TASK-050-A)
**권장 실행 순서:** 2번째
**예상 시간:** 3h
**서브에이전트:** `[nextjs-supabase-fullstack]`

**상세 설명:**
프로필 조회, 수정, 아바타 업로드를 처리하는 Server Actions를 구현합니다.

**구현 요구사항:**

1. **Server Actions 파일 생성** (`actions/profile.ts`)
   - `getProfile()`: 현재 로그인 사용자의 profiles 데이터 조회 (Server Component에서 호출)
   - `updateProfile(formData: FormData)`: 닉네임, 아바타 이미지 수정
     - Zod 서버 검증 (`updateProfileSchema`)
     - 아바타 이미지 파일이 포함된 경우: 기존 아바타 삭제 → 새 아바타 업로드 → `avatar_url` 업데이트
     - 아바타 제거 요청 시: 기존 아바타 삭제 → `avatar_url = null`
     - `supabase.from('profiles').update({ name, avatar_url }).eq('id', userId)`
     - `revalidatePath('/profile')` 호출
     - 성공/실패 결과를 `ActionResult<T>` 타입으로 반환

2. **Provider 정보 확인 유틸** (`actions/profile.ts` 내 또는 별도 헬퍼)
   - `getAuthProvider()`: `supabase.auth.getUser()`에서 `user.app_metadata.provider` 확인
   - `'google'`인 경우 비밀번호 관련 기능 비노출 플래그 반환

**완료 기준:**

- `actions/profile.ts`에 `getProfile`, `updateProfile`, `getAuthProvider` 함수 구현됨
- 프로필 수정 시 DB 업데이트 + Storage 아바타 처리 + 경로 재검증 동작
- 에러 처리: 인증 실패, DB 오류, Storage 업로드 실패 시 적절한 에러 메시지 반환

**예상 파일:**

- `actions/profile.ts` (신규)

---

### Task 3: 프로필 페이지 UI 구현

**TASK ID:** TASK-050-C
**의존성:** Task 2 (TASK-050-B)
**권장 실행 순서:** 3번째
**예상 시간:** 4h

**상세 설명:**
기존 placeholder 프로필 페이지를 실제 프로필 관리 기능으로 교체합니다. Server Component에서 프로필 데이터를 페칭하고, Client Component 폼에서 수정 기능을 제공합니다.

**구현 요구사항:**

1. **프로필 페이지** (`app/(app)/profile/page.tsx`) — `[nextjs-supabase-fullstack]`
   - Server Component로 `getProfile()` + `getAuthProvider()` 호출
   - 데이터를 `ProfileContent` Client Component에 전달

2. **프로필 콘텐츠 Client Component** (`components/forms/profile-form.tsx`) — `[nextjs-ui-markup]` + `[nextjs-supabase-fullstack]`
   - 아바타 이미지 표시 (Avatar 컴포넌트 활용) + 이미지 변경/제거 버튼
   - 아바타 클릭 또는 "변경" 버튼 → 파일 선택 다이얼로그 (`input[type="file"]`)
   - 닉네임 입력 필드 (React Hook Form + Zod 클라이언트 검증)
   - 이메일 표시 (수정 불가, `disabled` input)
   - 역할 표시 (Badge 컴포넌트: `user` → "일반 사용자", `admin` → "관리자")
   - 가입일 표시
   - **저장하기** 버튼 → `updateProfile` Server Action 호출
   - 성공/실패 토스트 표시 (sonner)

3. **프로필 설정 메뉴 영역** — `[nextjs-ui-markup]`
   - 비밀번호 변경 링크 (OAuth 전용 계정은 비노출)
   - 회원 탈퇴 링크 (`text-destructive` 스타일)
   - 로그아웃 버튼 (기존 `LogoutButton` 컴포넌트 활용)

**완료 기준:**

- 프로필 페이지에서 아바타 업로드/제거, 닉네임 수정이 동작함
- 이메일은 읽기 전용으로 표시됨
- Google OAuth 계정은 비밀번호 변경 링크가 표시되지 않음
- 수정 성공/실패 시 토스트 메시지 표시

**예상 파일:**

- `app/(app)/profile/page.tsx` (수정)
- `components/forms/profile-form.tsx` (신규)

---

### Task 4: 비밀번호 변경 기능

**TASK ID:** TASK-051
**의존성:** Task 1 (TASK-050-A), Task 3 (TASK-050-C)
**권장 실행 순서:** 4번째
**예상 시간:** 3h

**상세 설명:**
비밀번호 변경 전용 페이지와 Server Action을 구현합니다. Google OAuth 전용 계정(비밀번호 없음)은 이 페이지에 접근할 수 없도록 처리합니다.

**구현 요구사항:**

1. **Server Action** (`actions/auth.ts`) — `[nextjs-supabase-fullstack]`
   - `changePassword(formData: FormData)`: Zod 서버 검증 (`changePasswordSchema`) → `supabase.auth.updateUser({ password: newPassword })` 호출
   - 현재 비밀번호 재확인: `supabase.auth.signInWithPassword({ email, password: currentPassword })`로 검증 후 새 비밀번호 설정
   - 성공 시 `revalidatePath('/profile')` + 성공 `ActionResult` 반환
   - 실패 시 적절한 에러 메시지 (현재 비밀번호 불일치, 비밀번호 정책 위반 등)

2. **비밀번호 변경 페이지** (`app/(app)/profile/change-password/page.tsx`) — `[nextjs-supabase-fullstack]`
   - Server Component에서 `getAuthProvider()` 확인 → OAuth 전용이면 프로필로 리디렉션
   - `ChangePasswordForm` Client Component에 위임

3. **비밀번호 변경 폼** (`components/forms/change-password-form.tsx`) — `[nextjs-ui-markup]` + `[nextjs-supabase-fullstack]`
   - 현재 비밀번호 입력 (type="password")
   - 새 비밀번호 입력 (type="password")
   - 새 비밀번호 확인 입력 (type="password")
   - React Hook Form + Zod 클라이언트 검증
   - **비밀번호 변경** 버튼 → `changePassword` Server Action 호출
   - 성공 토스트 + 프로필 페이지로 리디렉션
   - 실패 시 인라인 에러 표시

**완료 기준:**

- 현재 비밀번호 확인 → 새 비밀번호 설정 흐름이 동작함
- 새 비밀번호와 확인 비밀번호 불일치 시 클라이언트 검증 에러 표시
- 현재 비밀번호 틀린 경우 서버 에러 메시지 표시
- Google OAuth 계정은 이 페이지에 접근 시 프로필 페이지로 리디렉션됨
- 성공 시 토스트 + `/profile`로 이동

**예상 파일:**

- `actions/auth.ts` (신규)
- `app/(app)/profile/change-password/page.tsx` (신규)
- `components/forms/change-password-form.tsx` (신규)

---

### Task 5: 회원 탈퇴 기능

**TASK ID:** TASK-052
**의존성:** Task 2 (TASK-050-B)
**권장 실행 순서:** 4번째 (Task 4와 병렬 가능)
**예상 시간:** 3h

**상세 설명:**
회원 탈퇴 전용 페이지와 Server Action을 구현합니다. 비가역 작업이므로 확인 절차를 강화합니다.

**구현 요구사항:**

1. **Server Action** (`actions/auth.ts`) — `[nextjs-supabase-fullstack]`
   - `deleteAccount(formData: FormData)`: Zod 서버 검증 (`deleteAccountSchema`) → `supabase.auth.admin.deleteUser(userId)` 호출
   - `SUPABASE_SERVICE_ROLE_KEY` 환경 변수 필요 — `createClient`와 별도로 service role 클라이언트 생성
   - `auth.users` 삭제 시 CASCADE로 `profiles`, `participations`, `posts` 등 관련 데이터 자동 삭제
   - 성공 시 세션 쿠키 삭제 → `/auth/login` 리디렉션

2. **회원 탈퇴 페이지** (`app/(app)/profile/delete-account/page.tsx`) — `[nextjs-supabase-fullstack]`
   - Server Component에서 현재 사용자의 주최 이벤트 존재 여부 확인
   - 주최 이벤트가 있는 경우 경고 문구 표시 (이벤트 삭제 또는 양도 권장)
   - `DeleteAccountForm` Client Component에 위임

3. **회원 탈퇴 폼** (`components/forms/delete-account-form.tsx`) — `[nextjs-ui-markup]` + `[nextjs-supabase-fullstack]`
   - 탈퇴 경고 메시지 (비가역 경고, `text-destructive` 강조)
   - 주최 이벤트 존재 시 경고 목록 표시
   - "탈퇴합니다" 텍스트 입력 확인 필드 (Zod 검증)
   - **계정 삭제** 버튼 (`variant="destructive"`) → 확인 다이얼로그 → `deleteAccount` Server Action 호출
   - 확인 다이얼로그에서 최종 확인 후 실행

**완료 기준:**

- "탈퇴합니다" 입력 + 확인 다이얼로그 후 계정 삭제 동작
- `auth.users` 삭제 → CASCADE로 관련 데이터 모두 삭제됨
- 삭제 후 세션 종료 → 로그인 페이지로 리디렉션
- 주최 중인 이벤트 존재 시 경고 문구 표시 (탈퇴 자체는 차단하지 않음)

**기술적 고려사항:**

- `supabase.auth.admin.deleteUser()`는 service role key가 필요하므로 서버 사이드에서만 호출 가능
- service role 클라이언트 생성: `createServerClient(url, serviceRoleKey, { cookies })` 또는 `createClient(url, serviceRoleKey)` 패턴 확인 필요
- `events` 테이블의 `host_id`는 `profiles(id)` FK ON DELETE CASCADE이므로, 프로필 삭제 시 주최 이벤트도 삭제됨 — 이를 사용자에게 명확히 안내

**예상 파일:**

- `actions/auth.ts` (Task 4와 공유)
- `app/(app)/profile/delete-account/page.tsx` (신규)
- `components/forms/delete-account-form.tsx` (신규)

---

### Task 6: 빈 상태 UI 컴포넌트 통합

**TASK ID:** TASK-053
**의존성:** 없음 (독립 작업)
**권장 실행 순서:** 1번째 (다른 태스크와 병렬 가능)
**예상 시간:** 2h

**상세 설명:**
재사용 가능한 빈 상태 컴포넌트를 생성하고, 기존에 인라인으로 구현된 빈 상태 UI를 이 컴포넌트로 통합합니다.

**구현 요구사항:**

1. **빈 상태 컴포넌트** (`components/shared/empty-state.tsx`) — `[nextjs-ui-markup]`
   - Props: `icon` (Lucide 아이콘 컴포넌트, optional), `title` (string), `description` (string, optional), `action` (ReactNode, optional — CTA 버튼 등)
   - 디자인: 센터 정렬, 아이콘 (muted 색상, 48px), 제목 (semibold), 설명 (muted-foreground), 액션 버튼
   - 반응형: 모바일에서도 적절한 여백과 크기

2. **기존 빈 상태 UI 교체** — `[nextjs-supabase-fullstack]`
   - `app/(app)/discover/page.tsx` — 이벤트 없을 때
   - `app/(app)/my-events/page.tsx` — 주최 중/참여 중 이벤트 없을 때
   - `app/(app)/carpools/page.tsx` — 카풀 신청/등록 없을 때
   - `app/(app)/events/[eventId]/page.tsx` — 참여자 목록, 게시판, 카풀, 정산 각 탭 빈 상태

**완료 기준:**

- `EmptyState` 컴포넌트가 `icon`, `title`, `description`, `action` props를 받아 렌더링됨
- 모든 주요 목록 페이지에서 데이터 없을 때 `EmptyState` 컴포넌트가 사용됨
- 각 빈 상태에 맥락에 맞는 아이콘과 메시지 표시 (예: 탐색 페이지는 "아직 등록된 이벤트가 없습니다", 카풀 페이지는 "신청한 카풀이 없습니다")

**예상 파일:**

- `components/shared/empty-state.tsx` (신규)
- 기존 목록 페이지 파일들 (수정)

---

### Task 7: 로딩 스켈레톤 + Suspense 경계 추가

**TASK ID:** TASK-054
**의존성:** 없음 (독립 작업)
**권장 실행 순서:** 1번째 (다른 태스크와 병렬 가능)
**예상 시간:** 4h

**상세 설명:**
주요 라우트에 `loading.tsx` 파일을 추가하여 페이지 전환 시 스켈레톤 로딩 UI를 표시합니다. 필요한 경우 페이지 내부에 `<Suspense>` 경계를 설정하여 부분 로딩을 지원합니다.

**구현 요구사항:**

1. **라우트별 loading.tsx 생성** — `[nextjs-ui-markup]`
   - `app/(app)/discover/loading.tsx` — 2열 이벤트 카드 스켈레톤 그리드 (6~8개)
   - `app/(app)/my-events/loading.tsx` — 탭 + 카드 리스트 스켈레톤
   - `app/(app)/events/[eventId]/loading.tsx` — 이벤트 상세 스켈레톤 (커버 이미지 + 정보 영역)
   - `app/(app)/carpools/loading.tsx` — 카풀 카드 리스트 스켈레톤
   - `app/(app)/profile/loading.tsx` — 프로필 정보 스켈레톤
   - `app/admin/loading.tsx` — KPI 카드 + 차트 스켈레톤
   - `app/admin/events/loading.tsx` — 데이터 테이블 스켈레톤
   - `app/admin/users/loading.tsx` — 데이터 테이블 스켈레톤

2. **스켈레톤 컴포넌트 활용**
   - shadcn/ui의 `Skeleton` 컴포넌트 (`components/ui/skeleton.tsx`) 활용
   - 실제 페이지 레이아웃과 유사한 형태로 스켈레톤 배치
   - 카드 스켈레톤: 이미지 영역 (aspect-video) + 텍스트 라인 2~3개
   - 테이블 스켈레톤: 헤더 + 행 5~10개

3. **Suspense 경계** — `[nextjs-supabase-fullstack]`
   - 이벤트 상세 페이지에서 탭 콘텐츠(참여자/게시판/카풀/정산)를 `<Suspense>` 로 감싸기
   - 관리자 대시보드에서 KPI 카드/차트/테이블을 `<Suspense>`로 감싸기 (각각 독립 로딩)

**완료 기준:**

- 모든 주요 라우트에 `loading.tsx` 파일이 존재하고 페이지 전환 시 스켈레톤이 표시됨
- 스켈레톤 UI가 실제 페이지 레이아웃과 유사한 형태를 보여줌
- 이벤트 상세와 관리자 대시보드에서 부분 Suspense가 적용됨

**예상 파일:**

- `app/(app)/discover/loading.tsx` (신규)
- `app/(app)/my-events/loading.tsx` (신규)
- `app/(app)/events/[eventId]/loading.tsx` (신규)
- `app/(app)/carpools/loading.tsx` (신규)
- `app/(app)/profile/loading.tsx` (신규)
- `app/admin/loading.tsx` (신규)
- `app/admin/events/loading.tsx` (신규)
- `app/admin/users/loading.tsx` (신규)
- 이벤트 상세, 관리자 대시보드 페이지 파일 (수정 — Suspense 추가)

---

### Task 8: 에러 바운더리 추가

**TASK ID:** TASK-055
**의존성:** 없음 (독립 작업)
**권장 실행 순서:** 1번째 (다른 태스크와 병렬 가능)
**예상 시간:** 2h

**상세 설명:**
각 라우트 그룹별 `error.tsx`를 추가하여 런타임 에러 발생 시 사용자 친화적 에러 페이지를 표시합니다. 전역 `not-found.tsx`도 커스터마이징합니다.

**구현 요구사항:**

1. **라우트별 error.tsx 생성** — `[nextjs-ui-markup]`
   - `app/(app)/error.tsx` — 일반 사용자 에러 페이지
   - `app/admin/error.tsx` — 관리자 에러 페이지
   - 공통 구조: `'use client'` 필수 (Error Boundary는 Client Component), `error.message` 표시, **다시 시도** 버튼 (`reset()` 호출), **홈으로** 링크
   - 디자인: 중앙 정렬, 에러 아이콘 (AlertCircle 등), 에러 메시지, 재시도/홈 버튼

2. **전역 not-found.tsx 커스터마이징** (`app/not-found.tsx`) — `[nextjs-ui-markup]`
   - 기존 파일 확인 후 프로젝트 스타일에 맞게 수정
   - "페이지를 찾을 수 없습니다" 메시지 + 홈으로 돌아가기 링크
   - 404 숫자를 시각적으로 강조

**완료 기준:**

- `app/(app)/error.tsx`, `app/admin/error.tsx`가 생성되어 런타임 에러 시 사용자 친화적 UI 표시
- error.tsx에 "다시 시도" 버튼과 "홈으로" 링크가 포함됨
- `app/not-found.tsx`가 프로젝트 디자인에 맞게 커스터마이징됨

**예상 파일:**

- `app/(app)/error.tsx` (신규)
- `app/admin/error.tsx` (신규)
- `app/not-found.tsx` (수정)

---

### Task 9: 반응형 디자인 검증 및 보정

**TASK ID:** TASK-056
**의존성:** Phase 1~4 완료 (현재 충족), Task 3 (프로필 페이지), Task 6~8 (UI 개선 태스크)
**권장 실행 순서:** 5번째 (UI 작업 완료 후)
**예상 시간:** 3h
**서브에이전트:** `[nextjs-ui-markup]`

**상세 설명:**
모든 페이지를 3개 뷰포트(모바일 375px, 태블릿 768px, 데스크탑 1280px+)에서 검증하고 레이아웃 깨짐을 보정합니다.

**구현 요구사항:**

1. **모바일 (375px) 검증** — 주요 경로 우선
   - 하단 5탭 내비게이션이 화면 하단에 고정되어 있는지
   - 이벤트 카드 2열 그리드가 정상 렌더링되는지
   - 이벤트 상세 페이지 탭 전환이 정상 동작하는지
   - 프로필 페이지 아바타 + 폼이 적절히 배치되는지
   - 카풀/정산 탭 내용이 스크롤 가능한지
   - 폼 입력 필드가 충분한 터치 영역을 가지는지

2. **태블릿 (768px) 검증**
   - 카드 그리드가 2열 이상으로 확장되는지 (또는 2열 유지가 적절한지)
   - 이벤트 상세 페이지 레이아웃 깨짐 없는지
   - 관리자 페이지 사이드바가 적절히 처리되는지 (축소 또는 오버레이)

3. **데스크탑 (1280px+) 검증**
   - 관리자 사이드바 + 메인 콘텐츠 레이아웃 정상 표시
   - KPI 카드 4열 그리드, 차트 + 테이블 2열 레이아웃
   - 데이터 테이블 컬럼 표시/숨김 정상 동작

**완료 기준:**

- 3개 뷰포트에서 주요 페이지 레이아웃 깨짐 없음
- 터치 영역(44px+) 및 가독성 확보
- 발견된 문제점 수정 완료

---

### Task 10: 주최자 뷰 접근 제어 강화

**TASK ID:** TASK-057
**의존성:** Phase 1~4 완료 (현재 충족)
**권장 실행 순서:** 5번째 (기능 구현 완료 후)
**예상 시간:** 2h
**서브에이전트:** `[nextjs-supabase-fullstack]`

**상세 설명:**
이벤트 수정/삭제 등 주최자 전용 기능에 대해 `host_id` 검증을 강화합니다. 현재 RLS 정책이 1차 방어선이지만, 페이지 레벨에서도 명시적 접근 제어를 추가합니다.

**구현 요구사항:**

1. **이벤트 수정 페이지 접근 제어** (`app/(app)/events/[eventId]/edit/page.tsx`)
   - Server Component에서 이벤트 조회 후 `event.host_id !== user.id` 시 `/discover`로 리디렉션 또는 `notFound()` 호출
   - 기존 `isEventHost()` 헬퍼 함수 활용

2. **이벤트 상세 페이지 주최자 액션 보호** (`app/(app)/events/[eventId]/page.tsx`)
   - 수정/삭제 버튼이 `isHost` 조건에 따라 렌더링되는지 재검증
   - 정산 확정 버튼, 참여자 승인/거절 버튼 등 주최자 전용 액션의 조건부 렌더링 확인

3. **Server Action 레벨 검증 강화** (`actions/events.ts`, `actions/settlements.ts`)
   - `updateEvent`, `deleteEvent`에서 `host_id` 검증이 이미 있는지 확인, 없으면 추가
   - 정산 관련 액션에서 주최자 또는 작성자 검증 확인

**완료 기준:**

- 비주최자가 이벤트 수정 페이지 URL 직접 접근 시 리디렉션 또는 404 처리됨
- 비주최자가 Server Action 직접 호출 시 에러 반환됨
- 주최자 전용 UI 요소가 비주최자에게 노출되지 않음

**예상 파일:**

- `app/(app)/events/[eventId]/edit/page.tsx` (수정)
- `app/(app)/events/[eventId]/page.tsx` (검증/수정)
- `actions/events.ts` (검증/수정)
- `actions/settlements.ts` (검증/수정)

---

### Task 11: 참여자 뷰 접근 제어 강화

**TASK ID:** TASK-058
**의존성:** Phase 2 완료 (현재 충족)
**권장 실행 순서:** 5번째 (Task 10과 병렬 가능)
**예상 시간:** 2h
**서브에이전트:** `[nextjs-supabase-fullstack]`

**상세 설명:**
이벤트 상세 페이지의 카풀/정산/게시판 탭에서 미승인 참여자의 접근을 페이지 레벨에서 강화합니다.

**구현 요구사항:**

1. **이벤트 상세 페이지 탭 접근 제어** (`app/(app)/events/[eventId]/page.tsx`)
   - 카풀 탭, 정산 탭 콘텐츠 렌더링 시 `isApproved` 조건 재검증
   - 미승인 참여자가 탭 접근 시 `AccessRestrictedNotice` 컴포넌트 표시

2. **Server Action 레벨 검증** (`actions/carpools.ts`, `actions/settlements.ts`)
   - 카풀 등록/신청, 정산 항목 CRUD에서 승인된 참여자 또는 주최자 검증이 있는지 확인
   - 기존 `isApprovedParticipant()` 헬퍼 활용

3. **게시판 탭 접근 제어**
   - 댓글 작성은 승인된 참여자만 가능한지 확인
   - 공지 작성은 주최자만 가능한지 확인
   - 미승인 참여자는 게시판 읽기도 제한되어야 하는지 기존 정책 확인 후 적용

**완료 기준:**

- 미승인 참여자가 카풀/정산/게시판 탭 접근 시 적절한 접근 차단 UI 표시
- Server Action 직접 호출 시에도 권한 검증 동작
- RLS 정책과 페이지 레벨 접근 제어가 일관되게 동작

**예상 파일:**

- `app/(app)/events/[eventId]/page.tsx` (검증/수정)
- `actions/carpools.ts` (검증/수정)
- `actions/settlements.ts` (검증/수정)
- `actions/posts.ts` (검증/수정)

---

## 5. Task 간 의존성 요약 및 권장 실행 순서

```
[독립 작업 — 병렬 가능]
├── Task 1: 프로필 스키마 + 타입 + Storage 유틸  (TASK-050-A)
├── Task 6: 빈 상태 UI 컴포넌트 통합             (TASK-053)
├── Task 7: 로딩 스켈레톤 + Suspense             (TASK-054)
└── Task 8: 에러 바운더리                         (TASK-055)

[Task 1 완료 후]
└── Task 2: 프로필 Server Actions                 (TASK-050-B)
    └── Task 3: 프로필 페이지 UI                  (TASK-050-C)
        ├── Task 4: 비밀번호 변경                 (TASK-051)
        └── Task 5: 회원 탈퇴                     (TASK-052)

[모든 기능 구현 완료 후]
├── Task 9: 반응형 디자인 검증                    (TASK-056)
├── Task 10: 주최자 뷰 접근 제어 강화             (TASK-057)
└── Task 11: 참여자 뷰 접근 제어 강화             (TASK-058)
```

---

## 6. 위험 요소 (Risks)

| 위험 요소                  | 설명                                                           | 완화 방안                                                               |
| -------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 반응형 보정 범위           | 모든 페이지에 걸친 반응형 보정이 예상보다 시간 소요 가능       | 주요 경로(이벤트 탐색 → 상세 → 참여)에 우선 집중                        |
| Service Role Key           | 회원 탈퇴 시 `admin.deleteUser()` 호출에 service role key 필요 | `SUPABASE_SERVICE_ROLE_KEY` 환경 변수 설정 확인, 서버 사이드에서만 사용 |
| 아바타 Storage 설정        | `avatars` 버킷이 Supabase에 미존재 시 업로드 실패              | Supabase 대시보드에서 사전 버킷 생성 + RLS 정책 설정                    |
| OAuth 계정 비밀번호 변경   | Google OAuth 전용 계정에 비밀번호 변경 노출 시 혼란            | `app_metadata.provider` 확인으로 OAuth 계정 판별, UI 비노출             |
| 빈 상태 컴포넌트 통합 범위 | 기존 인라인 빈 상태 UI를 모두 교체하면 많은 파일 수정 필요     | 주요 목록 페이지에 우선 적용, 이후 점진적 확대                          |
