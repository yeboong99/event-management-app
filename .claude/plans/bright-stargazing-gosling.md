# Task 53: event-tab-nav.tsx 컴포넌트 업데이트

## Context

이벤트 상세 페이지의 하위 탭 내비게이션 컴포넌트 구현 태스크입니다.
`components/shared/event-tab-nav.tsx` 파일은 이미 존재하지만, 태스크 스펙과 비교 시 다음이 누락되어 있습니다:

- 탭 레이블 불일치: "상세" → "상세정보", "게시물" → "공지/댓글"
- 카풀 탭, 정산 탭 누락 (isHost || isApproved 조건)

`layout.tsx`는 이미 `EventTabNav`를 임포트하여 사용 중입니다.

## 변경 대상 파일

- **수정**: `components/shared/event-tab-nav.tsx`

## 구현 계획

### Step 1: [nextjs-ui-markup] event-tab-nav.tsx 컴포넌트 업데이트

기존 파일의 탭 목록을 태스크 스펙에 맞게 업데이트:

| 현재                              | 변경 후                         |
| --------------------------------- | ------------------------------- |
| "상세" (exactMatch: true)         | "상세정보"                      |
| "참여자" (isHost)                 | 동일                            |
| "게시물" (isHost \|\| isApproved) | "공지/댓글"                     |
| -(없음)                           | "카풀" (isHost \|\| isApproved) |
| -(없음)                           | "정산" (isHost \|\| isApproved) |

구체적 변경 사항:

```typescript
const tabs = [
  {
    label: "상세정보", // "상세" → "상세정보"
    href: `/events/${eventId}`,
    show: true,
  },
  {
    label: "참여자",
    href: `/events/${eventId}/participants`,
    show: isHost,
  },
  {
    label: "공지/댓글", // "게시물" → "공지/댓글"
    href: `/events/${eventId}/posts`,
    show: isHost || isApproved,
  },
  {
    label: "카풀", // 신규 추가
    href: `/events/${eventId}/carpool`,
    show: isHost || isApproved,
  },
  {
    label: "정산", // 신규 추가
    href: `/events/${eventId}/settlement`,
    show: isHost || isApproved,
  },
].filter((tab) => tab.show);
```

활성 탭 판단 로직 (기존 로직 유지):

- 상세정보 탭: `pathname === href` (정확히 일치)
- 나머지 탭: `pathname.startsWith(href)`

모바일 스크롤: `overflow-x-auto` + `min-w-max` (기존 유지)

## 검증

1. 주최자(isHost=true)로 접근 → 5개 탭 모두 표시 확인
2. 승인된 참여자(isApproved=true)로 접근 → 상세정보, 공지/댓글, 카풀, 정산 탭 표시 확인
3. 미참여자(isHost=false, isApproved=false)로 접근 → 상세정보 탭만 표시 확인
4. 각 탭 클릭 시 해당 경로로 이동 및 활성 탭 하이라이트 확인
5. 375px 뷰포트에서 탭 바 가로 스크롤 동작 확인
