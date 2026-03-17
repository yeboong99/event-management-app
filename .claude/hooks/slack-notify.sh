#!/usr/bin/env bash
# Claude Code Notification Hook - Slack 알림 전송 스크립트
# stdin으로 JSON을 받아 notification_type에 따라 Slack 메시지를 전송합니다.
#
# 사용법: slack-notify.sh [--source user|project]
#   --source user    : ~/.claude/.env에서 URL 읽기 (프로젝트에 URL 있으면 skip)
#   --source project : $CWD/.env에서 URL 읽기

set -euo pipefail

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
if command -v chcp.com &>/dev/null; then
  chcp.com 65001 &>/dev/null || true
fi

# --source 인자 파싱 (기본값: user)
SOURCE="user"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)
      SOURCE="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# stdin JSON 읽기
INPUT=$(cat)

# jq로 필드 파싱
NOTIFICATION_TYPE=$(echo "$INPUT" | jq -r '.notification_type // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')

# notification_type이 없으면 종료 (정상)
if [ -z "$NOTIFICATION_TYPE" ]; then
  exit 0
fi

# Webhook URL 결정 로직
WEBHOOK_URL=""

if [ "$SOURCE" = "project" ]; then
  # 프로젝트 스코프: $CWD/.env에서 URL 읽기
  if [ -n "$CWD" ] && [ -f "$CWD/.env" ]; then
    WEBHOOK_URL=$(grep -E '^SLACK_WEBHOOK_URL=' "$CWD/.env" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
  fi
else
  # 유저 스코프: 프로젝트 .env에 URL이 이미 있으면 skip (프로젝트 훅이 처리)
  PROJECT_HAS_URL=""
  if [ -n "$CWD" ] && [ -f "$CWD/.env" ]; then
    PROJECT_HAS_URL=$(grep -E '^SLACK_WEBHOOK_URL=' "$CWD/.env" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
  fi

  if [ -n "$PROJECT_HAS_URL" ]; then
    # 프로젝트에 URL이 있으므로 프로젝트 훅이 전송 → 중복 방지를 위해 skip
    exit 0
  fi

  # 프로젝트에 URL이 없으면 ~/.claude/.env에서 폴백
  USER_ENV="$HOME/.claude/.env"
  if [ -f "$USER_ENV" ]; then
    WEBHOOK_URL=$(grep -E '^SLACK_WEBHOOK_URL=' "$USER_ENV" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
  fi
fi

# Webhook URL이 없으면 종료 (정상)
if [ -z "$WEBHOOK_URL" ]; then
  exit 0
fi

# 프로젝트명 추출 (cwd 마지막 디렉토리명)
PROJECT_NAME=$(basename "${CWD:-unknown}")

# 세션 ID 앞 8자
SESSION_SHORT="${SESSION_ID:0:8}"

# 현재 시각 (KST)
TIMESTAMP=$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M:%S KST')

# notification_type별 메시지 설정
case "$NOTIFICATION_TYPE" in
  permission_prompt)
    COLOR="#FF8C00"
    EMOJI=$'\U0001F512'
    TITLE=$'\uad8c\ud55c \uc2b9\uc778 \uc694\uccad'
    TEXT=$'Claude Code\uac00 \uc791\uc5c5 \uc9c4\ud589\uc744 \uc704\ud574 \uad8c\ud55c \uc2b9\uc778\uc744 \uae30\ub2e4\ub9ac\uace0 \uc788\uc2b5\ub2c8\ub2e4. \ud130\ubbf8\ub110\uc744 \ud655\uc778\ud574 \uc8fc\uc138\uc694.'
    ;;
  idle_prompt)
    COLOR="#36A64F"
    EMOJI=$'\u2705'
    TITLE=$'\uc791\uc5c5 \uc644\ub8cc'
    TEXT=$'Claude Code\uac00 \uc791\uc5c5\uc744 \uc644\ub8cc\ud558\uace0 \ub2e4\uc74c \uc9c0\uc2dc\ub97c \uae30\ub2e4\ub9ac\uace0 \uc788\uc2b5\ub2c8\ub2e4.'
    ;;
  elicitation_dialog)
    COLOR="#0078D4"
    EMOJI=$'\U0001F64B'
    TITLE=$'\uc758\uc0ac\uacb0\uc815 \ud544\uc694'
    TEXT=$'Claude Code\uac00 \uc9c4\ud589\uc744 \uc704\ud574 \ucd94\uac00 \uc815\ubcf4\ub098 \uacb0\uc815\uc774 \ud544\uc694\ud569\ub2c8\ub2e4. \ud130\ubbf8\ub110\uc744 \ud655\uc778\ud574 \uc8fc\uc138\uc694.'
    ;;
  *)
    exit 0
    ;;
esac

# Slack Block Kit JSON 페이로드 구성
PAYLOAD=$(jq -n \
  --arg color "$COLOR" \
  --arg emoji "$EMOJI" \
  --arg title "$TITLE" \
  --arg text "$TEXT" \
  --arg project "$PROJECT_NAME" \
  --arg timestamp "$TIMESTAMP" \
  --arg session "$SESSION_SHORT" \
  '{
    attachments: [
      {
        color: $color,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: ($emoji + " Claude Code - " + $title),
              emoji: true
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: $text
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: ("*\ud504\ub85c\uc81d\ud2b8:* " + $project + "  |  *\uc2dc\uac01:* " + $timestamp + "  |  *\uc138\uc158:* `" + $session + "`")
              }
            ]
          }
        ]
      }
    ]
  }')

# Slack으로 전송 (임시 파일 경유 → Windows 인자 인코딩 문제 우회)
TMPFILE=$(mktemp)
printf '%s' "$PAYLOAD" > "$TMPFILE"
curl --silent --max-time 5 \
  -X POST \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary "@$TMPFILE" \
  "$WEBHOOK_URL" || true
rm -f "$TMPFILE"

exit 0
