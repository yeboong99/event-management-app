# TaskMaster 태스크 상태 자동 업데이트 훅 설정

## Context

현재 태스크 완료 후 `mcp__taskmaster-ai__set_task_status` → `done` 호출이 Claude의 수동 판단에 의존한다. 이를 Claude Code 훅으로 자동화하여 태스크 작업 시작 시 `in_progress`, 완료 시 `done`이 자동 반영되도록 한다. 예외 상황(태스크 없음, 이미 완료, CLI 오류 등)에 대한 처리 흐름도 정의한다.

## 훅 흐름 설계

```
태스크 조회 (get_task)
    │
    ▼ [PostToolUse hook]
taskmaster-track.sh
 → state 파일에 현재 태스크 ID + in_progress 기록
 → task-master set-status in-progress 호출
    │
    ▼ (Claude 작업 수행)
    │
Claude 응답 완료
    │
    ▼ [Stop hook]
taskmaster-done.sh
 → state 파일에서 현재 태스크 ID 읽기
 → 예외 검사 수행
 → 정상이면 task-master set-status done 호출
 → state 파일 초기화
```

## 예외 처리 흐름

| 예외 상황                                   | 처리 방식                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| state 파일 없음 / task ID 없음              | skip (로그만 기록)                                                                       |
| 이미 `done` / `cancelled` / `deferred` 상태 | skip (중복 업데이트 방지)                                                                |
| `task-master` CLI 없음 (npx 실패)           | 에러 로그 기록 + 종료 코드 1                                                             |
| CLI 실행 오류 (네트워크, API 등)            | 에러 로그 기록 + skip                                                                    |
| **멀티 세션 동시 작업**                     | `$CLAUDE_SESSION_ID`로 세션별 독립 state 파일 사용 → 상호 간섭 없음                      |
| `get_task` 호출했지만 구현 실패 후 Stop     | state 파일에 남아있어 done 처리 → 사용자가 `/cancel-task` 또는 수동 상태 변경으로 되돌림 |

## 구현 대상 파일

| 파일                                                  | 역할                                           |
| ----------------------------------------------------- | ---------------------------------------------- |
| `.claude/hooks/taskmaster-track.sh`                   | 신규 생성: PostToolUse → 태스크 ID 추적        |
| `.claude/hooks/taskmaster-done.sh`                    | 신규 생성: Stop → done 업데이트                |
| `.claude/.taskmaster-state-${CLAUDE_SESSION_ID}.json` | 세션별 런타임 state 파일 (gitignore 추가 권장) |
| `.claude/settings.json`                               | PostToolUse + Stop 훅 추가                     |

## 구현 범위

- 훅은 **프로젝트 레벨**로 제한: `.claude/settings.json`에만 추가 (글로벌 `~/.claude/settings.json` 수정 없음)
- 구현은 서브에이전트 위임 없이 **메인 세션 Claude가 직접 진행**

## 구현 계획

### Step 1: 훅 스크립트 및 settings.json 작성

#### `.claude/hooks/taskmaster-track.sh`

```bash
#!/bin/bash
# PostToolUse: mcp__taskmaster-ai__get_task 실행 후 태스크 ID를 세션별 state 파일에 기록

set -euo pipefail

# 세션별 독립 state 파일 (멀티 세션 동시 작업 시 상호 간섭 방지)
SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
STATE_FILE="$CLAUDE_PROJECT_DIR/.claude/.taskmaster-state-${SESSION_ID}.json"
LOG_FILE="$CLAUDE_PROJECT_DIR/.claude/hooks/taskmaster.log"

# stdin에서 tool 입력 JSON 읽기
INPUT=$(cat)

# task ID 추출 (tool_input.id 필드)
TASK_ID=$(echo "$INPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
tool_input = data.get('tool_input', {})
task_id = tool_input.get('id', '')
print(task_id)
" 2>/dev/null || echo "")

if [ -z "$TASK_ID" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [session:$SESSION_ID] SKIP: task ID를 추출하지 못했습니다" >> "$LOG_FILE"
  exit 0
fi

# 세션 state 파일 업데이트
echo "{\"currentTaskId\": \"$TASK_ID\", \"status\": \"in_progress\", \"sessionId\": \"$SESSION_ID\", \"updatedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$STATE_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] [session:$SESSION_ID] TRACK: task $TASK_ID → in_progress" >> "$LOG_FILE"

# TaskMaster CLI로 상태 업데이트
cd "$CLAUDE_PROJECT_DIR"
npx task-master set-status --id "$TASK_ID" --status "in-progress" >> "$LOG_FILE" 2>&1 || {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [session:$SESSION_ID] WARN: in-progress 상태 업데이트 실패 (task $TASK_ID)" >> "$LOG_FILE"
}
```

#### `.claude/hooks/taskmaster-done.sh`

```bash
#!/bin/bash
# Stop hook: Claude 응답 완료 시 해당 세션의 태스크를 done으로 업데이트

set -euo pipefail

# 세션별 독립 state 파일
SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
STATE_FILE="$CLAUDE_PROJECT_DIR/.claude/.taskmaster-state-${SESSION_ID}.json"
LOG_FILE="$CLAUDE_PROJECT_DIR/.claude/hooks/taskmaster.log"

# 이 세션의 state 파일 없으면 skip
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# state 읽기
TASK_ID=$(python3 -c "
import json, sys
with open('$STATE_FILE') as f:
  data = json.load(f)
print(data.get('currentTaskId', ''))
" 2>/dev/null || echo "")

TASK_STATUS=$(python3 -c "
import json, sys
with open('$STATE_FILE') as f:
  data = json.load(f)
print(data.get('status', ''))
" 2>/dev/null || echo "")

# task ID 없으면 skip
if [ -z "$TASK_ID" ]; then
  exit 0
fi

# 이미 완료된 상태면 skip (중복 업데이트 방지)
if [[ "$TASK_STATUS" == "done" || "$TASK_STATUS" == "cancelled" || "$TASK_STATUS" == "deferred" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [session:$SESSION_ID] SKIP: task $TASK_ID 이미 $TASK_STATUS 상태" >> "$LOG_FILE"
  exit 0
fi

# TaskMaster CLI로 done 업데이트
cd "$CLAUDE_PROJECT_DIR"
if npx task-master set-status --id "$TASK_ID" --status "done" >> "$LOG_FILE" 2>&1; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [session:$SESSION_ID] DONE: task $TASK_ID → done" >> "$LOG_FILE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [session:$SESSION_ID] ERROR: task $TASK_ID done 업데이트 실패 (수동 확인 필요)" >> "$LOG_FILE"
fi

# 성공/실패 무관하게 세션 state 파일 삭제 (파일 누적 방지)
rm -f "$STATE_FILE"
```

#### `.claude/settings.json` 훅 추가

기존 `hooks` 객체에 아래 항목 추가:

```json
"PostToolUse": [
  {
    "matcher": "mcp__taskmaster-ai__get_task",
    "hooks": [
      {
        "type": "command",
        "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/taskmaster-track.sh",
        "timeout": 15
      }
    ]
  }
],
"Stop": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/taskmaster-done.sh",
        "timeout": 15
      }
    ]
  }
]
```

## 검증

1. 태스크 작업 시작 → `.claude/.taskmaster-state-<SESSION_ID>.json` 파일 생성 및 `in_progress` 기록 확인
2. TaskMaster에서 해당 태스크가 `in_progress`로 변경됐는지 확인
3. Claude 응답 완료 후 state 파일이 삭제되고 태스크가 `done`으로 변경됐는지 확인
4. `.claude/hooks/taskmaster.log`에서 `[session:xxx]` 로그 확인
5. **멀티 세션 검증**: 두 Claude 세션에서 각각 다른 태스크 동시 진행 → 각 세션이 독립 state 파일 사용, 서로 간섭 없이 각자 태스크를 done 처리 확인
