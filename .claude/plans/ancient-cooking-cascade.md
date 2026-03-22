# Task 13: 이벤트 CRUD Server Actions 구현

## Context

Task 11(Zod 스키마/타입 정의)과 Task 12(Storage 유틸리티)가 완료된 상태에서,
이벤트 생성·수정·삭제·조회를 처리하는 Server Actions를 구현한다.
의존 파일들이 모두 준비되어 있고, `actions/` 폴더만 신규 생성하면 된다.

**의존 관계 확인:**

- Task 11: `done` → `lib/validations/event.ts`, `types/event.ts` 사용 가능
- Task 12: `done` → `lib/supabase/storage.ts` 사용 가능

---

## 재사용할 기존 유틸리티

| 함수/타입                 | 파일                       | 용도                     |
| ------------------------- | -------------------------- | ------------------------ |
| `createClient()`          | `lib/supabase/server.ts`   | 서버 Supabase 클라이언트 |
| `uploadEventCoverImage()` | `lib/supabase/storage.ts`  | 커버 이미지 업로드       |
| `deleteEventCoverImage()` | `lib/supabase/storage.ts`  | 커버 이미지 삭제         |
| `eventCreateSchema`       | `lib/validations/event.ts` | 생성 폼 Zod 검증         |
| `eventUpdateSchema`       | `lib/validations/event.ts` | 수정 폼 Zod 검증         |
| `EventWithHost`           | `types/event.ts`           | 조회 반환 타입           |

---

## 구현 계획

**담당 에이전트: nextjs-supabase-fullstack** (전체 Server Actions 구현)

- UI 컴포넌트 없음 → nextjs-ui-markup 에이전트 불필요

### 신규 생성 파일

1. **`types/action.ts`** — ActionResult 공통 반환 타입
2. **`actions/events.ts`** — 이벤트 CRUD Server Actions

### Subtask 순서

#### Subtask 1: `types/action.ts` ActionResult 타입 정의

```typescript
export type ActionResult<T = undefined> = {
  success: boolean;
  error?: string;
  data?: T;
};
```

#### Subtask 2~4: `actions/events.ts` CUD Actions

**주의 사항 (task details 코드 수정 필요):**

- `revalidatePath("/(host)/events")` → `revalidatePath("/events")`
  - Next.js Route Groups `(host)`는 URL에 포함되지 않음
- `redirect(`/(host)/events/${event.id}`)` → `redirect(`/events/${event.id}`)`
- `createEvent`의 임시 UUID 전략: 이미지 업로드 후 DB insert 순서 유지

**createEvent 흐름:**

1. `supabase.auth.getUser()` → 인증 확인
2. `eventCreateSchema.safeParse(rawData)` → Zod 검증
3. 커버 이미지 있으면 `uploadEventCoverImage(file, tempId)` 호출
4. `events` 테이블 insert → `revalidatePath("/events")` → `redirect("/events/${event.id}")`

**updateEvent 흐름:**

1. 인증 확인 → host_id 권한 확인
2. `eventUpdateSchema.safeParse(rawData)` → Zod 검증
3. `removeCoverImage` 플래그 또는 새 파일 업로드 분기 처리
4. update 쿼리 → `revalidatePath` 2곳 → `redirect`

**deleteEvent 흐름:**

1. 인증 확인 → host_id 권한 확인
2. `cover_image_url` 있으면 `deleteEventCoverImage` 호출
3. delete 쿼리 → `revalidatePath("/events")` → `redirect("/events")`

#### Subtask 5: 조회 함수 (getEventById, getMyEvents, getPublicEvents)

Supabase join 패턴:

```typescript
.select(`*, host:profiles!host_id(name, avatar_url)`)
```

반환 타입: `EventWithHost` / `EventWithHost[]`

#### Subtask 6: 타입 검증

- `npm run type-check` 통과 확인
- `npm run lint` 통과 확인

---

## 에이전트 분담

| Subtask | 내용                                  | 담당 에이전트             |
| ------- | ------------------------------------- | ------------------------- |
| 13.1    | ActionResult 타입 (`types/action.ts`) | nextjs-supabase-fullstack |
| 13.2    | createEvent Server Action             | nextjs-supabase-fullstack |
| 13.3    | updateEvent Server Action             | nextjs-supabase-fullstack |
| 13.4    | deleteEvent Server Action             | nextjs-supabase-fullstack |
| 13.5    | 조회 함수 3개                         | nextjs-supabase-fullstack |
| 13.6    | type-check + lint 검증                | nextjs-supabase-fullstack |

---

## 검증 방법

1. `npm run type-check` — TypeScript 컴파일 오류 없음
2. `npm run lint` — ESLint 규칙 통과
3. Supabase MCP `execute_sql`로 events/profiles 테이블 존재 확인 (선택)
