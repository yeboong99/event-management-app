# MCP 서버 연결 복구 계획

## Context

Node.js가 설치되어 있지 않아 `.mcp.json`의 stdio 타입 MCP 서버들이 `npx`를 찾지 못해 전부 실패했음.
Node.js 설치 후 `npx --version` 11.9.0 확인됨. Claude Code를 재시작하면 새 PATH가 적용되어 MCP 서버들이 정상 연결될 것으로 예상.

## 해결 절차

### 1. Claude Code 재시작

- Node.js 설치 이전에 실행된 Claude Code는 새 PATH를 모름
- 완전히 종료 후 재시작 필요

### 2. MCP 연결 확인

- `/mcp` 명령어로 7개 서버 상태 확인
- `context7`, `memory`, `playwright`, `sequential-thinking`, `shadcn`, `taskmaster-ai` → `connected` 기대

### 3. Supabase 인증

- `supabase` 서버는 `needs authentication` 상태 → OAuth 인증 별도 필요
- `/mcp` → `supabase` 선택 → 인증 링크 열기 → 브라우저에서 승인

## 변경이 필요한 파일

없음 (`.mcp.json`은 이미 수정 완료)
