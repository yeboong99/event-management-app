# 게시판 탭 개선: 이름 변경 / 체크박스 UI / 배지 수정 / 정렬 / 페이지네이션

## Context

이벤트 상세 페이지의 "공지/댓글" 탭을 "게시판"으로 개선합니다.

개선 항목:

1. **탭 이름**: "공지/댓글" → "게시판"
2. **PostForm UI**: 주최자의 공지 선택을 라디오 버튼(댓글/공지)에서 체크박스(☑ 공지로 등록)로 변경
3. **배지 버그 수정**: `post.type === "notice"` 조건 코드는 올바르나, 배지가 눈에 띄지 않거나 미표시 → 배지 variant 개선 및 타입 명확화
4. **정렬**: 공지 글 항상 상단, 동일 타입 내에서 최신순(created_at DESC)
5. **페이지네이션**: 초기 5개 로드, "더보기" 버튼으로 5개씩 추가 로드

---

## 현재 구현 파악

- `getPosts()`: `.order("created_at", { ascending: false })` 단순 최신순 정렬, 페이지네이션 없음
- `PostForm`: RadioGroup으로 댓글/공지 선택 (주최자만)
- `PostItem`: `{post.type === "notice" && <Badge variant="default">공지</Badge>}` - 조건 로직은 맞으나 `variant="default"`는 배경색이 배지처럼 두드러지지 않을 수 있음
- `types/database.types.ts`의 posts.type은 `string`으로만 정의되어 있어 타입 안전성 부족
- `PostFeed`: 서버에서 받은 posts 배열을 그대로 렌더링, 페이지네이션 없음

---

## 구현 단계

### Step 1: [nextjs-supabase-fullstack] `actions/posts.ts` 정렬 및 페이지네이션 추가

**`getPosts` 함수 수정:**

```ts
// 기존
getPosts(eventId: string, type?: "notice" | "comment"): Promise<PostWithAuthor[]>

// 변경 후
getPosts(eventId: string, options?: { limit?: number; offset?: number }): Promise<{
  posts: PostWithAuthor[];
  hasMore: boolean;
}>
```

- 정렬: `.order("type", { ascending: false })` (notice > comment 알파벳순이므로 공지 먼저) → `.order("created_at", { ascending: false })` 순으로 2중 정렬
- 페이지네이션: `limit` 기본값 5, `offset` 기본값 0, `.range(offset, offset + limit)` (limit+1개 fetch로 hasMore 판단)
- 기존 `type` 필터 파라미터는 제거 (현재 미사용)

**`loadMorePosts` Server Action 신규 추가:**

```ts
"use server";
export async function loadMorePosts(
  eventId: string,
  offset: number,
  limit: number = 5,
);
```

- 클라이언트 컴포넌트에서 "더보기" 시 호출할 Server Action
- `getPosts` 내부 로직 재사용

### Step 2: [nextjs-supabase-fullstack] `app/(app)/events/[eventId]/page.tsx` 탭명 변경 + 초기 fetch 수정

- `<TabsTrigger value="posts">공지/댓글</TabsTrigger>` → `게시판`
- `getPosts(eventId)` → `getPosts(eventId, { limit: 5, offset: 0 })`로 변경
- `PostFeed` → `PostFeedPaginated` 컴포넌트로 교체
- props: `initialPosts`, `initialHasMore`, `eventId`, `currentUserId`, `isHost`, `canPost` 전달

### Step 3: [nextjs-supabase-fullstack] `components/shared/post-feed.tsx` 페이지네이션 클라이언트 컴포넌트로 교체

`PostFeed`를 `PostFeedPaginated`로 교체:

```tsx
"use client";
// 상태 관리: posts[], hasMore, isLoading, offset
// "더보기" 버튼 클릭 시 loadMorePosts(eventId, currentOffset) 호출
// 응답받은 posts를 기존 배열에 append
```

기존 `PostFeed` 컴포넌트는 유지하되, `PostFeedPaginated`가 내부적으로 `PostItem` 렌더링.

### Step 4: [nextjs-ui-markup] `components/forms/post-form.tsx` 체크박스 UI 교체

RadioGroup → Checkbox:

```tsx
// 기존 (주최자만 표시)
<RadioGroup>
  <RadioGroupItem value="comment" /> 댓글
  <RadioGroupItem value="notice" /> 공지
</RadioGroup>

// 변경 후
<div className="flex items-center gap-2">
  <Checkbox
    id="is-notice"
    checked={form.watch("type") === "notice"}
    onCheckedChange={(checked) => form.setValue("type", checked ? "notice" : "comment")}
  />
  <Label htmlFor="is-notice">공지로 등록</Label>
</div>
```

- RadioGroup, RadioGroupItem import 제거
- shadcn Checkbox 컴포넌트 사용 (`components/ui/checkbox.tsx` 확인 필요)
- Zod 스키마 및 `type` 필드 값 변경 없음

### Step 5: [nextjs-ui-markup] `components/shared/post-item.tsx` 배지 스타일 개선

- `variant="default"` → `variant="secondary"` 또는 구분이 명확한 커스텀 스타일로 변경
- 배지가 작성자 이름 옆에 시각적으로 눈에 띄게 표시되도록 개선
- `types/post.ts`에서 `PostWithAuthor` 타입의 `type` 필드를 `"notice" | "comment"`로 명확히 재정의 (string 대신)

---

## 핵심 파일 목록

| 파일                                  | 변경 유형                                     | 담당                      |
| ------------------------------------- | --------------------------------------------- | ------------------------- |
| `actions/posts.ts`                    | 수정 (정렬, 페이지네이션, loadMorePosts 추가) | nextjs-supabase-fullstack |
| `app/(app)/events/[eventId]/page.tsx` | 수정 (탭명, fetch, 컴포넌트 교체)             | nextjs-supabase-fullstack |
| `components/shared/post-feed.tsx`     | 대체 (PostFeedPaginated 클라이언트 컴포넌트)  | nextjs-supabase-fullstack |
| `components/forms/post-form.tsx`      | 수정 (RadioGroup → Checkbox)                  | nextjs-ui-markup          |
| `components/shared/post-item.tsx`     | 수정 (배지 스타일)                            | nextjs-ui-markup          |
| `types/post.ts`                       | 수정 (type 필드 명확화)                       | nextjs-supabase-fullstack |

---

## 검증 방법

1. `npm run dev`
2. 이벤트 상세 페이지 → "게시판" 탭 명칭 확인
3. 주최자 로그인 → PostForm에 체크박스 "공지로 등록" 표시 확인
4. 공지 글 작성 → 목록에서 `공지` 배지 표시 확인
5. 댓글 글 작성 → 공지 아래에 최신순 정렬 확인
6. 게시글 5개 초과 시 "더보기" 버튼 표시 확인
7. "더보기" 클릭 시 5개 추가 로드 확인
8. `npm run type-check` → 오류 없음
9. `npm run lint` → 오류 없음
