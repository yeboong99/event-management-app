# 컴포넌트 패턴 가이드

> Next.js 16 App Router + React 19 환경에서 효율적이고 재사용 가능한 컴포넌트 작성 패턴

## 컴포넌트 분류

| 분류              | 위치                 | 설명                                       |
| ----------------- | -------------------- | ------------------------------------------ |
| UI 컴포넌트       | `components/ui/`     | shadcn/ui 기본 컴포넌트 (Button, Input 등) |
| 폼 컴포넌트       | `components/forms/`  | 폼 + 검증 로직 포함                        |
| 레이아웃 컴포넌트 | `components/layout/` | Header, Footer, Sidebar 등                 |
| 공유 컴포넌트     | `components/shared/` | 도메인 로직 포함 재사용 컴포넌트           |
| 페이지 컴포넌트   | `app/**/page.tsx`    | 라우트 진입점 (Server Component)           |

## 기본 컴포넌트 작성 패턴

### Props 타입 정의

```tsx
// 인터페이스보다 type을 선호 (union 타입 활용 용이)
// HTML 속성을 확장할 때는 ComponentPropsWithoutRef 사용
type EventCardProps = {
  title: string;
  date: string;
  description?: string;
} & React.ComponentPropsWithoutRef<"div">;

export function EventCard({
  title,
  date,
  description,
  className,
  ...props
}: EventCardProps) {
  return (
    <div className={cn("rounded-lg border p-4", className)} {...props}>
      <h3 className="font-semibold">{title}</h3>
      <time className="text-sm text-muted-foreground">{date}</time>
      {description && <p className="mt-2">{description}</p>}
    </div>
  );
}
```

### children 패턴

```tsx
type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode; // 액션 버튼 영역
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

// 사용
<PageHeader title="이벤트" description="모든 이벤트를 관리하세요">
  <Button>새 이벤트</Button>
</PageHeader>;
```

## Server Component 패턴

### 비동기 데이터 Fetching 컴포넌트

```tsx
// components/shared/event-list.tsx (Server Component)
import { getEvents } from "@/lib/data/events";
import { EventCard } from "@/components/shared/event-card";
import { EmptyState } from "@/components/shared/empty-state";

export async function EventList() {
  const events = await getEvents();

  if (events.length === 0) {
    return <EmptyState message="등록된 이벤트가 없습니다" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} {...event} />
      ))}
    </div>
  );
}
```

### Server Component에서 Client Component 조합

```tsx
// app/events/page.tsx (Server Component)
import { Suspense } from "react";
import { EventList } from "@/components/shared/event-list";
import { EventFilter } from "@/components/shared/event-filter"; // Client Component
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="이벤트" />
      {/* 필터는 사용자 인터랙션이 필요하므로 Client Component */}
      <EventFilter />
      {/* 데이터 목록은 Suspense로 래핑하여 스트리밍 */}
      <Suspense fallback={<EventListSkeleton />}>
        <EventList />
      </Suspense>
    </div>
  );
}

function EventListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-lg" />
      ))}
    </div>
  );
}
```

## Client Component 패턴

### 최소 범위 Client Boundary

```tsx
// ❌ 잘못된 패턴: 전체 카드를 Client Component로 만듦
"use client";
export function EventCard({ event }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  return (
    <div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <button onClick={() => setIsBookmarked(!isBookmarked)}>북마크</button>
    </div>
  );
}

// ✅ 올바른 패턴: 인터랙티브 부분만 Client Component로 분리
// event-card.tsx (Server Component)
export function EventCard({ event }) {
  return (
    <div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <BookmarkButton eventId={event.id} />
    </div>
  );
}

// bookmark-button.tsx (Client Component)
("use client");
export function BookmarkButton({ eventId }: { eventId: string }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  return (
    <button onClick={() => setIsBookmarked(!isBookmarked)}>
      {isBookmarked ? "북마크 해제" : "북마크"}
    </button>
  );
}
```

### 제어 컴포넌트와 useActionState

```tsx
"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/profile";

export function ProfileForm({ defaultValues }: { defaultValues: UserProfile }) {
  const [state, action, isPending] = useActionState(updateProfile, undefined);

  return (
    <form action={action}>
      <input name="name" defaultValue={defaultValues.name} />
      {state?.errors?.name && (
        <p className="text-sm text-destructive">{state.errors.name[0]}</p>
      )}
      <button type="submit" disabled={isPending}>
        {isPending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
```

## 조건부 렌더링 패턴

### 인증 상태 기반 렌더링

```tsx
// Server Component에서 인증 체크
import { createClient } from "@/lib/supabase/server";

export async function AuthGuard({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SignInPrompt />;
  }

  return <>{children}</>;
}
```

### 빈 상태 (Empty State)

```tsx
type EmptyStateProps = {
  icon?: React.ReactNode;
  message: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

// 사용
<EmptyState
  icon={<CalendarIcon className="h-12 w-12" />}
  message="등록된 이벤트가 없습니다"
  action={
    <Button asChild>
      <Link href="/events/new">이벤트 만들기</Link>
    </Button>
  }
/>;
```

## Composition 패턴

### Compound Component

```tsx
// shadcn/ui의 Card처럼 합성 패턴 활용
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// 도메인 특화 합성 컴포넌트
export function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardContent>
    </Card>
  );
}
```

### Render Props / Slot 패턴

```tsx
// asChild 패턴 (shadcn/ui의 Slot 활용)
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Button의 스타일을 Link에 적용
<Button asChild variant="outline">
  <Link href="/events">이벤트 보기</Link>
</Button>;
```

## 리스트 렌더링 패턴

### 서버 사이드 페이지네이션

```tsx
// app/events/page.tsx
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;
  const currentPage = Number(page);
  const { events, totalPages } = await getEventsPaginated(currentPage);

  return (
    <div>
      <EventList events={events} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}

// components/shared/pagination.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
};

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild disabled={currentPage <= 1}>
        <Link href={`?page=${currentPage - 1}`}>이전</Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={currentPage >= totalPages}
      >
        <Link href={`?page=${currentPage + 1}`}>다음</Link>
      </Button>
    </div>
  );
}
```

## 핵심 원칙 요약

1. **Server Component 기본**: `'use client'`는 반드시 필요한 경우에만
2. **Props 직렬화 가능**: Server → Client로 전달하는 props는 직렬화 가능한 값만 (함수, Date 등 불가, Server Action은 예외)
3. **Client 경계 최소화**: 인터랙티브한 최소 단위만 Client Component로 분리
4. **데이터는 서버에서**: fetch는 Server Component 또는 Server Action에서 수행
5. **Suspense 적극 활용**: 비동기 Server Component는 Suspense로 래핑하여 스트리밍
6. **cn() 유틸 사용**: className 조합 시 항상 `cn()` 사용으로 충돌 방지
7. **HTML 속성 전파**: `...props`와 `className` 병합으로 유연한 컴포넌트 작성
