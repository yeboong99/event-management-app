# Task 9: 주최자 레이아웃 + 하단 탭 내비게이션 구축

## Context

TASK-008에서 구현된 `MobileBottomNav` / `MobileHeader` 컴포넌트를 참여자(`(participant)`) 레이아웃에 이어, 주최자(`(host)`) 라우트 그룹에도 동일하게 재사용한다. 주최자 전용 탭 4개(홈, 내이벤트, 만들기, 프로필)를 갖는 레이아웃과 홈 Placeholder 페이지를 생성한다.

---

## 작업 범위

### 현재 상태 파악

- `components/mobile/mobile-bottom-nav.tsx` — `MobileBottomNav(tabs)` + `ParticipantBottomNav` export 존재
- `components/mobile/mobile-header.tsx` — `MobileHeader({ className? })` export 존재
- `app/(participant)/layout.tsx` — 참조 패턴으로 활용
- `app/(host)/` — **미존재**, 새로 생성 필요

---

## 구현 계획

### Step 1 — `HostBottomNav` export 추가 (nextjs-supabase-fullstack 에이전트)

**파일**: `components/mobile/mobile-bottom-nav.tsx`

`participantTabs` 패턴을 참고하여 파일 하단에 추가:

```typescript
import { Calendar, Home, Plus, User } from "lucide-react";

const hostTabs: Tab[] = [
  { label: "홈", href: "/home", icon: Home },
  { label: "내이벤트", href: "/events", icon: Calendar },
  { label: "만들기", href: "/events/new", icon: Plus },
  { label: "프로필", href: "/profile", icon: User },
];

export function HostBottomNav() {
  return <MobileBottomNav tabs={hostTabs} />;
}
```

> `Home`, `Plus` 아이콘을 import에 추가해야 함 (현재 `Calendar`, `Car`, `Compass`, `User`만 import)

---

### Step 2 — `app/(host)/layout.tsx` + `app/(host)/home/page.tsx` 생성 (nextjs-ui-markup 에이전트)

#### `app/(host)/layout.tsx`

`app/(participant)/layout.tsx`와 동일한 구조, `HostBottomNav`로 교체:

```typescript
import { HostBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { MobileHeader } from "@/components/mobile/mobile-header";

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen justify-center bg-muted/50">
      <div className="flex h-screen w-full max-w-[430px] flex-col bg-background shadow-lg">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <HostBottomNav />
      </div>
    </div>
  );
}
```

#### `app/(host)/home/page.tsx`

```typescript
export default function HostHomePage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">주최자 홈</h1>
      <p className="text-sm text-muted-foreground">
        주최자 홈 페이지입니다. (준비 중)
      </p>
    </div>
  );
}
```

---

## 에이전트 역할 분담

| 단계   | 에이전트                      | 작업 내용                                                                  |
| ------ | ----------------------------- | -------------------------------------------------------------------------- |
| Step 1 | **nextjs-supabase-fullstack** | `mobile-bottom-nav.tsx`에 `HostBottomNav` export 추가 (아이콘 import 포함) |
| Step 2 | **nextjs-ui-markup**          | `app/(host)/layout.tsx` 생성, `app/(host)/home/page.tsx` Placeholder 생성  |

> Step 1이 완료된 후 Step 2를 진행해야 함 (import 의존성)

---

## 수정 대상 파일

- `components/mobile/mobile-bottom-nav.tsx` — `HostBottomNav` 추가
- `app/(host)/layout.tsx` — **신규 생성**
- `app/(host)/home/page.tsx` — **신규 생성**

---

## 검증 방법

1. `npm run type-check` — TypeScript 오류 없음 확인
2. `npm run lint` — ESLint 오류 없음 확인
3. 개발 서버 실행 후 `/home` 접근 → 하단 4개 탭(홈, 내이벤트, 만들기, 프로필) 렌더링 확인
4. 탭 클릭 시 경로 이동 확인 (`/home`, `/events`, `/events/new`, `/profile`)
5. 모바일 뷰포트(430px 이하)에서 레이아웃 정상 확인
6. `(participant)` 레이아웃과 `(host)` 레이아웃이 독립적으로 작동하는지 확인
