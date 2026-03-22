# Task 17: 내 이벤트 목록 페이지 구현 (주최자)

## Context

주최자가 자신이 생성한 이벤트를 카테고리 필터와 함께 2열 그리드로 확인할 수 있는 페이지를 구현합니다.
의존 태스크 13(Server Actions), 16(이벤트 카드 컴포넌트) 모두 완료된 상태이므로, 기존 함수/컴포넌트를 재사용하여 단일 파일만 수정하면 됩니다.

현재 `app/(host)/events/page.tsx`는 "준비 중입니다." 스텁 상태입니다.

---

## 수정 대상 파일

- `app/(host)/events/page.tsx` — **유일한 수정 파일**

## 재사용할 기존 구현

| 항목                        | 경로                                      | 역할                                            |
| --------------------------- | ----------------------------------------- | ----------------------------------------------- |
| `getMyEvents()`             | `actions/events.ts`                       | 현재 사용자의 이벤트 목록 조회                  |
| `EventCardMobile`           | `components/mobile/event-card-mobile.tsx` | 이벤트 카드 (props: event, href, showNewBadge?) |
| `EVENT_CATEGORIES`          | `types/event.ts`                          | 카테고리 배열 상수                              |
| `createClient()`            | `lib/supabase/server.ts`                  | 서버 Supabase 클라이언트                        |
| `Tabs/TabsList/TabsTrigger` | `components/ui/tabs`                      | 카테고리 필터 탭                                |
| `Button`                    | `components/ui/button`                    | 만들기 버튼                                     |

---

## 구현 계획 (에이전트 분담)

### Step 1 — nextjs-ui-markup 에이전트

정적 마크업을 먼저 구현합니다 (mock 데이터 사용).

**구현 내용:**

- 헤더: 제목("내 이벤트") + 이벤트 개수 텍스트 + "만들기" 버튼
- 카테고리 필터 탭: `Tabs` + `TabsList` + Link로 감싼 `TabsTrigger`
- 2열 그리드: `grid grid-cols-2 gap-3` + `EventCardMobile` 목록
- 빈 상태 UI: `Calendar` 아이콘 + 안내 메시지 + "이벤트 만들기" 버튼

**주의사항:**

- `Calendar` 아이콘은 `lucide-react`에서 반드시 import 필요 (태스크 원본 코드에 import 누락된 버그 있음)
- `Tabs`의 `defaultValue`는 `selectedCategory || "all"` 로 설정

### Step 2 — nextjs-supabase-fullstack 에이전트

Step 1 결과물에 실제 데이터 fetching 및 인증 로직을 통합합니다.

**구현 내용:**

- `'use server'` 없이 Server Component로 구현 (이미 기본값)
- `createClient()` + `supabase.auth.getUser()` → 비인증 시 `redirect("/auth/login")`
- `searchParams: Promise<{ category?: string }>` 타입 + `await searchParams`
- `getMyEvents()` 호출 후 클라이언트 사이드에서 카테고리 필터링
- `revalidatePath` 불필요 (조회 페이지)

---

## 주요 구현 로직

```typescript
// searchParams 기반 카테고리 필터링
const params = await searchParams;
const selectedCategory = params.category;
const filteredEvents = selectedCategory
  ? events.filter((event) => event.category === selectedCategory)
  : events;

// 카테고리 탭 링크 구조 (Link + TabsTrigger 조합)
<Link href="/events"><TabsTrigger value="all">전체</TabsTrigger></Link>
{EVENT_CATEGORIES.map((category) => (
  <Link key={category} href={`/events?category=${category}`}>
    <TabsTrigger value={category}>{category}</TabsTrigger>
  </Link>
))}
```

---

## 검증 방법

1. `npm run type-check` — TypeScript 오류 없음 확인
2. `npm run lint` — ESLint 오류 없음 확인
3. 브라우저 확인:
   - `/events` 접근 → 전체 이벤트 2열 그리드 표시
   - `/events?category=생일파티` → 해당 카테고리만 필터링
   - 이벤트 없을 때 → 빈 상태 UI (아이콘 + 메시지 + 버튼)
   - 미로그인 상태 접근 → `/auth/login` 리다이렉트
