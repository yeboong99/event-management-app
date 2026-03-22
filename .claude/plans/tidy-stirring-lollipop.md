# Task 28: 이벤트 수정/생성 성공 시 Toast 알림 추가

## Context

이벤트 생성·수정 후 Server Action이 성공해도 사용자에게 명시적인 피드백이 없다.
현재는 redirect만 발생하고, 에러 케이스에만 `toast.error`가 구현되어 있다.
성공 케이스에도 Toast 알림을 추가해 사용자 경험을 개선한다.

## 에이전트 역할 분담

| 에이전트                      | 담당 작업                                       |
| ----------------------------- | ----------------------------------------------- |
| **nextjs-supabase-fullstack** | 전체 구현 (로직 중심, UI 없음)                  |
| **nextjs-ui-markup**          | 해당 없음 (ToastHandler는 null-render 컴포넌트) |

> Task 28은 시각적 UI 설계 없이 로직/통합 위주이므로 `nextjs-supabase-fullstack` 단독 수행.

---

## 구현 계획 (nextjs-supabase-fullstack 수행)

### Step 1: `app/layout.tsx` — Toaster 추가

- `components/ui/sonner.tsx`의 `<Toaster />` import 후 `ThemeProvider` 내부 하단에 추가
- 현재 `<Toaster />`가 없어서 어디서도 toast가 렌더링되지 않음

```tsx
// app/layout.tsx
import { Toaster } from "@/components/ui/sonner";
// ...
<ThemeProvider ...>
  {children}
  <Toaster />   // ← 추가
</ThemeProvider>
```

### Step 2: `actions/events.ts` — redirect에 searchParams 추가

| 함수                  | 변경 전                             | 변경 후                                          |
| --------------------- | ----------------------------------- | ------------------------------------------------ |
| `createEvent` (112줄) | `redirect(\`/events/${event.id}\`)` | `redirect(\`/events/${event.id}?created=true\`)` |
| `updateEvent` (252줄) | `redirect(\`/events/${eventId}\`)`  | `redirect(\`/events/${eventId}?updated=true\`)`  |
| `deleteEvent`         | `redirect("/events")`               | 변경 없음 (목록 페이지로 가므로 별도 처리)       |

### Step 3: `components/shared/toast-handler.tsx` — 신규 Client Component 생성

- `'use client'` 컴포넌트, null 렌더링
- `useSearchParams`로 `created` / `updated` 파라미터 감지
- 감지 시 `toast.success()` 호출 후 `router.replace()`로 파라미터 제거 (새로고침 중복 방지)

```tsx
'use client';
// useSearchParams → created/updated 감지 → toast.success → router.replace로 파라미터 정리
export function ToastHandler() { ... return null; }
```

**주의:** `useSearchParams`는 Suspense 경계 필요 — 페이지에서 `<Suspense>` 래핑

### Step 4: `app/(app)/events/[eventId]/page.tsx` — ToastHandler 통합

- `<ToastHandler />`를 `<Suspense fallback={null}>` 로 감싸서 페이지 최상단에 추가
- import 경로: `@/components/shared/toast-handler`

---

## 수정 파일 목록

| 파일                                  | 작업                                             |
| ------------------------------------- | ------------------------------------------------ |
| `app/layout.tsx`                      | `<Toaster />` 추가                               |
| `actions/events.ts`                   | redirect에 `?created=true`, `?updated=true` 추가 |
| `components/shared/toast-handler.tsx` | 신규 생성                                        |
| `app/(app)/events/[eventId]/page.tsx` | `<ToastHandler />` 통합                          |

---

## 검증 방법

1. `npm run dev` 실행
2. 이벤트 생성 → 상세 페이지에서 "이벤트가 생성되었습니다" toast 확인
3. 이벤트 수정 → 상세 페이지에서 "이벤트가 수정되었습니다" toast 확인
4. 상세 페이지 새로고침 → toast 재표시 없음 확인 (URL 파라미터 제거됨)
5. `npm run type-check && npm run lint` 통과 확인
