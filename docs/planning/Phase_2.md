# Phase 2: 참여자 관리 + 공지/댓글 (Participation + Posts)

**생성일:** 2026-03-22
**대상 Phase:** Phase 2
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

| Phase       | 제목                                                  | 상태           |
| ----------- | ----------------------------------------------------- | -------------- |
| Phase 0     | 기반 설정 (Foundation Setup)                          | 완료           |
| Phase 1     | 데이터 레이어 + 이벤트 CRUD                           | 완료           |
| **Phase 2** | **참여자 관리 + 공지/댓글 (Participation + Posts)**   | **현재 Phase** |
| Phase 3     | 카풀 기능 (Carpool)                                   | 미착수         |
| Phase 4     | 정산 + 관리자 대시보드 (Settlement + Admin)           | 미착수         |
| Phase 5     | 프로필 + 사용자 경험 + 보안 (Profile + UX + Security) | 미착수         |
| Phase 6     | 성능 최적화 + 런칭 준비 (Performance + Launch)        | 미착수         |

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

Phase 2는 Phase 1에서 구현된 이벤트 CRUD 위에 **참여자 관리**(참여 신청/승인/거절/출석 체크)와 **공지/댓글 소통** 기능을 구축하는 단계입니다. 이벤트의 핵심 상호작용 레이어를 완성하여 주최자와 참여자 간의 실질적인 협업 흐름을 만듭니다.

### 현재 Phase의 목표

참여 신청 → 주최자 승인/거절 → 출석 체크 전체 흐름 동작, 공지 작성 + 댓글 피드 동작

### 완료 기준 (Definition of Done)

- participations, posts 테이블이 생성되고 RLS 정책이 적용됨
- 참여 신청 → 승인/거절 → 출석 체크 전체 흐름이 동작함
- 동시성 제어 RPC 함수로 `max_participants` 초과 승인이 방지됨
- 공지(주최자만 작성) + 댓글(승인 참여자 작성) 피드가 동작함
- 참여 상태별 필터(전체/대기/승인/거절)가 동작함
- 이벤트 상세 페이지에서 참여 신청 및 공지/댓글 조회가 가능함

### 주요 산출물 (Deliverables)

- Supabase 마이그레이션: participations 테이블, posts 테이블, `approve_participation` RPC 함수
- Server Actions: `actions/participations.ts`, `actions/posts.ts`
- Zod 스키마: `lib/validations/participation.ts`, `lib/validations/post.ts`
- 페이지: 참여자 관리 페이지, 공지/댓글 페이지, 이벤트 상세 페이지(참여자 뷰), 내가 참여한 이벤트 목록 페이지
- 컴포넌트: `participant-list`, `participant-actions`, `attendance-toggle`, `post-feed`, `post-item`, `post-form`, `participation-form`

### 이전 Phase와의 연관성

- Phase 0에서 구축한 DB 스키마(profiles, events), ENUM 타입, 레이아웃, 미들웨어를 기반으로 함
- Phase 1에서 구현한 이벤트 CRUD, Server Actions 패턴, 이벤트 카드 컴포넌트를 재사용함
- 특히 events 테이블의 `max_participants` 컬럼이 참여 승인 동시성 제어의 기준값으로 사용됨

### 다음 Phase에 미치는 영향

- Phase 3 (카풀): participations 테이블의 승인 상태를 기준으로 카풀 신청 자격이 결정됨
- Phase 4 (정산): 승인된 참여자 목록이 정산 대상 인원으로 사용됨
- Phase 5 (접근 제어): 참여 상태에 따른 뷰 접근 제어 정책의 기반이 됨

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
- DB: profiles 테이블 (role 컬럼 포함), events 테이블, ENUM 타입들
- `types/database.types.ts` — 자동생성 타입

### Phase 1: 데이터 레이어 + 이벤트 CRUD — 완료

구현된 항목:

- [x] 이벤트 Zod 스키마 + 공통 타입 정의 (`lib/validations/event.ts`, `types/event.ts`)
- [x] Supabase Storage 버킷 설정 + 이미지 업로드 유틸리티 (`lib/supabase/storage.ts`)
- [x] Server Actions — 이벤트 CRUD (`actions/events.ts`: `createEvent`, `updateEvent`, `deleteEvent`)
- [x] 이벤트 생성 페이지 (`app/(app)/events/new/page.tsx`, `components/forms/event-form.tsx`)
- [x] 이벤트 상세 페이지 (`app/(app)/events/[eventId]/page.tsx`)
- [x] 이벤트 수정 페이지 (`app/(app)/events/[eventId]/edit/page.tsx`)
- [x] 이벤트 삭제 기능 + 확인 다이얼로그 (`components/shared/confirm-dialog.tsx`)
- [x] 내 이벤트 목록 페이지 (`app/(app)/my-events/page.tsx` — 주최 중 탭/참여 중 탭 통합)
- [x] 이벤트 탐색 페이지 (`app/(app)/discover/page.tsx`)
- [x] 초대 링크 복사 기능 (`components/shared/copy-link-button.tsx`)

산출물:

- `actions/events.ts` — 이벤트 CRUD Server Actions
- `lib/validations/event.ts` — 이벤트 Zod 스키마
- `lib/validations/image.ts` — 이미지 검증 스키마
- `types/event.ts` — 이벤트 공통 타입
- `components/forms/event-form.tsx` — 이벤트 생성/수정 공통 폼
- `components/mobile/event-card-mobile.tsx` — 이벤트 카드 컴포넌트
- `components/mobile/event-category-badge.tsx` — 카테고리 배지
- `components/mobile/category-tabs-scroll.tsx` — 카테고리 필터 탭

### 이월 항목 / 기술 부채

- 없음. Phase 0, Phase 1 모두 정상 완료.

### Phase 2 진입 전제 조건 충족 여부

- [x] events 테이블 존재 (TASK-004에서 생성)
- [x] `participation_status` ENUM 타입 존재 (TASK-003에서 생성)
- [x] 이벤트 CRUD Server Actions 동작 (Phase 1에서 완료)
- [x] `(app)` 통합 라우트 그룹 구조 확립 (Phase 0에서 완료)
- [x] TypeScript 타입 생성 파이프라인 확립 (Phase 0에서 완료)

---

## 4. Phase 2 액션 아이템

> **중요 경로 참고:** ROADMAP.md에서는 `(host)`, `(participant)` 분리 라우트 구조를 사용하지만, 실제 프로젝트는 Phase 0 추가 작업에서 `(app)` 통합 라우트 구조로 전환되었습니다. 따라서 모든 페이지 경로는 `app/(app)/` 하위에 생성합니다.

### Task 1: Migration 003 — participations 테이블 + RLS + 인덱스

**ROADMAP 참조:** TASK-022
**의존성:** 없음 (Phase 1 완료 전제)
**예상 시간:** 2h
**우선순위:** 최상 (후속 모든 Task의 기반)

#### 상세 요구사항

Supabase 마이그레이션 SQL 파일을 생성하여 participations 테이블을 만듭니다.

**테이블 스키마 (`participations`):**

```sql
CREATE TABLE participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status participation_status NOT NULL DEFAULT 'pending',
  message TEXT,                    -- 참여 신청 시 메시지
  attended BOOLEAN DEFAULT FALSE,  -- 출석 여부
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)        -- 중복 신청 방지
);
```

**인덱스:**

- `CREATE INDEX idx_participations_event_id ON participations(event_id);`
- `CREATE INDEX idx_participations_user_id_status ON participations(user_id, status);`

**RLS 정책:**

- SELECT: 본인의 참여 데이터 조회 가능, 이벤트 주최자는 해당 이벤트의 모든 참여 데이터 조회 가능
- INSERT: 인증된 사용자 누구나 참여 신청 가능 (자기 자신만)
- UPDATE: 이벤트 주최자만 status/attended 변경 가능, 본인은 status='pending'인 경우 취소(삭제) 가능
- DELETE: 본인의 pending 상태 참여만 삭제 가능

**`updated_at` 자동 갱신 트리거:**

- `participations` 테이블에 `updated_at` 컬럼 자동 갱신 트리거 함수 생성 및 적용

**예상 파일:**

- `supabase/migrations/YYYYMMDDHHMMSS_create_participations.sql`

#### 완료 기준

- [ ] participations 테이블이 Supabase DB에 생성됨
- [ ] `(event_id, user_id)` UNIQUE 제약조건이 적용됨
- [ ] `event_id`, `(user_id, status)` 인덱스가 생성됨
- [ ] `event_id` FK에 `ON DELETE CASCADE`가 설정됨
- [ ] 위 명세대로 RLS 정책이 적용되어 비인가 접근이 차단됨
- [ ] `updated_at` 자동 갱신 트리거가 동작함

---

### Task 2: Migration 004 — posts 테이블 + RLS

**ROADMAP 참조:** TASK-023
**의존성:** Task 1 (participations 테이블 필요 — RLS 정책에서 참여 상태 확인)
**예상 시간:** 1.5h
**우선순위:** 최상

#### 상세 요구사항

공지 및 댓글을 저장하는 posts 테이블을 생성합니다. 공지와 댓글을 하나의 테이블에서 `type` 컬럼으로 구분합니다.

**테이블 스키마 (`posts`):**

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'comment' CHECK (type IN ('notice', 'comment')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**인덱스:**

- `CREATE INDEX idx_posts_event_id_created ON posts(event_id, created_at DESC);`

**RLS 정책:**

- SELECT: 이벤트 주최자 또는 승인된 참여자(`participations.status = 'approved'`)만 조회 가능
- INSERT (type='notice'): 이벤트 주최자만 공지 작성 가능
- INSERT (type='comment'): 이벤트 주최자 또는 승인된 참여자만 댓글 작성 가능
- UPDATE: 본인이 작성한 게시물만 수정 가능
- DELETE: 본인이 작성한 게시물만 삭제 가능, 주최자는 해당 이벤트의 모든 게시물 삭제 가능

**`updated_at` 자동 갱신 트리거:**

- posts 테이블에도 동일한 `updated_at` 트리거 적용 (Task 1에서 생성한 트리거 함수 재사용)

**예상 파일:**

- `supabase/migrations/YYYYMMDDHHMMSS_create_posts.sql`

#### 완료 기준

- [ ] posts 테이블이 생성됨
- [ ] `type` 컬럼이 'notice', 'comment' 값만 허용함
- [ ] `event_id` FK에 `ON DELETE CASCADE`가 설정됨
- [ ] 공지는 주최자만, 댓글은 주최자 또는 승인 참여자만 작성할 수 있는 RLS 정책이 적용됨
- [ ] 미승인 참여자 또는 비참여자의 조회/작성이 RLS에 의해 차단됨

---

### Task 3: 참여 승인 동시성 제어 RPC 함수

**ROADMAP 참조:** TASK-024
**의존성:** Task 1 (participations 테이블 필요)
**예상 시간:** 3h
**우선순위:** 높음

#### 상세 요구사항

여러 주최자가 동시에 참여 승인을 처리할 때 `max_participants`를 초과하지 않도록 보장하는 PostgreSQL RPC 함수를 작성합니다.

**함수 명세:**

```sql
CREATE OR REPLACE FUNCTION approve_participation(
  p_participation_id UUID,
  p_event_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INT;
  v_max INT;
BEGIN
  -- events 테이블에서 max_participants 조회 (행 레벨 잠금)
  SELECT max_participants INTO v_max
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  -- 현재 승인된 참여자 수 조회
  SELECT COUNT(*) INTO v_current_count
  FROM participations
  WHERE event_id = p_event_id AND status = 'approved';

  -- max_participants가 NULL이면 무제한
  IF v_max IS NOT NULL AND v_current_count >= v_max THEN
    RAISE EXCEPTION 'max_participants_exceeded';
  END IF;

  -- 승인 처리
  UPDATE participations
  SET status = 'approved', updated_at = now()
  WHERE id = p_participation_id AND event_id = p_event_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**핵심 로직:**

- `FOR UPDATE`로 events 행에 대해 행 레벨 잠금을 걸어 동시성 문제 방지
- `max_participants`가 NULL이면 인원 제한 없음으로 처리
- 초과 시 `RAISE EXCEPTION`으로 에러를 반환하여 클라이언트에서 처리 가능

**예상 파일:**

- `supabase/migrations/YYYYMMDDHHMMSS_create_approve_participation_rpc.sql`

#### 완료 기준

- [ ] `approve_participation` RPC 함수가 생성됨
- [ ] 현재 승인 인원이 `max_participants` 미만일 때만 승인이 처리됨
- [ ] `max_participants` 초과 시 `max_participants_exceeded` 예외가 발생함
- [ ] `max_participants`가 NULL인 경우 무제한으로 승인됨
- [ ] `FOR UPDATE`를 사용하여 동시 승인 요청 시 레이스 컨디션이 방지됨

---

### Task 4: TypeScript 타입 재생성 (participations, posts)

**ROADMAP 참조:** TASK-025
**의존성:** Task 1, Task 2, Task 3 (모든 마이그레이션 완료 후)
**예상 시간:** 30m
**우선순위:** 높음 (후속 코드 작성의 전제)

#### 상세 요구사항

Supabase CLI를 사용하여 새로 추가된 participations, posts 테이블과 `approve_participation` RPC 함수의 타입을 `types/database.types.ts`에 반영합니다.

**실행 명령:**

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.types.ts
```

**검증 사항:**

- `Database['public']['Tables']['participations']` 타입이 존재하는지 확인
- `Database['public']['Tables']['posts']` 타입이 존재하는지 확인
- `Database['public']['Functions']['approve_participation']` 타입이 존재하는지 확인
- 기존 events, profiles 타입이 유지되는지 확인

**예상 파일:**

- `types/database.types.ts` (재생성)

#### 완료 기준

- [ ] `types/database.types.ts`에 participations 테이블 타입이 반영됨
- [ ] `types/database.types.ts`에 posts 테이블 타입이 반영됨
- [ ] `approve_participation` RPC 함수 타입이 반영됨
- [ ] `npm run type-check` 실행 시 타입 오류 없음

---

### Task 5: 참여 Zod 스키마 + 공통 타입 정의

**의존성:** Task 4 (DB 타입 필요)
**예상 시간:** 1h
**우선순위:** 높음

#### 상세 요구사항

참여 신청 폼과 Server Actions에서 사용할 Zod 검증 스키마와 공통 타입을 정의합니다.

**파일:** `lib/validations/participation.ts`

```typescript
import { z } from "zod";

// 참여 신청 스키마
export const applyParticipationSchema = z.object({
  eventId: z.string().uuid(),
  message: z.string().max(200, "메시지는 200자 이내로 입력해주세요").optional(),
});

// 참여 상태 변경 스키마
export const updateParticipationStatusSchema = z.object({
  participationId: z.string().uuid(),
  eventId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

// 출석 토글 스키마
export const toggleAttendanceSchema = z.object({
  participationId: z.string().uuid(),
  attended: z.boolean(),
});
```

**파일:** `types/participation.ts`

```typescript
import { Database } from "@/types/database.types";

export type Participation =
  Database["public"]["Tables"]["participations"]["Row"];
export type ParticipationInsert =
  Database["public"]["Tables"]["participations"]["Insert"];

// 참여자 목록 표시용 (profiles JOIN)
export type ParticipationWithProfile = Participation & {
  profiles: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
};
```

#### 완료 기준

- [ ] `lib/validations/participation.ts`에 `applyParticipationSchema`, `updateParticipationStatusSchema`, `toggleAttendanceSchema`가 정의됨
- [ ] `types/participation.ts`에 `Participation`, `ParticipationWithProfile` 타입이 정의됨
- [ ] Zod 스키마가 실제 DB 스키마와 일치함
- [ ] `npm run type-check` 통과

---

### Task 6: 공지/댓글 Zod 스키마 + 공통 타입 정의

**의존성:** Task 4 (DB 타입 필요)
**예상 시간:** 1h
**우선순위:** 높음

#### 상세 요구사항

공지/댓글 폼과 Server Actions에서 사용할 Zod 검증 스키마와 공통 타입을 정의합니다.

**파일:** `lib/validations/post.ts`

```typescript
import { z } from "zod";

// 게시물 작성 스키마
export const createPostSchema = z.object({
  eventId: z.string().uuid(),
  type: z.enum(["notice", "comment"]),
  content: z
    .string()
    .min(1, "내용을 입력해주세요")
    .max(1000, "1000자 이내로 입력해주세요"),
});

// 게시물 수정 스키마
export const updatePostSchema = z.object({
  postId: z.string().uuid(),
  content: z
    .string()
    .min(1, "내용을 입력해주세요")
    .max(1000, "1000자 이내로 입력해주세요"),
});
```

**파일:** `types/post.ts`

```typescript
import { Database } from "@/types/database.types";

export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];

// 게시물 표시용 (profiles JOIN)
export type PostWithAuthor = Post & {
  profiles: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};
```

#### 완료 기준

- [ ] `lib/validations/post.ts`에 `createPostSchema`, `updatePostSchema`가 정의됨
- [ ] `types/post.ts`에 `Post`, `PostWithAuthor` 타입이 정의됨
- [ ] Zod 스키마가 실제 DB 스키마와 일치함
- [ ] `npm run type-check` 통과

---

### Task 7: Server Actions — 참여자 관리 구현

**ROADMAP 참조:** TASK-026
**의존성:** Task 4 (타입), Task 5 (Zod 스키마), Task 3 (RPC 함수)
**예상 시간:** 4h
**우선순위:** 높음

#### 상세 요구사항

참여 신청, 승인, 거절, 취소, 출석 체크 기능을 Server Actions으로 구현합니다.

**파일:** `actions/participations.ts`

**구현할 함수:**

1. **`applyParticipation(formData: FormData)`**
   - Zod 서버 검증 (`applyParticipationSchema`)
   - `supabase.from('participations').insert(...)` 실행
   - 중복 신청 방지: DB UNIQUE 제약에 의해 자동 처리, 에러 메시지 반환
   - `revalidatePath(`/events/${eventId}`)` 호출
   - 성공/실패 상태 반환 (`{ success: boolean; error?: string }`)

2. **`approveParticipation(formData: FormData)`**
   - Zod 서버 검증 (`updateParticipationStatusSchema`)
   - 주최자 권한 검증: 현재 사용자가 해당 이벤트의 `host_id`인지 확인
   - `supabase.rpc('approve_participation', { p_participation_id, p_event_id })` 호출
   - `max_participants_exceeded` 에러 처리 → 사용자에게 "최대 인원을 초과했습니다" 메시지 반환
   - `revalidatePath()` 호출

3. **`rejectParticipation(formData: FormData)`**
   - Zod 서버 검증
   - 주최자 권한 검증
   - `supabase.from('participations').update({ status: 'rejected' })` 실행
   - `revalidatePath()` 호출

4. **`cancelParticipation(formData: FormData)`**
   - 본인의 pending 상태 참여만 취소 가능
   - `supabase.from('participations').delete()` 실행
   - `revalidatePath()` 호출

5. **`toggleAttendance(formData: FormData)`**
   - Zod 서버 검증 (`toggleAttendanceSchema`)
   - 주최자 권한 검증
   - `supabase.from('participations').update({ attended })` 실행
   - `revalidatePath()` 호출

**데이터 조회 함수 (Server Component에서 사용):**

6. **`getParticipations(eventId: string, status?: string)`**
   - 해당 이벤트의 참여자 목록 조회 (profiles JOIN)
   - status 필터 옵션 (전체/pending/approved/rejected)
   - `ParticipationWithProfile[]` 반환

7. **`getMyParticipations(userId: string, status?: string)`**
   - 내가 참여 신청한 이벤트 목록 조회 (events JOIN)
   - status 필터 옵션
   - 최신 순 정렬

8. **`getParticipationStatus(eventId: string, userId: string)`**
   - 특정 이벤트에 대한 현재 사용자의 참여 상태 조회
   - 참여 신청 여부 + 현재 상태 반환

**기술적 주의사항:**

- 모든 함수에서 `createServerClient` 사용 (Server Actions)
- 권한 검증은 반드시 서버 측에서 수행 (클라이언트 검증에 의존하지 않음)
- `revalidatePath()`로 관련 페이지 캐시 무효화
- 에러 반환 형식 통일: `{ success: boolean; error?: string }`

#### 완료 기준

- [ ] `actions/participations.ts`에 위 8개 함수가 구현됨
- [ ] 참여 신청 시 중복 신청이 방지됨
- [ ] 승인 시 RPC 함수를 통해 동시성이 제어됨
- [ ] `max_participants` 초과 승인 시 적절한 에러 메시지가 반환됨
- [ ] 모든 상태 변경 함수에 주최자/본인 권한 검증이 포함됨
- [ ] `npm run type-check` 통과

---

### Task 8: Server Actions — 공지/댓글 구현

**ROADMAP 참조:** TASK-027
**의존성:** Task 4 (타입), Task 6 (Zod 스키마)
**예상 시간:** 2h
**우선순위:** 높음

#### 상세 요구사항

공지 작성(주최자), 댓글 작성(승인 참여자 + 주최자), 수정, 삭제 기능을 Server Actions으로 구현합니다.

**파일:** `actions/posts.ts`

**구현할 함수:**

1. **`createPost(formData: FormData)`**
   - Zod 서버 검증 (`createPostSchema`)
   - type='notice'인 경우: 현재 사용자가 이벤트 주최자인지 검증
   - type='comment'인 경우: 현재 사용자가 주최자이거나 승인된 참여자인지 검증
   - `supabase.from('posts').insert(...)` 실행
   - `revalidatePath()` 호출

2. **`updatePost(formData: FormData)`**
   - Zod 서버 검증 (`updatePostSchema`)
   - 본인 작성 게시물만 수정 가능 검증
   - `supabase.from('posts').update({ content })` 실행
   - `revalidatePath()` 호출

3. **`deletePost(formData: FormData)`**
   - 본인 작성 게시물 또는 주최자가 해당 이벤트의 게시물 삭제 가능
   - `supabase.from('posts').delete()` 실행
   - `revalidatePath()` 호출

**데이터 조회 함수:**

4. **`getPosts(eventId: string, type?: 'notice' | 'comment')`**
   - 해당 이벤트의 게시물 목록 조회 (profiles JOIN)
   - type 필터 옵션 (전체/공지/댓글)
   - 최신 순 정렬
   - `PostWithAuthor[]` 반환

**기술적 주의사항:**

- 공지 작성 권한은 RLS + Server Action 양쪽에서 이중 검증
- 댓글 작성 시 participations 테이블에서 승인 상태 확인 필요

#### 완료 기준

- [ ] `actions/posts.ts`에 위 4개 함수가 구현됨
- [ ] 공지는 주최자만 작성 가능 (서버 검증)
- [ ] 댓글은 주최자 또는 승인된 참여자만 작성 가능 (서버 검증)
- [ ] 수정/삭제 권한 검증이 동작함
- [ ] `npm run type-check` 통과

---

### Task 9: 참여자 관리 페이지 (주최자 뷰)

**ROADMAP 참조:** TASK-028
**의존성:** Task 7 (참여 Server Actions)
**예상 시간:** 4h
**우선순위:** 중간

#### 상세 요구사항

이벤트 주최자가 참여 신청을 관리하는 페이지를 구현합니다. 이벤트 상세 페이지의 하위 탭으로 접근합니다.

**페이지 파일:** `app/(app)/events/[eventId]/participants/page.tsx` (Server Component)

**컴포넌트:**

1. **`components/shared/participant-list.tsx`** (Client Component)
   - 참여자 목록 렌더링 (아바타, 이름, 신청 메시지, 상태 배지, 신청 일시)
   - 상태별 필터 탭: 전체 / 대기중 / 승인 / 거절
   - URL SearchParams 기반 필터 (`?status=pending`)
   - 현재 승인 인원 / 최대 인원 카운터 표시 (예: "3/10명 승인")

2. **`components/shared/participant-actions.tsx`** (Client Component)
   - pending 상태: 승인 / 거절 버튼
   - approved 상태: 거절로 변경 버튼 (선택적)
   - 각 버튼 클릭 시 Server Action 호출
   - 로딩 상태 표시 (`useTransition` 활용)

3. **`components/shared/attendance-toggle.tsx`** (Client Component)
   - approved 상태 참여자에게만 표시
   - 체크박스 또는 토글 스위치로 출석 여부 변경
   - `toggleAttendance` Server Action 호출

**레이아웃 고려사항:**

- 모바일 최적화: 카드 형태의 참여자 항목
- 각 항목에 아바타 + 이름 + 상태 배지 + 액션 버튼 배치
- 빈 상태 UI: "아직 참여 신청이 없습니다" + 초대 링크 복사 버튼

**예상 파일:**

- `app/(app)/events/[eventId]/participants/page.tsx`
- `components/shared/participant-list.tsx`
- `components/shared/participant-actions.tsx`
- `components/shared/attendance-toggle.tsx`

#### 완료 기준

- [ ] 참여 신청 목록이 상태별로 필터링되어 표시됨
- [ ] 승인/거절 버튼 클릭 시 상태가 즉시 반영됨
- [ ] 출석 체크 토글이 동작함
- [ ] 현재 승인 인원 / 최대 인원이 정확히 표시됨
- [ ] `max_participants` 초과 승인 시 에러 메시지가 토스트로 표시됨
- [ ] 빈 상태 UI가 표시됨
- [ ] 모바일(375px)에서 레이아웃이 정상 동작함

---

### Task 10: 공지 및 댓글 관리 페이지

**ROADMAP 참조:** TASK-029
**의존성:** Task 8 (공지/댓글 Server Actions)
**예상 시간:** 4h
**우선순위:** 중간

#### 상세 요구사항

이벤트의 공지 및 댓글 피드를 표시하고 작성/수정/삭제를 관리하는 페이지를 구현합니다. 이벤트 상세 페이지의 하위 탭으로 접근합니다.

**페이지 파일:** `app/(app)/events/[eventId]/posts/page.tsx` (Server Component)

**컴포넌트:**

1. **`components/shared/post-feed.tsx`** (Server Component 또는 Client Component)
   - 공지 + 댓글 통합 피드 (최신 순)
   - 공지는 상단 고정 또는 별도 배지(`NOTICE`)로 시각적 구분
   - 댓글은 일반 피드로 표시

2. **`components/shared/post-item.tsx`** (Client Component)
   - 단일 게시물 렌더링: 작성자 아바타 + 이름, 내용, 작성 시간, 타입 배지
   - 본인 작성 게시물: 수정/삭제 드롭다운 메뉴
   - 주최자: 모든 게시물에 삭제 옵션

3. **`components/forms/post-form.tsx`** (Client Component)
   - React Hook Form + Zod 이중 검증
   - 공지/댓글 타입 선택 (주최자에게만 공지 옵션 표시)
   - 텍스트 입력 (textarea) + 제출 버튼
   - 수정 모드: 기존 내용이 미리 채워진 상태로 전환
   - 제출 후 폼 초기화

4. **`components/shared/post-actions.tsx`** (Client Component)
   - 수정/삭제 드롭다운 메뉴 (`DropdownMenu` shadcn/ui 컴포넌트 사용)
   - 삭제 시 확인 다이얼로그 (`confirm-dialog.tsx` 재사용)

**예상 파일:**

- `app/(app)/events/[eventId]/posts/page.tsx`
- `components/shared/post-feed.tsx`
- `components/shared/post-item.tsx`
- `components/shared/post-actions.tsx`
- `components/forms/post-form.tsx`

#### 완료 기준

- [ ] 공지 피드가 배지 강조로 최신 순 표시됨
- [ ] 댓글 피드가 최신 순으로 표시됨
- [ ] 주최자가 공지를 작성할 수 있음
- [ ] 승인된 참여자가 댓글을 작성할 수 있음
- [ ] 미승인 참여자에게는 작성 폼이 표시되지 않음
- [ ] 본인 게시물 수정/삭제가 동작함
- [ ] 주최자의 타 게시물 삭제가 동작함
- [ ] 모바일(375px)에서 레이아웃이 정상 동작함

---

### Task 11: 이벤트 상세 페이지 참여자 뷰 확장

**ROADMAP 참조:** TASK-030
**의존성:** Task 7 (참여 Server Actions), Task 8 (공지/댓글 Server Actions)
**예상 시간:** 4h
**우선순위:** 중간

#### 상세 요구사항

기존 이벤트 상세 페이지(`app/(app)/events/[eventId]/page.tsx`)를 확장하여 참여자 뷰 기능을 추가합니다. 주최자가 아닌 사용자가 접근할 때의 UI를 구현합니다.

**기존 파일 수정:** `app/(app)/events/[eventId]/page.tsx`

**추가 기능:**

1. **참여 신청 영역**
   - 비참여자: "참여 신청" 버튼 + 메시지 입력 폼 표시
   - pending 상태: "신청 대기중" 상태 배지 + 취소 버튼
   - approved 상태: "참여 승인됨" 상태 배지
   - rejected 상태: "참여 거절됨" 상태 배지
   - 주최자(본인 이벤트): 참여 신청 영역 대신 관리 버튼 표시

2. **하위 탭 내비게이션 (승인 참여자 전용)**
   - 승인된 참여자에게만 표시되는 탭: 공지/댓글, 카풀, 정산
   - 카풀, 정산 탭은 Phase 3, 4에서 구현 예정 → "준비 중" placeholder 표시
   - 탭 전환 시 URL 변경 없이 클라이언트 사이드 전환 또는 중첩 라우트 활용

3. **`components/forms/participation-form.tsx`** (Client Component)
   - React Hook Form + Zod 이중 검증
   - 메시지 입력 (textarea, 200자 제한)
   - 신청 버튼 + 로딩 상태
   - `applyParticipation` Server Action 호출

**컨텍스트 판단 로직:**

```typescript
// Server Component에서 판단
const isHost = event.host_id === user.id;
const participation = await getParticipationStatus(eventId, user.id);
const isApproved = participation?.status === "approved";
```

**예상 파일:**

- `app/(app)/events/[eventId]/page.tsx` (수정)
- `components/forms/participation-form.tsx` (신규)

#### 완료 기준

- [ ] 비참여자에게 참여 신청 폼이 표시됨
- [ ] 참여 신청 후 상태 배지가 올바르게 표시됨 (pending/approved/rejected)
- [ ] pending 상태에서 참여 취소가 가능함
- [ ] 승인 참여자에게 하위 탭(공지댓글/카풀/정산)이 표시됨
- [ ] 미승인 참여자에게는 하위 탭이 숨겨짐
- [ ] 주최자에게는 참여 관리 페이지 링크가 표시됨
- [ ] 모바일(375px)에서 레이아웃이 정상 동작함

---

### Task 12: 내가 참여한 이벤트 목록 페이지

**ROADMAP 참조:** TASK-031
**의존성:** Task 7 (참여 Server Actions)
**예상 시간:** 2h
**우선순위:** 중간

#### 상세 요구사항

내가 참여 신청한 이벤트 목록을 표시하는 페이지를 구현합니다. 기존 `app/(app)/my-events/page.tsx`에 "참여 중" 탭이 이미 존재하므로, 이 탭의 실제 데이터 조회 및 표시 로직을 구현합니다.

**수정 파일:** `app/(app)/my-events/page.tsx` (기존 파일 수정)

**구현 내용:**

1. **참여 중 탭 (`ParticipatingView`) 데이터 연동**
   - `getMyParticipations(userId, status)` 호출하여 실제 데이터 조회
   - 상태별 필터: 전체 / 대기중 / 승인 / 거절 (URL SearchParams 기반: `?tab=participating&status=pending`)
   - `EventCardMobile` 컴포넌트 재사용하여 이벤트 카드 목록 표시
   - 각 카드에 참여 상태 배지 표시

2. **참여 취소 기능**
   - pending 상태 카드에 취소 버튼 표시
   - `cancelParticipation` Server Action 호출
   - 취소 확인 다이얼로그 (`confirm-dialog.tsx` 재사용)

3. **빈 상태 UI**
   - "아직 참여한 이벤트가 없습니다" + "이벤트 탐색하기" 버튼

**예상 파일:**

- `app/(app)/my-events/page.tsx` (수정)

#### 완료 기준

- [ ] 참여 중 탭에서 내가 신청한 이벤트 카드 목록이 표시됨
- [ ] 상태별 필터(전체/대기/승인/거절)가 동작함
- [ ] pending 상태 카드에서 참여 취소가 가능함
- [ ] 이벤트 카드에 참여 상태 배지가 표시됨
- [ ] 빈 상태 UI가 표시됨
- [ ] `EventCardMobile` 컴포넌트가 재사용됨

---

### Task 13: 이벤트 상세 페이지 하위 탭 라우팅 구조 구축

**의존성:** Task 9 (참여자 관리 페이지), Task 10 (공지/댓글 페이지)
**예상 시간:** 2h
**우선순위:** 중간

#### 상세 요구사항

이벤트 상세 페이지에서 하위 콘텐츠(참여자 관리, 공지/댓글, 카풀, 정산)로의 내비게이션 구조를 구축합니다.

**구현 방식 (중첩 라우트):**

```
app/(app)/events/[eventId]/
├── page.tsx              # 이벤트 상세 (기본 정보)
├── layout.tsx            # 하위 탭 내비게이션 공통 레이아웃 (신규)
├── participants/
│   └── page.tsx          # 참여자 관리 (Task 9)
├── posts/
│   └── page.tsx          # 공지/댓글 (Task 10)
├── carpool/
│   └── page.tsx          # 카풀 (Phase 3 placeholder)
├── settlement/
│   └── page.tsx          # 정산 (Phase 4 placeholder)
└── edit/
    └── page.tsx          # 이벤트 수정 (기존)
```

**`app/(app)/events/[eventId]/layout.tsx` (신규):**

- 이벤트 기본 정보 (커버 이미지, 제목) 표시
- 하위 탭 내비게이션 바: 상세정보 / 참여자 / 공지댓글 / 카풀 / 정산
- 주최자/승인참여자 여부에 따라 탭 표시 제어
- `usePathname`으로 활성 탭 하이라이트

**Placeholder 페이지 (Phase 3, 4용):**

- `app/(app)/events/[eventId]/carpool/page.tsx` — "카풀 기능은 준비 중입니다" 표시
- `app/(app)/events/[eventId]/settlement/page.tsx` — "정산 기능은 준비 중입니다" 표시

**예상 파일:**

- `app/(app)/events/[eventId]/layout.tsx` (신규)
- `app/(app)/events/[eventId]/carpool/page.tsx` (placeholder)
- `app/(app)/events/[eventId]/settlement/page.tsx` (placeholder)

#### 완료 기준

- [ ] 이벤트 상세 하위 탭 내비게이션이 동작함
- [ ] 주최자에게 모든 탭이 표시됨
- [ ] 승인 참여자에게 공지댓글/카풀/정산 탭이 표시됨
- [ ] 미승인 참여자에게는 제한된 탭만 표시됨
- [ ] 카풀/정산 placeholder 페이지가 표시됨
- [ ] 활성 탭이 하이라이트됨
- [ ] 모바일(375px)에서 탭이 스크롤 가능하게 표시됨

---

## 기술적 고려사항

### RLS 정책 설계 원칙

- **최소 권한 원칙:** 각 역할에 필요한 최소한의 접근 권한만 부여
- **이중 검증:** RLS 정책(DB 레벨) + Server Action 권한 검증(앱 레벨) 양쪽에서 검증
- **참여 상태 기반 접근 제어:** posts 테이블의 RLS에서 participations 테이블을 JOIN하여 승인 상태 확인

### 동시성 제어

- `approve_participation` RPC 함수에서 `FOR UPDATE` 행 레벨 잠금 사용
- 클라이언트에서 `max_participants_exceeded` 에러를 적절히 처리하여 사용자에게 안내

### 성능 고려사항

- participations 테이블의 `(event_id)`, `(user_id, status)` 인덱스로 조회 성능 확보
- posts 테이블의 `(event_id, created_at DESC)` 인덱스로 피드 조회 성능 확보
- Server Component에서 데이터를 조회하여 클라이언트로 전달 (waterfall 방지)

### Task 간 의존 관계 요약

```
Task 1 (participations 마이그레이션)
├── Task 2 (posts 마이그레이션) → depends on Task 1
├── Task 3 (RPC 함수) → depends on Task 1
└── Task 4 (타입 재생성) → depends on Task 1, 2, 3
    ├── Task 5 (참여 Zod/타입) → depends on Task 4
    ├── Task 6 (공지 Zod/타입) → depends on Task 4
    ├── Task 7 (참여 Server Actions) → depends on Task 4, 5, 3
    ├── Task 8 (공지 Server Actions) → depends on Task 4, 6
    ├── Task 9 (참여자 관리 페이지) → depends on Task 7
    ├── Task 10 (공지/댓글 페이지) → depends on Task 8
    ├── Task 11 (이벤트 상세 참여자 뷰) → depends on Task 7, 8
    ├── Task 12 (내 참여 이벤트 목록) → depends on Task 7
    └── Task 13 (하위 탭 라우팅) → depends on Task 9, 10
```

### 권장 실행 순서

1. Task 1 → Task 2 → Task 3 (DB 마이그레이션, 순차)
2. Task 4 (타입 재생성)
3. Task 5, Task 6 (Zod 스키마, 병렬 가능)
4. Task 7, Task 8 (Server Actions, 병렬 가능)
5. Task 9, Task 10, Task 11, Task 12 (페이지 구현, 병렬 가능)
6. Task 13 (하위 탭 라우팅, 마지막)

---

## 위험 요소 (Risks)

| 위험                              | 영향                                                                  | 완화 방안                                                                |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 동시성 제어 RPC 복잡도            | PostgreSQL 함수 작성 경험 부족 시 구현 지연                           | Supabase 문서의 RPC 예제를 참고하여 스파이크 작업 선행                   |
| RLS 정책 복잡도                   | 참여 상태에 따른 접근 제어가 복잡하여 예상치 못한 차단/허용 발생      | 각 시나리오별 RLS 정책을 사전 설계 후 SQL 작성, 테스트 케이스 준비       |
| 라우트 구조 변경                  | ROADMAP의 `(host)/(participant)` 경로와 실제 `(app)` 통합 구조 불일치 | 모든 경로를 `(app)` 하위로 통일, 주최자/참여자 구분은 서버 로직으로 처리 |
| 기존 이벤트 상세 페이지 변경 범위 | Phase 1에서 구현된 이벤트 상세 페이지의 대폭 수정 필요                | 기존 코드를 컴포넌트 단위로 분리하여 점진적으로 확장                     |
