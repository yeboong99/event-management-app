# Task 91: 빈 상태 UI 컴포넌트 통합

## Context

현재 프로젝트에는 10개 이상의 파일에 빈 상태(empty state) UI가 개별적으로 구현되어 있습니다.
각 구현은 동일한 구조(flex column, 중앙 정렬, 아이콘/제목/설명/CTA)를 반복하고 있어
코드 중복이 심하고, 일부는 아이콘이 없거나 padding 크기가 다르는 등 일관성도 부족합니다.

재사용 가능한 `EmptyState` 컴포넌트를 만들고 기존 인라인 구현을 교체합니다.

---

## 구현 전략

### Step 1: [nextjs-ui-markup] EmptyState 공용 컴포넌트 생성

**파일**: `components/shared/empty-state.tsx` (신규)

**Props 설계:**

```ts
interface EmptyStateProps {
  icon?: LucideIcon; // Lucide 아이콘 컴포넌트 (optional)
  title: string; // 제목 (필수)
  description?: string; // 설명 (optional)
  action?: ReactNode; // CTA 버튼 영역 (optional)
  className?: string; // 컨테이너 커스터마이징
}
```

**디자인 사양 (현재 패턴 통일):**

- 컨테이너: `flex flex-col items-center justify-center gap-3 py-12 text-center`
- 아이콘: `size-12 text-muted-foreground/40` (className 오버라이드 가능)
- 제목: `text-base font-semibold text-foreground`
- 설명: `text-sm text-muted-foreground`
- action: 그대로 렌더링 (Button 등 외부에서 전달)

---

### Step 2: [nextjs-supabase-fullstack] 기존 빈 상태 UI 교체

아래 파일의 인라인 empty state를 `<EmptyState>` 컴포넌트로 교체합니다.

#### 교체 대상 (총 10곳)

| 파일                                                   | 라인                   | 아이콘         | CTA                           |
| ------------------------------------------------------ | ---------------------- | -------------- | ----------------------------- |
| `app/(app)/discover/page.tsx:53-65`                    | 카테고리별 동적 메시지 | `<Calendar />` | 없음                          |
| `app/(app)/my-events/page.tsx:212-228`                 | EMPTY_STATE_MAP 상태별 | `<Calendar />` | `<Compass /> 이벤트 탐색하기` |
| `app/(app)/my-events/page.tsx:310-326`                 | 주최 이벤트 없음       | `<Calendar />` | `<Plus /> 이벤트 만들기`      |
| `components/shared/my-carpool-requests-view.tsx:76-93` | 전체/필터 두 케이스    | `<Car />`      | 없음                          |
| `components/shared/my-carpools-driver-view.tsx:26-39`  | 등록 카풀 없음         | `<Car />`      | 없음                          |
| `components/shared/post-feed.tsx:47-57`                | 게시물 없음            | 없음           | 없음                          |
| `components/shared/participant-list.tsx:144-169`       | 역할별 3가지 케이스    | 없음           | `CopyLinkButton`              |
| `components/shared/carpool-tabs.tsx:59-75`             | 탭별 2가지 케이스      | `<Car />`      | 없음                          |
| `components/shared/settlement-item-list.tsx:82-89`     | 지출 없음              | `<Receipt />`  | 없음                          |
| `components/shared/settlement-result.tsx:277-291`      | 정산 결과 없음         | 없음           | `FinalizeSettlementButton`    |

**교체 시 주의사항:**

- `participant-list.tsx`의 `CopyLinkButton`은 `action` prop으로 전달
- `settlement-result.tsx`는 `Card` 내부이므로 `className`으로 `py-12` 조정
- `my-carpool-requests-view.tsx`의 필터 후 빈 상태(아이콘 없음 케이스)도 동일 컴포넌트 사용 (`icon` 생략)

---

## 수정 파일 목록

**신규 생성:**

- `components/shared/empty-state.tsx`

**수정:**

- `app/(app)/discover/page.tsx`
- `app/(app)/my-events/page.tsx`
- `components/shared/my-carpool-requests-view.tsx`
- `components/shared/my-carpools-driver-view.tsx`
- `components/shared/post-feed.tsx`
- `components/shared/participant-list.tsx`
- `components/shared/carpool-tabs.tsx`
- `components/shared/settlement-item-list.tsx`
- `components/shared/settlement-result.tsx`

---

## 검증 방법

1. 각 페이지에서 데이터가 없는 상태로 접근해 EmptyState 렌더링 확인
   - `/discover` — 이벤트 없는 카테고리 선택
   - `/my-events` — 참여/주최 이벤트 없는 상태
   - `/carpools` — 신청/등록 카풀 없는 상태
   - `/events/[eventId]` — 참여자, 게시판, 카풀, 정산 각 탭
2. 아이콘 있음/없음, CTA 있음/없음 케이스 모두 정상 렌더링 확인
3. `npm run type-check` 및 `npm run lint` 통과 확인
4. 모바일(375px) 반응형 레이아웃 확인
