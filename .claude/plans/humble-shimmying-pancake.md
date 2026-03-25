# Task 66: 내 카풀 목록 페이지 구현

## Context

하단 탭 네비게이션의 "카풀" 탭(`/carpools`)에 연결되는 페이지가 아직 없음. 사용자가 자신이 탑승 신청한 카풀과 드라이버로 등록한 카풀을 한눈에 볼 수 있는 전용 페이지가 필요함.

- 하단 네비게이션: `components/mobile/unified-bottom-nav.tsx`에 `/carpools` 이미 정의됨
- 데이터 함수: `actions/carpools.ts`에 `getMyCarpoolRequests(userId, status?)` (593행), `getMyCarpools(userId)` (641행) 이미 구현됨
- 참고 패턴: `app/(app)/my-events/page.tsx` - URL 쿼리 파라미터 탭 전환, 조건부 데이터 페칭

---

## 재사용 가능한 기존 리소스

| 리소스                      | 파일 경로                                      | 용도                           |
| --------------------------- | ---------------------------------------------- | ------------------------------ |
| `getMyCarpoolRequests`      | `actions/carpools.ts:593`                      | 탑승 신청 목록 조회            |
| `getMyCarpools`             | `actions/carpools.ts:641`                      | 드라이버 카풀 목록 조회        |
| `cancelCarpoolRequest`      | `actions/carpools.ts`                          | 탑승 신청 취소                 |
| `CarpoolRequestStatus`      | `components/shared/carpool-request-status.tsx` | 상태 배지 + 취소 버튼 (재사용) |
| `CarpoolRequestWithCarpool` | `types/carpool.ts`                             | 탑승 신청 뷰 데이터 타입       |
| `CarpoolWithEvent`          | `types/carpool.ts`                             | 드라이버 뷰 데이터 타입        |

---

## 구현 계획

### Step 1: [nextjs-ui-markup] 탑승 신청 뷰 UI 마크업 작성

**파일:** `components/shared/my-carpool-requests-view.tsx` (신규)

- `'use client'` 컴포넌트
- Props: `requests: CarpoolRequestWithCarpool[]`
- 상태 필터 버튼 UI (전체/대기/승인/거절) — `useState`로 클라이언트 사이드 필터링
- 카드 레이아웃: 이벤트명, 드라이버명, 출발지(MapPin 아이콘), 출발 시간(Clock 아이콘)
- 상태 배지: 기존 `CarpoolRequestStatus` 컴포넌트 재사용
- pending 상태 취소 버튼: `CarpoolRequestStatus`의 `showCancel` prop 활용
- 카드 클릭: `Link href="/events/{carpool.event_id}"` 로 이동
- 빈 상태 UI: "탑승 신청한 카풀이 없습니다"
- shadcn/ui: Badge, Button, Card

### Step 2: [nextjs-ui-markup] 드라이버 카풀 뷰 UI 마크업 작성

**파일:** `components/shared/my-carpools-driver-view.tsx` (신규)

- `'use client'` 컴포넌트
- Props: `carpools: CarpoolWithEvent[]`
- 카드 레이아웃: 이벤트명, 출발지(MapPin), 출발 시간(Clock), 좌석 현황(Users, `{approved_count}/{total_seats}석`)
- 카드 클릭: `Link href="/events/{carpool.event_id}"` 로 이동
- 빈 상태 UI: "등록한 카풀이 없습니다"
- shadcn/ui: Card, Badge

### Step 3: [nextjs-supabase-fullstack] 메인 페이지 구현

**파일:** `app/(app)/carpools/page.tsx` (신규)

- Server Component
- `searchParams: Promise<{ tab?: string }>` → `await searchParams`
- `activeTab = params.tab === "driver" ? "driver" : "requests"` (기본값: "requests")
- 인증된 사용자 조회 (Supabase server client)
- 조건부 데이터 페칭:
  ```ts
  const requests =
    activeTab === "requests" ? await getMyCarpoolRequests(userId) : [];
  const carpools = activeTab === "driver" ? await getMyCarpools(userId) : [];
  ```
- shadcn/ui Tabs + Link 기반 탭 전환:
  - "탑승 신청" → `/carpools` (기본)
  - "내가 등록한 카풀" → `/carpools?tab=driver`
- 각 탭에 해당 뷰 컴포넌트 렌더링

---

## 타입 참고

```typescript
// 탑승 신청 뷰 (CarpoolRequestWithCarpool)
{
  id, status, created_at,
  carpool: {
    id, departure_location, departure_time, total_seats,
    driver: { name },
    event: { id, title }
  }
}

// 드라이버 뷰 (CarpoolWithEvent)
{
  id, departure_location, departure_time, total_seats, approved_count,
  event: { id, title }
}
```

---

## 검증 방법

1. 하단 탭 "카풀" 클릭 → `/carpools` 정상 렌더링
2. "탑승 신청" 탭 → 내가 신청한 카풀 목록 표시
3. "내가 등록한 카풀" 탭 → 드라이버 카풀 목록 표시
4. 상태별 필터(전체/대기/승인/거절) 동작
5. pending 상태 카드에서 취소 버튼 동작
6. 카드 클릭 → 이벤트 상세 페이지 이동
7. 각 뷰의 빈 상태 UI 확인
8. URL 탭 파라미터 전환 (`?tab=driver`) 확인
9. `npm run lint && npm run type-check` 통과
