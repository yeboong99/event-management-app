# E2E 테스트 계획: Phase 2 기능 검증 (Playwright MCP)

## Context

Phase 2에서 구현된 **참여 신청/승인 관리**, **게시판 시스템**, **참여자 관리** 기능에 대해 Playwright MCP를 활용한 E2E 테스트를 수행한다. 관리자 페이지는 테스트 제외. 실제 DB에 테스트 데이터가 반영되어도 무방하며, 주최자/참여자 계정을 교차 사용하여 권한 분기를 철저히 검증한다.

---

## 테스트 계정 정보

| 역할    | 이메일                | 비밀번호  | 이름     |
| ------- | --------------------- | --------- | -------- |
| 주최자  | testuser1@example.com | Test1234! | 김테스트 |
| 참여자A | testuser2@example.com | Test1234! | 이테스트 |
| 참여자B | testuser3@example.com | Test1234! | 박테스트 |
| 참여자C | testuser4@example.com | Test1234! | 최테스트 |
| 참여자D | testuser5@example.com | Test1234! | 정테스트 |

---

## 앱 URL

개발 서버: http://localhost:3000 (실행 중 확인 후 사용)

---

## 테스트 시나리오 목록

### 📋 Phase A: 사전 준비 - 테스트용 이벤트 생성

**목표**: 모든 테스트의 기반이 되는 이벤트를 주최자(testuser1)로 생성

**Step A-1**: testuser1로 로그인
**Step A-2**: `/events/new`에서 이벤트 생성

- 제목: "E2E 테스트 이벤트"
- 날짜/시간: 적절히 설정
- 최대 참여 인원: 3명 (동시성 테스트용)
  **Step A-3**: 생성된 이벤트 URL(`/events/{eventId}`) 기록 → 이후 테스트에서 재사용

---

### 🔐 Phase B: 권한 분기 UI 검증

**목표**: 주최자 vs 비참여자 vs 승인 참여자가 보는 UI가 올바른지 검증

**Scenario B-1: 비참여자 UI 검증** (testuser2로 테스트)

1. testuser2로 로그인 후 테스트 이벤트 상세 페이지 접근
2. **확인 사항**:
   - [링크 복사 버튼] 없음 ✓
   - [수정 버튼] 없음 ✓
   - [삭제 버튼] 없음 ✓
   - [참여 신청 폼] 표시됨 ✓
   - 참여자 탭 클릭 시 `AccessRestrictedNotice` 표시 ✓
   - 게시판 탭 클릭 시 `AccessRestrictedNotice` 표시 ✓

**Scenario B-2: 주최자 UI 검증** (testuser1로 테스트)

1. testuser1로 로그인 후 동일 이벤트 접근
2. **확인 사항**:
   - [링크 복사 버튼] 표시 ✓
   - [수정 버튼] 표시 ✓
   - [삭제 버튼] 표시 ✓
   - 참여 신청 폼 없음 ✓
   - 참여자 탭 → 전체 필터 + 승인/거절 버튼 표시 ✓
   - 게시판 탭 → 게시물 작성 폼 + 공지 체크박스 표시 ✓

---

### 🙋 Phase C: 참여 신청 시스템

**Scenario C-1: 참여 신청 성공** (testuser2)

1. 테스트 이벤트 상세 페이지
2. 메시지 입력: "테스트 참여 신청입니다"
3. [참여 신청] 버튼 클릭
4. **확인 사항**:
   - "신청 대기중" 배지 표시 ✓
   - [신청 취소] 버튼 표시 ✓
   - 참여 신청 폼 사라짐 ✓

**Scenario C-2: 중복 신청 방지** (testuser2로 재시도)

- 이미 신청한 상태에서 또 신청 시도 불가 (버튼 자체가 숨겨져야 함)

**Scenario C-3: 추가 참여 신청** (testuser3, testuser4, testuser5)

1. 각 계정으로 로그인 후 동일 이벤트에 참여 신청
2. 총 4명이 신청한 상태 만들기 (max_participants=3 테스트 목적)

**Scenario C-4: 참여 신청 취소** (testuser5로 테스트)

1. 신청 대기 중인 상태에서 [신청 취소] 버튼 클릭
2. ConfirmDialog 확인 클릭
3. **확인 사항**:
   - 참여 신청 폼 다시 표시 ✓
   - 내 활동 페이지 → 참여 중 탭에서 해당 이벤트 사라짐 ✓

---

### ✅ Phase D: 참여 승인/거절 관리

**Scenario D-1: 참여 신청 승인** (testuser1 - 주최자)

1. testuser1로 로그인 후 테스트 이벤트 접근
2. 참여자 탭 클릭 → 대기 중 탭 필터 선택
3. testuser2(이테스트)의 [승인] 버튼 클릭
4. ConfirmDialog 확인
5. **확인 사항**:
   - 해당 참여자 상태 → "승인됨" 배지 ✓
   - 승인 탭으로 이동 시 해당 참여자 표시 ✓

**Scenario D-2: 참여 신청 거절** (testuser1 - 주최자)

1. testuser3(박테스트)의 [거절] 버튼 클릭
2. ConfirmDialog 확인
3. **확인 사항**:
   - 해당 참여자 상태 → "거절됨" 배지 ✓
   - 거절 탭 필터에서 확인 ✓

**Scenario D-3: 거절된 참여자 UI** (testuser3으로 확인)

1. testuser3으로 이벤트 접근
2. **확인 사항**:
   - "참여 거절됨" 배지 표시 ✓
   - 참여자 탭 → `AccessRestrictedNotice` ✓
   - 게시판 탭 → `AccessRestrictedNotice` ✓

**Scenario D-4: 승인된 참여자 UI** (testuser2로 확인)

1. testuser2로 이벤트 접근
2. **확인 사항**:
   - "참여 승인됨" 배지 표시 ✓
   - 참여자 탭 → 승인된 참여자 목록만 조회 ✓ (필터 탭 없음)
   - 게시판 탭 → 게시물 조회 가능, 댓글 작성 가능 (공지 체크박스 없음) ✓

---

### ⚡ Phase E: 동시성 제어 - 최대 참여 인원 초과

**Scenario E-1: 최대 인원 초과 승인 방지** (testuser1 - 주최자)

- 현재 상태: testuser2(승인), testuser3(거절), testuser4(대기) 가정
- testuser4 승인 → 성공 (2/3)
- testuser5 재신청 후 승인 시도 → "최대 참여 인원을 초과했습니다" 에러 ✓

> 주의: max_participants=3으로 설정. 이미 승인된 testuser2 + testuser4 = 2명이므로 1명 더 가능

---

### 👥 Phase F: 참여자 목록 필터 및 출석 체크

**Scenario F-1: 참여자 상태별 필터 탭** (testuser1 - 주최자)

1. 참여자 탭에서 각 필터 탭 클릭
2. **확인 사항**:
   - 전체 탭: 모든 참여자 표시 ✓
   - 대기 탭: pending 상태만 ✓
   - 승인 탭: approved 상태만 ✓
   - 거절 탭: rejected 상태만 ✓
   - URL에 `?status=pending|approved|rejected` 쿼리 반영 ✓

**Scenario F-2: 출석 체크 (낙관적 업데이트)** (testuser1 - 주최자)

1. 승인된 참여자의 출석 체크박스 클릭
2. **확인 사항**:
   - 즉시 UI 반영됨 (낙관적 업데이트) ✓
   - 다시 클릭 시 해제 ✓

---

### 📝 Phase G: 게시판 시스템

**Scenario G-1: 공지 작성** (testuser1 - 주최자)

1. 게시판 탭 접근
2. 공지 체크박스 체크 후 내용 입력: "공지사항 테스트입니다"
3. [등록] 버튼 클릭
4. **확인 사항**:
   - 게시물 목록 상단에 "공지" 배지와 함께 표시 ✓
   - 글자 수 카운터 표시 ✓

**Scenario G-2: 댓글 작성 - 승인된 참여자** (testuser2)

1. 게시판 탭 접근
2. 댓글 내용 입력: "참여자 댓글 테스트"
3. [등록] 버튼 클릭
4. **확인 사항**:
   - 공지 체크박스 없음 ✓
   - 작성자 이름(이테스트)으로 댓글 표시 ✓
   - 상대 시간 표시 ✓

**Scenario G-3: 공지 작성 권한 검증** (testuser2 - 참여자)

- 공지 체크박스가 폼에 표시되지 않아야 함 ✓

**Scenario G-4: 게시물 수정 (작성자 본인)** (testuser1 - 공지 수정)

1. 공지 게시물의 액션 메뉴 클릭
2. [수정] 선택
3. 인라인 수정 폼에서 내용 변경
4. [저장] 클릭
5. **확인 사항**:
   - 수정된 내용으로 표시 ✓
   - 수정 모드 종료 ✓

**Scenario G-5: 게시물 삭제 (작성자)** (testuser2 - 본인 댓글 삭제)

1. 자신이 작성한 댓글의 액션 메뉴 클릭
2. [삭제] 선택 → ConfirmDialog 확인
3. **확인 사항**: 목록에서 사라짐 ✓

**Scenario G-6: 게시물 삭제 (주최자)** (testuser1 - 참여자 댓글 삭제)

1. 다른 사용자의 게시물 액션 메뉴 클릭
2. **확인 사항**: 삭제 옵션만 표시 (수정 옵션 없음) ✓
3. 삭제 후 목록에서 사라짐 ✓

**Scenario G-7: 게시판 접근 제한** (비승인 참여자)

1. testuser3(거절됨)으로 게시판 탭 클릭
2. **확인 사항**: `AccessRestrictedNotice` 표시 ✓

**Scenario G-8: 더보기 페이지네이션**

1. 게시물을 6개 이상 작성 후
2. [더보기] 버튼 클릭
3. **확인 사항**: 추가 게시물 로드 ✓

---

### 📋 Phase H: 내 활동 페이지 (`/my-events`)

**Scenario H-1: 참여 중 탭 - 상태 필터** (testuser2, testuser3)

1. `/my-events` 접근
2. 참여 중 탭 확인
3. **확인 사항**:
   - testuser2: "승인됨" 배지 + [취소 버튼] 없음 ✓
   - testuser3: "거절됨" 배지 + [취소 버튼] 없음 ✓
   - 상태별 필터 탭 동작 확인 ✓

**Scenario H-2: 참여 취소 (내 활동 페이지에서)** (testuser4 - 대기 중)

1. testuser4로 `/my-events` 접근
2. 해당 이벤트 카드의 [신청 취소] 클릭
3. **확인 사항**: 카드에서 사라짐 ✓

**Scenario H-3: 주최 중 탭** (testuser1)

1. `/my-events?tab=hosting` 접근
2. **확인 사항**:
   - 테스트 이벤트 카드 표시 ✓
   - 카테고리 필터 동작 ✓
   - 이벤트 수 표시 ✓
   - [만들기] 버튼 `/events/new` 링크 ✓

---

### 🔗 Phase I: 초대 링크 복사

**Scenario I-1: 초대 링크 복사** (testuser1 - 주최자)

1. 이벤트 상세 페이지의 [링크 복사 버튼] 클릭
2. **확인 사항**: "복사됨!" 아이콘으로 교체 후 2초 후 원래 아이콘 복원 ✓

---

## 실행 순서 및 의존성

```
Phase A (이벤트 생성)
    ↓
Phase B (권한 UI)
Phase C-1~C-3 (참여 신청 - testuser2,3,4,5)
    ↓
Phase D-1~D-3 (승인/거절)
    ↓
Phase D-4 (승인된 참여자 UI)
Phase E (동시성 제어)
Phase F (필터/출석)
Phase G (게시판)
    ↓
Phase H (내 활동 페이지)
Phase I (초대 링크)
```

---

## 주요 검증 포인트 요약

| 기능           | 검증 포인트                       |
| -------------- | --------------------------------- |
| 참여 신청      | 신청 성공, 중복 방지, 취소        |
| 참여 승인/거절 | 상태 전이, ConfirmDialog          |
| 동시성 제어    | max_participants 초과 에러 메시지 |
| 권한 분기 UI   | 주최자/승인/비승인 별 UI 차이     |
| 게시판         | 공지/댓글 CRUD, 권한 분기         |
| 더보기         | 페이지네이션 동작                 |
| 참여자 목록    | 상태 필터, 출석 토글              |
| 내 활동        | 참여/주최 탭, 상태 필터           |

---

## 구현 단계

**Step 1: [nextjs-supabase-fullstack 없음 - 직접 Playwright MCP 실행]**

모든 테스트는 Playwright MCP 도구를 순차적으로 활용하여 직접 실행:

1. `mcp__playwright__browser_navigate` — 페이지 이동
2. `mcp__playwright__browser_fill_form` — 폼 입력
3. `mcp__playwright__browser_click` — 버튼 클릭
4. `mcp__playwright__browser_snapshot` — 현재 상태 스냅샷 확인
5. `mcp__playwright__browser_take_screenshot` — 증거 캡처 (주요 시점)

각 Phase가 완료되면 결과를 기록하고 다음 Phase로 진행.

---

## 테스트 결과 기록 방침

### 성공 시

- `mcp__playwright__browser_take_screenshot`으로 스크린샷 캡처
- 저장 경로: `screenshots/phase2/{phase}_{scenario_name}.png`
- 예: `screenshots/phase2/C1_participation_apply_success.png`

### 실패 시

- **즉시 수정하지 않음**
- 실패 원인만 분석 후 루트 디렉토리의 `phase2_test_issue.md`에 기록
- 기록 형식:
  ```markdown
  ## [Phase X - Scenario N] 시나리오 이름

  - **실패 조건**: 어떤 상황에서 실패했는지
  - **예상 결과**: 기대했던 동작
  - **실제 결과**: 실제 발생한 동작
  - **추정 원인**: 원인 분석
  ```

---

## 예상 이슈 및 대응

| 이슈                  | 대응                               |
| --------------------- | ---------------------------------- |
| 이미 신청된 계정 상태 | DB 확인 후 필요시 취소 처리        |
| 개발 서버 미실행      | 사용자에게 `npm run dev` 실행 안내 |
| 이전 테스트 데이터    | 새 이벤트 생성으로 격리            |
| Supabase 세션 오류    | 로그아웃 후 재로그인               |
