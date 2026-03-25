# Task 46: getParticipations / getMyParticipations / getParticipationStatus 조회 함수 구현

## Context

Task 45에서 구현된 참여 신청/승인/거절/취소/출석 등의 뮤테이션 함수에 이어,
참여 데이터를 **조회**하는 함수 3종을 `actions/participations.ts`에 추가합니다.

- 이벤트 상세 페이지에서 참여자 목록을 표시하거나 버튼 상태(이미 신청했는지)를 확인하기 위해 필요
- 내 참여 목록 페이지(마이페이지)에서 참여한 이벤트 목록을 조회하기 위해 필요

## 수정 대상 파일

- **`actions/participations.ts`** — 조회 함수 3개 추가
- **`types/participation.ts`** — `ParticipationWithProfile` 타입 이미 정의됨 (수정 불필요)

## 현재 상태

`actions/participations.ts`에는 이미 5개의 뮤테이션 함수가 구현되어 있습니다:

- `applyParticipation`, `approveParticipation`, `rejectParticipation`, `cancelParticipation`, `toggleAttendance`

사용 중인 import:

- `createClient` from `@/lib/supabase/server`
- `Participation`, `ParticipationWithProfile` 타입은 `types/participation.ts`에 정의됨

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] 조회 함수 3개 추가

`actions/participations.ts` 파일 하단에 아래 3개 함수를 추가합니다.

#### 1. `getParticipations` — 이벤트별 참여자 목록 (profiles JOIN)

```typescript
export async function getParticipations(
  eventId: string,
  status?: string,
): Promise<ParticipationWithProfile[]> {
  const supabase = await createClient();

  let query = supabase
    .from("participations")
    .select(`*, profiles (id, name, avatar_url, email)`)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data as ParticipationWithProfile[];
}
```

#### 2. `getMyParticipations` — 현재 로그인 사용자의 참여 목록 (events JOIN)

```typescript
export async function getMyParticipations(status?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  let query = supabase
    .from("participations")
    .select(`*, events (id, title, start_at, location, cover_image_url)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data;
}
```

#### 3. `getParticipationStatus` — 특정 사용자의 단일 참여 상태 조회

```typescript
export async function getParticipationStatus(
  eventId: string,
  userId: string,
): Promise<Participation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("participations")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);

  return data;
}
```

- `PGRST116`: 행이 없을 때 PostgREST가 반환하는 에러 코드 → `null` 반환 처리

### import 추가

파일 상단에 `Participation`, `ParticipationWithProfile` 타입 import 추가:

```typescript
import { Participation, ParticipationWithProfile } from "@/types/participation";
```

## 검증 방법

1. `npm run type-check` — 타입 오류 없음 확인
2. `npm run lint` — ESLint 통과 확인
3. 로컬 dev 서버에서 해당 함수를 호출하는 페이지/컴포넌트에서 데이터 정상 반환 확인
   - `getParticipations`: 이벤트 참여자 목록 조회
   - `getMyParticipations`: 내 참여 목록 조회 (status 필터 포함)
   - `getParticipationStatus`: 참여하지 않은 이벤트 조회 시 `null` 반환 확인
