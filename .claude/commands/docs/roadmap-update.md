---
argument-hint: [Phase number]
description: ROADMAP.md 현재 상태 업데이트
allowed-tools: Read, Edit, Glob, Grep
model: claude-sonnet-4-6
---

현재 코드베이스와 ROADMAP.md를 비교하여 개발 로드맵 문서인 docs/planning/ROADMAP.md를 업데이트합니다.

## 완료 여부 판단 기준

TaskMaster는 사용하지 않습니다. 반드시 실제 코드베이스와 ROADMAP.md를 직접 비교하여 판단합니다.

각 태스크에 대해 아래 순서로 검증합니다:

1. ROADMAP.md의 태스크에 명시된 파일 경로가 실제로 존재하는지 Glob으로 확인합니다
2. 해당 파일의 내용을 Read / Grep으로 확인하여 완료 기준 항목이 구현되었는지 검증합니다
3. 위 두 조건을 모두 충족한 경우에만 `[x]`로 표시합니다
4. 하나라도 미충족 시 `[ ]` 유지하세요.

## 문서 편집 시 유의사항

1. ROADMAP.md의 진행사항 표현한 체크리스트만 체크표시 및 체크해제 표시할 수 있습니다.
2. 체크 및 체크해제 외의 어떠한 편집도 할 수 없습니다.
3. 만약 argument로 phase number를 입력할 경우, 해당 Phase 작업 중 미완료 사항이 있으면 ROADMAP.md에 체크하지 말고 저에게 알려주세요.
