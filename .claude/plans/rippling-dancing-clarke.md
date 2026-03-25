# ROADMAP.md Phase 2 체크 업데이트 계획

## Context

`/docs:roadmap-update 2` 커맨드 실행 — Phase 2 태스크의 실제 구현 완료 여부를 코드베이스와 비교 검증하여 ROADMAP.md 체크리스트를 업데이트한다. 구조 변경이 있는 TASK-028, 029, 030, 031은 파일 경로 수정 및 구현 설명을 추가한다.

---

## 실행할 편집 내용 (`docs/planning/ROADMAP.md`)

### 1. TASK-022 ~ TASK-027: `[ ]` → `[x]` 체크만

### 2. TASK-028: 파일 경로 수정 + 구조 변경 설명 추가 + `[x]` 체크

```diff
- - [ ] **[TASK-028]** 참여자 관리 페이지 (주최자)
-   - 파일: `app/(host)/events/[eventId]/participants/page.tsx`, `components/shared/participant-list.tsx`, `components/shared/participant-actions.tsx`, `components/shared/attendance-toggle.tsx`
+ - [x] **[TASK-028]** 참여자 관리 페이지 (주최자)
+   - 파일: `app/(app)/events/[eventId]/page.tsx` (참여자 탭 통합), `components/shared/participant-list.tsx`, `components/shared/participant-actions.tsx`, `components/shared/attendance-toggle.tsx`
+   - 구현 변경: 전용 호스트 라우트 대신 이벤트 상세 페이지의 "참여자" 탭에 통합. ParticipantList에서 주최자 전용 상태 필터 탭(전체/대기/승인/거절)과 승인/거절 버튼을 제공하며, AttendanceToggle로 출석 체크 토글이 가능. 비승인 사용자는 AccessRestrictedNotice로 접근 제한.
```

### 3. TASK-029: 파일 경로 수정 + 구조 변경 설명 추가 + `[x]` 체크

```diff
- - [ ] **[TASK-029]** 공지 및 댓글 관리 페이지 (주최자)
-   - 파일: `app/(host)/events/[eventId]/posts/page.tsx`, `components/shared/post-feed.tsx`, `components/shared/post-item.tsx`, `components/shared/post-actions.tsx`, `components/forms/post-form.tsx`
+ - [x] **[TASK-029]** 공지 및 댓글 관리 페이지 (주최자)
+   - 파일: `app/(app)/events/[eventId]/page.tsx` (게시판 탭 통합), `components/shared/posts-section.tsx`, `components/shared/post-feed.tsx`, `components/shared/post-item.tsx`, `components/shared/post-actions.tsx`, `components/forms/post-form.tsx`
+   - 구현 변경: 전용 호스트 라우트 대신 이벤트 상세 페이지의 "게시판" 탭으로 통합. PostForm에서 주최자만 공지 체크박스로 notice/comment 타입 전환 가능하며, PostsSection은 공지를 항상 최상단 정렬로 관리. 작성자 본인과 주최자만 수정/삭제 가능하며, 비승인 사용자는 접근 제한.
```

### 4. TASK-030: 파일 경로 수정 + `[x]` 체크

```diff
- - [ ] **[TASK-030]** 이벤트 상세 페이지 (참여자)
-   - 파일: `app/(participant)/events/[eventId]/page.tsx`, `components/forms/participation-form.tsx`
+ - [x] **[TASK-030]** 이벤트 상세 페이지 (참여자)
+   - 파일: `app/(app)/events/[eventId]/page.tsx`, `components/forms/participation-form.tsx`
```

### 5. TASK-031: 파일 경로 수정 + `[x]` 체크

```diff
- - [ ] **[TASK-031]** 내가 참여한 이벤트 목록 페이지 (참여자)
-   - 파일: `app/(participant)/my-events/page.tsx`
+ - [x] **[TASK-031]** 내가 참여한 이벤트 목록 페이지 (참여자)
+   - 파일: `app/(app)/my-events/page.tsx`
```

---

## 수정 대상 파일

- `docs/planning/ROADMAP.md`

---

## 검증

편집 후 `docs/planning/ROADMAP.md` Phase 2 섹션 Read로 체크 상태 및 파일 경로 확인.
