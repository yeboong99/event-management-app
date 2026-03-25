# Task 34: 참여 및 공지/댓글 Zod 스키마와 공통 타입 정의

## Context

참여 관리(Task 35~37)와 공지/댓글 기능(Task 38~40) 구현에 앞서, 폼 검증과 타입 안전성을 위한 기반 파일을 생성합니다. Task 33(이벤트 스키마/타입 정의)과 동일한 패턴을 따릅니다.

**의존성**: Task 33 완료 ✅ (lib/validations/event.ts, types/event.ts 존재 확인)

## 기존 패턴 참조

- 검증 스키마: `lib/validations/event.ts` — Zod + `database.types.ts` Constants/Enums 참조
- 도메인 타입: `types/event.ts` — DB Row 타입 별칭 + `z.infer<>` 폼 타입 + 확장 조인 타입

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] 4개 파일 생성

생성할 파일:

**1. `lib/validations/participation.ts`**

- `applyParticipationSchema`: eventId(uuid), message(optional, max 200)
- `updateParticipationStatusSchema`: participationId(uuid), eventId(uuid), status enum("approved" | "rejected")
- `toggleAttendanceSchema`: participationId(uuid), attended(boolean)
- 타입 export: `ApplyParticipationInput`, `UpdateParticipationStatusInput`, `ToggleAttendanceInput`

**2. `types/participation.ts`**

- `Participation`: `Database["public"]["Tables"]["participations"]["Row"]`
- `ParticipationInsert`: `Database["public"]["Tables"]["participations"]["Insert"]`
- `ParticipationStatus`: `Database["public"]["Enums"]["participation_status"]`
- `ParticipationWithProfile`: Participation + profiles 조인 타입 (id, name, avatar_url, email)

**3. `lib/validations/post.ts`**

- `createPostSchema`: eventId(uuid), type enum("notice" | "comment"), content(min 1, max 1000)
- `updatePostSchema`: postId(uuid), content(min 1, max 1000)
- 타입 export: `CreatePostInput`, `UpdatePostInput`

**4. `types/post.ts`**

- `Post`: `Database["public"]["Tables"]["posts"]["Row"]`
- `PostInsert`: `Database["public"]["Tables"]["posts"]["Insert"]`
- `PostWithAuthor`: Post + profiles 조인 타입 (id, name, avatar_url)

## 검증

1. `npm run type-check` — 타입 오류 없음 확인
2. `npm run lint` — ESLint 오류 없음 확인

## 수정 파일 목록

- `lib/validations/participation.ts` (신규)
- `types/participation.ts` (신규)
- `lib/validations/post.ts` (신규)
- `types/post.ts` (신규)
