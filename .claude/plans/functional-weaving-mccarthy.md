# TASK-018/019 구현 계획

## Context

`/my-events` 페이지(`app/(app)/my-events/page.tsx`)는 현재 주최 중 탭이 placeholder 상태.
구조 통합(`(host)` → `(app)`) 이후 TASK-018(주최자 홈)과 TASK-019(내 이벤트 목록)는
이 페이지의 `HostingView`에 통합 구현한다.

## 현재 상태

- `app/(app)/my-events/page.tsx` — 탭 UI 존재, HostingView는 "총 0개" 하드코딩 placeholder
- `actions/events.ts:348` — `getMyEvents()` 구현됨 (category 파라미터 없음)
- `components/mobile/event-card-mobile.tsx` — EventCardMobile 구현 완료
- `components/mobile/event-category-badge.tsx` — 구현 완료
- `types/event.ts` — EVENT_CATEGORIES 상수 사용 가능

## 수정 파일

1. `actions/events.ts` — `getMyEvents` 카테고리 필터 추가
2. `app/(app)/my-events/page.tsx` — 데이터 연결 + HostingView UI 완성

---

## Step 1: nextjs-supabase-fullstack 에이전트

**담당:** 데이터 레이어 + Server Component 연결

### 1-1. `actions/events.ts` 수정

- `getMyEvents(category?: string)` 시그니처 변경
- `getPublicEvents` 패턴과 동일하게 category 필터 추가:
  ```ts
  if (category) {
    query = query.eq("category", category as EventWithHost["category"]);
  }
  ```

### 1-2. `app/(app)/my-events/page.tsx` 수정

- searchParams 타입에 `category?: string` 추가:
  ```ts
  searchParams: Promise<{ tab?: string; category?: string }>;
  ```
- hosting 탭일 때 `getMyEvents(selectedCategory)` 호출:
  ```ts
  const selectedCategory = params.category;
  const hostingEvents =
    activeTab === "hosting" ? await getMyEvents(selectedCategory) : [];
  ```
- `HostingView`에 props 전달:
  ```tsx
  <HostingView events={hostingEvents} selectedCategory={selectedCategory} />
  ```

---

## Step 2: nextjs-ui-markup 에이전트

**담당:** HostingView UI 컴포넌트 완성 (Step 1 완료 후 실행)

### `HostingView` 컴포넌트 재작성

```
props: { events: EventWithHost[], selectedCategory?: string }
```

**구현 요소:**

1. **카테고리 필터 탭** (인라인 구현 — CategoryTabsScroll은 /discover URL 하드코딩이라 재사용 불가)
   - "전체" → `/my-events?tab=hosting`
   - 각 카테고리 → `/my-events?tab=hosting&category={cat}`
   - `EVENT_CATEGORIES` import 활용
   - 선택된 탭 하이라이트 (`selectedCategory` 비교)
   - 스크롤 가능한 탭 스타일 (overflow-x-auto)

2. **헤더 영역**
   - `총 {events.length}개의 이벤트` (동적)
   - 만들기 버튼 (`/events/new`)

3. **이벤트 목록** (조건 분기)
   - events.length > 0: `grid grid-cols-2 gap-3` + `EventCardMobile` (href=`/events/${event.id}`)
   - events.length === 0: 기존 빈 상태 UI 유지 (Calendar 아이콘)

**import 목록:**

- `EventCardMobile` from `@/components/mobile/event-card-mobile`
- `EVENT_CATEGORIES` from `@/types/event`
- `Link` from `next/link`
- `cn` from `@/lib/utils`
- `EventWithHost` from `@/types/event`

---

## 검증

1. `npm run dev` 실행
2. 로그인 후 `/my-events?tab=hosting` 진입 → 주최 이벤트 카드 2열 표시 확인
3. 카테고리 탭 클릭 → URL `?tab=hosting&category=생일파티` 변경 + 필터링 확인
4. 이벤트 없을 때 빈 상태 UI 확인
5. `npm run type-check` + `npm run lint` 통과
