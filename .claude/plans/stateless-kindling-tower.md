# Phase 2 후속 개선 계획

## Context

Phase 2 완료 검토 후 발견된 4가지 미완성/버그 항목을 수정한다:

1. **posts RLS 버그**: 댓글 INSERT 정책에서 `participations.event_id = participations.event_id` (자기 참조) → 어떤 이벤트에서든 approved 이력이 있으면 모든 이벤트 댓글 작성 허용 가능
2. **getMyParticipations 컬럼 오류**: `start_at` 컬럼 참조 → 실제 컬럼명은 `event_date`, 반환 데이터가 null
3. **데드 라우트**: `participants/`, `posts/`, `carpool/`, `settlement/` 하위 폴더 모두 `/events/${eventId}`로 redirect만 하는 쓸모없는 라우트
4. **Task 12 미완성**: `my-events/page.tsx`의 `ParticipatingView`가 placeholder UI (데이터 연결 없음)

---

## 수정 대상 파일

| 파일                                                | 작업                                         |
| --------------------------------------------------- | -------------------------------------------- |
| `supabase/migrations/20260322000200_posts_rls.sql`  | 참조용 (수정 불가, 새 마이그레이션으로 패치) |
| Supabase DB (MCP)                                   | 새 마이그레이션 적용                         |
| `actions/participations.ts`                         | `start_at` → `event_date`, 쿼리 확장         |
| `types/participation.ts`                            | `ParticipationWithEvent` 타입 추가           |
| `app/(app)/events/[eventId]/participants/page.tsx`  | 삭제                                         |
| `app/(app)/events/[eventId]/posts/page.tsx`         | 삭제                                         |
| `app/(app)/events/[eventId]/carpool/page.tsx`       | 삭제                                         |
| `app/(app)/events/[eventId]/settlement/page.tsx`    | 삭제                                         |
| `app/(app)/events/[eventId]/layout.tsx`             | 삭제 (단순 children 래퍼, 불필요)            |
| `app/(app)/my-events/page.tsx`                      | `ParticipatingView` 실제 구현                |
| `components/shared/cancel-participation-button.tsx` | 신규 생성                                    |

---

## Step 1: [nextjs-supabase-fullstack] posts RLS 버그 수정 — 새 마이그레이션

**문제 원인**: `20260322000200_posts_rls.sql`의 INSERT WITH CHECK 정책에서 subquery 내
`WHERE participations.event_id = event_id` 의 `event_id`가 PostgreSQL에 의해
외부 posts 행이 아닌 participations 테이블의 컬럼으로 resolve되어 자기 참조 발생.

**수정 방법**: `mcp__supabase__apply_migration`으로 새 마이그레이션 적용

- 기존 INSERT 정책 DROP
- 올바른 alias(`p`)로 새 정책 CREATE
- `posts.event_id`를 명시적으로 참조

```sql
-- 기존 INSERT 정책 삭제
DROP POLICY IF EXISTS "주최자만 공지 작성 가능" ON posts;

-- 올바른 정책 재생성 (p alias로 self-reference 방지)
CREATE POLICY "주최자만 공지 작성 가능"
  ON posts FOR INSERT
  WITH CHECK (
    (type = 'notice' AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = posts.event_id AND events.host_id = auth.uid()
    ))
    OR
    (type = 'comment' AND (
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = posts.event_id AND events.host_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM participations p
        WHERE p.event_id = posts.event_id
          AND p.user_id = auth.uid()
          AND p.status = 'approved'
      )
    ))
  );
```

마이그레이션 파일도 수정 (기존 파일 `20260322000200_posts_rls.sql` 내용 동기화 반영)

---

## Step 2: [nextjs-supabase-fullstack] getMyParticipations 수정 + 타입 정의

**파일**: `actions/participations.ts`

**변경 사항**:

1. select 쿼리에서 `start_at` → `event_date`
2. `EventCardMobile` 재사용을 위해 events 조인을 확장 (category, host_id, profiles 포함)

```typescript
// 수정 후 select 쿼리
`
  *,
  events (
    id,
    host_id,
    title,
    category,
    event_date,
    location,
    max_participants,
    cover_image_url,
    is_public,
    created_at,
    updated_at,
    profiles (
      id,
      name,
      avatar_url
    )
  )
`;
```

**파일**: `types/participation.ts`

`ParticipationWithEvent` 타입 추가:

```typescript
import { EventWithHost } from "@/types/event";

export type ParticipationWithEvent = Participation & {
  events: EventWithHost;
};
```

---

## Step 3: [nextjs-supabase-fullstack] 데드 라우트 제거

다음 파일/폴더를 삭제 (모두 `/events/${eventId}` redirect만 하는 dead route):

- `app/(app)/events/[eventId]/participants/page.tsx` (+ 폴더)
- `app/(app)/events/[eventId]/posts/page.tsx` (+ 폴더)
- `app/(app)/events/[eventId]/carpool/page.tsx` (+ 폴더)
- `app/(app)/events/[eventId]/settlement/page.tsx` (+ 폴더)
- `app/(app)/events/[eventId]/layout.tsx` (단순 `<>{children}</>` 래퍼, 삭제 가능)

실제 탭 콘텐츠는 `app/(app)/events/[eventId]/page.tsx`의 shadcn `Tabs` 컴포넌트 내에 인라인으로 모두 구현되어 있으므로 기능 영향 없음.

---

## Step 4: [nextjs-supabase-fullstack] CancelParticipationButton 신규 Client Component

**파일**: `components/shared/cancel-participation-button.tsx` (신규)

- `'use client'` 선언
- Props: `participationId: string`, `eventId: string`
- `ConfirmDialog` (`components/shared/confirm-dialog.tsx`) 재사용
- `useTransition`으로 로딩 상태 처리
- `cancelParticipation` Server Action 호출
- 성공/실패 toast 표시

```typescript
// 참조 패턴: 이벤트 삭제 버튼의 ConfirmDialog 사용 방식 (page.tsx 263-275)
// 참조: ConfirmDialog props (title, description, confirmLabel, variant, onConfirm, trigger)
```

---

## Step 5: [nextjs-supabase-fullstack] ParticipatingView 실제 구현

**파일**: `app/(app)/my-events/page.tsx`

### 페이지 레벨 변경

searchParams에 `status` 파라미터 추가:

```typescript
searchParams: Promise<{ tab?: string; category?: string; status?: string }>;
```

데이터 페칭 조건부 추가:

```typescript
// participating 탭일 때만 데이터 fetch
const participations =
  activeTab === "participating"
    ? await getMyParticipations(selectedStatus)
    : [];
```

### ParticipatingView 컴포넌트 구현

Props: `participations: ParticipationWithEvent[]`, `selectedStatus?: string`

**상태 필터 탭** (URL SearchParams 기반, 인라인 구현):

```
전체:   /my-events            (status 없음)
대기중: /my-events?status=pending
승인:   /my-events?status=approved
거절:   /my-events?status=rejected
```

**카드 목록**:

- `EventCardMobile` 재사용: `participation.events as EventWithHost`
- href: `/events/${participation.event_id}`
- 카드 아래 또는 오버레이에 참여 상태 배지 (`Badge` shadcn/ui 컴포넌트)
  - pending: `variant="secondary"` "대기중"
  - approved: `variant="default"` "승인됨"
  - rejected: `variant="destructive"` "거절됨"

**취소 버튼** (pending 상태 카드에만):

- `CancelParticipationButton` 컴포넌트 (Step 4에서 생성)
- participationId, eventId 전달

**빈 상태 UI**:

- Phase_2.md 명세: "아직 참여한 이벤트가 없습니다" + "이벤트 탐색하기" 버튼
- 기존 placeholder와 동일한 구조 유지

---

## 검증 방법

### DB RLS 검증

```sql
-- 수정 후 정책 확인 (자기 참조 없어야 함)
SELECT policyname, with_check
FROM pg_policies
WHERE tablename = 'posts' AND cmd = 'INSERT';
-- participations.event_id = participations.event_id 없어야 함
-- p.event_id = posts.event_id 형태여야 함
```

### 코드 검증

```bash
npm run type-check   # 타입 오류 없어야 함
npm run lint         # lint 오류 없어야 함
```

### 기능 검증

1. `getMyParticipations` 반환 데이터에 `events.event_date` 값이 정상 포함되는지
2. `/my-events` 참여 중 탭에서 실제 신청 이벤트 카드 목록 표시 확인
3. 상태 필터(전체/대기중/승인/거절) 클릭 시 URL 변경 및 필터 적용 확인
4. pending 카드의 취소 버튼 → ConfirmDialog → cancelParticipation 실행 확인
5. `/events/${eventId}/participants` 직접 접근 시 404 반환 확인 (데드 라우트 제거됨)
6. comments POST 시 다른 이벤트의 approved 참여자가 DB 레벨에서 차단되는지 확인
