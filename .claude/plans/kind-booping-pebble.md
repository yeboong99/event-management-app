# Task 48: getPosts 조회 함수 구현

## Context

이벤트 상세 페이지에서 공지/댓글 목록을 조회하기 위해 `getPosts` 함수가 필요합니다.
현재 `actions/posts.ts`에는 createPost, updatePost, deletePost, isEventHost, isApprovedParticipant가 있지만
조회 함수가 없습니다. `types/post.ts`의 `PostWithAuthor` 타입과 profiles JOIN을 활용하여 구현합니다.

## 분석 결과

### 현재 상태

- `actions/posts.ts`: createPost/updatePost/deletePost 존재, getPosts 없음
- `types/post.ts`: `PostWithAuthor` 타입 정의됨 (Post + profiles { id, name, avatar_url })
- `lib/supabase/server.ts`: `createClient()` 함수 제공
- `types/database.types.ts`: posts 테이블에 author_id 존재, profiles 관계는 미정의 → `as PostWithAuthor[]` 타입 캐스팅 필요

### 구현 전략

- Supabase의 실제 FK 관계는 DB에서 설정되어 있으므로 JOIN 쿼리는 정상 동작
- TypeScript 타입은 `as PostWithAuthor[]`로 캐스팅

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] getPosts 함수 추가

**파일:** `actions/posts.ts`

기존 import 블록에 `PostWithAuthor` 타입 추가 후, 파일 맨 아래에 함수 추가:

```typescript
import type { PostWithAuthor } from "@/types/post";

export async function getPosts(
  eventId: string,
  type?: "notice" | "comment",
): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      profiles (
        id,
        name,
        avatar_url
      )
    `,
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data as PostWithAuthor[];
}
```

## 검증 방법

1. TypeScript 타입 체크: `npm run type-check`
2. Lint 검사: `npm run lint`
3. Supabase Studio에서 posts 테이블에 테스트 데이터 추가 후 함수 호출 테스트
4. RLS 정책 검증: 미승인 참여자 세션으로 호출 시 빈 배열 반환 확인
