# 프로젝트 구조 가이드

> Next.js 16 App Router 프로젝트의 폴더 구조, 파일 조직 및 네이밍 컨벤션 정의

## 디렉토리 구조

```
project-root/
├── app/                          # App Router (라우팅 + 페이지)
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 홈 페이지 (/)
│   ├── globals.css               # 전역 CSS
│   ├── not-found.tsx             # 전역 404 페이지
│   ├── error.tsx                 # 전역 에러 페이지
│   ├── loading.tsx               # 전역 로딩 UI
│   ├── favicon.ico               # 파비콘
│   ├── opengraph-image.png       # OG 이미지
│   ├── (public)/                 # 비인증 라우트 그룹
│   │   ├── layout.tsx
│   │   └── about/
│   │       └── page.tsx
│   ├── (protected)/              # 인증 필요 라우트 그룹
│   │   ├── layout.tsx            # 인증 체크 + 공통 네비게이션
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── events/
│   │       ├── page.tsx          # 이벤트 목록
│   │       ├── new/
│   │       │   └── page.tsx      # 이벤트 생성
│   │       └── [id]/
│   │           ├── page.tsx      # 이벤트 상세
│   │           └── edit/
│   │               └── page.tsx  # 이벤트 수정
│   ├── auth/                     # 인증 라우트
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── sign-up/
│   │   │   └── page.tsx
│   │   └── confirm/
│   │       └── route.ts          # 이메일 확인 콜백 (Route Handler)
│   └── api/                      # API Route Handlers (필요 시)
│       └── webhooks/
│           └── route.ts
│
├── components/                   # 공유 컴포넌트
│   ├── ui/                       # shadcn/ui 기본 컴포넌트 (자동생성, 수정 최소화)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── forms/                    # 폼 관련 컴포넌트
│   │   ├── sign-up-form.tsx
│   │   ├── event-form.tsx
│   │   └── ...
│   ├── layout/                   # 레이아웃 컴포넌트
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── sidebar.tsx
│   │   └── nav-links.tsx
│   └── shared/                   # 범용 재사용 컴포넌트
│       ├── data-table.tsx
│       ├── pagination.tsx
│       ├── empty-state.tsx
│       └── confirm-dialog.tsx
│
├── lib/                          # 유틸리티 및 라이브러리
│   ├── utils.ts                  # cn() 등 범용 유틸
│   ├── constants.ts              # 상수 정의
│   ├── supabase/                 # Supabase 클라이언트
│   │   ├── client.ts             # 브라우저 클라이언트
│   │   ├── server.ts             # 서버 클라이언트
│   │   └── middleware.ts         # 미들웨어용 클라이언트
│   └── validations/              # Zod 스키마
│       ├── auth.ts
│       └── event.ts
│
├── actions/                      # Server Actions
│   ├── auth.ts                   # 인증 관련 액션
│   └── events.ts                 # 이벤트 CRUD 액션
│
├── hooks/                        # 커스텀 훅
│   ├── use-debounce.ts
│   └── use-media-query.ts
│
├── types/                        # TypeScript 타입 정의
│   ├── database.types.ts         # Supabase 자동생성 타입
│   └── index.ts                  # 도메인 타입 정의
│
├── docs/                         # 프로젝트 문서
│   └── guides/                   # 개발 가이드
│
├── middleware.ts                  # Next.js 미들웨어 (루트)
├── next.config.ts                # Next.js 설정
├── tailwind.config.ts            # Tailwind 설정
├── tsconfig.json                 # TypeScript 설정
└── package.json
```

## 파일 네이밍 컨벤션

### 디렉토리 & 파일

| 대상            | 규칙                | 예시                                    |
| --------------- | ------------------- | --------------------------------------- |
| 디렉토리        | `kebab-case`        | `sign-up/`, `data-table/`               |
| 페이지/레이아웃 | Next.js 예약 파일명 | `page.tsx`, `layout.tsx`, `loading.tsx` |
| 컴포넌트 파일   | `kebab-case.tsx`    | `event-card.tsx`, `nav-links.tsx`       |
| 유틸/라이브러리 | `kebab-case.ts`     | `utils.ts`, `format-date.ts`            |
| 타입 정의       | `kebab-case.ts`     | `database.types.ts`                     |
| Server Actions  | `kebab-case.ts`     | `auth.ts`, `events.ts`                  |

### 코드 네이밍

| 대상            | 규칙                        | 예시                             |
| --------------- | --------------------------- | -------------------------------- |
| 컴포넌트        | `PascalCase`                | `EventCard`, `SignUpForm`        |
| 함수/변수       | `camelCase`                 | `formatDate`, `isLoading`        |
| 상수            | `UPPER_SNAKE_CASE`          | `MAX_FILE_SIZE`, `API_BASE_URL`  |
| 타입/인터페이스 | `PascalCase`                | `EventFormData`, `UserProfile`   |
| Zod 스키마      | `camelCase` + Schema 접미사 | `eventFormSchema`, `loginSchema` |
| Server Action   | `camelCase` 동사형          | `createEvent`, `updateProfile`   |
| 커스텀 훅       | `use` 접두사 + `camelCase`  | `useDebounce`, `useMediaQuery`   |

## Next.js App Router 특수 파일

각 라우트 세그먼트에서 사용할 수 있는 특수 파일들:

| 파일            | 용도                                                    | 필수 여부   |
| --------------- | ------------------------------------------------------- | ----------- |
| `layout.tsx`    | 하위 라우트 공유 레이아웃, 리렌더링 없이 유지됨         | 루트만 필수 |
| `page.tsx`      | 해당 경로의 고유 UI                                     | 필수        |
| `loading.tsx`   | Suspense 기반 로딩 UI                                   | 선택        |
| `error.tsx`     | Error Boundary 기반 에러 UI (`'use client'` 필수)       | 선택        |
| `not-found.tsx` | `notFound()` 호출 시 표시될 UI                          | 선택        |
| `route.ts`      | API 엔드포인트 (같은 세그먼트에 `page.tsx`와 공존 불가) | 선택        |
| `template.tsx`  | 매 네비게이션마다 새로 마운트되는 레이아웃              | 선택        |
| `default.tsx`   | Parallel Route의 폴백 UI                                | 선택        |

## Route Groups

괄호 `()` 로 감싸면 URL 경로에 영향 없이 라우트를 논리적으로 그룹화 가능:

```
app/
├── (app)/              # URL: / (괄호 부분 미포함) — 인증된 일반 사용자 영역
│   ├── layout.tsx      # 통합 레이아웃 (MobileHeader + UnifiedBottomNav)
│   ├── discover/page.tsx    # URL: /discover
│   ├── my-events/page.tsx   # URL: /my-events
│   ├── carpools/page.tsx    # URL: /carpools
│   ├── profile/page.tsx     # URL: /profile
│   └── events/
│       ├── new/page.tsx     # URL: /events/new
│       └── [eventId]/page.tsx  # URL: /events/{id}
├── admin/              # URL: /admin — 관리자 전용 (데스크탑)
│   ├── layout.tsx      # 관리자 레이아웃 (AdminSidebar + AdminHeader)
│   ├── page.tsx
│   ├── events/page.tsx
│   └── users/page.tsx
├── auth/               # URL: /auth — 인증 플로우
│   ├── login/page.tsx
│   └── sign-up/page.tsx
```

**이 프로젝트의 라우트 그룹 활용 사례:**

- `(app)`: 로그인한 일반 사용자(주최자/참여자 통합)의 모든 기능 — 통합 하단 탭 5개(탐색/내활동/만들기/카풀/프로필)
- `admin`: 관리자 전용 뷰 — 데스크탑 레이아웃(사이드바 + GNB)
- `auth`: 인증 플로우 — 레이아웃 없음, 독립 페이지

## 모듈 임포트 순서

```tsx
// 1. React / Next.js 내장
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

// 2. 외부 라이브러리
import { z } from "zod";
import { useForm } from "react-hook-form";

// 3. 내부 라이브러리/유틸
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

// 4. Server Actions
import { createEvent } from "@/actions/events";

// 5. 컴포넌트
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/shared/event-card";

// 6. 타입 (type-only import)
import type { EventFormData } from "@/types";
```

## 경로 별칭 (Path Aliases)

`tsconfig.json`에서 `@/` 별칭을 설정하여 절대 경로 임포트 사용:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

```tsx
// 상대 경로 (금지)
import { Button } from "../../../components/ui/button";

// 절대 경로 (권장)
import { Button } from "@/components/ui/button";
```

## 핵심 원칙

1. **`app/` 디렉토리는 라우팅 전용**: 비즈니스 로직이나 공유 컴포넌트를 넣지 않음
2. **`components/ui/`는 shadcn/ui 전용**: 직접 수정 최소화, 래퍼가 필요하면 `components/shared/`에 생성
3. **Server Actions는 `actions/` 디렉토리**: 파일 상단에 `'use server'` 선언
4. **Zod 스키마는 `lib/validations/`**: 클라이언트와 서버 양쪽에서 재사용
5. **타입은 `types/`**: Supabase 자동생성 타입과 도메인 타입 분리
6. **한 파일에 한 컴포넌트**: 파일명과 export 컴포넌트명 일치
