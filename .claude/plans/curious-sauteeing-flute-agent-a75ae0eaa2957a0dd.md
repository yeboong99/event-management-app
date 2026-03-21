# Phase 0 PRD 생성 계획

## 분석 완료 사항

ROADMAP.md 전체를 읽고 다음을 파악했습니다:

- **프로젝트:** 이벤트 관리 플랫폼 MVP (생일파티, 워크샵, 모임 등)
- **기술 스택:** Next.js 16 (App Router) + React 19, TypeScript, TailwindCSS + shadcn/ui, Supabase
- **전체 Phase:** Phase 0~6 (7개 Phase)
- **현재 상태:** 인증 시스템(Google OAuth 포함), Supabase 클라이언트, 미들웨어, 기본 shadcn/ui 컴포넌트, 코드 품질 도구 설정 완료

## Phase 0 분석

Phase 0은 "기반 설정 (Foundation Setup)"으로, 모든 후속 Phase의 전제 조건이 되는 환경, 스키마, 레이아웃을 준비하는 단계입니다.

### Phase 0 Tasks (10개)

1. TASK-001: TailwindCSS v3 → v4 업그레이드
2. TASK-002: 추가 shadcn/ui 컴포넌트 설치
3. TASK-003: Migration 001 — profiles 스키마 정비 + ENUM 타입 생성
4. TASK-004: Migration 002 — events 테이블 생성 + RLS
5. TASK-005: TypeScript 타입 재생성
6. TASK-006: 미들웨어 admin 접근 제어 추가
7. TASK-007: 루트 페이지 역할별 리디렉션 구현
8. TASK-008: 참여자 레이아웃 + 하단 탭 내비게이션 구축
9. TASK-009: 주최자 레이아웃 + 하단 탭 내비게이션 구축
10. TASK-010: 관리자 레이아웃 구축 (GNB + 사이드바)

### 이전 Phase 상태

- Phase 0이 첫 번째 Phase이므로 이전 Phase 없음
- 현재 상태 섹션에서 이미 구현된 항목(인증, Supabase 클라이언트 등)이 전제 조건

## 작업 계획

1. `docs/planning/Phase_0.md` 파일을 생성
2. PRD 필수 포함 내용에 맞춰 다음 섹션 작성:
   - 전체 프로젝트 개요
   - 페이즈 전체 요약
   - 이전 Phase 완료 여부 (현재 상태 = 구현 완료 항목)
   - Phase 0 액션 아이템 (10개 Task 상세 명세)
3. TaskMaster AI parse-prd 최적화: 각 Task에 명확한 경계, 의존성, 완료 기준 포함
4. 메모리 업데이트

## 준비 상태

ROADMAP.md 분석 완료. Phase_0.md 생성 준비 완료.
