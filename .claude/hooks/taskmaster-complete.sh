#!/bin/bash
# PostToolUse: mcp__taskmaster-ai__set_task_status 호출 시 완료 신호 처리
# 명시적으로 set_task_status(done) 이 호출될 때만 완료 처리

set -euo pipefail

SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
STATE_FILE="$CLAUDE_PROJECT_DIR/.claude/.taskmaster-state-${SESSION_ID}.json"
LOG_FILE="$CLAUDE_PROJECT_DIR/.claude/hooks/taskmaster.log"

# stdin에서 tool 입력 JSON 읽기
INPUT=$(cat)

# task ID 추출
TASK_ID=$(echo "$INPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
tool_input = data.get('tool_input', {})
print(tool_input.get('id', ''))
" 2>/dev/null || echo "")

# status 추출
TASK_STATUS=$(echo "$INPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
tool_input = data.get('tool_input', {})
print(tool_input.get('status', ''))
" 2>/dev/null || echo "")

if [ -z "$TASK_ID" ] || [ -z "$TASK_STATUS" ]; then
  exit 0
fi

# 완료 신호: done 또는 completed 상태로 명시적 설정 시에만 처리
if [[ "$TASK_STATUS" == "done" || "$TASK_STATUS" == "completed" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [session:$SESSION_ID] COMPLETE: task $TASK_ID → $TASK_STATUS (명시적 완료 신호)" >> "$LOG_FILE"
  # 세션 state 파일 정리
  rm -f "$STATE_FILE"
  exit 0
fi

# 취소/연기 신호
if [[ "$TASK_STATUS" == "cancelled" || "$TASK_STATUS" == "deferred" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [session:$SESSION_ID] CLOSED: task $TASK_ID → $TASK_STATUS (명시적 종료 신호)" >> "$LOG_FILE"
  rm -f "$STATE_FILE"
  exit 0
fi

# 그 외 상태 변경 (in-progress, pending 등)은 state 파일 갱신만
if [ -f "$STATE_FILE" ]; then
  echo "{\"currentTaskId\": \"$TASK_ID\", \"status\": \"$TASK_STATUS\", \"sessionId\": \"$SESSION_ID\", \"updatedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$STATE_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [session:$SESSION_ID] UPDATE: task $TASK_ID → $TASK_STATUS" >> "$LOG_FILE"
fi
