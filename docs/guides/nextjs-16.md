# Next.js 16 개발 가이드

> Next.js 16 App Router 프로젝트 개발 시 따라야 할 핵심 규칙과 가이드라인

## Server Components vs Client Components

### 기본 원칙

Next.js App Router에서 모든 컴포넌트는 **기본적으로 Server Component**입니다.

```tsx
// Server Component (기본값 - 'use client' 없음)
// 서버에서 실행되며, 번들에 포함되지 않음
export default async function EventList() {
  const events = await getEvents(); // 서버에서 직접 데이터 fetch
  return (
    <ul>
      {events.map((event) => (
        <li key={event.id}>{event.title}</li>
      ))}
    </ul>
  );
}
```

### `'use client'` 선언이 필요한 경우

다음 기능을 사용할 때만 Client Component로 전환:

- `useState`, `useReducer`, `useEffect` 등 React 훅
- `onClick`, `onChange` 등 이벤트 핸들러
- `useRouter`, `useSearchParams` 등 브라우저 전용 API
- `useForm` (React Hook Form) 등 클라이언트 전용 라이브러리

```tsx
"use client";

import { useState } from "react";

export function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  return <button onClick={() => setLikes(likes + 1)}>{likes}</button>;
}
```

### 컴포넌트 분리 패턴

**Server Component에서 데이터를 fetch하고, Client Component에 props로 전달:**

```tsx
// app/events/[id]/page.tsx (Server Component)
import { getEvent } from "@/lib/data";
import { EventActions } from "@/components/shared/event-actions";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  return (
    <div>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
      {/* 인터랙션이 필요한 부분만 Client Component */}
      <EventActions eventId={event.id} initialLikes={event.likes} />
    </div>
  );
}
```

### Client Component 경계 최소화

```
// 잘못된 패턴: 페이지 전체를 Client Component로 만듦
'use client'  // ❌ 전체 페이지에 선언

// 올바른 패턴: 인터랙티브한 부분만 Client Component로 분리
// page.tsx (Server Component)
import { InteractiveSection } from './interactive-section'  // ✅ 일부만 Client

export default async function Page() {
  const data = await fetchData()
  return (
    <div>
      <StaticContent data={data} />
      <InteractiveSection initialData={data} />
    </div>
  )
}
```

## 라우팅 & 네비게이션

### Dynamic Routes

```tsx
// app/events/[id]/page.tsx
// Next.js 16에서 params는 Promise
export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ...
}
```

### Search Params

```tsx
// Next.js 16에서 searchParams도 Promise
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; query?: string }>;
}) {
  const { page = "1", query = "" } = await searchParams;
  // ...
}
```

### 프로그래밍 방식 네비게이션

```tsx
// Server Component에서
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  // ...
}

// Client Component에서
("use client");
import { useRouter } from "next/navigation";

export function LoginButton() {
  const router = useRouter();
  const handleLogin = async () => {
    await login();
    router.push("/dashboard");
    router.refresh(); // 서버 컴포넌트 데이터 갱신
  };
  return <button onClick={handleLogin}>로그인</button>;
}
```

## Server Actions

### 정의 및 사용

```tsx
// actions/events.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eventFormSchema } from "@/lib/validations/event";

// 반환 타입을 명확히 정의
type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createEvent(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  // 1. 입력값 검증
  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
  };

  const validated = eventFormSchema.safeParse(rawData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  // 2. 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { message: "인증이 필요합니다." };
  }

  // 3. 데이터 저장
  const { error } = await supabase
    .from("events")
    .insert({ ...validated.data, user_id: user.id });

  if (error) {
    return { message: "이벤트 생성에 실패했습니다." };
  }

  // 4. 캐시 무효화 및 리다이렉트
  revalidatePath("/events");
  redirect("/events");
}
```

### useActionState와 함께 사용

```tsx
"use client";

import { useActionState } from "react";
import { createEvent } from "@/actions/events";
import { Button } from "@/components/ui/button";

export function CreateEventForm() {
  const [state, action, isPending] = useActionState(createEvent, undefined);

  return (
    <form action={action}>
      <input name="title" />
      {state?.errors?.title && (
        <p className="text-sm text-destructive">{state.errors.title[0]}</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "생성 중..." : "이벤트 생성"}
      </Button>
    </form>
  );
}
```

## 데이터 Fetching

### Server Component에서 직접 fetch

```tsx
// 별도의 API 레이어 없이 서버에서 직접 데이터 접근
export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  return <EventList events={events ?? []} />;
}
```

### 데이터 함수 분리 (권장)

```tsx
// lib/data/events.ts
import { createClient } from "@/lib/supabase/server";

export async function getEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getEvent(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
```

## 캐싱 & Revalidation

### `use cache` 디렉티브 (Next.js 15+)

```tsx
// 컴포넌트 레벨 캐싱
async function EventStats() {
  "use cache";
  const stats = await getEventStats();
  return <div>{stats.total} 개의 이벤트</div>;
}

// 함수 레벨 캐싱
async function getPopularEvents() {
  "use cache";
  const supabase = await createClient();
  return supabase
    .from("events")
    .select("*")
    .order("views", { ascending: false })
    .limit(10);
}
```

### 캐시 무효화

```tsx
import { revalidatePath, revalidateTag } from "next/cache";

// 경로 기반 무효화
revalidatePath("/events"); // 특정 경로
revalidatePath("/events", "layout"); // 레이아웃 포함

// 태그 기반 무효화
revalidateTag("events");
```

## 에러 핸들링

### error.tsx

```tsx
// app/events/error.tsx
"use client"; // 반드시 Client Component

export default function EventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <h2 className="text-xl font-semibold">문제가 발생했습니다</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
```

### not-found.tsx

```tsx
// app/events/[id]/not-found.tsx
import Link from "next/link";

export default function EventNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <h2 className="text-xl font-semibold">이벤트를 찾을 수 없습니다</h2>
      <Link href="/events">이벤트 목록으로 돌아가기</Link>
    </div>
  );
}
```

```tsx
// page.tsx에서 사용
import { notFound } from "next/navigation";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  // ...
}
```

## 로딩 UI

### loading.tsx (Suspense 자동 래핑)

```tsx
// app/events/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function EventsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-lg" />
      ))}
    </div>
  );
}
```

### Suspense를 직접 사용한 스트리밍

```tsx
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div>
      <h1>대시보드</h1>
      {/* 독립적인 데이터 요청을 병렬로 스트리밍 */}
      <Suspense fallback={<StatsSkeleton />}>
        <EventStats />
      </Suspense>
      <Suspense fallback={<ListSkeleton />}>
        <RecentEvents />
      </Suspense>
    </div>
  );
}
```

## Metadata

```tsx
// 정적 메타데이터
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이벤트 목록",
  description: "모든 이벤트를 확인하세요",
};

// 동적 메타데이터
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  return {
    title: event.title,
    description: event.description,
  };
}
```

## Middleware

```tsx
// middleware.ts (프로젝트 루트)
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 보호된 경로에 비인증 접근 차단
  if (request.nextUrl.pathname.startsWith("/protected") && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // 정적 파일과 API 라우트 제외
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
```

## 핵심 규칙 요약

| 규칙                          | 설명                                                           |
| ----------------------------- | -------------------------------------------------------------- |
| Server Component 우선         | `'use client'`는 인터랙션이 필요한 최소 범위에만 적용          |
| params/searchParams는 Promise | Next.js 16에서 `await params`, `await searchParams` 필수       |
| 데이터 fetch는 서버에서       | Server Component 또는 Server Action에서 데이터 접근            |
| Server Action 검증 필수       | Zod로 입력값 검증 후 데이터 처리                               |
| 에러 경계 설정                | 주요 라우트에 `error.tsx`, `not-found.tsx` 배치                |
| 로딩 UI 제공                  | `loading.tsx` 또는 `Suspense`로 스트리밍                       |
| Metadata 설정                 | 모든 페이지에 적절한 `metadata` export                         |
| 미들웨어 최소화               | 인증 체크 등 꼭 필요한 로직만, 무거운 작업은 서버 컴포넌트에서 |
