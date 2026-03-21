# Phase 0 PRD 문서 생성 계획

## Context

사용자가 ROADMAP.md의 Phase 0 내용을 기반으로 TaskMaster AI의 `parse-prd` 명령에 사용할 수 있는 PRD 문서를 생성하도록 요청했습니다. phase-prd-architect 에이전트가 ROADMAP.md를 분석 완료하였으며, 실행 모드 전환 후 문서 생성을 진행합니다.

## Phase 0 분석 요약

- **이름:** 기반 설정 (Foundation Setup)
- **기간:** 1주
- **목표:** 모든 후속 Phase의 전제 조건이 되는 환경, DB 스키마, 레이아웃 준비
- **완료 기준:** TailwindCSS v4 동작, profiles 테이블에 role 컬럼 존재, 3개 레이아웃 라우트 그룹 렌더링, 미들웨어 admin 접근 제어 동작
- **Tasks:** TASK-001 ~ TASK-010 (총 10개)

## 생성할 문서

**경로:** `docs/planning/Phase_0.md`

## 주요 Tasks (TASK-001 ~ TASK-010)

| Task     | 설명                                     | 의존성             | 예상 시간 |
| -------- | ---------------------------------------- | ------------------ | --------- |
| TASK-001 | TailwindCSS v3 → v4 업그레이드           | 없음               | 3h        |
| TASK-002 | 추가 shadcn/ui 컴포넌트 설치             | TASK-001           | 1h        |
| TASK-003 | Migration 001 — profiles 스키마 정비     | 없음               | 3h        |
| TASK-004 | Migration 002 — events 테이블 생성 + RLS | TASK-003           | 2h        |
| TASK-005 | TypeScript 타입 재생성                   | TASK-003, TASK-004 | 30m       |
| TASK-006 | 미들웨어 admin 접근 제어                 | TASK-003           | 2h        |
| TASK-007 | 루트 페이지 역할별 리디렉션              | TASK-003, TASK-006 | 1h        |
| TASK-008 | 참여자 레이아웃 + 하단 탭 내비게이션     | TASK-001, TASK-002 | 3h        |
| TASK-009 | 주최자 레이아웃 + 하단 탭 내비게이션     | TASK-008           | 2h        |
| TASK-010 | 관리자 레이아웃 (GNB + 사이드바)         | TASK-001, TASK-002 | 3h        |

## 실행 계획

1. phase-prd-architect 에이전트에게 `docs/planning/Phase_0.md` 파일 생성 요청
   - ROADMAP.md Phase 0 내용을 TaskMaster AI parse-prd 형식으로 변환
   - 각 Task에 구현 요구사항, 의존성, 완료 기준, 파일 경로 포함
   - 현재 구현 상태 (인증 시스템 완료, shadcn/ui 일부 설치 등) 반영
   - 한국어로 작성

## 검증

- `docs/planning/Phase_0.md` 파일이 생성되었는지 확인
- TaskMaster AI의 `parse-prd` 명령으로 파싱 가능한 형식인지 확인
- 10개 Task가 모두 포함되었는지 확인
