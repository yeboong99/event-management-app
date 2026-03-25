# 문서 업데이트 계획: Phase 2 완료 반영

## Context

Phase 2(참여자 관리 + 공지/댓글)까지 구현이 완료되었으나, 프로젝트 문서들은 Phase 0~1 기준 또는 초기 설계 기준으로 작성되어 있어 실제 구현 상태와 괴리가 있다. Claude가 참조하는 모든 문서를 현행화하여 향후 Phase 3+ 개발 시 정확한 컨텍스트를 제공해야 한다.

## 대상 문서 및 변경 범위

### 1. `docs/planning/ROADMAP.md` — 현재 상태 섹션 갱신

- **"구현 완료" 섹션 (15~22행)**: Phase 1~2에서 구현된 항목 추가
  - DB 스키마: events, participations, posts 테이블 + approve_participation RPC
  - 라우팅: `(app)` 라우트 그룹, 이벤트 CRUD/상세/수정 라우트
  - Server Actions: events.ts, participations.ts, posts.ts
  - UI: 모바일 하단 탭, 이벤트 카드, 참여자 관리, 게시판 컴포넌트
  - 관리자: admin 레이아웃, 대시보드, 이벤트/사용자 관리 페이지
- **"미구현" 섹션 (24~32행)**: 완료된 항목 제거, 남은 미구현 항목만 유지
  - 남은 것: 카풀(Phase 3), 정산(Phase 4), 관리자 KPI 차트(Phase 4)
- **Phase 2 헤더**: 완료 표기 추가 (Phase 0, 1과 동일 형식)

### 2. `docs/planning/PRD.md` — 기능 구현 현황 반영

- 기능 명세 테이블에서 F001~F003, F006, F007을 "구현 완료"로 표시
- 이벤트 상세 페이지가 주최자/참여자 통합 뷰로 구현된 점 반영
- 메뉴 구조에서 실제 구현된 탭 이름 반영 (공지/댓글 → 게시판)

### 3. `docs/guides/project-structure.md` — 디렉토리 트리 현행화

- **app/ 트리**: `(public)/(protected)` → 실제 `(app)/(host)/(participant)/admin/auth` 구조로 교체
- **actions/**: participations.ts, posts.ts 추가
- **components/forms/**: participation-form.tsx, post-form.tsx 추가
- **components/shared/**: Phase 2 컴포넌트 11개 추가 (participant-list, post-feed 등)
- **components/ui/**: form.tsx, radio-group.tsx 추가
- **lib/validations/**: participation.ts, post.ts 추가
- **types/**: action.ts, event.ts, participation.ts, post.ts 추가 (index.ts 제거)
- **lib/supabase/**: middleware.ts → proxy.ts로 파일명 수정

### 4. `docs/guides/nextjs-16.md` — Server Actions 패턴 확장

- **권한 검증 헬퍼 패턴 추가**: `isEventHost()`, `isApprovedParticipant()` (actions/posts.ts에서 사용)
- **RPC 호출 패턴 추가**: `supabase.rpc("approve_participation", ...)` 동시성 제어
- **ActionResult 공통 반환 타입**: `types/action.ts`의 `ActionResult<T>` 패턴 문서화
- **FormData 직접 처리 패턴**: useActionState 없이 Server Action 직접 호출

### 5. `docs/guides/component-patterns.md` — 새 패턴 섹션 추가

- **낙관적 업데이트 패턴**: useOptimistic + useTransition (attendance-toggle.tsx 기반)
- **인라인 수정 패턴**: useState로 편집 모드 전환 (post-item.tsx 기반)
- **더보기(Load More) 페이지네이션 패턴**: offset 기반 추가 로드 (post-feed.tsx 기반)
- **접근 제한 컴포넌트 패턴**: 권한 부족 시 대체 UI (access-restricted-notice.tsx 기반)
- **컴포넌트 분류 테이블**: 각 분류에 Phase 2 새 컴포넌트 예시 추가

### 6. `docs/guides/forms-react-hook-form.md` — 새 폼 패턴 추가

- **패턴 3: Server Action 직접 호출**: form action={...} 방식 (participation-form.tsx 기반)
- **인라인 폼 패턴**: 페이지 내장형 작성 폼 (post-form.tsx 기반)
- **Zod 스키마 예시 추가**: applyParticipationSchema, createPostSchema
- **패턴 선택 기준 테이블**: 새 패턴 행 추가

### 7. `docs/guides/styling-guide.md` — 최소 변경

- shadcn/ui 컴포넌트 목록에 form, radio-group 추가

### 8. `CLAUDE.md` — 아키텍처 개요 확장

- **아키텍처 개요** 섹션 (32~48행)에 새 하위 섹션 추가:
  - Server Actions (actions/\*.ts 목록)
  - 검증 스키마 (lib/validations/\*.ts 목록)
  - 도메인 타입 (types/\*.ts 목록)
  - DB 테이블 목록 (events, participations, posts + approve_participation RPC)
- **핵심 개발 규칙** (50~59행)에 추가:
  - ActionResult<T> 공통 반환 타입 사용
  - 동시성 제어가 필요한 로직은 PostgreSQL RPC 함수로 처리

## 구현 단계

- Step 1: [general-purpose] ROADMAP.md "현재 상태" 섹션 갱신 + Phase 2 완료 표기
- Step 2: [general-purpose] PRD.md 기능 구현 현황 + 메뉴 구조 업데이트
- Step 3: [general-purpose] project-structure.md 디렉토리 트리 현행화
- Step 4: [general-purpose] nextjs-16.md Server Actions 패턴 확장
- Step 5: [general-purpose] component-patterns.md 새 패턴 4개 섹션 추가
- Step 6: [general-purpose] forms-react-hook-form.md 새 폼 패턴 추가
- Step 7: [general-purpose] styling-guide.md 최소 변경
- Step 8: [general-purpose] CLAUDE.md 아키텍처 개요 확장

> 참고: 문서 업데이트 작업이므로 nextjs-supabase-fullstack / nextjs-ui-markup 서브에이전트 대신 general-purpose 에이전트를 사용합니다. 코드 구현이 아닌 문서 편집 작업입니다.

## 검증

- 모든 문서 변경 후 실제 파일 구조/코드와 일치하는지 교차 확인
- `npm run format:check`으로 마크다운 포맷 검증
- CLAUDE.md 변경 후 프로젝트 컨텍스트 정합성 확인
