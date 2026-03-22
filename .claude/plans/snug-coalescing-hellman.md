# Task 20.7: Playwright E2E 자동화 테스트

## Context

Task 20에서 구현한 Phase 1 기능들(이벤트 상세, 수정, 삭제, 초대 링크 복사, 탭 구조, 권한/404 처리)을
Playwright MCP를 사용하여 브라우저에서 자동으로 E2E 테스트합니다.
정상 작동 화면 스크린샷 저장, UI/UX 개선사항 문서화, 기능 오류 즉시 수정이 목표입니다.

## 테스트 계정 정보

- **email**: yechani99@naver.com
- **password**: yclee37647568
- **role**: host (주최자)

## 앱 구조 요약

- 기본 URL: `http://localhost:3000`
- 주최자 경로: `/home`, `/events`, `/events/new`, `/events/[eventId]`, `/events/[eventId]/edit`
- 이벤트 카드 href: `/events/${event.id}` (주최자 뷰)
- 이벤트 카테고리: 생일파티, 파티모임, 워크샵, 스터디, 운동스포츠, 기타
- `screenshots/` 디렉토리: 아직 없음 → 테스트 중 생성

## 사전 준비

1. `npm run dev`가 이미 실행 중이어야 함 (사용자가 별도 실행)
2. Playwright MCP 브라우저로 `http://localhost:3000` 접근

---

## E2E 테스트 시나리오 (순서)

### Phase A: 인증 및 기본 페이지

1. **로그인**
   - `http://localhost:3000/auth/login` 접근 → 이메일/패스워드 입력 → 로그인
   - 스크린샷: `screenshots/01-login-page.png`, `screenshots/02-login-success.png`

2. **홈 페이지** (`/home`)
   - 최근 이벤트 목록 렌더링 확인
   - FAB(+) 버튼 존재 확인
   - 스크린샷: `screenshots/03-home-page.png`

3. **이벤트 목록** (`/events`)
   - 이벤트 카드 목록 렌더링 확인
   - 카테고리 탭 필터 클릭 테스트 (최소 2개 카테고리)
   - 스크린샷: `screenshots/04-events-list.png`, `screenshots/05-events-list-filtered.png`

### Phase B: 이벤트 상세 페이지 (핵심 Task 20 기능)

4. **이벤트 상세 페이지** (기존 이벤트 카드 클릭)
   - 커버 이미지(또는 placeholder) 렌더링 확인
   - 카테고리 배지, 제목, 날짜, 장소, 참여 인원, 공개 여부 표시 확인
   - 설명 텍스트 확인
   - 스크린샷: `screenshots/06-event-detail.png`

5. **하위 탭 구조**
   - 참여자/공지댓글/카풀/정산 탭 4개 확인
   - 각 탭 클릭 시 "준비 중입니다" 메시지 확인
   - 스크린샷: `screenshots/07-event-detail-tabs.png`

6. **초대 링크 복사**
   - "초대 링크 복사" 버튼 클릭
   - 버튼 텍스트가 "복사됨!"으로 변경 확인
   - toast 알림 확인
   - 스크린샷: `screenshots/08-copy-link-success.png`

### Phase C: 이벤트 수정

7. **수정 페이지 이동**
   - 상세 페이지의 "수정" 버튼 클릭 → `/events/[id]/edit` 이동 확인
   - EventForm에 기존 데이터가 미리 채워졌는지 확인 (제목, 카테고리, 날짜 등)
   - 스크린샷: `screenshots/09-event-edit-prefilled.png`

8. **수정 제출**
   - 제목 필드 일부 변경 후 제출
   - 로딩 상태 표시 확인
   - 수정 완료 후 상세 페이지로 리다이렉트 확인
   - 수정된 내용 반영 확인
   - 스크린샷: `screenshots/10-event-edit-success.png`

### Phase D: 이벤트 삭제 (삭제 전용 테스트 이벤트 생성)

9. **테스트용 이벤트 생성**
   - `/events/new`에서 제목: "삭제 테스트 이벤트" 생성
   - 이 이벤트로 삭제 테스트 진행 (원본 이벤트 보존)
   - 스크린샷: `screenshots/11-test-event-created.png`

10. **삭제 확인 다이얼로그 - 취소**
    - 삭제 버튼 클릭 → ConfirmDialog 열림 확인
    - 다이얼로그 제목: "이벤트 삭제", 내용 확인
    - "취소" 클릭 → 다이얼로그 닫힘, 이벤트 유지 확인
    - 스크린샷: `screenshots/12-delete-dialog.png`

11. **삭제 확인 다이얼로그 - 삭제 실행**
    - 다시 삭제 버튼 클릭 → 다이얼로그 확인 → "삭제" 클릭
    - 로딩 상태 확인
    - `/events` 목록으로 리다이렉트 확인
    - 삭제된 이벤트가 목록에 없는지 확인
    - 스크린샷: `screenshots/13-delete-success.png`

### Phase E: 권한 및 에러 처리

12. **존재하지 않는 eventId → 404**
    - `/events/nonexistent-id-12345` 접근
    - 404 페이지 렌더링 확인
    - 스크린샷: `screenshots/14-404-page.png`

---

## 오류 발견 시 처리 방침

### 기능 오류 (바로 수정)

1. 오류 발견 → 원인 분석 → 코드 수정
2. `npm run type-check` + `npm run lint` 검증
3. 수정 후 테스트 재실행
4. `docs/planning/error-solved-done.md`에 기록:
   - 오류 현상
   - 원인 분석
   - 수정 내용 (파일, 변경 사항)
   - 해결 여부 확인

### UI/UX 개선사항 (바로 수정 금지)

1. 개선 필요사항 발견 → 메모
2. `docs/planning/uiux-improvement.md`에 정리:
   - 현상 설명 + 해당 페이지/컴포넌트
   - 심각도: `긴급` / `높음` / `중간` / `낮음`
   - 개선 방향 제안 (최신 웹앱 트렌드 반영)
3. **직접 수정하지 않음**

---

## 생성될 산출물

| 항목                | 경로                                                            |
| ------------------- | --------------------------------------------------------------- |
| 스크린샷들          | `screenshots/01-login-page.png` ~ `screenshots/14-404-page.png` |
| UI/UX 개선 문서     | `docs/planning/uiux-improvement.md`                             |
| 기능 오류 수정 기록 | `docs/planning/error-solved-done.md` (오류 발견 시)             |

---

## 검증 기준

- 모든 14개 스크린샷 저장 성공
- 기능 오류 발생 시 수정 후 재검증 통과
- UI/UX 개선 문서에 심각도별 항목 작성
- 최종 `npm run type-check` + `npm run lint` 통과

---

## 주의사항

- `mcp__playwright__browser_wait_for`로 페이지 로딩/토스트 완료 대기 필요
- 클립보드 복사는 `mcp__playwright__browser_snapshot`으로 버튼 상태 텍스트 변화 확인
- 삭제 테스트는 반드시 별도 테스트 이벤트로 진행 (기존 이벤트 보존)
- 로그인 상태가 쿠키로 유지되므로 한 번 로그인 후 세션 유지 가능
