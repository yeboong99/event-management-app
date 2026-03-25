# Task 51: post-form.tsx Client Component 구현

## Context

공지/댓글 작성 폼(`components/forms/post-form.tsx`)이 미구현 상태로 주석 처리되어 있음.
`actions/posts.ts`의 `createPost` Server Action과 `lib/validations/post.ts`의 `createPostSchema`가 이미 준비되어 있어 폼 컴포넌트만 구현하면 됨.

## 구현 범위

1. `components/forms/post-form.tsx` 신규 생성
2. `app/(app)/events/[eventId]/posts/page.tsx` — PostForm import 주석 해제 및 실제 렌더링

## 핵심 의존 파일

- `actions/posts.ts` — `createPost(formData)` → `Promise<ActionResult>`
- `lib/validations/post.ts` — `createPostSchema`, `CreatePostInput`
- `components/forms/event-form.tsx` — 기존 폼 패턴 참조
- `app/(app)/events/[eventId]/posts/page.tsx` — PostForm 사용 위치 (주석 해제 필요)

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] post-form.tsx 컴포넌트 구현

`components/forms/post-form.tsx` 파일 생성:

- `"use client"` Client Component
- `useForm<CreatePostInput>` + `zodResolver(createPostSchema)`
- `useTransition()` 으로 pending 상태 관리
- **주최자(`isHost=true`)만** type Radio Group(공지/댓글) 표시
- Textarea: rows=3, maxLength=1000
- `form.watch("content")` 로 실시간 글자 수 표시 (`{content.length}/1000`)
- 제출: FormData 구성 → `createPost(formData)` 호출
- 성공: `toast.success()` + `form.reset()`
- 실패: `toast.error()`

### Step 2: [nextjs-supabase-fullstack] posts page.tsx PostForm 주석 해제

`app/(app)/events/[eventId]/posts/page.tsx`에서:

- PostForm import 주석 해제
- `{canPost && <PostForm eventId={eventId} isHost={isHost} />}` 렌더링 추가

## 검증

1. `npm run type-check` — 타입 에러 없음 확인
2. `npm run lint` — ESLint 통과 확인
3. 브라우저에서 이벤트 게시판 접근:
   - 주최자: 공지/댓글 Radio Group 표시 확인
   - 참여자: Radio Group 숨김, Textarea만 표시 확인
   - 글자 입력 시 실시간 카운터(`0/1000`) 업데이트 확인
   - 빈 내용 제출 → Zod 에러 메시지 표시 확인
   - 정상 제출 → toast 표시 + 폼 초기화 + 게시물 목록 갱신 확인
