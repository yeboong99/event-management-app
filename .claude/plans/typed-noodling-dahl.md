# Task 19: 이벤트 탐색 페이지 구현 (참여자)

## Context

참여자가 공개 이벤트를 카테고리 필터와 함께 탐색할 수 있는 페이지를 구현한다.
`app/(participant)/discover/page.tsx`는 이미 존재하지만 스켈레톤 상태(제목만 있는 빈 페이지)이며,
`getPublicEvents`, `EventCardMobile`, `EVENT_CATEGORIES` 등 필요한 의존 요소는 모두 구현 완료되어 있다.

---

## 사전 확인된 의존 요소

| 항목                              | 위치                                      | 상태               |
| --------------------------------- | ----------------------------------------- | ------------------ |
| `getPublicEvents(category?)`      | `actions/events.ts`                       | ✅ 구현 완료       |
| `EventWithHost` 타입              | `types/event.ts`                          | ✅ 구현 완료       |
| `EVENT_CATEGORIES` 상수           | `types/event.ts`                          | ✅ 6개 카테고리    |
| `EventCardMobile`                 | `components/mobile/event-card-mobile.tsx` | ✅ props 확인 완료 |
| `Tabs`, `TabsList`, `TabsTrigger` | `components/ui/tabs.tsx`                  | ✅ 존재            |

---

## 구현 전략 (에이전트 분담)

### Step 1 — UI 마크업 (nextjs-ui-markup 에이전트)

**담당:** `app/(participant)/discover/page.tsx`의 정적 UI 구조 작성

작업 내용:

- 목 데이터(빈 배열 + 하드코딩 카테고리)를 사용해 전체 레이아웃 구성
- 헤더 영역 (`h1` + 설명 텍스트)
- 카테고리 가로 스크롤 탭 (`Tabs` + `TabsList` + `TabsTrigger`, `overflow-x-auto`)
- 이벤트 2열 그리드 (`grid grid-cols-2 gap-3`)
- 빈 상태 UI (`Calendar` 아이콘 + 안내 텍스트)
- 이벤트 개수 표시 텍스트

### Step 2 — 서버 액션 연동 (nextjs-supabase-fullstack 에이전트)

**담당:** UI에 실제 데이터 연결

작업 내용:

- `searchParams: Promise<{ category?: string }>` props 추가 및 `await`
- `getPublicEvents(selectedCategory)` 호출로 실제 이벤트 목록 조회
- `Link` + `TabsTrigger`로 URL searchParams 기반 카테고리 필터 연결
  - 전체: `/discover`
  - 카테고리: `/discover?category=${category}`
- `EventCardMobile`에 `event`, `href={/events/${event.id}}`, `showNewBadge` prop 전달

---

## 수정 대상 파일

- `app/(participant)/discover/page.tsx` — **단일 파일 수정** (스켈레톤 → 완전 구현)

---

## 최종 구현 코드 (참고)

```typescript
import { Calendar } from "lucide-react";
import Link from "next/link";
import { getPublicEvents } from "@/actions/events";
import { EventCardMobile } from "@/components/mobile/event-card-mobile";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EVENT_CATEGORIES } from "@/types/event";

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function DiscoverPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedCategory = params.category;
  const events = await getPublicEvents(selectedCategory);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">탐색</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          참여할 수 있는 이벤트를 찾아보세요
        </p>
      </div>

      {/* 카테고리 세그먼트 탭 (가로 스크롤) */}
      <div className="overflow-x-auto">
        <Tabs defaultValue={selectedCategory || "all"} className="w-full">
          <TabsList className="inline-flex w-auto gap-2">
            <Link href="/discover">
              <TabsTrigger value="all">전체</TabsTrigger>
            </Link>
            {EVENT_CATEGORIES.map((category) => (
              <Link key={category} href={`/discover?category=${category}`}>
                <TabsTrigger value={category}>{category}</TabsTrigger>
              </Link>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* 이벤트 목록 */}
      {events.length > 0 ? (
        <>
          <div className="text-sm text-muted-foreground">
            {events.length}개의 이벤트
          </div>
          <div className="grid grid-cols-2 gap-3">
            {events.map((event) => (
              <EventCardMobile
                key={event.id}
                event={event}
                href={`/events/${event.id}`}
                showNewBadge
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="mb-4 h-16 w-16 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">
            {selectedCategory
              ? `${selectedCategory} 이벤트가 없습니다`
              : "아직 공개된 이벤트가 없습니다"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            나중에 다시 확인해보세요!
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 검증 방법

1. `npm run type-check` — TypeScript 오류 없음 확인
2. `npm run lint` — ESLint 오류 없음 확인
3. `npm run build` — 빌드 성공 확인
4. 로컬 개발 서버에서 `/discover` 접속:
   - 공개 이벤트 2열 그리드 표시 확인
   - 카테고리 탭 클릭 시 URL 변경 확인
   - NEW 배지 (24시간 이내 이벤트) 확인
   - 빈 상태 UI 확인 (이벤트 없는 카테고리 선택)
