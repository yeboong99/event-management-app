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

# 복수 ID 조회(쉼표 포함) 시 상태 변경 스킵 - 단일 태스크 작업 시만 추적
if [[ "$TASK_ID" == *","* ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [session:$SESSION_ID] SKIP: 복수 ID 조회($TASK_ID) → 상태 변경 생략" >> "$LOG_FILE"
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
