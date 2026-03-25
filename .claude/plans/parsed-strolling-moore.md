# Plan: PROJECT_ISSUES.md 정리 및 신규 이슈 추가

## Context

PROJECT_ISSUES.md에는 이미 해결된 이슈(✅ 해결됨) 6건이 남아 있어 문서가 불필요하게 길어져 있음.
미해결 이슈(🔴)는 FLOW-001 1건만 존재. 해결된 이슈를 제거하고 신규 UI 이슈를 추가해야 함.

## 작업 범위

파일: `docs/planning/PROJECT_ISSUES.md`

---

## Step 1: 해결된 이슈 전체 제거

제거 대상 섹션:

- PERF-001: RLS `auth.uid()` 반복 평가 (✅)
- PERF-002: `carpools.driver_id` 인덱스 누락 (✅)
- PERF-003: `events`/`profiles` RLS `auth.uid()` 미최적화 (✅)
- QUAL-001: RLS 정책 역할 불일치 (✅)
- FEAT-001: 비공개 이벤트 승인 참여자 조회 불가 (✅)
- FEAT-002: `carpools` UPDATE 정책 없음 (✅)

유지 대상:

- FLOW-001: 비공개 이벤트 참여 신청 흐름 단절 (🔴 미해결)

## Step 2: 이슈 현황 요약 테이블 갱신

FLOW-001 단 1건만 남도록 테이블 축소.

## Step 3: 신규 이슈 추가 — UI-001

- **ID**: UI-001
- **카테고리**: UI/UX
- **제목**: 내 활동 페이지 이벤트 카드에 비공개 이벤트 뱃지 없음
- **상태**: 🔴 미해결
- **내용**: 비공개 이벤트(`is_public = false`)가 내 활동 페이지 카드에 표시될 때 공개 이벤트와 시각적으로 구별되지 않음. 카드 적절한 위치에 "비공개" 뱃지 추가 필요. 정확한 요구사항(위치, 스타일, 텍스트)은 추후 기술 예정.
- **심각도**: 낮음 (현재 MVP에서 비공개 이벤트 생성이 UI에 없어 미발현)

---

## 검증

- 문서 편집 후 `docs/planning/PROJECT_ISSUES.md` 직접 열람으로 확인
