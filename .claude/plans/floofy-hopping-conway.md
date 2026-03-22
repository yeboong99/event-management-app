# 알림 훅 복구 계획

## Context

Mac에서 Windows MinGW64로 환경을 이전한 후 Slack 알림 훅이 작동하지 않는 문제.
두 가지 원인이 복합적으로 작용하고 있음.

---

## 원인 분석

### 원인 1: CRLF 줄바꿈 (핵심)

- `git config core.autocrlf = true` 로 인해 `.sh` 파일이 CRLF로 체크아웃됨
- `file slack-notify.sh` 결과: `CRLF line terminators` 확인됨
- bash는 CRLF 스크립트를 실행하면 각 줄 끝의 `\r`을 명령어 일부로 해석 → 오류 또는 무응답
- `.gitattributes` 파일이 없어 `.sh` 파일에 대한 LF 강제 설정이 없음

### 원인 2: .env 파일 없음

- `.env`는 gitignore 대상 → git pull로 이전되지 않음
- 스크립트가 `SLACK_WEBHOOK_URL`을 찾지 못하면 조용히 exit 0
- Mac의 Slack Webhook URL을 별도로 새 PC에 복사해야 함

---

## 수정 계획

### Step 1: .gitattributes 추가

`C:\Users\HighTech\Desktop\event-management\.gitattributes` 생성:

```
# 쉘 스크립트는 항상 LF 유지 (Windows autocrlf 방지)
*.sh text eol=lf
```

### Step 2: 기존 스크립트 LF로 재변환

```bash
# MinGW64 dos2unix 또는 sed로 CRLF → LF 변환
dos2unix .claude/hooks/slack-notify.sh
# 또는
sed -i 's/\r//' .claude/hooks/slack-notify.sh
```

### Step 3: .env 파일 복구

`.env` 파일에 Slack Webhook URL 추가 (Mac에서 사용하던 URL):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Step 4: .env.example 업데이트

`SLACK_WEBHOOK_URL` 항목을 `.env.example`에도 추가해 두어 다음 환경 이전 시 누락 방지.

---

## 수정 파일 목록

- **생성**: `.gitattributes` — `.sh` 파일 LF 강제
- **수정**: `.claude/hooks/slack-notify.sh` — CRLF → LF 변환 (dos2unix)
- **수정**: `.env.example` — `SLACK_WEBHOOK_URL` 항목 추가
- **복구**: `.env` — Slack Webhook URL 직접 입력 (사용자가 보유한 URL 사용)

---

## 검증 방법

```bash
# 1. 줄바꿈 확인
file .claude/hooks/slack-notify.sh
# → "with LF line terminators" 이어야 함

# 2. 스크립트 직접 테스트
echo '{"notification_type":"idle_prompt","cwd":"/c/Users/HighTech/Desktop/event-management","session_id":"test-abc123"}' \
  | bash .claude/hooks/slack-notify.sh --source project
# → Slack 채널에 메시지 수신 확인

# 3. 실제 훅 트리거: Claude Code에서 작업 완료 → idle_prompt 발생 시 Slack 알림 확인
```

---

## 추가 권장사항

향후 환경 이전 시 `.env` 파일 누락을 방지하기 위해:

- `.env.example`에 필요한 모든 키를 명시
- README 또는 CLAUDE.md에 초기 설정 지침 추가 검토
