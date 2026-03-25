# 플랜: 문서 현행화 (Phase 3 완료 반영)

## Context

Phase 3 (카풀 기능)이 코드베이스에서 완전히 구현 완료되었으나, `docs/` 디렉토리 하위 문서들이 여전히 Phase 3를 "미착수" 또는 "미구현"으로 표시하고 있음. 이 플랜은 현재 코드베이스 상태와 일치하도록 모든 문서를 업데이트한다.

---

## 현재 상태 vs 문서 불일치 목록

### 구현 완료된 Phase 3 산출물 (실제 코드베이스)

- `supabase/migrations/20260324000000_create_carpools.sql` — carpools, carpool_requests 테이블 + RLS
- `supabase/migrations/20260324000100_approve_carpool_request_rpc.sql` — RPC 함수
- `supabase/migrations/20260325000000_add_carpools_driver_id_index.sql` — driver_id 인덱스 추가 (**PERF-002 해결됨**)
- `supabase/migrations/20260325000100_fix_participations_rls.sql` — participations RLS 수정
- `actions/carpools.ts` — 카풀 관련 Server Actions 전체
- `components/forms/carpool-register-form.tsx`, `components/forms/carpool-request-form.tsx`
- `components/shared/carpool-section.tsx`, `carpool-tabs.tsx`, `carpool-card.tsx`, `carpool-actions.tsx`, `carpool-register-toggle.tsx`, `carpool-request-status.tsx`, `carpool-conflict-dialog.tsx`, `my-carpool-requests-view.tsx`, `my-carpools-driver-view.tsx`
- `types/carpool.ts` — 카풀 타입 정의
- `lib/validations/carpool.ts` — Zod 스키마
- `app/(app)/carpools/page.tsx` — 내 카풀 현황 페이지

### PERF-001 상태

- `20260325000100_fix_participations_rls.sql`은 `is_approved_participant_for_event` 헬퍼 함수를 추가하고 SELECT 정책을 수정했으나, `auth.uid()` → `(select auth.uid())` 최적화는 **미적용됨 (여전히 미해결)**

---

## 수정 대상 파일 및 변경 내용

### 1. `CLAUDE.md`

- **위치**: 프로젝트 루트
- **변경**: `DB 스키마 (Phase 0~2 구현 완료)` → `Phase 0~3 구현 완료`
- **추가**: carpools, carpool_requests 테이블 항목 2개 추가

### 2. `docs/planning/Phase_3.md`

- **변경 1**: 상태 `미착수` → `완료`
- **변경 2**: Phase 테이블에서 Phase 3 행의 상태 `현재 Phase` → `완료`

### 4. `docs/planning/PROJECT_ISSUES.md`

- **변경**: PERF-002 항목에 해결 완료 표시
  - 해결 일자: 2026-03-25
  - 마이그레이션: `20260325000000_add_carpools_driver_id_index.sql`
  - PERF-001은 여전히 미해결 → 변경 없음

### 5. `docs/guides/project-structure.md`

- **변경 1**: `carpools/page.tsx` 주석 `"Phase 3 예정, 현재 placeholder"` → `"내 카풀 현황 (드라이버/탑승자)"`
- **변경 2**: `components/forms/` 트리에 carpool 폼 2개 추가
- **변경 3**: `components/shared/` 트리에 carpool-\* 컴포넌트 9개 추가
- **변경 4**: `actions/` 트리에 `carpools.ts` 추가
- **변경 5**: `types/` 트리에 `carpool.ts` 추가
- **변경 6**: `lib/validations/` 트리에 `carpool.ts` 추가

---

## 실행 단계

> 이 작업은 문서(Markdown) 파일 수정이므로 서브에이전트 위임 불필요. Edit 도구로 직접 수정.

### Step 1: CLAUDE.md 업데이트

- DB 스키마 섹션에 Phase 3 반영 (carpools, carpool_requests 테이블 추가)

### Step 2: Phase_3.md 업데이트

- 상태 필드 "미착수" → "완료"
- Phase 테이블 상태 업데이트

### Step 4: PROJECT_ISSUES.md 업데이트

- PERF-002에 해결 완료 표시 추가

### Step 5: project-structure.md 업데이트

- 디렉토리 트리에 Phase 3 파일들 추가

---

## 검증

- 모든 문서에서 "카풀 미구현", "Phase 3 미착수", "Phase 3 예정" 등 구식 표현이 제거됨
- CLAUDE.md의 DB 스키마 목록이 carpools, carpool_requests 포함
- PROJECT_ISSUES.md에 PERF-002 해결 완료 표시, PERF-001 미해결 유지
- project-structure.md의 디렉토리 트리가 실제 파일 구조와 일치
