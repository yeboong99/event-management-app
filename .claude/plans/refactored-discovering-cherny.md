# 참여 중 탭 필터별 빈 상태 메시지 개선

## Context

`/my-events` 페이지의 "참여 중" 탭에서 전체/대기 중/승인/거절 필터를 적용했을 때 해당 항목이 없으면, 어떤 필터 상태인지와 무관하게 항상 동일한 "아직 참여한 이벤트가 없습니다" 안내 화면이 표시된다. 필터 맥락에 맞는 안내 화면이 표시되어야 UX가 개선된다.

## 변경 대상 파일

- `app/(app)/my-events/page.tsx` — `ParticipatingView` 컴포넌트 (186~203행)

## 구현 계획

### Step 1: [nextjs-ui-markup] 필터별 빈 상태 메시지 UI 수정

`ParticipatingView` 컴포넌트의 빈 상태 렌더링 블록(186~203행)을 `selectedStatus` 값에 따라 다른 메시지를 보여주도록 수정한다.

**필터별 안내 메시지 정의:**

| selectedStatus     | 제목                          | 설명                                      | CTA                  |
| ------------------ | ----------------------------- | ----------------------------------------- | -------------------- |
| `undefined` (전체) | 아직 참여한 이벤트가 없습니다 | 관심 있는 이벤트를 탐색하고 참여해보세요. | 이벤트 탐색하기 버튼 |
| `pending`          | 대기 중인 신청이 없습니다     | 승인을 기다리는 참여 신청이 없습니다.     | 이벤트 탐색하기 버튼 |
| `approved`         | 승인된 이벤트가 없습니다      | 아직 승인된 참여 신청이 없습니다.         | 이벤트 탐색하기 버튼 |
| `rejected`         | 거절된 신청이 없습니다        | 거절된 참여 신청이 없습니다.              | 이벤트 탐색하기 버튼 |

**구현 방식:**

```tsx
// 빈 상태 메시지 매핑 상수 추가
const EMPTY_STATE_MAP = {
  pending: {
    title: "대기 중인 신청이 없습니다",
    desc: "승인을 기다리는 참여 신청이 없습니다.",
  },
  approved: {
    title: "승인된 이벤트가 없습니다",
    desc: "아직 승인된 참여 신청이 없습니다.",
  },
  rejected: {
    title: "거절된 신청이 없습니다",
    desc: "거절된 참여 신청이 없습니다.",
  },
};

// ParticipatingView 빈 상태 블록에서
const emptyState = selectedStatus
  ? EMPTY_STATE_MAP[selectedStatus as keyof typeof EMPTY_STATE_MAP]
  : null;
```

- 모든 경우(전체 포함) "이벤트 탐색하기" CTA 버튼 표시
- `selectedStatus`가 없을 때(전체 탭): 기존 메시지 유지
- `selectedStatus`가 있을 때(필터 탭): 해당 상태에 맞는 제목/설명 표시
- 아이콘은 모든 경우 `Calendar` 아이콘 유지

## 검증 방법

1. `/my-events?tab=participating` — 참여 이력이 없을 때: "아직 참여한 이벤트가 없습니다" + CTA 버튼
2. `/my-events?tab=participating&status=pending` — 대기 중 없을 때: "대기 중인 신청이 없습니다"
3. `/my-events?tab=participating&status=approved` — 승인 없을 때: "승인된 이벤트가 없습니다"
4. `/my-events?tab=participating&status=rejected` — 거절 없을 때: "거절된 신청이 없습니다"
5. 각 필터에 실제 데이터가 있을 때는 정상적으로 카드 목록이 표시되는지 확인
