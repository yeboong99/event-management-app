# 통합 네비게이션 전환 — 코드 + 문서 전면 개편

## Context

현재 앱은 `(host)` / `(participant)` 두 라우트 그룹으로 완전히 분리되어 있어 UX 혼란이 발생합니다.
Task 21은 "역할 전환 버튼"으로 이를 완화하려 했으나, 근본적인 해결책은 아닙니다.

**결정:** 역할 전환 버튼 대신 통합 하단 네비게이션으로 전면 전환.
이에 따라 코드 구조 변경 + 관련 문서 전체 업데이트가 필요합니다.

---

## 새 통합 네비게이션 설계

### 통합 탭 5개

| 탭      | 경로        | 아이콘     | 설명                          |
| ------- | ----------- | ---------- | ----------------------------- |
| 탐색    | /discover   | Compass    | 공개 이벤트 둘러보기          |
| 내 활동 | /my-events  | Calendar   | 참여 중 + 주최 중 (내부 토글) |
| 만들기  | /events/new | Plus (FAB) | 이벤트 생성 (중앙 강조)       |
| 카풀    | /carpools   | Car        | 카풀 매칭                     |
| 프로필  | /profile    | User       | 계정/설정                     |

`/home`과 `/events` (호스트 이벤트 목록)는 `/my-events` 탭 내 "주최 중" 서브탭으로 흡수.

---

## Part 1: 코드 변경

### 1-1. 새 통합 레이아웃 생성

- **생성**: `app/(app)/layout.tsx` — `MobileHeader` + `UnifiedBottomNav`
- **생성**: `components/mobile/unified-bottom-nav.tsx` — 5탭 통합 네비게이션

```tsx
// unified-bottom-nav.tsx 탭 구성
const tabs = [
  { href: "/discover", label: "탐색", Icon: Compass },
  { href: "/my-events", label: "내 활동", Icon: Calendar },
  { href: "/events/new", label: "만들기", Icon: Plus }, // FAB 스타일
  { href: "/carpools", label: "카풀", Icon: Car },
  { href: "/profile", label: "프로필", Icon: User },
];
```

### 1-2. 페이지 이동 (라우트 그룹 재배치)

| 현재 위치                      | 새 위치                       | 비고              |
| ------------------------------ | ----------------------------- | ----------------- |
| `app/(participant)/discover/`  | `app/(app)/discover/`         | 내용 그대로       |
| `app/(participant)/my-events/` | `app/(app)/my-events/`        | "주최 중" 탭 추가 |
| `app/(participant)/carpools/`  | `app/(app)/carpools/`         | 내용 그대로       |
| `app/(participant)/profile/`   | `app/(app)/profile/`          | 내용 그대로       |
| `app/(host)/events/new/`       | `app/(app)/events/new/`       | 내용 그대로       |
| `app/(host)/events/[eventId]/` | `app/(app)/events/[eventId]/` | 내용 그대로       |

### 1-3. `/my-events` 페이지 내부 탭 추가

- 상단에 "참여 중 | 주최 중" 세그먼트 탭 또는 토글 버튼 추가
- "참여 중": 기존 my-events 내용 (내가 신청한 이벤트)
- "주최 중": 기존 /events 내용 (내가 만든 이벤트 목록)
- `searchParams.tab` (`participating` | `hosting`)으로 구분

### 1-4. 리다이렉트 처리

- `app/page.tsx`: 루트 `/` → `/discover` (role = 'user')로 변경
- `app/(host)/home/page.tsx` → `redirect('/discover')` 추가 (또는 파일 삭제 후 Next.js redirect config)
- `app/(host)/events/page.tsx` → `redirect('/my-events?tab=hosting')` 추가
- `next.config.ts`의 `redirects` 또는 Next.js `redirect()` 활용

### 1-5. `mobile-header.tsx` 수정

- Task 21 역할 전환 버튼 추가 불필요 → Server Component 그대로 유지
- 또는 헤더 자체를 `(app)/layout.tsx`에만 포함시키면서 단순화

### 1-6. 구 라우트 그룹 제거

- `app/(host)/layout.tsx` 삭제
- `app/(host)/home/page.tsx` 삭제 (리다이렉트 처리 후)
- `app/(host)/events/page.tsx` 삭제 (리다이렉트 처리 후)
- `app/(participant)/layout.tsx` 삭제
- `components/mobile/mobile-bottom-nav.tsx`에서 `HostBottomNav`, `ParticipantBottomNav` 제거

---

## Part 2: 문서 업데이트

### 2-1. `docs/guides/project-structure.md`

**변경 내용:**

- Route Groups 예시를 `(host)` / `(participant)` → `(app)` / `admin` / `auth` 구조로 업데이트
- 디렉토리 트리에서 `(host)`, `(participant)` 제거 → `(app)` 추가
- 네비게이션 설명을 "역할별 분리 탭" → "통합 하단 탭 5개"로 변경

### 2-2. `docs/planning/ROADMAP.md`

**변경 내용:**

- **Phase 0 > TASK-008** (참여자 레이아웃 + 하단 탭): 설명을 "통합 레이아웃 + UnifiedBottomNav"로 수정
- **Phase 0 > TASK-009** (주최자 레이아웃): 완료 사항이지만 새 구조로 설명 업데이트
- **Phase 1 추가 > Task 21** (역할 전환 버튼): 제목과 설명을 "통합 하단 네비게이션으로 전환"으로 변경
  - 기존: "모바일 헤더에 역할 전환 버튼 추가"
  - 변경: "(host)/(participant) 라우트 그룹 → (app) 단일 그룹으로 통합, UnifiedBottomNav 구현"
- 현재 상태(Current State)의 라우팅 구조 설명 업데이트

### 2-3. `docs/planning/Phase1_uiux_improvement.md`

**변경 내용:**

- **배경/목적**: UI-001 설명 업데이트 (역할 전환 버튼 → 통합 네비게이션)
- **목표**: "주최자/참여자 역할 전환 UI 제공" → "통합 하단 네비게이션으로 역할 구분 제거"
- **Task 21 상세**: 구현 방법 전면 수정
  - 기존: `mobile-header.tsx`를 Client Component로 변경 + 역할 전환 버튼
  - 변경: `(app)` 라우트 그룹 생성 + `UnifiedBottomNav` + `/my-events` 내부 탭 + 리다이렉트
- **검증 전략**: 기존 역할 전환 버튼 테스트 → 통합 탭 네비게이션 테스트로 교체

### 2-4. `docs/planning/uiux-improvement.md`

**변경 내용:**

- **[UI-001] 개선 방향**: 기존 "역할 전환 버튼/탭 추가" → "통합 하단 네비게이션으로 역할 구분 제거"로 업데이트
- 발생 위치, 현상, 문제점은 유지 (문맥 보존)
- 해결 방향만 새 설계로 교체

### 2-5. `docs/planning/PRD.md`

**변경 내용:**

- **주최자 여정**: 시작점 변경
  - 기존: "로그인 → 주최자 홈(`/home`)"
  - 변경: "로그인 → 탐색 페이지(`/discover`), 내 활동(`/my-events?tab=hosting`)에서 주최 이벤트 관리"
- **참여자 여정**: 동일하게 통합 탭 기준으로 수정
- **네비게이션 구조**: 기존 역할별 4탭 → 통합 5탭으로 업데이트

---

## 파일 변경 목록 요약

| 파일                                       | 변경 유형 | 내용                          |
| ------------------------------------------ | --------- | ----------------------------- |
| `app/(app)/layout.tsx`                     | 생성      | 통합 레이아웃                 |
| `components/mobile/unified-bottom-nav.tsx` | 생성      | 5탭 통합 네비게이션           |
| `app/(app)/discover/page.tsx`              | 이동      | (participant)에서 이동        |
| `app/(app)/my-events/page.tsx`             | 이동+수정 | 내부 탭 추가                  |
| `app/(app)/carpools/page.tsx`              | 이동      | (participant)에서 이동        |
| `app/(app)/profile/page.tsx`               | 이동      | (participant)에서 이동        |
| `app/(app)/events/new/page.tsx`            | 이동      | (host)에서 이동               |
| `app/(app)/events/[eventId]/page.tsx`      | 이동      | (host)에서 이동               |
| `app/(app)/events/[eventId]/edit/page.tsx` | 이동      | (host)에서 이동               |
| `app/page.tsx`                             | 수정      | `/discover`로 리다이렉트      |
| `app/(host)/`                              | 삭제      | 전체 라우트 그룹 제거         |
| `app/(participant)/`                       | 삭제      | 전체 라우트 그룹 제거         |
| `docs/guides/project-structure.md`         | 수정      | 새 라우팅 구조 반영           |
| `docs/planning/ROADMAP.md`                 | 수정      | Task 21 및 관련 task 업데이트 |
| `docs/planning/Phase1_uiux_improvement.md` | 수정      | Task 21 전면 재작성           |
| `docs/planning/uiux-improvement.md`        | 수정      | UI-001 해결 방향 업데이트     |
| `docs/planning/PRD.md`                     | 수정      | 사용자 여정 업데이트          |

---

## 역할 분담

### 현재 세션 (Claude — 메인)

문서 업데이트 담당:

- `docs/guides/project-structure.md`
- `docs/planning/ROADMAP.md`
- `docs/planning/Phase1_uiux_improvement.md`
- `docs/planning/uiux-improvement.md`
- `docs/planning/PRD.md`

### nextjs-ui-markup 서브에이전트

UI 마크업 작업 담당:

- `components/mobile/unified-bottom-nav.tsx` 생성 (5탭 통합 네비게이션)
- `app/(app)/layout.tsx` 생성 (통합 레이아웃)
- `/my-events` 페이지 내부 탭 UI (참여 중 | 주최 중 세그먼트)

### nextjs-supabase-fullstack 서브에이전트

구현 작업 담당:

- 페이지 파일 이동 `(host)` + `(participant)` → `(app)` 라우트 그룹
- `app/page.tsx` 루트 리다이렉트 수정 (`/discover`)
- `/home`, `/events` 리다이렉트 처리
- 구 라우트 그룹 (`(host)`, `(participant)`) 제거
- `mobile-bottom-nav.tsx`에서 구 컴포넌트 정리
- `tasks.json` Task 21 업데이트

---

## 구현 순서 (의존성 고려)

**Step 1 — UI 마크업 (nextjs-ui-markup, 독립적)**

1. `components/mobile/unified-bottom-nav.tsx` 생성
2. `app/(app)/layout.tsx` 생성
3. `/my-events` 내부 탭 UI

**Step 2 — 구현 작업 (nextjs-supabase-fullstack, Step 1 완료 후)** 4. 페이지 이동: `(participant)` + `(host)` → `(app)` 5. 루트/구 경로 리다이렉트 처리 6. 구 라우트 그룹 삭제 7. `tasks.json` Task 21 업데이트

**Step 3 — 문서 업데이트 (현재 세션, Step 1~2와 병행 가능)** 8. `docs/` 하위 5개 파일 업데이트

---

## 검증 계획

1. `/discover` 진입 → 탐색 탭 활성 확인
2. `/my-events` → "참여 중 | 주최 중" 탭 전환 동작
3. `/events/new` → 이벤트 생성 후 `/my-events?tab=hosting` 리다이렉트
4. `/carpools`, `/profile` 탭 정상 동작
5. `/home` 직접 접속 → `/discover` 리다이렉트 확인
6. `/events` 직접 접속 → `/my-events?tab=hosting` 리다이렉트 확인
7. `npm run type-check` + `npm run lint` + `npm run build` 통과
