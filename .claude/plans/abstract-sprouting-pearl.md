# Task 52: post-item.tsx 및 post-actions.tsx 구현

## Context

게시물 피드(`post-feed.tsx`)가 현재 내부 `PostCard` 컴포넌트로 읽기 전용 렌더링만 담당하고 있습니다. 작성자/주최자가 게시물을 수정·삭제할 수 있도록 인라인 편집 모드와 드롭다운 액션 UI가 필요합니다. 이를 위해 `PostItem` + `PostActions` 두 컴포넌트를 분리 구현하고, `PostFeed`가 이를 사용하도록 교체합니다.

## 구현 범위

| 파일                                 | 작업                         |
| ------------------------------------ | ---------------------------- |
| `components/shared/post-actions.tsx` | 새로 생성                    |
| `components/shared/post-item.tsx`    | 새로 생성                    |
| `components/shared/post-feed.tsx`    | PostCard → PostItem으로 교체 |

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] post-actions.tsx 구현

**파일**: `components/shared/post-actions.tsx`

- `"use client"` Client Component
- Props: `post: PostWithAuthor`, `eventId: string`, `onEdit: () => void`, `isAuthor: boolean`
- DropdownMenu(shadcn/ui) 기반 드롭다운
  - 트리거: `MoreHorizontal` 아이콘 버튼 (ghost, 8×8)
  - 메뉴 아이템:
    - `isAuthor`인 경우만 "수정" 항목 표시 → `onEdit()` 호출
    - 항상 "삭제" 항목 표시 (`text-destructive`) → `confirm()` → `deletePost(formData)` 호출
- `useTransition` + `toast` (sonner) 패턴 적용
- `deletePost` import: `@/actions/posts`
- `PostWithAuthor` import: `@/types/post`

### Step 2: [nextjs-supabase-fullstack] post-item.tsx 구현

**파일**: `components/shared/post-item.tsx`

- `"use client"` Client Component
- Props: `post: PostWithAuthor`, `eventId: string`, `currentUserId: string`, `isHost: boolean`
- 상태: `isEditing (useState)`, `editContent (useState)`, `isPending (useTransition)`
- 렌더링 구조:
  1. 헤더: Avatar + 이름 + 작성 시간(`formatDistanceToNow` from `date-fns/ko`) + 공지 Badge
  2. `(isAuthor || isHost)` 조건으로 `<PostActions>` 표시
  3. `isEditing` 분기:
     - 편집 모드: Textarea(maxLength=1000) + 저장/취소 버튼
     - 일반 모드: `<p className="text-sm whitespace-pre-wrap">`
- 저장: `updatePost(formData)` 호출 → 성공 시 `setIsEditing(false)` + `toast.success`
- `isAuthor = post.author_id === currentUserId`

### Step 3: [nextjs-supabase-fullstack] post-feed.tsx 업데이트

**파일**: `components/shared/post-feed.tsx`

- 기존 인라인 `PostCard` 컴포넌트 제거
- `PostItem` 컴포넌트 import 후 게시물 목록 렌더링에 사용
- `PostFeedProps`에 `currentUserId`, `isHost`가 이미 있으므로 그대로 전달
- 공지/댓글 구분 배지 및 날짜 표시는 PostItem으로 이동됨
- 빈 상태 메시지 유지

## 참조 파일

- **Server Actions**: `actions/posts.ts` — `updatePost`, `deletePost` 시그니처
- **타입**: `types/post.ts` — `PostWithAuthor`
- **기존 패턴**: `components/shared/participant-actions.tsx` — `useTransition` + `toast` + FormData 패턴
- **현재 PostCard 로직**: `components/shared/post-feed.tsx` (교체 대상)

## 검증

1. 주최자 계정으로 로그인 → 다른 사람의 게시물에 "삭제"만 보이는지 확인
2. 작성자 본인 → "수정" + "삭제" 모두 보이는지 확인
3. 수정 버튼 클릭 → 인라인 Textarea로 전환 → 저장 → toast.success + 편집 모드 종료
4. 취소 클릭 → 편집 모드 종료, 내용 복원
5. 삭제 → confirm() → 확인 → 게시물 제거 + toast.success
6. `type === "notice"` 게시물에 공지 Badge 표시 확인
