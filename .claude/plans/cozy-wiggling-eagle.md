# Task 64: 카풀 관리 액션 컴포넌트 구현

## Context

이벤트 카풀 기능(Task 63)이 완료된 후, 드라이버/주최자가 탑승 신청을 관리(승인/거절/카풀 삭제)할 수 있는 Client Component가 필요합니다. `components/shared/participant-actions.tsx`의 패턴을 참조하여 동일한 UX를 카풀에 적용합니다.

## 참조 파일

- `components/shared/participant-actions.tsx` — 참조 패턴 (useTransition, toast, Server Action 호출)
- `actions/carpools.ts` — approveCarpoolRequest, rejectCarpoolRequest, deleteCarpool
- `types/carpool.ts` — CarpoolWithDetails, CarpoolRequestWithProfile 타입
- `components/shared/carpool-card.tsx` — children composition 패턴

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] carpool-actions.tsx 구조 및 로직 구현

`components/shared/carpool-actions.tsx` 파일을 새로 생성하여 컴포넌트 구조와 비즈니스 로직을 구현합니다.

**Props 정의:**

```typescript
interface CarpoolActionsProps {
  carpool: CarpoolWithDetails;
  requests: CarpoolRequestWithProfile[];
  currentUserId: string;
  eventId: string;
  isDriverOrHost: boolean;
}
```

**구현 상세:**

1. `'use client'` 선언
2. `useTransition()`으로 `isPending` 상태 관리
3. `isDriverOrHost`가 false면 `null` 반환
4. 각 Server Action 핸들러 함수 정의:
   - `handleApprove(requestId)` → `approveCarpoolRequest(requestId, carpool.id, eventId)` 호출
   - `handleReject(requestId)` → `rejectCarpoolRequest(requestId, carpool.id, eventId)` 호출
   - `handleDelete()` → `deleteCarpool(carpool.id, eventId)` 호출
5. 각 액션 결과에 따라 `toast.success()` / `toast.error()` 표시 (sonner)
6. 잔여석 계산: `isFull = carpool.approved_count >= carpool.total_seats`
7. UI는 placeholder 구조만 잡고, 실제 마크업은 Step 2에서 완성

**import 목록:**

- `actions/carpools`: approveCarpoolRequest, rejectCarpoolRequest, deleteCarpool
- `types/carpool`: CarpoolWithDetails, CarpoolRequestWithProfile
- `react`: useTransition
- `sonner`: toast
- shadcn/ui: AlertDialog 관련 컴포넌트, Badge, Button
- `lucide-react`: Check, X, Trash2, Users

---

### Step 2: [nextjs-ui-markup] carpool-actions.tsx UI 마크업 완성

Step 1에서 구현된 로직 위에 UI 마크업을 완성합니다.

**구현 상세:**

1. 탑승 신청 목록 레이아웃 (신청자 아바타, 이름, 이메일)
2. 상태 배지 색상 (배지 텍스트는 한글로 표시):
   - pending → "대기중" (노란색 `bg-yellow-100 text-yellow-800`)
   - approved → "승인됨" (초록색 `bg-green-100 text-green-800`)
   - rejected → "거절됨" (빨간색 `bg-red-100 text-red-800`)
3. 승인 버튼 (`Check` 아이콘): `isFull || isPending` 시 disabled
4. 거절 버튼 (`X` 아이콘): `status === 'rejected' || isPending` 시 disabled
5. 카풀 삭제 AlertDialog: Trash2 버튼 → AlertDialog 확인창 → deleteCarpool 호출
6. 신청 목록 없을 때 빈 상태 UI (`Users` 아이콘 + "탑승 신청이 없습니다.")

**사용 라이브러리:**

- `shadcn/ui`: AlertDialog, Badge, Button
- `lucide-react`: Check, X, Trash2, Users
- `sonner`: toast

## 검증 방법

- `npm run type-check` — TypeScript 오류 없음 확인
- `npm run lint` — ESLint 통과 확인
- 브라우저에서 이벤트 카풀 페이지 접속 후:
  - 드라이버/주최자 계정: 신청 목록 + 승인/거절/삭제 버튼 노출 확인
  - 일반 참여자 계정: 액션 컴포넌트 미표시 확인
  - 잔여석 0일 때 승인 버튼 비활성화 확인
  - 삭제 시 AlertDialog 표시 후 카풀 삭제 확인
