# Plan: Task 36 - 권한 검증 헬퍼 함수 및 createPost Server Action 구현

## Context

공지/댓글 기능에서 type별 권한 분기가 필요합니다.

- 공지(notice): 이벤트 주최자만 작성 가능
- 댓글(comment): 주최자 또는 승인된 참여자만 작성 가능

Task 34(Zod 스키마 + 타입 정의)가 완료되어 필요한 의존 파일이 모두 존재합니다.

## 의존 파일 (이미 존재)

- `lib/validations/post.ts` — `createPostSchema` (eventId, type, content)
- `types/action.ts` — `ActionResult<T>` 타입
- `lib/supabase/server.ts` — `createClient()`

## 구현 단계

### Step 1: [nextjs-supabase-fullstack] `actions/posts.ts` 신규 생성

**경로:** `actions/posts.ts`

**구현 내용:**

1. **`isEventHost(supabase, eventId, userId)`** 헬퍼
   - `events` 테이블에서 `host_id` 조회
   - `host_id === userId` 여부 반환

2. **`isApprovedParticipant(supabase, eventId, userId)`** 헬퍼
   - `participations` 테이블에서 `status = 'approved'` 레코드 조회
   - 존재 여부 반환

3. **`createPost(formData: FormData): Promise<ActionResult>`** Server Action
   - `getUser()`로 인증 확인
   - FormData 파싱: eventId, type, content
   - `createPostSchema.safeParse()` 검증
   - type === 'notice': `isEventHost` 확인 → 아니면 에러
   - type === 'comment': host가 아닐 경우 `isApprovedParticipant` 확인 → 아니면 에러
   - `posts` 테이블 insert (event_id, author_id, type, content)
   - `revalidatePath('/events/${eventId}/posts')`
   - `ActionResult` 반환

**참조 패턴:** `actions/participations.ts` 와 동일한 구조 사용

## 검증

1. `npm run type-check` — 타입 오류 없음 확인
2. `npm run lint` — ESLint 오류 없음 확인
3. 권한 시나리오 수동 테스트:
   - 주최자 공지 작성 → 성공
   - 비주최자 공지 작성 → "공지는 주최자만 작성할 수 있습니다." 에러
   - 승인 참여자 댓글 작성 → 성공
   - 미승인 참여자 댓글 작성 → "승인된 참여자만 댓글을 작성할 수 있습니다." 에러
   - content 빈 문자열 → Zod 에러 반환
