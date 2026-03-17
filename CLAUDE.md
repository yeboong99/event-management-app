# Event Management

## 사용 언어 설정

- 기본 응답 언어: 한국어(존댓말 사용)
- 코드 주석: 한국어
- 커밋 메시지: 한국어로 작성
- 문서화: 한국어로 작성 (IMPORTANT)
- 변수명/함수명: 영어, camelCase (코드 표준 준수)

## 개발 가이드 문서

- **Next.js 16 프로젝트 구조**: `docs/guides/project-structure.md` - 폴더 구조, 파일 조직, 네이밍 컨벤션
- **Next.js 16 규칙**: `docs/guides/nextjs-16.md` - Server/Client Component, 라우팅, Server Actions, 캐싱, 에러 핸들링
- **컴포넌트 패턴**: `docs/guides/component-patterns.md` - 컴포넌트 분류, 작성 패턴, Composition 패턴
- **폼 처리**: `docs/guides/forms-react-hook-form.md` - React Hook Form + Zod + Server Actions 폼 패턴
- **스타일링**: `docs/guides/styling-guide.md` - TailwindCSS + shadcn/ui 스타일링 규칙, 다크 모드, 반응형

## 기술 스택

- Next.js 16 (App Router) + React 19
- TypeScript
- TailwindCSS + shadcn/ui
- Supabase (인증, 데이터베이스)
- React Hook Form + Zod (폼 처리)

## 아키텍처 개요

### Supabase 클라이언트

- **browser** (`lib/supabase/client.ts`) — Client Component에서 사용, `createBrowserClient`
- **server** (`lib/supabase/server.ts`) — Server Component/Server Action에서 사용, `createServerClient` + `cookies()`
- **proxy** (`lib/supabase/proxy.ts`) — 미들웨어 전용, `updateSession()`으로 모든 요청의 세션 갱신

### 인증 흐름

- 쿠키 기반 세션 관리 (`@supabase/ssr`)
- `proxy.ts`의 `updateSession()`이 미들웨어에서 매 요청마다 세션 체크
- 비인증 사용자는 `/`, `/auth/*`, `/login` 외 경로 접근 시 `/auth/login`으로 리다이렉트

### DB 타입

- `types/database.types.ts` — Supabase CLI로 자동생성, 직접 수정 금지

## 핵심 개발 규칙

- Server Component 기본, `'use client'`는 인터랙션 필요 시만 사용
- `params`/`searchParams`는 Promise → 반드시 `await`
- Server Actions: Zod 검증 → 처리 → `revalidatePath()` → `redirect()`
- 폼: 클라이언트(UX) + 서버(보안) 이중 Zod 검증
- `components/ui/`는 shadcn 자동생성 → 직접 수정 금지, className 오버라이드로 커스터마이징
- `cn()` 유틸리티(`lib/utils.ts`): Tailwind 클래스 결합 시 항상 사용
- 시맨틱 색상 사용 (`bg-primary`, `text-destructive` 등)
- `@/` 절대 경로 별칭 사용

## 자주 사용하는 명령어

- `npm run dev` — 개발 서버 실행
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint 실행
- `npx shadcn@latest add <component>` — shadcn/ui 컴포넌트 추가
- `npm run format` — Prettier 전체 포맷팅
- `npm run format:check` — Prettier 포맷 검증 (CI용)
- `npm run type-check` — TypeScript 타입 검사
- `npm run knip` — 미사용 코드/의존성 탐지

## 코드 품질 도구

### 자동화 파이프라인

- **pre-commit hook** (Husky + lint-staged): 커밋 시 자동으로 ESLint fix + Prettier 포맷 실행
- 별도 설정이나 수동 실행 없이 `git commit`만 하면 자동 적용됨

### 코드 작성 시 지침

- 새 코드 작성 후 반드시 `npm run lint`와 `npm run type-check`로 검증
- import 순서는 `eslint-plugin-simple-import-sort`가 자동 정렬 — 수동 정렬 불필요
- Tailwind 클래스 순서는 `prettier-plugin-tailwindcss`가 자동 정렬
- `types/database.types.ts`는 자동생성 파일 → lint/format 대상에서 제외됨

### 코드 일관성 규칙

- Prettier 설정: 세미콜론 사용, 쌍따옴표, trailing comma, 80자 줄바꿈
- ESLint: `next/core-web-vitals` + `next/typescript` + `prettier`(충돌 방지) 적용
- 파일 저장 시 자동 포맷팅에 의존하지 말고, 커밋 전 `npm run format:check`으로 확인 가능

### 안전한 작업 흐름

- 코드 변경 후 커밋 전: `npm run type-check` → `npm run lint` → `npm run build` 순서로 검증
- 대규모 리팩토링 후: `npm run knip`으로 미사용 코드 정리
- `components/ui/` 파일은 lint-staged 대상이지만, 직접 수정은 여전히 금지 (shadcn 자동생성)
