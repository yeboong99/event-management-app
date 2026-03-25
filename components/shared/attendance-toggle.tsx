"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { toggleAttendance } from "@/actions/participations";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ParticipationWithProfile } from "@/types/participation";

interface AttendanceToggleProps {
  /** 승인된 참여자 정보 (attended 필드 포함) */
  participation: ParticipationWithProfile;
  /** 해당 이벤트의 ID */
  eventId: string;
}

/**
 * 승인된 참여자의 출석 여부를 토글하는 컴포넌트.
 * 낙관적 업데이트로 Server Action 완료 전에 UI를 먼저 반영한다.
 */
export function AttendanceToggle({
  participation,
  eventId,
}: AttendanceToggleProps) {
  // 낙관적 업데이트: Server Action 응답 전에 UI 상태를 즉시 반영
  const [optimisticAttended, setOptimisticAttended] = useOptimistic(
    participation.attended ?? false,
  );
  const [, startTransition] = useTransition();

  /**
   * 체크박스 상태가 바뀔 때 낙관적으로 UI를 업데이트한 후 Server Action을 호출한다.
   * @param checked - 새로 변경된 체크 상태 (true = 출석)
   */
  const handleCheckedChange = (checked: boolean | "indeterminate") => {
    // indeterminate 상태는 출석 처리하지 않음
    if (checked === "indeterminate") return;

    startTransition(async () => {
      // Server Action 호출 전 UI 즉시 반영
      setOptimisticAttended(checked);

      const formData = new FormData();
      formData.set("participationId", participation.id);
      formData.set("eventId", eventId);
      // Server Action은 string "true"/"false"로 attended 값을 파싱함
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
