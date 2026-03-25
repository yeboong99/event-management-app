# Task 45: cancelParticipation / toggleAttendance Server Actions 구현

## Context

참여 관리 기능 중 아직 구현되지 않은 두 가지 Server Action을 추가한다:

- `cancelParticipation`: 참여자 본인이 `pending` 상태의 신청을 취소(삭제)
- `toggleAttendance`: 주최자가 `approved` 참여자의 출석 여부를 토글

`toggleAttendanceSchema`는 `lib/validations/participation.ts`에 이미 정의되어 있으며,
기존 `actions/participations.ts` 패턴을 그대로 따라 구현한다.

## 수정 대상 파일

- **`actions/participations.ts`** — 두 함수 추가
- **`lib/validations/participation.ts`** — (읽기 전용) `toggleAttendanceSchema` 이미 존재, 추가 불필요

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] cancelParticipation 및 toggleAttendance 구현

`actions/participations.ts`에 다음 두 함수를 추가한다.

#### cancelParticipation

```
export async function cancelParticipation(formData: FormData): Promise<ActionResult>
```

- `supabase.auth.getUser()`로 인증 검증
- `formData`에서 `participationId`, `eventId` 추출
- `participations` 테이블에서 해당 row 조회 (`user_id`, `status` 확인)
- 검증:
  1. 레코드 미존재 → error
  2. `participation.user_id !== user.id` → error (권한 없음)
  3. `participation.status !== "pending"` → error (pending만 취소 가능)
- 검증 통과 시 `.delete().eq("id", participationId)`
- `revalidatePath(\`/events/${eventId}\`)`

#### toggleAttendance

```
export async function toggleAttendance(formData: FormData): Promise<ActionResult>
```

- `supabase.auth.getUser()`로 인증 검증
- `formData`에서 `participationId`, `eventId`, `attended` 추출
- `toggleAttendanceSchema.safeParse()` Zod 검증
- `events` 테이블에서 `host_id` 조회 → `event.host_id !== user.id` 시 error
- `.update({ attended: validated.data.attended }).eq("id", validated.data.participationId)`
- `revalidatePath(\`/events/${eventId}/participants\`)`

#### import 추가

기존 import에 `toggleAttendanceSchema` 추가:

```typescript
import {
  applyParticipationSchema,
  toggleAttendanceSchema,
  updateParticipationStatusSchema,
} from "@/lib/validations/participation";
```

## 검증 방법

1. **취소 정상 흐름**: `pending` 상태 참여 → `cancelParticipation` 호출 → DB에서 row 삭제 확인
2. **취소 차단 (approved)**: `approved` 상태 참여 → 취소 시 `"대기 중인 신청만 취소할 수 있습니다."` 에러 반환
3. **취소 차단 (타인)**: 타인의 참여 ID로 취소 시 `"권한이 없습니다."` 에러 반환
4. **출석 체크 정상**: 주최자가 `toggleAttendance` 호출 → `attended` 컬럼 토글 확인
5. **출석 체크 권한**: 주최자가 아닌 사용자 호출 시 `"권한이 없습니다."` 에러 반환
6. `npm run type-check` 및 `npm run lint` 오류 없음 확인
