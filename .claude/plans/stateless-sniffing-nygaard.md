# Task 15: 이벤트 생성 페이지 구현 (주최자)

## Context

Task 14(EventForm 컴포넌트)가 완료된 상태에서, 주최자가 새 이벤트를 생성하는 페이지를 완성합니다.
현재 `page.tsx`에는 기본 렌더링만 있고, **Supabase 인증 확인**과 **헤더 UI 개선**이 누락되어 있습니다.

### 현재 상태 (수정 필요)

```typescript
// app/(host)/events/new/page.tsx (현재)
import { EventForm } from "@/components/forms/event-form";

export default function HostEventNewPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">이벤트 만들기</h1>
      <EventForm mode="create" />
    </div>
  );
}
```

### 목표 상태

```typescript
// app/(host)/events/new/page.tsx (목표)
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/forms/event-form";

export default async function HostEventNewPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">새 이벤트 만들기</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          이벤트 정보를 입력하여 새로운 이벤트를 생성하세요.
        </p>
      </div>
      <EventForm mode="create" />
    </div>
  );
}
```

---

## 구현 계획

### Step 1 — nextjs-ui-markup 에이전트: 페이지 헤더 UI 마크업

**담당:** 페이지 헤더 레이아웃 개선 (비즈니스 로직 없음)

- `h1` 스타일: `text-xl font-semibold` → `text-2xl font-bold text-foreground`
- 제목 텍스트: `"이벤트 만들기"` → `"새 이벤트 만들기"`
- 제목 아래 설명 문구 추가: `<p className="mt-1 text-sm text-muted-foreground">`
- 헤더 섹션을 `<div className="mb-4">`로 감싸기

**수정 파일:** `app/(host)/events/new/page.tsx`

---

### Step 2 — nextjs-supabase-fullstack 에이전트: 인증 확인 로직 추가

Step 1 결과에 이어서 서버 사이드 인증 처리 추가.

**담당:** Supabase 인증 확인 및 Server Component 변환

- `async` 함수로 변환
- `createClient()` (`lib/supabase/server.ts`) 호출로 Supabase 서버 클라이언트 생성
- `supabase.auth.getUser()`로 현재 사용자 확인
- 비인증 사용자 → `redirect("/auth/login")`

**수정 파일:** `app/(host)/events/new/page.tsx`
**재사용 함수:** `createClient` from `@/lib/supabase/server`

---

## 핵심 파일

| 파일                              | 역할                           | 상태             |
| --------------------------------- | ------------------------------ | ---------------- |
| `app/(host)/events/new/page.tsx`  | 이벤트 생성 페이지 (수정 대상) | 수정 필요        |
| `lib/supabase/server.ts`          | Supabase 서버 클라이언트       | 기존 파일 재사용 |
| `components/forms/event-form.tsx` | 이벤트 폼 컴포넌트             | 완료 (Task 14)   |

---

## 검증

1. `npm run type-check` — TypeScript 타입 오류 없음 확인
2. `npm run lint` — ESLint 통과 확인
3. 브라우저에서 `/events/new` 접근 시:
   - 비로그인 상태 → `/auth/login`으로 리다이렉트
   - 로그인 상태 → 이벤트 생성 폼 정상 렌더링
