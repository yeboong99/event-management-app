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

// pending 상태 참여자에 대한 승인/거절 액션 버튼 컴포넌트
export function ParticipantActions({
  participation,
  eventId,
}: ParticipantActionsProps) {
  const [isPending, startTransition] = useTransition();

  // pending 상태가 아니면 버튼을 렌더링하지 않음
  if (participation.status !== "pending") {
    return null;
  }

  // 승인 Server Action 호출 — FormData 방식으로 participationId, eventId 전달
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

  // 거절 Server Action 호출 — FormData 방식으로 participationId, eventId 전달
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
      {/* 승인 버튼 — ConfirmDialog로 확인 후 승인 처리 */}
      <ConfirmDialog
        title="참여 승인"
        description="이 참여자를 승인하시겠습니까?"
        confirmLabel="승인"
        variant="default"
        onConfirm={handleApprove}
        trigger={
          <Button disabled={isPending} variant="default" size="sm">
            승인
          </Button>
        }
      />

      {/* 거절 버튼 — ConfirmDialog로 확인 후 거절 처리 */}
      <ConfirmDialog
        title="참여 거절"
        description="이 참여자를 거절하시겠습니까?"
        confirmLabel="거절"
        variant="destructive"
        onConfirm={handleReject}
        trigger={
          <Button disabled={isPending} variant="outline" size="sm">
            거절
          </Button>
        }
      />
    </div>
  );
}
