# Task 47: updatePost / deletePost Server Actions 구현

## Context

게시물 생성(`createPost`)은 이미 구현되어 있으나, 수정·삭제 기능이 없어 사용자가 작성한 게시물을 편집하거나 삭제할 수 없는 상태입니다. 본 작업은 `actions/posts.ts`에 수정/삭제 Server Actions를 추가합니다.

## 현재 상태 파악

### 기존 구현 (재사용 가능한 요소)

- `isEventHost()` 헬퍼: `actions/posts.ts` 내 이미 정의됨 → 재사용
- `updatePostSchema`: `lib/validations/post.ts`에 이미 정의됨 → 재사용
- `ActionResult` 타입: `@/types/action`에서 import

### 미구현 항목

- `updatePost` Server Action (본인 게시물만 수정 가능)
- `deletePost` Server Action (본인 또는 주최자 삭제 가능)

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] `updatePost` / `deletePost` 구현

**파일:** `actions/posts.ts` 하단에 추가

**updatePost 로직:**

1. 인증 확인
2. FormData에서 `postId`, `content` 추출
3. `updatePostSchema`로 Zod 검증
4. 해당 게시물의 `author_id`, `event_id` 조회
5. `author_id !== user.id` 이면 권한 오류 반환
6. `posts` 테이블 `content` 업데이트
7. `revalidatePath(/events/${event_id}/posts)` 후 `{ success: true }` 반환

**deletePost 로직:**

1. 인증 확인
2. FormData에서 `postId` 추출
3. 해당 게시물의 `author_id`, `event_id` 조회
4. `isEventHost()`로 주최자 여부 확인
5. 본인도 아니고 주최자도 아니면 권한 오류 반환
6. `posts` 테이블 해당 행 삭제
7. `revalidatePath(/events/${event_id}/posts)` 후 `{ success: true }` 반환

**추가 import 필요:**

- `updatePostSchema` — `@/lib/validations/post`에서 (기존 import에 추가)

## 수정 대상 파일

- `actions/posts.ts` — `updatePost`, `deletePost` 함수 추가

## 검증 방법

Task 47 testStrategy 기준:

1. 본인 게시물 수정 → 내용 반영 확인
2. 타인 게시물 수정 시도 → 차단 확인
3. 본인 게시물 삭제 → 정상 삭제 확인
4. 주최자가 타인 게시물 삭제 → 허용 확인
5. 비주최자 타인 게시물 삭제 시도 → 차단 확인
