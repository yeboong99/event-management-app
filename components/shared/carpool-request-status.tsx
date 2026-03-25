"use client";

import { X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { cancelCarpoolRequest } from "@/actions/carpools";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CarpoolRequest } from "@/types/carpool";

interface CarpoolRequestStatusProps {
  request: CarpoolRequest;
  eventId: string;
  showCancel?: boolean; // true면 모든 상태에서 취소 버튼 표시 (기본: pending 상태만)
}

// 카풀 탑승 신청 상태별 Badge를 렌더링하는 내부 컴포넌트
function CarpoolStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">대기 중</Badge>;
    case "approved":
      return <Badge variant="default">승인됨</Badge>;
    case "rejected":
      return <Badge variant="destructive">거절됨</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// 카풀 탑승 신청 상태 표시 컴포넌트
// 현재 신청 상태를 Badge로 보여주며, showCancel=true이면 모든 상태에서 취소 버튼을 표시합니다.
export function CarpoolRequestStatus({
  request,
  eventId,
  showCancel,
}: CarpoolRequestStatusProps) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelCarpoolRequest(request.id, eventId);
      if (result.success) {
        toast.success("신청이 취소되었습니다.");
      } else {
        toast.error(result.error ?? "취소에 실패했습니다.");
      }
    });
  };

  return (
    <div className={cn("flex items-center justify-between")}>
      {/* 왼쪽: 레이블 + 상태 Badge */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">신청 상태:</span>
        <CarpoolStatusBadge status={request.status} />
      </div>

      {/* 오른쪽: showCancel=true이면 모든 상태에서, 기본은 pending 상태에서만 취소 버튼 표시 */}
      {(showCancel || request.status === "pending") && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
          aria-label="카풀 탑승 신청 취소"
        >
          <X className="mr-1 h-4 w-4" />
          신청 취소
        </Button>
      )}
    </div>
  );
}
