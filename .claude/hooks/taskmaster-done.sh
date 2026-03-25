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
  rm -f "$STATE_FILE"
  exit 0
fi

# 이미 완료된 상태면 skip (중복 업데이트 방지)
if [[ "$TASK_STATUS" == "done" || "$TASK_STATUS" == "cancelled" || "$TASK_STATUS" == "deferred" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [session:$SESSION_ID] SKIP: task $TASK_ID 이미 $TASK_STATUS 상태" >> "$LOG_FILE"
  rm -f "$STATE_FILE"
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
