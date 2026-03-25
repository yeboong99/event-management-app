# Task 39: events/[eventId]/layout.tsx 생성 및 공통 레이아웃 구현

## Context

현재 `app/(app)/events/[eventId]/` 하위에 `page.tsx`, `participants/page.tsx`, `posts/page.tsx` 세 라우트가 존재하지만 공통 레이아웃 파일이 없어 각 페이지가 독립적으로 렌더링됩니다. 중첩 레이아웃을 도입하여 커버 이미지, 이벤트 제목, 탭 네비게이션(EventTabNav)을 모든 하위 라우트에서 공통으로 표시하는 것이 목표입니다.

의존 태스크 46(getParticipationStatus), 48(getPosts)은 모두 완료(done) 상태입니다.

---

## 핵심 파악 사항

- **기존 함수명**: 태스크 명세는 `getEvent()`를 참조하지만 실제 구현 함수명은 `getEventById()` (`actions/events.ts`)
- **layout.tsx 없음**: `[eventId]/` 폴더에 현재 레이아웃 파일이 없음
- **EventTabNav 미존재**: Task 53 예정 컴포넌트 → 이번 태스크에서 함께 생성
- **현재 page.tsx**: 호스트 전용 상세 페이지(비호스트는 `/my-events` 리다이렉트). 레이아웃 도입 후 이 리다이렉트 로직은 page.tsx에 그대로 유지

---

## 구현 계획

### Step 1: [nextjs-ui-markup] EventTabNav 컴포넌트 생성

**파일:** `components/shared/event-tab-nav.tsx`

- `'use client'` 컴포넌트 (usePathname으로 활성 탭 표시)
- Props: `eventId: string`, `isHost: boolean`, `isApproved: boolean`
- 탭 구성:
  - **상세** (`/events/[eventId]`) — 항상 표시
  - **참여자** (`/events/[eventId]/participants`) — isHost일 때만 표시
  - **게시물** (`/events/[eventId]/posts`) — isHost 또는 isApproved일 때만 표시
- 활성 탭: 현재 pathname과 href 비교로 강조 스타일 적용
- shadcn/ui 없이 Link + className 기반 구현

### Step 2: [nextjs-supabase-fullstack] layout.tsx 생성

**파일:** `app/(app)/events/[eventId]/layout.tsx`

- `async` Server Component
- `params: Promise<{ eventId: string }>` → 반드시 await
- `getEventById(eventId)` 로 이벤트 조회 (getEvent 아님)
- `supabase.auth.getUser()` 로 현재 사용자 조회
- `getParticipationStatus(eventId, user.id)` 로 참여 상태 조회 (비로그인 시 null)
- isHost, isApproved 계산 후 EventTabNav에 전달
- 렌더링 구조:
  ```
  <div className="space-y-4">
    {cover_image_url && <Image ... />}
    <h1>{event.title}</h1>
    <EventTabNav eventId isHost isApproved />
    {children}
  </div>
  ```
- cover_image_url이 null이면 이미지 영역 렌더링 안 함

---

## 주요 파일

| 파일                                    | 역할                                          |
| --------------------------------------- | --------------------------------------------- |
| `app/(app)/events/[eventId]/layout.tsx` | **신규 생성** — 공통 레이아웃                 |
| `components/shared/event-tab-nav.tsx`   | **신규 생성** — 탭 네비게이션                 |
| `actions/events.ts`                     | `getEventById()` 재사용 (수정 없음)           |
| `actions/participations.ts`             | `getParticipationStatus()` 재사용 (수정 없음) |
| `lib/supabase/server.ts`                | `createClient()` 재사용 (수정 없음)           |

---

## 검증 방법

1. `/events/[id]` — 커버 이미지, 제목, 탭 렌더링 확인
2. `/events/[id]/participants` — 동일한 레이아웃(커버+제목+탭) 위에 참여자 콘텐츠 확인
3. `/events/[id]/posts` — 동일한 레이아웃 위에 게시물 콘텐츠 확인
4. cover_image_url이 null인 이벤트에서 이미지 영역 미노출 확인
5. isHost=false, isApproved=false인 사용자: 상세 탭만 표시
6. isHost=true: 참여자·게시물 탭 모두 표시
7. `npm run type-check` 타입 오류 없음 확인
