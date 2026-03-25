# Plan: Task 38 — posts/page.tsx 및 post-feed.tsx 구현

## Context

공지/댓글 게시물 피드 페이지를 위한 Server Component와 Client 피드 컴포넌트를 구현합니다.
태스크 48(getPosts 조회 함수)이 완료되어 있어 바로 구현 가능합니다.

**의존 태스크 상태:**

- Task 48 (getPosts 함수) → ✅ done

## 주요 발견 사항

- `actions/events.ts`: `getEvent()` 아님 → 실제 함수명은 **`getEventById()`**
- `actions/posts.ts`: `getPosts(eventId, type?)` ✅ 구현됨
- `actions/participations.ts`: `getParticipationStatus(eventId, userId)` ✅ 구현됨
- `types/post.ts`: `PostWithAuthor` ✅ 정의됨
- `components/shared/post-item.tsx`: ❌ 미존재 (다른 태스크에서 구현 예정 → 스텁 처리)
- `components/forms/post-form.tsx`: ❌ 미존재 (다른 태스크 → 조건부 렌더링 유지, import만 준비)

## 구현 범위

### 파일 1: `app/(app)/events/[eventId]/posts/page.tsx`

- Server Component
- `Promise.all`로 posts, event, participation 병렬 조회
- `isHost`: `event.host_id === user.id`
- `canPost`: 주최자 또는 승인된 참여자
- 미인증 시 `/auth/login` redirect
- `getEvent` → **`getEventById`** 로 수정하여 사용

### 파일 2: `components/shared/post-feed.tsx`

- Client Component (`"use client"`)
- `PostWithAuthor[]` 타입의 posts 렌더링
- 빈 상태 UI: "아직 게시물이 없습니다" + 주최자 힌트
- `PostItem` 컴포넌트 사용 (미구현 → 임시 인라인 처리로 타입 에러 방지)

## 구현 계획

**Step 1: [nextjs-supabase-fullstack] posts/page.tsx Server Component 구현**

- 파일 생성: `app/(app)/events/[eventId]/posts/page.tsx`
- `getEventById`, `getPosts`, `getParticipationStatus` 사용
- `PostFeed`, `PostForm` 조건부 렌더링 (PostForm은 파일 미존재 시 주석 처리)

**Step 2: [nextjs-ui-markup] post-feed.tsx Client Component UI 구현**

- 파일 생성: `components/shared/post-feed.tsx`
- `PostWithAuthor[]` 순회 렌더링
- 빈 상태 UI 포함
- `PostItem` 미구현 상태이므로, 인라인 임시 카드로 처리하여 타입 에러 방지

## 중요 파일 경로

| 파일                                        | 상태                                      |
| ------------------------------------------- | ----------------------------------------- |
| `app/(app)/events/[eventId]/posts/page.tsx` | 신규 생성                                 |
| `components/shared/post-feed.tsx`           | 신규 생성                                 |
| `actions/posts.ts`                          | 읽기 전용 (getPosts 재사용)               |
| `actions/events.ts`                         | 읽기 전용 (getEventById 재사용)           |
| `actions/participations.ts`                 | 읽기 전용 (getParticipationStatus 재사용) |
| `types/post.ts`                             | 읽기 전용 (PostWithAuthor 재사용)         |

## 검증 방법

1. `npm run type-check` — 타입 오류 없음 확인
2. `npm run lint` — lint 오류 없음 확인
3. 브라우저에서 `/events/[eventId]/posts` 접근 → 게시물 피드 페이지 렌더링 확인
4. 승인된 참여자 → PostForm 표시 확인
5. 미승인/비회원 → PostForm 숨김 확인
6. 게시물 없을 때 빈 상태 UI 표시 확인
