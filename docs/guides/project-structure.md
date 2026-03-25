# 프로젝트 구조 가이드

> Next.js 16 App Router 프로젝트의 폴더 구조, 파일 조직 및 네이밍 컨벤션 정의

## 디렉토리 구조

```
project-root/
├── app/                          # App Router (라우팅 + 페이지)
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 홈 페이지 (/) — 역할별 리디렉션
│   ├── globals.css               # 전역 CSS
│   ├── not-found.tsx             # 전역 404 페이지
│   ├── (app)/                    # 인증된 일반 사용자 라우트 그룹 (주최자/참여자 통합)
│   │   ├── layout.tsx            # MobileHeader + UnifiedBottomNav
│   │   ├── discover/
│   │   │   └── page.tsx          # 이벤트 탐색 (공개 이벤트, 카테고리 필터)
│   │   ├── events/
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # 이벤트 생성
│   │   │   └── [eventId]/
│   │   │       ├── page.tsx      # 이벤트 상세 (참여자/게시판 탭 통합)
│   │   │       └── edit/
│   │   │           └── page.tsx  # 이벤트 수정 (주최자만)
│   │   ├── my-events/
│   │   │   └── page.tsx          # 내 활동 (참여 중 / 주최 중 탭)
│   │   ├── carpools/
│   │   │   └── page.tsx          # 카풀 (Phase 3 예정, 현재 placeholder)
│   │   └── profile/
│   │       └── page.tsx          # 프로필 (Phase 5 예정, 현재 placeholder)
│   ├── admin/                    # 관리자 전용 라우트 (데스크탑)
│   │   ├── layout.tsx            # AdminSidebar + AdminHeader
│   │   ├── page.tsx              # 대시보드 (레이아웃만, KPI는 Phase 4 예정)
│   │   ├── events/
│   │   │   └── page.tsx          # 이벤트 관리
│   │   └── users/
│   │       └── page.tsx          # 사용자 관리
│   └── auth/                     # 인증 라우트 (레이아웃 없음)
│       ├── login/
│       │   └── page.tsx
│       ├── sign-up/
│       │   └── page.tsx
│       ├── forgot-password/
│       │   └── page.tsx
│       ├── update-password/
│       │   └── page.tsx
│       ├── sign-up-success/
│       │   └── page.tsx
│       ├── error/
│       │   └── page.tsx
│       ├── callback/
│       │   └── route.ts          # OAuth 콜백 (Route Handler)
│       └── confirm/
│           └── route.ts          # 이메일 확인 (Route Handler)
│
├── components/                   # 공유 컴포넌트
│   ├── ui/                       # shadcn/ui 기본 컴포넌트 (자동생성, 수정 금지)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── avatar.tsx
│   │   ├── sonner.tsx
│   │   ├── form.tsx              # React Hook Form 연동
│   │   ├── radio-group.tsx
│   │   └── ...
│   ├── forms/                    # 폼 컴포넌트
│   │   ├── event-form.tsx        # 이벤트 생성/수정 폼
│   │   ├── participation-form.tsx # 참여 신청 폼
│   │   └── post-form.tsx         # 게시물 작성 폼
│   ├── shared/                   # 범용 재사용 컴포넌트
│   │   ├── access-restricted-notice.tsx  # 접근 제한 안내
│   │   ├── attendance-toggle.tsx         # 출석 토글 (useOptimistic)
│   │   ├── back-button.tsx               # 뒤로가기
│   │   ├── cancel-participation-button.tsx # 참여 취소
│   │   ├── confirm-dialog.tsx            # 확인 다이얼로그
│   │   ├── copy-link-button.tsx          # 초대 링크 복사
│   │   ├── participant-actions.tsx       # 승인/거절 버튼
│   │   ├── participant-list.tsx          # 참여자 목록 (필터 탭)
│   │   ├── post-actions.tsx              # 게시물 수정/삭제
│   │   ├── post-feed.tsx                 # 페이지네이션 피드
│   │   ├── post-item.tsx                 # 개별 게시물 (인라인 수정)
│   │   ├── posts-section.tsx             # 게시판 섹션
│   │   └── toast-handler.tsx             # URL 쿼리 기반 토스트
│   ├── mobile/                   # 모바일 전용 컴포넌트
│   │   ├── mobile-header.tsx
│   │   ├── unified-bottom-nav.tsx
│   │   ├── event-card-mobile.tsx
│   │   ├── event-category-badge.tsx
│   │   └── category-tabs-scroll.tsx
│   ├── admin/                    # 관리자 전용 컴포넌트
│   │   ├── admin-header.tsx
│   │   ├── admin-sidebar.tsx
│   │   ├── admin-header-profile.tsx
│   │   └── dark-mode-toggle.tsx
│   ├── login-form.tsx            # 인증 폼 (루트 레벨)
│   ├── sign-up-form.tsx
│   ├── forgot-password-form.tsx
│   ├── update-password-form.tsx
│   ├── auth-button.tsx
│   ├── logout-button.tsx
│   └── theme-switcher.tsx
│
├── lib/                          # 유틸리티 및 라이브러리
│   ├── utils.ts                  # cn(), kstDatetimeLocalToUtc() 등 범용 유틸
│   ├── supabase/                 # Supabase 클라이언트
│   │   ├── client.ts             # 브라우저 클라이언트 (Client Component용)
│   │   ├── server.ts             # 서버 클라이언트 (Server Component/Action용)
│   │   ├── proxy.ts              # 미들웨어 전용 (updateSession)
│   │   └── storage.ts            # 이미지 업로드/삭제 유틸 (Supabase Storage)
│   ├── validations/              # Zod 스키마
│   │   ├── event.ts              # 이벤트 검증 스키마
│   │   ├── image.ts              # 이미지 검증 유틸
│   │   ├── participation.ts      # 참여 검증 스키마
│   │   └── post.ts               # 게시물 검증 스키마
│   └── constants/
│       └── event-gradients.ts    # 카테고리별 배경 그라데이션 + 아이콘
│
├── actions/                      # Server Actions
│   ├── events.ts                 # 이벤트 CRUD 액션
│   ├── participations.ts         # 참여 관리 액션
│   └── posts.ts                  # 공지/댓글 액션
│
├── types/                        # TypeScript 타입 정의
│   ├── database.types.ts         # Supabase 자동생성 타입 (수정 금지)
│   ├── action.ts                 # ActionResult<T> 공통 반환 타입
│   ├── event.ts                  # 이벤트 타입 + EventWithHost
│   ├── participation.ts          # 참여 타입 + 조인 타입
│   └── post.ts                   # 게시물 타입 + PostWithAuthor
│
├── supabase/                     # Supabase 로컬 개발 설정
│   ├── migrations/               # DB 마이그레이션 SQL 파일
│   └── config.toml               # Supabase CLI 설정
│
├── docs/                         # 프로젝트 문서
│   ├── guides/                   # 개발 가이드
│   └── planning/                 # PRD, 로드맵
│
├── middleware.ts                  # Next.js 미들웨어 (루트)
├── next.config.ts                # Next.js 설정
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
│   ├── discover/page.tsx        # URL: /discover
│   ├── my-events/page.tsx       # URL: /my-events
│   ├── carpools/page.tsx        # URL: /carpools
│   ├── profile/page.tsx         # URL: /profile
│   └── events/
│       ├── new/page.tsx         # URL: /events/new
│       └── [eventId]/page.tsx   # URL: /events/{id}
│           └── edit/page.tsx    # URL: /events/{id}/edit
├── admin/              # URL: /admin — 관리자 전용 (데스크탑)
│   ├── layout.tsx      # 관리자 레이아웃 (AdminSidebar + AdminHeader)
│   ├── page.tsx
│   ├── events/page.tsx
│   └── users/page.tsx
└── auth/               # URL: /auth — 인증 플로우
    ├── login/page.tsx
    ├── sign-up/page.tsx
    ├── callback/route.ts
    └── confirm/route.ts
```

**이 프로젝트의 라우트 그룹 활용 사례:**

- `(app)`: 로그인한 일반 사용자(주최자/참여자 통합)의 모든 기능 — 통합 하단 탭 5개(탐색/내활동/만들기/카풀/프로필)
- `admin`: 관리자 전용 뷰 — 데스크탑 레이아웃(사이드바 + GNB), role = 'admin'만 접근 가능
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
