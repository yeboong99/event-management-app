# 플랜: TaskMaster AI 페이즈별 태스크 추가 전략

## Context

ROADMAP.md에는 Phase 0~N 전체 마일스톤이 정의되어 있다.
사용자는 Phase 0 태스크만 먼저 TaskMaster에 추가하되, AI가 전체 로드맵 맥락을 잃지 않도록 하고 싶다.
페이즈 완료 때마다 새 PRD 파일을 만드는 반복 작업은 원하지 않음.

---

## 해결책: 전체 파싱 + 상태(Status) 관리 방식

**한 번만 파싱하고, 상태로 페이즈를 관리한다.**

### 흐름

1. **전체 ROADMAP.md를 한 번에 `tm parse`**
   - TaskMaster가 모든 페이즈 맥락을 인지하며 태스크 생성
   - TASK-001 ~ TASK-010 (Phase 0), TASK-011 ~ TASK-021 (Phase 1), ... 모두 생성됨

2. **Phase 1+ 태스크를 즉시 `deferred` 상태로 일괄 변경**
   - TaskMaster는 기본적으로 `pending` 상태 태스크만 `next_task` 추천에 포함
   - `deferred` 태스크는 목록에서 숨겨지지 않지만, 작업 흐름에 방해 안 됨
   - `set_task_status`로 Phase 1+ 태스크 전체를 `deferred`로 변경

3. **Phase 0 작업 진행**
   - `next_task` → 구현 → `set_task_status done` 반복

4. **Phase 0 완료 시 → Phase 1 태스크만 `pending`으로 일괄 활성화**
   - 새 파일 생성 불필요, 컨텍스트 재입력 불필요
   - 이미 ROADMAP.md의 전체 내용으로 태스크가 만들어져 있음

### 장점

| 방식                             | 페이즈 진행 시 추가 작업         | AI 맥락            |
| -------------------------------- | -------------------------------- | ------------------ |
| 페이즈별 PRD 파일 생성           | 매 페이즈마다 PRD 파일 작성 필요 | 전체 맥락 유지     |
| **전체 파싱 + 상태 관리 (채택)** | **없음 (상태만 변경)**           | **전체 맥락 유지** |

---

## 구현 계획

### Step 1: 전체 ROADMAP.md 파싱

```bash
# CLI
npx task-master-ai parse-prd docs/planning/ROADMAP.md --numTasks 50
```

또는 MCP:

```
mcp__taskmaster-ai__parse_prd(input: "docs/planning/ROADMAP.md")
```

### Step 2: Phase 1+ 태스크 일괄 deferred 처리

파싱 결과로 태스크 ID를 확인한 뒤:

```bash
# Phase 1 시작 ID부터 deferred로 변경 (예: 11번부터)
npx task-master-ai set-status --id 11,12,...,N --status deferred
```

또는 MCP `set_task_status`를 사용해 Phase 1+ 태스크 상태 변경

### Step 3: Phase 0 작업 진행

```bash
npx task-master-ai next         # 다음 할 일 추천
npx task-master-ai set-status --id 1 --status done
```

### Step 4: Phase 0 완료 시 Phase 1 활성화

```bash
npx task-master-ai set-status --id 11,12,...,21 --status pending
```

---

## 검증 방법

1. `tm parse` 후 `tm list` → 전체 태스크 생성 확인
2. `tm list --status pending` → Phase 0 태스크(1~10)만 표시되는지 확인
3. `tm next` → Phase 0 첫 번째 태스크 추천 확인
4. 태스크 details에 전체 프로젝트 맥락(Phase 1~N 언급) 반영 여부 확인
