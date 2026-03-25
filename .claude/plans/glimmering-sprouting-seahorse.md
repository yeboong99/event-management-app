# Task 63: 카풀 등록 폼 및 카풀 카드 컴포넌트 구현

## Context

카풀 기능(Task 62)의 Server Action과 DB 스키마가 완성된 상태에서, 사용자가 카풀을 등록하고 목록을 조회할 수 있는 UI 컴포넌트가 필요합니다. 이 작업은 두 개의 독립적인 컴포넌트를 구현합니다.

---

## 구현 대상 파일

| 파일                                         | 유형      |
| -------------------------------------------- | --------- |
| `components/forms/carpool-register-form.tsx` | 신규 생성 |
| `components/shared/carpool-card.tsx`         | 신규 생성 |

---

## 참고 파일

- `components/forms/participation-form.tsx` — 폼 패턴 직접 참고 (useTransition + FormData + toast)
- `components/shared/participant-list.tsx` — Avatar + Badge + Card 조합 패턴
- `lib/validations/carpool.ts` — `registerCarpoolSchema`, `RegisterCarpoolInput` 타입
- `actions/carpools.ts` — `registerCarpool(formData: FormData): Promise<ActionResult>`
- `types/carpool.ts` — `CarpoolWithDetails` 타입 (approved_count 포함)

---

## 구현 상세

### Step 1: [nextjs-supabase-fullstack] carpool-register-form.tsx 구현

**Props**: `{ eventId: string }`

**폼 필드:**

- `departurePlace`: Input (필수)
- `departureTime`: Input type="datetime-local" (선택)
- `totalSeats`: Input type="number" min=1 max=10 (필수) — onChange에서 `parseInt` 변환 처리
- `description`: Textarea (선택, maxLength=300)

**제출 흐름 (participation-form.tsx 동일 패턴):**

```
useTransition → FormData 구성 → registerCarpool 호출
→ 성공: toast.success("카풀이 등록되었습니다.") + form.reset({ eventId, ... })
→ 실패: toast.error(result.error ?? "등록 중 오류가 발생했습니다.")
```

**주의사항:**

- `totalSeats`는 `z.number()` 타입 → FormField render prop에서 `field.onChange(parseInt(e.target.value) || 1)` 처리
- `form.reset()` 시 `eventId` 유지 위해 `form.reset({ eventId, departurePlace: "", ... })` 사용

---

### Step 2: [nextjs-ui-markup] carpool-card.tsx 구현

**Props**: `{ carpool: CarpoolWithDetails; children?: React.ReactNode }`

**카드 레이아웃:**

- 상단 행: 드라이버 Avatar(크게) + 이름 + "마감" Badge (좌석 가득 찼을 때)
- 정보 목록:
  - MapPin 아이콘 + `departure_place`
  - Clock 아이콘 + `departure_time` (null이면 "시간 미정", 있으면 `ko-KR` 포맷팅)
  - Users 아이콘 + `{approved_count} / {total_seats}석`
- description 있으면 `bg-muted` 배경의 텍스트 블록으로 표시
- `children` (드라이버/참여자별 액션 버튼 슬롯)

**파생 로직:**

```typescript
const isFull = carpool.approved_count >= carpool.total_seats;
const driverName = carpool.profiles.name ?? "알 수 없음";

function formatDepartureTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
```

**사용 shadcn/ui 컴포넌트:** Card, CardContent, Avatar, AvatarImage, AvatarFallback, Badge
**lucide-react 아이콘:** Car, MapPin, Clock, Users

---

## 병렬 구현 가능 여부

두 컴포넌트는 서로 의존하지 않으므로 **병렬 구현 가능**.

---

## 검증

- `npm run type-check` — TypeScript 에러 없음 확인
- `npm run lint` — ESLint 통과 확인
- 폼 필드 유효성: 출발지 비워두면 에러 메시지 표시, 좌석 수 범위(1~10) 초과 시 에러
- 카풀 카드: `departure_time = null`이면 "시간 미정", `approved_count >= total_seats`이면 "마감" 배지
- 폼 제출 성공 시 toast 표시 + 필드 초기화
