# Task 67: 카풀 탑승 신청 폼 및 신청 상태 표시 컴포넌트 구현

## Context

참여자가 카풀을 신청하고 신청 상태를 확인/취소할 수 있는 클라이언트 컴포넌트 2개를 구현한다.
카풀 목록 페이지에서 각 카풀 카드에 삽입될 예정이며, 드라이버/이미 신청/마감 등 상태별 조건부 렌더링이 핵심이다.

## 구현 대상 파일

- `components/forms/carpool-request-form.tsx` (신규)
- `components/shared/carpool-request-status.tsx` (신규)

## 참조 파일

- `components/forms/participation-form.tsx` — useForm + FormData + Server Action 패턴
- `components/forms/carpool-register-form.tsx` — 카풀 관련 폼 패턴
- `components/shared/participant-list.tsx` — 상태별 Badge 패턴
- `actions/carpools.ts` — `requestCarpool(formData)`, `cancelCarpoolRequest(requestId, eventId)`
- `lib/validations/carpool.ts` — `requestCarpoolSchema` (carpoolId: UUID, message: 200자 이하 선택)
- `types/carpool.ts` — `CarpoolRequest`, `CarpoolRequestStatus`

## 구현 단계

### Step 1: [nextjs-ui-markup] carpool-request-status.tsx UI 마크업

**파일:** `components/shared/carpool-request-status.tsx`

- `'use client'` 컴포넌트
- props: `request: CarpoolRequest`, `eventId: string`
- 신청 상태 Badge 표시:
  - `pending` → `<Badge variant="secondary">대기 중</Badge>`
  - `approved` → `<Badge variant="default">승인됨</Badge>`
  - `rejected` → `<Badge variant="destructive">거절됨</Badge>`
- `pending` 상태일 때만 취소 버튼 표시 (Button variant="outline", X 아이콘)
- 취소 로직은 Step 2에서 추가 (이 단계는 UI 구조만)

### Step 2: [nextjs-supabase-fullstack] carpool-request-form.tsx 전체 구현 + carpool-request-status.tsx 로직 완성

**파일 1:** `components/forms/carpool-request-form.tsx`

props 인터페이스:

```typescript
interface CarpoolRequestFormProps {
  carpoolId: string;
  totalSeats: number;
  approvedCount: number;
  currentUserId: string | null;
  driverId: string;
  existingRequest: CarpoolRequest | null;
  eventId: string;
}
```

조건별 렌더링 (우선순위 순):

1. `currentUserId === driverId` → `return null` (전체 비노출)
2. `existingRequest !== null` → `<CarpoolRequestStatus request={existingRequest} eventId={eventId} />`
3. 일반 폼 렌더링:
   - `isFull = approvedCount >= totalSeats`
   - 메시지 Textarea (선택, 200자)
   - 신청 버튼: `isFull`이면 disabled + "마감" Badge 표시
   - `useTransition` + React Hook Form + `zodResolver(requestCarpoolSchema)`
   - formData에 `carpoolId` 포함하여 `requestCarpool(formData)` 호출
   - 성공: `toast.success("카풀 탑승 신청이 완료되었습니다.")`
   - 실패: `toast.error(result.error ?? "신청에 실패했습니다.")`

**파일 2:** `components/shared/carpool-request-status.tsx` 로직 완성

- 취소 버튼 클릭 → `cancelCarpoolRequest(request.id, eventId)` 호출
- `useTransition` 처리
- 성공: `toast.success("신청이 취소되었습니다.")`
- 실패: `toast.error(result.error ?? "취소에 실패했습니다.")`

## 검증 방법

```bash
npm run type-check   # TypeScript 타입 오류 없음
npm run lint         # ESLint 통과
```

기능 확인 체크리스트:

- [ ] 드라이버 본인에게 폼 비노출
- [ ] 이미 신청한 경우 폼 대신 상태 표시
- [ ] `approvedCount >= totalSeats`일 때 "마감" Badge + 버튼 비활성화
- [ ] 정상 신청 시 toast 표시
- [ ] pending 상태일 때만 취소 버튼 표시
- [ ] 취소 성공 시 toast 표시
