# Task 50: participant-actions.tsx 및 attendance-toggle.tsx 구현 완료

## Context

두 컴포넌트가 이미 생성되어 있으나, Task 50 명세와 다음과 같은 차이가 있습니다:

### participant-actions.tsx 현재 vs 명세

| 항목           | 현재                         | 명세                                              |
| -------------- | ---------------------------- | ------------------------------------------------- |
| 로딩 상태 관리 | 없음 (async 함수 직접 호출)  | `useTransition` 사용, isPending으로 버튼 disabled |
| 성공 피드백    | 없음 (에러만 toast)          | 성공 toast 추가                                   |
| UX             | ConfirmDialog 래핑 (더 안전) | 직접 버튼 (명세)                                  |

→ ConfirmDialog는 UX상 더 안전하므로 유지하되, **useTransition + 성공 toast** 추가

### attendance-toggle.tsx 현재 vs 명세

| 항목            | 현재                  | 명세                                    |
| --------------- | --------------------- | --------------------------------------- |
| 낙관적 업데이트 | 없음 (서버 응답 대기) | `useOptimistic` 사용, 클릭 즉시 UI 반영 |

→ **useOptimistic** 추가하여 낙관적 업데이트 구현

## 변경 대상 파일

- `components/shared/participant-actions.tsx`
- `components/shared/attendance-toggle.tsx`

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] participant-actions.tsx — useTransition + 성공 toast 추가

현재 코드에서 변경:

- `useTransition` import 추가
- `handleApprove`, `handleReject`를 `startTransition(async () => {...})` 으로 감싸기
- `isPending`으로 ConfirmDialog 내부 버튼 disabled 처리 (ConfirmDialog는 유지)
- 성공 시 `toast.success()` 추가

```tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  approveParticipation,
  rejectParticipation,
} from "@/actions/participations";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { ParticipationWithProfile } from "@/types/participation";

type ParticipantActionsProps = {
  participation: ParticipationWithProfile;
  eventId: string;
};

export function ParticipantActions({
  participation,
  eventId,
}: ParticipantActionsProps) {
  const [isPending, startTransition] = useTransition();

  if (participation.status !== "pending") return null;

  const handleApprove = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("participationId", participation.id);
      formData.append("eventId", eventId);
      const result = await approveParticipation(formData);
      if (result.success) {
        toast.success("참여를 승인했습니다.");
      } else {
        toast.error(result.error ?? "승인 처리 중 오류가 발생했습니다.");
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("participationId", participation.id);
      formData.append("eventId", eventId);
      const result = await rejectParticipation(formData);
      if (result.success) {
        toast.success("참여를 거절했습니다.");
      } else {
        toast.error(result.error ?? "거절 처리 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <ConfirmDialog
        title="참여 승인"
        description="이 참여자를 승인하시겠습니까?"
        confirmLabel="승인"
        variant="default"
        onConfirm={handleApprove}
        trigger={
          <Button variant="default" size="sm" disabled={isPending}>
            승인
          </Button>
        }
      />
      <ConfirmDialog
        title="참여 거절"
        description="이 참여자를 거절하시겠습니까?"
        confirmLabel="거절"
        variant="destructive"
        onConfirm={handleReject}
        trigger={
          <Button variant="outline" size="sm" disabled={isPending}>
            거절
          </Button>
        }
      />
    </div>
  );
}
```

### Step 2: [nextjs-supabase-fullstack] attendance-toggle.tsx — useOptimistic 낙관적 업데이트 추가

현재 코드에서 변경:

- `useOptimistic` import 추가
- `optimisticAttended` 상태를 `participation.attended`로 초기화
- 체크박스 변경 시 즉시 `setOptimisticAttended(checked)` 호출 후 Server Action 실행
- 실패 시 자동으로 이전 상태로 롤백 (useOptimistic 기본 동작)

```tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { toggleAttendance } from "@/actions/participations";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ParticipationWithProfile } from "@/types/participation";

interface AttendanceToggleProps {
  participation: ParticipationWithProfile;
  eventId: string;
}

export function AttendanceToggle({
  participation,
  eventId,
}: AttendanceToggleProps) {
  const [optimisticAttended, setOptimisticAttended] = useOptimistic(
    participation.attended ?? false,
  );
  const [, startTransition] = useTransition();

  const handleCheckedChange = (checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;

    startTransition(async () => {
      setOptimisticAttended(checked);

      const formData = new FormData();
      formData.set("participationId", participation.id);
      formData.set("eventId", eventId);
      formData.set("attended", String(checked));

      const result = await toggleAttendance(formData);
      if (!result.success) {
        toast.error(result.error ?? "출석 처리 중 오류가 발생했습니다.");
      }
    });
  };

  const checkboxId = `attendance-${participation.id}`;

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={checkboxId}
        checked={optimisticAttended}
        onCheckedChange={handleCheckedChange}
        aria-label="출석 여부 토글"
      />
      <Label
        htmlFor={checkboxId}
        className="cursor-pointer text-sm select-none"
      >
        출석
      </Label>
    </div>
  );
}
```

## 검증 방법

1. `npm run type-check` — TypeScript 오류 없음 확인
2. `npm run lint` — ESLint 오류 없음 확인
3. 브라우저에서 이벤트 참여자 목록 페이지 접근
4. **승인/거절 테스트**: 승인 버튼 클릭 → ConfirmDialog 확인 → 성공 toast "참여를 승인했습니다." 표시 확인
5. **출석 체크 낙관적 업데이트 테스트**: 체크박스 클릭 즉시 UI 반영 확인 (서버 응답 전 체크 상태 변경)
6. **에러 처리 테스트**: max_participants 초과 승인 시 에러 toast 확인
