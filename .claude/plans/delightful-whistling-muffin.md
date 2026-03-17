# CLAUDE.md 개선 계획

## Context

기존 CLAUDE.md는 기술 스택 나열과 가이드 문서 링크만 포함. 개발 명령어, 아키텍처 개요, 핵심 규칙이 누락되어 있어 새로운 Claude 인스턴스가 빠르게 생산적이 되기 어려움.

## 변경 사항 (CLAUDE.md 전면 개선)

### 추가할 섹션들:

1. **개발 명령어**
   - `npm run dev` / `npm run build` / `npm run lint`
   - shadcn/ui 컴포넌트 추가: `npx shadcn@latest add <component>`

2. **기술 스택** (기존 유지, 간결화)

3. **아키텍처 개요**
   - Supabase 클라이언트 3종: browser(`lib/supabase/client.ts`), server(`lib/supabase/server.ts`), proxy(`lib/supabase/proxy.ts`)
   - 인증 흐름: 쿠키 기반 세션, `proxy.ts`의 `updateSession()`이 미들웨어에서 모든 요청 세션 체크
   - 비인증 사용자는 `/auth/*` 외 경로 접근 시 `/auth/login`으로 리다이렉트
   - DB 타입: `types/database.types.ts` (Supabase CLI 자동생성)

4. **핵심 개발 규칙**
   - Server Component 기본, `'use client'`는 인터랙션 필요 시만
   - `params`/`searchParams`는 Promise → 반드시 `await`
   - Server Actions: Zod 검증 → 처리 → `revalidatePath()` → `redirect()`
   - 폼: 클라이언트(UX) + 서버(보안) 이중 Zod 검증
   - `components/ui/`는 shadcn 자동생성 → 직접 수정 금지, className 오버라이드 사용
   - `cn()` 유틸리티(`lib/utils.ts`): Tailwind 클래스 결합 시 항상 사용
   - 시맨틱 색상 사용 (`bg-primary`, `text-destructive` 등)
   - `@/` 절대 경로 별칭 사용

5. **개발 가이드 문서 참조** (기존 유지)

## 검증

- 프로젝트 구조 및 설정 파일과 일치 확인
- docs/guides 내용과 정합성 확인
