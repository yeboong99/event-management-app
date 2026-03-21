# Phase 1: 데이터 레이어 + 이벤트 CRUD (Data Layer + Event CRUD)

**생성일:** 2026-03-21
**대상 Phase:** Phase 1
**문서 용도:** TaskMaster AI `parse-prd` 입력용 PRD

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
- **차트:** Recharts
- **배포:** Vercel
- **코드 품질:** ESLint, Prettier, Husky + lint-staged, Knip

### 아키텍처 핵심 패턴

- Server Component 기본, `'use client'`는 인터랙션 필요 시만 사용
- Server Actions: Zod 검증 → 처리 → `revalidatePath()` → `redirect()`
- Supabase 클라이언트 3종: browser(`lib/supabase/client.ts`), server(`lib/supabase/server.ts`), proxy(`lib/supabase/proxy.ts`)
- `@/` 절대 경로 별칭, `cn()` 유틸리티로 Tailwind 클래스 결합
- 한국어 주석, 한국어 커밋 메시지, 변수명/함수명은 영어 camelCase

### 전체 Phase 목록

| Phase       | 제목                            | 한 줄 요약                                                          | 상태           |
| ----------- | ------------------------------- | ------------------------------------------------------------------- | -------------- |
| Phase 0     | 기반 설정                       | TailwindCSS v4, DB 스키마, 레이아웃 라우트 그룹, 미들웨어 접근 제어 | **완료**       |
| **Phase 1** | **데이터 레이어 + 이벤트 CRUD** | **이벤트 생성/조회/수정/삭제 전체 흐름 + Storage 이미지 업로드**    | **현재 Phase** |
| Phase 2     | 참여자 관리 + 공지/댓글         | 참여 신청/승인/거절/출석 + 공지/댓글 소통 기능                      | 미착수         |
| Phase 3     | 카풀 기능                       | 카풀 등록/탑승 신청/승인/거절/취소 + 잔여 좌석                      | 미착수         |
| Phase 4     | 정산 + 관리자 대시보드          | 1/N 균등 정산 + KPI 대시보드/차트/데이터 테이블                     | 미착수         |
| Phase 5     | 프로필 + UX + 보안              | 프로필 관리, 로딩/에러 처리, 반응형, 접근 제어 강화                 | 미착수         |
| Phase 6     | 성능 최적화 + 런칭 준비         | 빌드 검증, SEO, Vercel 배포, E2E 검증                               | 미착수         |

---

## 2. Phase 1 전체 요약

### 위치 및 역할

Phase 0에서 구축한 기반(TailwindCSS v4, DB 스키마, 레이아웃, 미들웨어)을 활용하여 **이벤트 CRUD 핵심 기능**을 구현하는 단계. 플랫폼의 가장 기본적인 데이터 흐름(이벤트 생성 → 목록 조회 → 상세 조회 → 수정/삭제)을 완성한다.

### 목표

- events 테이블 기반 이벤트 생성/조회/수정/삭제 전체 흐름 구현
- Supabase Storage를 이용한 이벤트 커버 이미지 업로드
- 주최자/참여자 양쪽 뷰에서 이벤트 카드 UI 표시

### 완료 기준 (Definition of Done)

- 이벤트 CRUD 전체 흐름이 실제 DB 데이터로 동작
- 이벤트 카드 UI가 2열 그리드로 표시됨
- 주최자: 이벤트 생성 → 목록 확인 → 상세 조회 → 수정 → 삭제 전체 시나리오 동작
- 참여자: 공개 이벤트 탐색 페이지에서 카테고리 필터 + 카드 목록 동작
- `npm run build` 성공

### 주요 산출물 (Deliverables)

- Zod 스키마 및 공통 타입 (`lib/validations/event.ts`, `types/event.ts`)
- Supabase Storage 이미지 업로드 유틸리티 (`lib/supabase/storage.ts`)
- 이벤트 CRUD Server Actions (`actions/events.ts`)
- 이벤트 폼 컴포넌트 (`components/forms/event-form.tsx`)
- 이벤트 카드 컴포넌트 (`components/mobile/event-card-mobile.tsx`, `components/mobile/event-category-badge.tsx`)
- 주최자 페이지: 홈, 이벤트 목록, 생성, 상세, 수정
- 참여자 페이지: 이벤트 탐색(discover)
- 공용 컴포넌트: 확인 다이얼로그, 초대 링크 복사 버튼, 세그먼트 탭

### 이전 Phase와의 연관성

Phase 0에서 완료된 다음 항목에 직접 의존:

- `events` 테이블 + RLS (TASK-004)
- `types/database.types.ts` 타입 정의 (TASK-005)
- 주최자 레이아웃 + 하단 탭 (TASK-009)
- 참여자 레이아웃 + 하단 탭 (TASK-008)
- shadcn/ui 컴포넌트 (TASK-002)

### 다음 Phase에 미치는 영향

Phase 1에서 생성하는 이벤트 데이터와 컴포넌트는 이후 Phase의 기반:

- Phase 2: 이벤트에 참여자 관리/공지 기능을 추가 (이벤트 상세 페이지의 탭 구조 활용)
- Phase 3: 이벤트별 카풀 기능 추가
- Phase 4: 이벤트별 정산 기능 추가
- `event-card-mobile.tsx` 컴포넌트는 Phase 2의 참여 이벤트 목록에서도 재사용

---

## 3. 이전 Phase 완료 상태

### Phase 0: 기반 설정 — **완료**

| Task ID  | 제목                                  | 상태     | 비고                                                                                |
| -------- | ------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| TASK-001 | TailwindCSS v3 → v4 업그레이드        | **완료** | `globals.css` 기반 설정으로 전환 완료                                               |
| TASK-002 | 추가 shadcn/ui 컴포넌트 설치          | **완료** | textarea, select, separator, tabs, avatar, toast, skeleton, dialog, sheet 설치 완료 |
| TASK-003 | profiles 스키마 정비 + ENUM 타입 생성 | **완료** | `role` 컬럼 추가, `name` 컬럼, ENUM 타입 3종 생성 완료                              |
| TASK-004 | events 테이블 생성 + RLS              | **완료** | events 테이블 + RLS 정책 적용 완료                                                  |
| TASK-005 | TypeScript 타입 재생성                | **완료** | `types/database.types.ts`에 events, profiles, ENUM 반영 완료                        |
| TASK-006 | 미들웨어 admin 접근 제어              | **완료** | `/admin/*` role 기반 리디렉션 동작                                                  |
| TASK-007 | 루트 페이지 역할별 리디렉션           | **완료** | 비로그인→login, admin→/admin, user→/discover                                        |
| TASK-008 | 참여자 레이아웃 + 하단 탭             | **완료** | `app/(participant)/layout.tsx`, `mobile-bottom-nav.tsx`, `mobile-header.tsx`        |
| TASK-009 | 주최자 레이아웃 + 하단 탭             | **완료** | `app/(host)/layout.tsx`, mobile-bottom-nav 재사용                                   |
| TASK-010 | 관리자 레이아웃 (GNB + 사이드바)      | **완료** | `admin-sidebar.tsx`, `admin-header.tsx`                                             |

### Phase 0 완료 산출물 요약

- **DB:** `profiles` 테이블 (role, name, avatar_url 등), `events` 테이블 (title, category, event_date, host_id 등), ENUM 3종 (event_category, participation_status, carpool_request_status)
- **레이아웃:** `(participant)` 라우트 그룹 (하단 탭: 탐색/참여중/카풀/프로필), `(host)` 라우트 그룹 (하단 탭: 홈/내이벤트/만들기/프로필), `admin` 라우트 (사이드바+GNB)
- **인증/접근 제어:** 미들웨어에서 admin role 검증, 루트 페이지 역할별 리디렉션
- **UI 컴포넌트:** shadcn/ui 16종 (button, card, badge, checkbox, dropdown-menu, input, label, textarea, select, separator, tabs, avatar, sonner(toast), skeleton, dialog, sheet)
- **타입:** `types/database.types.ts`에 events, profiles, ENUM 타입 자동 생성 완료

### 이월 항목 및 기술 부채

- Supabase 스타터 템플릿 코드(tutorial, deploy-button, hero 등)가 아직 정리되지 않음 (Phase 6 TASK-062에서 처리 예정)
- `app/protected/` 라우트가 아직 존재 (Phase 6에서 삭제 예정)

### Phase 1 진입 전제 조건 충족 여부

- [x] events 테이블 존재 + RLS 정책 적용
- [x] TypeScript 타입 (`database.types.ts`)에 events, ENUM 반영
- [x] 주최자 레이아웃 렌더링 동작
- [x] 참여자 레이아웃 렌더링 동작
- [x] shadcn/ui 필수 컴포넌트 설치 완료

**모든 전제 조건 충족 — Phase 1 착수 가능**

---

## 4. Phase 1 액션 아이템

### Task 1: 이벤트 Zod 스키마 + 공통 타입 정의

- **ROADMAP 참조:** TASK-011
- **우선순위:** 높음 (다른 Task의 기반)
- **예상 시간:** 1h
- **의존성:** 없음 (Phase 0 TASK-005 완료 전제)
- **파일:**
  - `lib/validations/event.ts` — Zod 스키마 정의
  - `types/event.ts` — 이벤트 관련 공통 TypeScript 타입

#### 구현 요구사항

1. `lib/validations/event.ts`에 이벤트 생성/수정용 Zod 스키마 정의:
   - `eventCreateSchema`: 이벤트 생성 폼 검증용
     - `title`: 문자열, 필수, 최소 2자, 최대 100자
     - `description`: 문자열, 선택, 최대 2000자
     - `category`: `event_category` ENUM 값 중 하나 (생일파티/파티모임/워크샵/스터디/운동스포츠/기타)
     - `eventDate`: 문자열(ISO 8601), 필수, 미래 날짜 검증
     - `location`: 문자열, 선택, 최대 200자
     - `maxParticipants`: 숫자, 선택, 최소 1, 최대 999
     - `isPublic`: boolean, 기본값 true
     - `coverImageUrl`: 문자열(URL), 선택
   - `eventUpdateSchema`: 이벤트 수정 폼 검증용 (eventCreateSchema와 동일 필드, 모든 필드 optional `.partial()`)

2. `types/event.ts`에 공통 타입 정의:
   - `EventCategory` 타입: `database.types.ts`의 `event_category` ENUM에서 파생
   - `EventFormData`: Zod 스키마에서 `z.infer`로 파생한 폼 데이터 타입
   - `EventWithHost`: events Row + host profile 정보(name, avatar_url)를 포함하는 조인 타입
   - `EVENT_CATEGORIES`: 카테고리 ENUM 값 배열 상수 (`["생일파티", "파티모임", "워크샵", "스터디", "운동스포츠", "기타"]`)

#### 완료 기준 (Acceptance Criteria)

- [ ] `eventCreateSchema`로 유효한 데이터 파싱 시 성공, 유효하지 않은 데이터 시 Zod 에러 반환
- [ ] `eventUpdateSchema`로 부분 업데이트 데이터 파싱 가능
- [ ] `EventCategory` 타입이 DB ENUM과 정확히 일치
- [ ] `EventWithHost` 타입이 이벤트 데이터 + 주최자 프로필 정보를 포함
- [ ] `npm run type-check` 통과

---

### Task 2: Supabase Storage 버킷 설정 + 이미지 업로드 유틸리티

- **ROADMAP 참조:** TASK-012
- **우선순위:** 높음 (이벤트 생성에 필요)
- **예상 시간:** 2h
- **의존성:** 없음 (Phase 0 TASK-005 완료 전제)
- **파일:**
  - `lib/supabase/storage.ts` — 이미지 업로드/삭제/URL 반환 유틸리티

#### 구현 요구사항

1. Supabase Storage에 `event-covers` 버킷 생성 (Supabase 대시보드 또는 마이그레이션 SQL):
   - 공개 버킷 설정 (커버 이미지는 누구나 조회 가능)
   - RLS 정책: 인증된 사용자만 업로드/삭제 가능

2. `lib/supabase/storage.ts`에 유틸리티 함수 구현:
   - `uploadEventCoverImage(file: File, eventId: string): Promise<string>` — 이미지 업로드 후 공개 URL 반환
     - 파일 경로: `event-covers/{eventId}/{timestamp}_{fileName}`
     - 파일 크기 제한: 5MB
     - 허용 MIME 타입: `image/jpeg`, `image/png`, `image/webp`
     - 업로드 실패 시 에러 throw
   - `deleteEventCoverImage(filePath: string): Promise<void>` — 기존 이미지 삭제
   - `getEventCoverImageUrl(filePath: string): string` — Storage 파일 경로로 공개 URL 생성

3. 클라이언트 사이드 파일 검증 유틸리티:
   - `validateImageFile(file: File): { valid: boolean; error?: string }` — 파일 크기/타입 사전 검증

#### 완료 기준 (Acceptance Criteria)

- [ ] `event-covers` 버킷이 Supabase Storage에 존재
- [ ] 인증된 사용자가 이미지를 업로드하면 공개 URL이 반환됨
- [ ] 5MB 초과 또는 허용되지 않은 MIME 타입 파일 업로드 시 에러 발생
- [ ] 이미지 삭제 시 Storage에서 파일이 제거됨
- [ ] `npm run type-check` 통과

---

### Task 3: Server Actions — 이벤트 CRUD 구현

- **ROADMAP 참조:** TASK-013
- **우선순위:** 높음 (모든 이벤트 페이지의 데이터 처리 기반)
- **예상 시간:** 4h
- **의존성:** Task 1 (Zod 스키마), Task 2 (이미지 업로드)
- **파일:**
  - `actions/events.ts` — 이벤트 CRUD Server Actions

#### 구현 요구사항

1. `actions/events.ts`에 다음 Server Actions 구현:
   - `createEvent(formData: FormData): Promise<ActionResult>`
     - `'use server'` 지시어 사용
     - Supabase server 클라이언트(`lib/supabase/server.ts`)로 인증 확인
     - `eventCreateSchema`로 서버 사이드 Zod 검증
     - 커버 이미지가 있으면 Storage 업로드 후 URL을 `cover_image_url`에 저장
     - `host_id`는 인증된 사용자의 `auth.uid()`로 자동 설정
     - Supabase `events` 테이블에 INSERT
     - 성공 시 `revalidatePath('/(host)/events')` 호출
     - 성공 시 `redirect(`/(host)/events/${newEventId}`)` 호출
     - 실패 시 에러 메시지를 포함한 ActionResult 반환

   - `updateEvent(eventId: string, formData: FormData): Promise<ActionResult>`
     - 인증 확인 + `host_id` === 현재 사용자 검증
     - `eventUpdateSchema`로 서버 사이드 Zod 검증
     - 커버 이미지 변경 시: 기존 이미지 삭제 → 새 이미지 업로드
     - Supabase `events` 테이블에 UPDATE
     - 성공 시 `revalidatePath` 호출 + `redirect`
     - 실패 시 에러 메시지 반환

   - `deleteEvent(eventId: string): Promise<ActionResult>`
     - 인증 확인 + `host_id` === 현재 사용자 검증
     - 커버 이미지가 있으면 Storage에서 삭제
     - Supabase `events` 테이블에서 DELETE
     - 성공 시 `revalidatePath('/(host)/events')` 호출 + `redirect('/(host)/events')`
     - 실패 시 에러 메시지 반환

   - `getEventById(eventId: string): Promise<EventWithHost | null>`
     - events 테이블에서 단일 이벤트 조회, profiles 테이블과 JOIN하여 host 정보 포함
     - 존재하지 않으면 null 반환

   - `getMyEvents(): Promise<EventWithHost[]>`
     - 현재 사용자가 host_id인 이벤트 목록 조회 (최신 순 정렬)

   - `getPublicEvents(category?: EventCategory): Promise<EventWithHost[]>`
     - `is_public = true`인 이벤트 목록 조회
     - category 필터 선택적 적용
     - 최신 순 정렬

2. `ActionResult` 타입 정의 (`types/action.ts` 또는 `actions/events.ts` 내부):
   ```typescript
   type ActionResult = {
     success: boolean;
     error?: string;
   };
   ```

#### 완료 기준 (Acceptance Criteria)

- [ ] `createEvent`로 새 이벤트 생성 시 DB에 저장되고 상세 페이지로 리디렉션
- [ ] `updateEvent`로 이벤트 수정 시 DB 업데이트 반영
- [ ] `deleteEvent`로 이벤트 삭제 시 DB에서 제거 + 커버 이미지 삭제
- [ ] 비주최자가 수정/삭제 시도 시 에러 반환
- [ ] Zod 검증 실패 시 구체적인 에러 메시지 반환
- [ ] `getPublicEvents`에 카테고리 필터 적용 시 해당 카테고리만 반환
- [ ] `npm run type-check` 통과

---

### Task 4: 이벤트 생성 페이지 (주최자)

- **ROADMAP 참조:** TASK-014
- **우선순위:** 높음
- **예상 시간:** 4h
- **의존성:** Task 3 (Server Actions), 주최자 레이아웃 (Phase 0 TASK-009)
- **파일:**
  - `app/(host)/events/new/page.tsx` — 이벤트 생성 페이지
  - `components/forms/event-form.tsx` — 이벤트 폼 컴포넌트 (생성/수정 공용)

#### 구현 요구사항

1. `components/forms/event-form.tsx` — 재사용 가능한 이벤트 폼 컴포넌트 (Client Component):
   - `'use client'` 지시어 사용
   - React Hook Form + `eventCreateSchema` 연동 (`zodResolver`)
   - 폼 필드:
     - 제목 (`Input`): 필수, placeholder "이벤트 제목을 입력하세요"
     - 카테고리 (`Select`): 필수, `EVENT_CATEGORIES` 배열로 옵션 렌더링
     - 일시 (`Input type="datetime-local"`): 필수
     - 장소 (`Input`): 선택, placeholder "장소를 입력하세요"
     - 최대 참여자 수 (`Input type="number"`): 선택, min=1
     - 설명 (`Textarea`): 선택, placeholder "이벤트에 대해 설명해주세요"
     - 커버 이미지 (파일 업로드): 선택, 이미지 미리보기 표시, `validateImageFile`으로 클라이언트 사전 검증
     - 공개/비공개 토글 (`Checkbox` 또는 커스텀 토글)
   - props:
     - `mode: 'create' | 'edit'` — 모드에 따라 버튼 텍스트 변경 ("이벤트 만들기" / "수정 완료")
     - `defaultValues?: Partial<EventFormData>` — 수정 모드에서 기존 데이터 미리 채움
     - `eventId?: string` — 수정 모드에서 이벤트 ID
   - 제출 시 `formData`를 구성하여 Server Action 호출 (`createEvent` 또는 `updateEvent`)
   - 제출 중 로딩 상태 표시 (버튼 disabled + 스피너)
   - Zod 클라이언트 검증 에러를 각 필드 아래에 표시
   - 서버 에러를 toast로 표시

2. `app/(host)/events/new/page.tsx` — 이벤트 생성 페이지 (Server Component):
   - 인증 확인 (비인증 시 리디렉션)
   - `<EventForm mode="create" />` 렌더링
   - 페이지 제목: "새 이벤트 만들기"

#### 완료 기준 (Acceptance Criteria)

- [ ] 모든 폼 필드가 정상 렌더링되고 입력 가능
- [ ] 필수 필드 미입력 시 클라이언트 검증 에러 메시지 표시
- [ ] 커버 이미지 선택 시 미리보기 표시
- [ ] 5MB 초과 이미지 선택 시 에러 메시지 표시
- [ ] 폼 제출 시 로딩 상태 표시 후 이벤트 상세 페이지로 리디렉션
- [ ] 생성된 이벤트가 DB에 정상 저장됨
- [ ] 모바일(375px) 화면에서 폼이 깨지지 않음
- [ ] `npm run type-check` 및 `npm run lint` 통과

---

### Task 5: 이벤트 상세 페이지 (주최자)

- **ROADMAP 참조:** TASK-015
- **우선순위:** 높음
- **예상 시간:** 3h
- **의존성:** Task 3 (Server Actions)
- **파일:**
  - `app/(host)/events/[eventId]/page.tsx` — 이벤트 상세 페이지

#### 구현 요구사항

1. `app/(host)/events/[eventId]/page.tsx` — Server Component:
   - `params`를 `await`하여 `eventId` 추출 (Next.js 16 규칙)
   - `getEventById(eventId)`로 이벤트 데이터 조회
   - 이벤트가 존재하지 않으면 `notFound()` 호출
   - `host_id` !== 현재 사용자인 경우 리디렉션 또는 에러 처리

2. 표시 정보:
   - 커버 이미지 (있으면 표시, 없으면 기본 플레이스홀더)
   - 이벤트 제목
   - 카테고리 배지 (색상 구분)
   - 일시 (`date-fns`로 한국어 포맷: "2026년 3월 21일 오후 3:00")
   - 장소
   - 최대 참여자 수 (Phase 2에서 현재 참여 인원 추가 예정)
   - 공개/비공개 상태
   - 설명

3. 액션 버튼:
   - "수정" 버튼 → `/(host)/events/[eventId]/edit`로 이동
   - "삭제" 버튼 → 확인 다이얼로그 (Task 7에서 구현) 후 삭제 실행

4. 하위 탭 내비게이션 (shadcn/ui `Tabs`):
   - 참여자 / 공지댓글 / 카풀 / 정산 탭 UI 구조만 구성
   - 각 탭의 실제 컨텐츠는 Phase 2~4에서 구현
   - 현재는 "준비 중입니다" 플레이스홀더 표시

#### 완료 기준 (Acceptance Criteria)

- [ ] 이벤트 정보(제목, 카테고리, 일시, 장소, 인원, 설명)가 정상 표시
- [ ] 커버 이미지가 있는 이벤트와 없는 이벤트 모두 정상 렌더링
- [ ] 수정/삭제 버튼 표시 (삭제 기능은 Task 7에서 연결)
- [ ] 하위 탭 4개가 UI 구조로 표시
- [ ] 존재하지 않는 이벤트 ID 접근 시 404 페이지 표시
- [ ] 모바일(375px) 화면에서 레이아웃 깨짐 없음

---

### Task 6: 이벤트 수정 페이지 (주최자)

- **ROADMAP 참조:** TASK-016
- **우선순위:** 중간
- **예상 시간:** 2h
- **의존성:** Task 4 (event-form 컴포넌트 재사용)
- **파일:**
  - `app/(host)/events/[eventId]/edit/page.tsx` — 이벤트 수정 페이지

#### 구현 요구사항

1. `app/(host)/events/[eventId]/edit/page.tsx` — Server Component:
   - `params`를 `await`하여 `eventId` 추출
   - `getEventById(eventId)`로 기존 이벤트 데이터 조회
   - 이벤트가 존재하지 않으면 `notFound()` 호출
   - `host_id` !== 현재 사용자인 경우 리디렉션
   - `<EventForm mode="edit" defaultValues={eventData} eventId={eventId} />` 렌더링
   - 페이지 제목: "이벤트 수정"

2. 수정 동작:
   - 기존 데이터가 모든 폼 필드에 미리 채워진 상태로 표시
   - 커버 이미지: 기존 이미지 미리보기 표시, 새 이미지 선택 시 교체
   - 수정 저장 시 `updateEvent` Server Action 호출
   - 성공 시 이벤트 상세 페이지로 리디렉션

#### 완료 기준 (Acceptance Criteria)

- [ ] 기존 이벤트 데이터가 폼에 미리 채워져 표시
- [ ] 일부 필드만 수정 후 저장 시 정상 업데이트
- [ ] 커버 이미지 교체 시 기존 이미지 삭제 + 새 이미지 업로드
- [ ] 수정 완료 후 이벤트 상세 페이지로 리디렉션
- [ ] 비주최자가 수정 페이지 접근 시 리디렉션

---

### Task 7: 이벤트 삭제 기능 + 확인 다이얼로그

- **ROADMAP 참조:** TASK-017
- **우선순위:** 중간
- **예상 시간:** 1.5h
- **의존성:** Task 5 (이벤트 상세 페이지에 통합)
- **파일:**
  - `components/shared/confirm-dialog.tsx` — 재사용 가능한 확인 다이얼로그
  - `app/(host)/events/[eventId]/page.tsx` — 삭제 버튼 연결 (기존 파일 수정)

#### 구현 요구사항

1. `components/shared/confirm-dialog.tsx` — Client Component:
   - shadcn/ui `Dialog` 기반 확인 다이얼로그
   - props:
     - `title: string` — 다이얼로그 제목
     - `description: string` — 확인 메시지
     - `confirmLabel?: string` — 확인 버튼 텍스트 (기본: "확인")
     - `cancelLabel?: string` — 취소 버튼 텍스트 (기본: "취소")
     - `variant?: 'default' | 'destructive'` — 확인 버튼 스타일
     - `onConfirm: () => void | Promise<void>` — 확인 시 실행할 콜백
     - `trigger: ReactNode` — 다이얼로그를 여는 트리거 엘리먼트
   - 확인 버튼 클릭 시 로딩 상태 표시

2. 이벤트 상세 페이지에 삭제 기능 통합:
   - 삭제 버튼 클릭 → `ConfirmDialog` 표시 ("정말 이 이벤트를 삭제하시겠습니까?")
   - 확인 클릭 → `deleteEvent` Server Action 호출
   - 삭제 성공 → 내 이벤트 목록(`/(host)/events`)으로 리디렉션
   - 삭제 실패 → toast로 에러 메시지 표시

#### 완료 기준 (Acceptance Criteria)

- [ ] 삭제 버튼 클릭 시 확인 다이얼로그 표시
- [ ] 확인 클릭 시 이벤트 삭제 + 목록 페이지로 리디렉션
- [ ] 취소 클릭 시 다이얼로그 닫힘, 이벤트 유지
- [ ] 삭제 중 로딩 상태 표시
- [ ] `ConfirmDialog`가 다른 페이지에서도 재사용 가능한 구조

---

### Task 8: 주최자 홈 페이지

- **ROADMAP 참조:** TASK-018
- **우선순위:** 중간
- **예상 시간:** 2h
- **의존성:** Task 3 (Server Actions)
- **파일:**
  - `app/(host)/home/page.tsx` — 주최자 홈 페이지

#### 구현 요구사항

1. `app/(host)/home/page.tsx` — Server Component:
   - `getMyEvents()`로 내가 만든 이벤트 목록 조회 (최근 순, 최대 5~6개)
   - 인증 확인 (비인증 시 리디렉션)

2. UI 구성:
   - 상단 인사말: "{사용자 이름}님의 이벤트" 또는 "내 이벤트 요약"
   - 이벤트 요약 카드 목록 (간결한 카드: 제목, 카테고리 배지, 날짜, 참여 현황)
   - 이벤트가 없을 때 빈 상태 UI: 아이콘 + "아직 만든 이벤트가 없습니다" 메시지 + "이벤트 만들기" 버튼
   - FAB (Floating Action Button): 화면 우하단에 "+" 버튼 → `/(host)/events/new`로 이동

3. 각 카드 클릭 시 `/(host)/events/[eventId]`로 이동

#### 완료 기준 (Acceptance Criteria)

- [ ] 내가 만든 이벤트 목록이 최신 순으로 표시
- [ ] 이벤트가 없을 때 빈 상태 UI 표시 + 이벤트 만들기 버튼 동작
- [ ] FAB 클릭 시 이벤트 생성 페이지로 이동
- [ ] 카드 클릭 시 이벤트 상세 페이지로 이동
- [ ] 모바일(375px) 화면에서 정상 표시

---

### Task 9: 내 이벤트 목록 페이지 (주최자)

- **ROADMAP 참조:** TASK-019
- **우선순위:** 중간
- **예상 시간:** 3h
- **의존성:** Task 3 (Server Actions)
- **파일:**
  - `app/(host)/events/page.tsx` — 내 이벤트 목록 페이지
  - `components/mobile/event-card-mobile.tsx` — 이벤트 카드 컴포넌트 (모바일)
  - `components/mobile/event-category-badge.tsx` — 카테고리 배지 컴포넌트

#### 구현 요구사항

1. `components/mobile/event-category-badge.tsx` — 카테고리별 색상 배지:
   - props: `category: EventCategory`
   - 카테고리별 색상 매핑 (shadcn/ui `Badge` 기반, className 오버라이드):
     - 생일파티: 핑크 계열
     - 파티모임: 보라 계열
     - 워크샵: 블루 계열
     - 스터디: 그린 계열
     - 운동스포츠: 오렌지 계열
     - 기타: 그레이 계열

2. `components/mobile/event-card-mobile.tsx` — 이벤트 카드 컴포넌트:
   - props: `event: EventWithHost`
   - shadcn/ui `Card` 기반
   - 표시 정보: 커버 이미지 썸네일 (없으면 카테고리별 기본 색상 배경), 제목, 카테고리 배지, 날짜 (상대적 표시: "3일 후", "내일" 등 — `date-fns`), 참여 현황 (Phase 2에서 추가, 현재 placeholder)
   - 카드 클릭 시 이벤트 상세 페이지로 이동 (Link 또는 onClick + router.push)

3. `app/(host)/events/page.tsx` — 내 이벤트 목록 페이지:
   - `getMyEvents()`로 이벤트 목록 조회
   - 카테고리 필터 탭 (shadcn/ui `Tabs`): 전체 / 생일파티 / 파티모임 / ... (URL searchParams 기반 필터링)
   - 2열 그리드 레이아웃으로 `EventCardMobile` 렌더링
   - 빈 상태 UI: "아직 만든 이벤트가 없습니다" + "이벤트 만들기" 버튼

#### 완료 기준 (Acceptance Criteria)

- [ ] 내가 만든 이벤트가 2열 그리드로 표시
- [ ] 카테고리 배지가 카테고리별 색상으로 표시
- [ ] 카테고리 필터 탭 선택 시 해당 카테고리 이벤트만 표시
- [ ] 이벤트 카드 클릭 시 상세 페이지로 이동
- [ ] 이벤트가 없을 때 빈 상태 UI 표시
- [ ] `event-card-mobile.tsx`가 Phase 1 이후에도 재사용 가능한 구조
- [ ] 모바일(375px) 2열 그리드 정상 표시

---

### Task 10: 이벤트 탐색 페이지 (참여자)

- **ROADMAP 참조:** TASK-020
- **우선순위:** 중간
- **예상 시간:** 3h
- **의존성:** Task 9 (event-card-mobile 재사용), 참여자 레이아웃 (Phase 0 TASK-008)
- **파일:**
  - `app/(participant)/discover/page.tsx` — 이벤트 탐색 페이지
  - `components/mobile/segment-tabs.tsx` — 세그먼트 탭 컴포넌트 (가로 스크롤)

#### 구현 요구사항

1. `components/mobile/segment-tabs.tsx` — 세그먼트 탭 컴포넌트:
   - props: `tabs: { value: string; label: string }[]`, `activeTab: string`, `onTabChange: (value: string) => void`
   - 가로 스크롤 가능한 필터 탭 (모바일에서 카테고리가 많을 경우 가로 스크롤)
   - 활성 탭 하이라이트 스타일

2. `app/(participant)/discover/page.tsx`:
   - `getPublicEvents(category?)` Server Action 호출로 공개 이벤트 목록 조회
   - 카테고리 세그먼트 탭 필터: 전체 / 생일파티 / 파티모임 / 워크샵 / 스터디 / 운동스포츠 / 기타
   - URL `searchParams`로 카테고리 필터 상태 관리 (예: `/discover?category=워크샵`)
   - 2열 그리드로 `EventCardMobile` 렌더링
   - NEW 배지: 최근 24시간 이내 생성된 이벤트에 "NEW" 배지 표시
   - 이벤트 카드 클릭 시 `/(participant)/events/[eventId]`로 이동 (Phase 2에서 상세 페이지 구현 예정, 현재는 placeholder 페이지 또는 링크만 설정)
   - 빈 상태 UI: "아직 공개된 이벤트가 없습니다"

#### 완료 기준 (Acceptance Criteria)

- [ ] 공개 이벤트가 2열 그리드로 표시
- [ ] 카테고리 세그먼트 탭이 가로 스크롤로 표시
- [ ] 카테고리 탭 선택 시 해당 카테고리 이벤트만 필터링
- [ ] 최근 24시간 이내 이벤트에 NEW 배지 표시
- [ ] 이벤트가 없을 때 빈 상태 UI 표시
- [ ] 모바일(375px) 화면에서 가로 스크롤 탭 + 2열 카드 정상 표시

---

### Task 11: 초대 링크 복사 기능

- **ROADMAP 참조:** TASK-021
- **우선순위:** 낮음
- **예상 시간:** 1h
- **의존성:** Task 5 (이벤트 상세 페이지에 배치)
- **파일:**
  - `components/shared/copy-link-button.tsx` — 링크 복사 버튼 컴포넌트

#### 구현 요구사항

1. `components/shared/copy-link-button.tsx` — Client Component:
   - props: `url: string` — 복사할 URL
   - `navigator.clipboard.writeText(url)`로 클립보드에 복사
   - 복사 전: 링크 아이콘 + "초대 링크 복사" 텍스트
   - 복사 후: 체크 아이콘 + "복사됨!" 텍스트 (2초 후 원래 상태 복원)
   - 복사 완료 시 shadcn/ui toast (sonner)로 "초대 링크가 복사되었습니다" 표시
   - 아이콘은 `lucide-react`의 `Link`, `Check` 사용

2. 이벤트 상세 페이지에 배치:
   - 이벤트 상세 페이지(`app/(host)/events/[eventId]/page.tsx`)에 초대 링크 복사 버튼 추가
   - URL 형식: `{origin}/(participant)/events/{eventId}` (참여자 뷰 URL)

#### 완료 기준 (Acceptance Criteria)

- [ ] 버튼 클릭 시 클립보드에 이벤트 URL 복사
- [ ] 복사 후 아이콘/텍스트가 변경되었다가 2초 후 복원
- [ ] toast 알림 표시
- [ ] 이벤트 상세 페이지에 버튼이 정상 배치

---

## 5. Task 의존성 및 권장 실행 순서

```
Task 1 (Zod 스키마 + 타입)
Task 2 (Storage 유틸리티)
  ↓        ↓
  └── Task 3 (Server Actions) ──┐
          ↓                      ↓
      Task 4 (생성 페이지)    Task 8 (주최자 홈)
          ↓
      Task 5 (상세 페이지) ──→ Task 7 (삭제 + 다이얼로그)
          ↓                    Task 11 (초대 링크 복사)
      Task 6 (수정 페이지)

      Task 9 (내 이벤트 목록) ──→ Task 10 (참여자 탐색)
```

### 권장 실행 순서

1. **1단계 (병렬 가능):** Task 1, Task 2
2. **2단계:** Task 3 (Task 1, 2에 의존)
3. **3단계 (병렬 가능):** Task 4, Task 5, Task 8, Task 9
4. **4단계 (병렬 가능):** Task 6 (Task 4 의존), Task 7 (Task 5 의존), Task 10 (Task 9 의존), Task 11 (Task 5 의존)

---

## 6. 기술적 고려사항

### 코딩 컨벤션

- **한국어 주석** 필수
- **변수명/함수명:** 영어 camelCase
- **절대 경로:** `@/` 별칭 사용 (예: `import { createEvent } from "@/actions/events"`)
- **클래스 결합:** `cn()` 유틸리티 사용
- **시맨틱 색상:** `bg-primary`, `text-destructive` 등
- **components/ui/** 파일 직접 수정 금지, className 오버라이드로 커스터마이징

### Server Component vs Client Component

- 페이지 컴포넌트는 기본적으로 Server Component
- `'use client'`가 필요한 경우: 폼 (React Hook Form), 이미지 미리보기, 클립보드 복사, 탭 인터랙션
- 데이터 fetching은 Server Component에서 수행하고 Client Component에 props로 전달

### Next.js 16 규칙

- `params`와 `searchParams`는 Promise → 반드시 `await` 사용
- Server Actions: `'use server'` 지시어 필수
- `revalidatePath()` + `redirect()` 패턴 준수

### Supabase 클라이언트 사용

- Server Component / Server Action: `lib/supabase/server.ts`의 `createServerClient` 사용
- Client Component: `lib/supabase/client.ts`의 `createBrowserClient` 사용
- Storage 업로드: 인증된 사용자의 세션이 필요하므로 적절한 클라이언트 선택

### 이미지 처리

- Next.js `<Image>` 컴포넌트 사용 시 Supabase Storage 도메인을 `next.config.ts`의 `images.remotePatterns`에 추가 필요
- 커버 이미지 미리보기: `URL.createObjectURL(file)`로 클라이언트 미리보기 생성

---

## 7. 위험 요소 및 완화 방안

| 위험 요소                         | 영향도 | 완화 방안                                                                      |
| --------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Supabase Storage 버킷 설정        | 중간   | 대시보드에서 수동 설정 후 코드에서 접근 확인, SQL 마이그레이션으로 자동화 가능 |
| 대용량 이미지 업로드 지연         | 낮음   | 5MB 파일 크기 제한, 클라이언트 사전 검증으로 UX 보호                           |
| next.config.ts 이미지 도메인 설정 | 낮음   | Supabase Storage URL 패턴을 remotePatterns에 추가                              |
| 카테고리 필터 URL 상태 관리       | 낮음   | searchParams 기반 필터링으로 SSR 호환성 유지                                   |
