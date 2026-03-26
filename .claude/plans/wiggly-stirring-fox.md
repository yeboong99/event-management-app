# Plan: UI-001 — 내 활동 페이지 이벤트 카드 비공개 뱃지 추가

## Context

`/my-events` 페이지의 이벤트 카드(`EventCardMobile`)에 비공개 이벤트(`is_public = false`)를 시각적으로 구별하는 뱃지가 없습니다. 사용자가 자신이 주최하거나 참여한 비공개 이벤트를 카드에서 즉시 구별할 수 없는 UX 문제입니다.

## 현황 파악

- **수정 대상 파일**: `components/mobile/event-card-mobile.tsx` (단일 파일 변경)
- `EventWithHost` 타입은 `Database["public"]["Tables"]["events"]["Row"]`를 확장하므로 `is_public: boolean | null` 필드가 이미 포함됨
- `getMyEvents`, `getMyParticipations` 쿼리 모두 `*` 셀렉트로 `is_public` 이미 포함
- 커버 이미지 영역 상단 좌측에 `NEW` 배지가 위치 — 비공개 뱃지는 **상단 우측**에 배치하여 충돌 방지
- 현재 이벤트 배지: NEW (top-left), 카테고리 (bottom-left)

## 구현 계획

### Step 1: [nextjs-ui-markup] EventCardMobile 비공개 뱃지 추가

**파일**: `components/mobile/event-card-mobile.tsx`

변경 내용:

1. `event.is_public === false` 조건으로 비공개 여부 판단
2. 커버 이미지 영역 **상단 우측** (`absolute top-2 right-2`)에 뱃지 추가
3. 스타일: `Lock` 아이콘(lucide-react) + "비공개" 텍스트, 반투명 다크 배경
   - `bg-black/60 text-white rounded-full px-2 py-0.5 text-xs font-medium`
4. NEW 배지와 동일한 패턴으로 조건부 렌더링

## 검증 — Playwright MCP 브라우저 테스트

구현 완료 후 `npm run dev`로 개발 서버 실행 상태에서 아래 순서로 직접 확인합니다.

### 사전 조건

- 비공개 이벤트를 주최 중인 계정으로 로그인된 상태

### 테스트 시나리오

1. **비공개 배지 표시 확인**
   - `mcp__playwright__browser_navigate` → `http://localhost:3000/my-events?tab=hosting`
   - `mcp__playwright__browser_take_screenshot` → 비공개 이벤트 카드에 뱃지가 보이는지 확인
   - `mcp__playwright__browser_snapshot` → `비공개` 텍스트 요소가 DOM에 존재하는지 확인

2. **공개 이벤트에 뱃지 없음 확인**
   - 같은 스크린샷에서 공개 이벤트 카드에는 "비공개" 텍스트/아이콘이 없는지 확인

3. **NEW 배지 동시 표시 시 레이아웃 확인**
   - 24시간 이내 생성된 비공개 이벤트가 있을 경우, 좌측 NEW / 우측 비공개 배지가 동시 표시되며 겹치지 않는지 스크린샷으로 확인

4. **참여 중 탭 확인**
   - `mcp__playwright__browser_navigate` → `http://localhost:3000/my-events` (참여 중 탭)
   - 비공개 이벤트에 참여한 경우, 해당 카드에도 뱃지 표시 확인
