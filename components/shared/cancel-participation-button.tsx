"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { cancelParticipation } from "@/actions/participations";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";

// 참여 신청 취소 버튼 컴포넌트 Props 타입
type CancelParticipationButtonProps = {
  participationId: string;
  eventId: string;
};

// 참여 신청 취소 버튼 — ConfirmDialog로 이중 확인 후 취소 처리
export function CancelParticipationButton({
  participationId,
  eventId,
}: CancelParticipationButtonProps) {
  const [isPending, startTransition] = useTransition();

  // 참여 취소 확인 후 Server Action 호출
  const handleCancel = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("participationId", participationId);
      formData.append("eventId", eventId);

      const result = await cancelParticipation(formData);

      if (result.success) {
        toast.success("참여 신청이 취소되었습니다.");
      } else {
        toast.error(result.error ?? "취소 처리 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <ConfirmDialog
      title="참여 신청 취소"
      description="정말 참여 신청을 취소하시겠습니까?"
      confirmLabel="신청 취소"
      cancelLabel="돌아가기"
      variant="destructive"
      onConfirm={handleCancel}
      trigger={
        <Button variant="outline" size="sm" disabled={isPending}>
          신청 취소
        </Button>
      }
    />
  );
}
