# Task 27: 이벤트 상세 페이지 뒤로가기 버튼 추가

## Context

이벤트 상세 페이지(`/events/[eventId]`)에 뒤로가기 버튼이 없어 사용자가 이전 페이지로 돌아가려면 브라우저 기본 버튼을 사용해야 한다. 모바일 UX 개선을 위해 커버 이미지 위 좌상단에 오버레이 형태의 뒤로가기 버튼을 추가한다.

## 핵심 발견 사항

- 실제 이벤트 상세 페이지 경로: `app/(app)/events/[eventId]/page.tsx` (task 명세의 `(host)` 경로와 다름)
- `components/shared/back-button.tsx` 미존재 → 신규 생성 필요
- 커버 이미지 영역: `<div className="relative h-48 w-full ...">` → `relative` 이미 적용되어 있어 오버레이 배치 바로 가능
- `components/shared/`에 `confirm-dialog.tsx`, `copy-link-button.tsx` 등 패턴 존재

## 구현 계획

### 서브에이전트 역할 분담

| 역할        | 에이전트                    | 작업                               |
| ----------- | --------------------------- | ---------------------------------- |
| UI 마크업   | `nextjs-ui-markup`          | `BackButton` Client Component 생성 |
| 풀스택 통합 | `nextjs-supabase-fullstack` | 상세 페이지에 `BackButton` 통합    |

---

### [nextjs-ui-markup] `components/shared/back-button.tsx` 생성

**새 파일 생성**: `components/shared/back-button.tsx`

```tsx
"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  className?: string;
  fallbackHref?: string;
  variant?: "default" | "ghost" | "overlay";
};

export function BackButton({
  className,
  fallbackHref = "/events",
  variant = "ghost",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  const buttonVariant = variant === "overlay" ? "ghost" : variant;
  const buttonClasses = cn(
    variant === "overlay" &&
      "absolute left-4 top-4 z-10 bg-black/40 text-white hover:bg-black/60 hover:text-white",
    className,
  );

  return (
    <Button
      onClick={handleBack}
      variant={buttonVariant}
      size="icon"
      className={buttonClasses}
      aria-label="뒤로가기"
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  );
}
```

---

### [nextjs-supabase-fullstack] `app/(app)/events/[eventId]/page.tsx` 수정

**수정 위치**: 커버 이미지 `<div className="relative h-48 ...">` 내부 최상단에 `BackButton` 추가

```tsx
// import 추가
import { BackButton } from '@/components/shared/back-button';

// 커버 이미지 div 내부에 추가
<div className="relative h-48 w-full bg-gradient-to-br from-primary/20 to-primary/5">
  <BackButton variant="overlay" />   {/* ← 추가 */}
  {event.cover_image_url ? (
    ...
  ) : (
    ...
  )}
</div>
```

---

## 수정 대상 파일

| 파일                                  | 작업                                                  |
| ------------------------------------- | ----------------------------------------------------- |
| `components/shared/back-button.tsx`   | 신규 생성 (nextjs-ui-markup)                          |
| `app/(app)/events/[eventId]/page.tsx` | BackButton import 및 배치 (nextjs-supabase-fullstack) |

## 검증

```bash
npm run type-check
npm run build
```

- `/events` → 이벤트 카드 클릭 → 뒤로가기 버튼 클릭 → `/events` 복귀 확인
- 브라우저 주소창 직접 입력 → 뒤로가기 버튼 클릭 → `/events`(fallback) 이동 확인
- 커버 이미지 위 좌상단에 반투명 버튼 렌더링 확인 (overlay 스타일)
