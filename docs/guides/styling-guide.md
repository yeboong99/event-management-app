# 스타일링 가이드

> TailwindCSS + shadcn/ui를 활용한 스타일링 규칙과 모범 사례

## 기술 스택

- **TailwindCSS**: 유틸리티 우선 CSS 프레임워크
- **shadcn/ui**: Radix UI + Tailwind 기반 컴포넌트 라이브러리
- **class-variance-authority (CVA)**: 컴포넌트 variants 관리
- **tailwind-merge**: 클래스 충돌 해결
- **clsx**: 조건부 클래스 결합
- **next-themes**: 다크 모드 지원

## cn() 유틸리티

모든 className 조합에 `cn()` 사용:

```tsx
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
// 사용 예시
import { cn } from '@/lib/utils'

// 기본 사용
<div className={cn('flex items-center', className)} />

// 조건부 클래스
<div className={cn(
  'rounded-lg border p-4',
  isActive && 'border-primary bg-primary/5',
  isDisabled && 'opacity-50 pointer-events-none',
)} />
```

## 디자인 토큰 (CSS 변수)

### 색상 시스템

shadcn/ui의 시맨틱 색상 변수를 사용합니다. `globals.css`에서 정의:

```
배경/전경:   background, foreground
카드:       card, card-foreground
팝오버:     popover, popover-foreground
주요 색상:   primary, primary-foreground
보조 색상:   secondary, secondary-foreground
음소거:     muted, muted-foreground
강조:       accent, accent-foreground
경고/삭제:   destructive, destructive-foreground
테두리:     border
입력:       input
포커스 링:   ring
```

### 색상 사용 규칙

```tsx
// ✅ 시맨틱 색상 사용
<div className="bg-background text-foreground" />
<div className="bg-primary text-primary-foreground" />
<div className="text-muted-foreground" />
<div className="border-destructive text-destructive" />

// ❌ 하드코딩 색상 지양
<div className="bg-white text-black" />
<div className="bg-blue-500 text-white" />
<div className="text-gray-500" />
```

### 커스텀 색상 추가

프로젝트 고유 색상이 필요한 경우:

```css
/* globals.css */
:root {
  --success: 142 76% 36%;
  --success-foreground: 0 0% 98%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 9%;
}

.dark {
  --success: 142 71% 45%;
  --success-foreground: 0 0% 98%;
  --warning: 48 96% 53%;
  --warning-foreground: 0 0% 9%;
}
```

```tsx
// tailwind.config.ts에 등록
colors: {
  success: {
    DEFAULT: "hsl(var(--success))",
    foreground: "hsl(var(--success-foreground))",
  },
  warning: {
    DEFAULT: "hsl(var(--warning))",
    foreground: "hsl(var(--warning-foreground))",
  },
}
```

## 반응형 디자인

### 브레이크포인트

Tailwind 기본 브레이크포인트를 사용합니다 (모바일 퍼스트):

| 접두사 | 최소 너비 | 대상          |
| ------ | --------- | ------------- |
| (없음) | 0px       | 모바일 (기본) |
| `sm:`  | 640px     | 소형 태블릿   |
| `md:`  | 768px     | 태블릿        |
| `lg:`  | 1024px    | 노트북        |
| `xl:`  | 1280px    | 데스크탑      |
| `2xl:` | 1536px    | 대형 데스크탑 |

### 반응형 패턴

```tsx
// 그리드 레이아웃
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// 사이드바 레이아웃
<div className="flex flex-col lg:flex-row">
  <aside className="w-full lg:w-64 lg:shrink-0">
    <Sidebar />
  </aside>
  <main className="flex-1">{children}</main>
</div>

// 패딩/마진 반응형
<div className="px-4 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-7xl">{children}</div>
</div>

// 텍스트 크기 반응형
<h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">제목</h1>

// 모바일에서 숨기기/보이기
<nav className="hidden md:flex">{/* 데스크탑 네비게이션 */}</nav>
<button className="md:hidden">{/* 모바일 메뉴 버튼 */}</button>
```

## 다크 모드

### next-themes 설정

```tsx
// app/layout.tsx
import { ThemeProvider } from "next-themes";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 다크 모드 토글

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">테마 변경</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          라이트
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          다크
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          시스템
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 다크 모드 스타일링

시맨틱 색상 변수를 사용하면 자동으로 다크 모드 대응됩니다:

```tsx
// ✅ 자동 다크 모드 대응 (CSS 변수 기반)
<div className="bg-background text-foreground border-border" />
<div className="bg-card text-card-foreground" />

// 필요 시 dark: 접두사로 직접 지정
<div className="bg-white dark:bg-slate-900" />
```

## CVA (Class Variance Authority) 패턴

### 커스텀 Variant 컴포넌트

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  // 기본 스타일
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border text-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

type BadgeProps = React.ComponentPropsWithoutRef<'span'> &
  VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// 사용
<Badge variant="success">진행 중</Badge>
<Badge variant="destructive">취소됨</Badge>
```

## 레이아웃 패턴

### 페이지 컨테이너

```tsx
// 일관된 페이지 레이아웃
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}

// 사용
export default function EventsPage() {
  return (
    <PageContainer>
      <div className="space-y-6 py-6">
        <PageHeader title="이벤트" />
        <EventList />
      </div>
    </PageContainer>
  );
}
```

### 간격 규칙

```tsx
// 수직 간격: space-y 사용
<div className="space-y-4">  {/* 섹션 내부 요소 간격 */}
<div className="space-y-6">  {/* 섹션 간 간격 */}
<div className="space-y-8">  {/* 대섹션 간 간격 */}

// 수평 간격: gap 또는 space-x 사용
<div className="flex gap-2">  {/* 작은 요소 간격 */}
<div className="flex gap-4">  {/* 일반 요소 간격 */}

// 패딩
<div className="p-4">   {/* 카드 등 내부 여백 */}
<div className="p-6">   {/* 섹션 내부 여백 */}
<div className="py-8">  {/* 페이지 상하 여백 */}
```

## 타이포그래피

```tsx
// 제목 체계
<h1 className="text-3xl font-bold tracking-tight">페이지 제목</h1>
<h2 className="text-2xl font-semibold tracking-tight">섹션 제목</h2>
<h3 className="text-xl font-semibold">서브 섹션</h3>
<h4 className="text-lg font-medium">소제목</h4>

// 본문
<p className="text-base leading-7">일반 본문</p>
<p className="text-sm text-muted-foreground">보조 텍스트</p>
<p className="text-xs text-muted-foreground">캡션</p>
```

## 애니메이션

```tsx
// tailwindcss-animate 플러그인 활용
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500" />
<div className="animate-out fade-out slide-out-to-top-4 duration-300" />

// Tailwind 기본 트랜지션
<button className="transition-colors hover:bg-accent" />
<div className="transition-opacity duration-200" />
```

## shadcn/ui 컴포넌트 사용 규칙

### 컴포넌트 추가

```bash
# CLI로 컴포넌트 추가 (components/ui/에 자동 생성)
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

### 커스터마이징

```tsx
// ❌ components/ui/ 파일 직접 수정 (업데이트 시 충돌)
// components/ui/button.tsx를 직접 수정하지 마세요

// ✅ className으로 오버라이드
<Button className="rounded-full">둥근 버튼</Button>;

// ✅ 래퍼 컴포넌트 생성 (components/shared/)
export function SubmitButton({
  children,
  isPending,
  ...props
}: ButtonProps & { isPending?: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full" {...props}>
      {isPending ? "처리 중..." : children}
    </Button>
  );
}
```

## 핵심 원칙

1. **시맨틱 색상 사용**: `bg-primary` O, `bg-blue-500` X (다크 모드 자동 대응)
2. **cn() 필수 사용**: className 조합 시 항상 `cn()` 유틸리티 사용
3. **모바일 퍼스트**: 기본 스타일은 모바일, `sm:`/`md:`/`lg:`로 확장
4. **간격 일관성**: `space-y-*`, `gap-*` 등 일관된 간격 유틸리티 사용
5. **shadcn/ui 우선**: 직접 컴포넌트를 만들기 전에 shadcn/ui 컴포넌트 확인
6. **인라인 스타일 금지**: `style` 속성 대신 Tailwind 유틸리티 사용
7. **커스텀 CSS 최소화**: `globals.css`에는 CSS 변수와 기본 스타일만, 컴포넌트 CSS 파일 생성 금지
