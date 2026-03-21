# TASK-001: TailwindCSS v3 → v4 업그레이드

## Context

Phase 0의 첫 번째 작업. 모든 후속 Task(UI 컴포넌트 설치, 레이아웃 구축 등)의 전제 조건.
v4는 CSS 기반 설정으로 전환되어 `tailwind.config.ts`가 삭제되고, `globals.css`가 설정의 중심이 됨.
shadcn/ui는 `components.json`에서 이미 `"config": ""`로 v4 준비가 되어 있음.

---

## 변경 파일 목록

| 파일                 | 작업                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `package.json`       | `tailwindcss@next`, `@tailwindcss/postcss@next`, `tw-animate-css` 추가; `tailwindcss-animate` 제거 |
| `postcss.config.mjs` | `tailwindcss` → `@tailwindcss/postcss`로 교체, `autoprefixer` 제거                                 |
| `app/globals.css`    | 전면 재작성 (아래 상세 참조)                                                                       |
| `tailwind.config.ts` | **삭제**                                                                                           |

수정 불필요: `components/ui/*.tsx`, `lib/utils.ts`, `app/layout.tsx`, `prettier.config.mjs`

---

## 구현 단계

### STEP 1: 패키지 설치

```bash
npm install tailwindcss@next @tailwindcss/postcss@next tw-animate-css
npm uninstall tailwindcss-animate
```

### STEP 2: postcss.config.mjs 수정

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

> v4는 autoprefixer를 내장하므로 별도 선언 불필요

### STEP 3: tailwind.config.ts 삭제

### STEP 4: app/globals.css 전면 재작성

**핵심 변경 포인트:**

| 항목            | v3                                                 | v4                                                             |
| --------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| 지시어          | `@tailwind base/components/utilities`              | `@import "tailwindcss"`                                        |
| 애니메이션      | `tailwindcss-animate` 플러그인                     | `@import "tw-animate-css"`                                     |
| 다크모드        | `tailwind.config.ts`의 `darkMode: ["class"]`       | `@custom-variant dark (&:where(.dark, .dark *))`               |
| 색상 토큰       | `tailwind.config.ts`의 `theme.extend.colors`       | `@theme inline { --color-background: var(--background); ... }` |
| CSS 변수값 형식 | `0 0% 100%` (숫자만)                               | `hsl(0 0% 100%)` (완전한 값)                                   |
| borderRadius    | `tailwind.config.ts`의 `theme.extend.borderRadius` | `@theme inline { --radius-lg: var(--radius); ... }`            |

**최종 globals.css 구조:**

```css
@import "tailwindcss";
@import "tw-animate-css";

/* 다크모드: next-themes의 attribute="class" 방식 유지 */
@custom-variant dark (&:where(.dark, .dark *));

/* shadcn/ui 색상 토큰 → Tailwind 유틸리티로 노출 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}

@layer base {
  :root {
    --background: hsl(0 0% 100%);
    --foreground: hsl(0 0% 3.9%);
    --card: hsl(0 0% 100%);
    --card-foreground: hsl(0 0% 3.9%);
    --popover: hsl(0 0% 100%);
    --popover-foreground: hsl(0 0% 3.9%);
    --primary: hsl(0 0% 9%);
    --primary-foreground: hsl(0 0% 98%);
    --secondary: hsl(0 0% 96.1%);
    --secondary-foreground: hsl(0 0% 9%);
    --muted: hsl(0 0% 96.1%);
    --muted-foreground: hsl(0 0% 45.1%);
    --accent: hsl(0 0% 96.1%);
    --accent-foreground: hsl(0 0% 9%);
    --destructive: hsl(0 84.2% 60.2%);
    --destructive-foreground: hsl(0 0% 98%);
    --border: hsl(0 0% 89.8%);
    --input: hsl(0 0% 89.8%);
    --ring: hsl(0 0% 3.9%);
    --chart-1: hsl(12 76% 61%);
    --chart-2: hsl(173 58% 39%);
    --chart-3: hsl(197 37% 24%);
    --chart-4: hsl(43 74% 66%);
    --chart-5: hsl(27 87% 67%);
    --radius: 0.5rem;
  }

  .dark {
    --background: hsl(0 0% 3.9%);
    --foreground: hsl(0 0% 98%);
    --card: hsl(0 0% 3.9%);
    --card-foreground: hsl(0 0% 98%);
    --popover: hsl(0 0% 3.9%);
    --popover-foreground: hsl(0 0% 98%);
    --primary: hsl(0 0% 98%);
    --primary-foreground: hsl(0 0% 9%);
    --secondary: hsl(0 0% 14.9%);
    --secondary-foreground: hsl(0 0% 98%);
    --muted: hsl(0 0% 14.9%);
    --muted-foreground: hsl(0 0% 63.9%);
    --accent: hsl(0 0% 14.9%);
    --accent-foreground: hsl(0 0% 98%);
    --destructive: hsl(0 62.8% 30.6%);
    --destructive-foreground: hsl(0 0% 98%);
    --border: hsl(0 0% 14.9%);
    --input: hsl(0 0% 14.9%);
    --ring: hsl(0 0% 83.1%);
    --chart-1: hsl(220 70% 50%);
    --chart-2: hsl(160 60% 45%);
    --chart-3: hsl(30 80% 55%);
    --chart-4: hsl(280 65% 60%);
    --chart-5: hsl(340 75% 55%);
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 검증 방법

```bash
# 1. 타입 검사 (tailwind.config.ts 삭제 후 import 오류 없는지)
npm run type-check

# 2. 개발 서버 실행 후 UI 확인
npm run dev
# 브라우저에서 http://localhost:3000 → 기존 스타일 정상 렌더링 확인
# 다크모드 토글 → 색상 전환 확인
# 인증 페이지(/auth/login) → shadcn/ui 컴포넌트 스타일 확인

# 3. 프로덕션 빌드
npm run build
```

---

## 주요 위험 요소

- **`@apply border-border` 동작**: `@theme inline`에서 `--color-border`로 등록되어야 `border-border` 유틸리티가 생성됨 (계획에 반영됨)
- **`rounded-lg/md/sm` 동작**: v4에서 `--radius-{size}` 네이밍 컨벤션으로 `rounded-{size}` 유틸리티를 오버라이드 (계획에 반영됨)
- **`tw-animate-css`**: `tailwindcss-animate`와 동일한 API 제공 — 컴포넌트 수정 불필요
