"use client";

import { Check, Trash2, Users, Wrench, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  approveCarpoolRequest,
  deleteCarpool,
  dismissCarpoolRequest,
  rejectCarpoolRequest,
} from "@/actions/carpools";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CarpoolRequestWithProfile,
  CarpoolWithDetails,
} from "@/types/carpool";

type CarpoolActionsProps = {
  carpool: CarpoolWithDetails;
  requests: CarpoolRequestWithProfile[];
  currentUserId: string;
  eventId: string;
  isDriverOrHost: boolean;
};

// 카풀 삭제 버튼 — 카드 헤더 슬롯에 독립적으로 배치하기 위해 분리
export function CarpoolDeleteButton({
  carpoolId,
  eventId,
}: {
  carpoolId: string;
  eventId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCarpool(carpoolId, eventId);
      if (result.success) {
        toast.success("카풀이 삭제되었습니다.");
      } else {
        toast.error(result.error ?? "카풀 삭제 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <ConfirmDialog
      title="카풀 삭제"
      description="이 카풀을 삭제하면 모든 탑승 신청도 함께 삭제됩니다. 정말 삭제하시겠습니까?"
      confirmLabel="삭제"
      variant="destructive"
      onConfirm={handleDelete}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="text-destructive hover:text-destructive"
          aria-label="카풀 삭제"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      }
    />
  );
}

// 카풀 드라이버/주최자 전용 — 탑승 신청 승인/거절 액션 컴포넌트
export function CarpoolActions({
  carpool,
  requests,
  eventId,
  isDriverOrHost,
}: CarpoolActionsProps) {
  const [isPending, startTransition] = useTransition();
  // 관리 버튼이 펼쳐진 신청 항목 ID — null이면 모든 항목이 닫힌 상태
  const [openManageId, setOpenManageId] = useState<string | null>(null);

  // 드라이버 또는 주최자가 아니면 렌더링하지 않음
  if (!isDriverOrHost) {
    return null;
  }

  // 잔여석 계산: 승인된 탑승자 수가 총 좌석 수 이상이면 만석
  const isFull = carpool.approved_count >= carpool.total_seats;

  // 상태 우선순위에 따라 정렬: pending → approved → rejected
  const STATUS_ORDER: Record<CarpoolRequestWithProfile["status"], number> = {
    pending: 0,
    approved: 1,
    rejected: 2,
  };
  const sortedRequests = [...requests].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );

  // 탑승 신청 승인 — approveCarpoolRequest Server Action 호출
  const handleApprove = (requestId: string) => {
    startTransition(async () => {
      const result = await approveCarpoolRequest(
        requestId,
        carpool.id,
        eventId,
      );

      if (result.success) {
        toast.success("탑승 신청을 승인했습니다.");
      } else {
        toast.error(result.error ?? "승인 처리 중 오류가 발생했습니다.");
      }
    });
  };

  // 탑승 신청 거절 — rejectCarpoolRequest Server Action 호출
  const handleReject = (requestId: string) => {
    startTransition(async () => {
      const result = await rejectCarpoolRequest(requestId, carpool.id, eventId);

      if (result.success) {
        toast.success("탑승 신청을 거절했습니다.");
      } else {
        toast.error(result.error ?? "거절 처리 중 오류가 발생했습니다.");
      }
    });
  };

  // 거절된 탑승 신청 삭제 — dismissCarpoolRequest Server Action 호출
  const handleDismiss = (requestId: string) => {
    startTransition(async () => {
      const result = await dismissCarpoolRequest(
        requestId,
        carpool.id,
        eventId,
      );

      if (result.success) {
        toast.success("탑승 신청을 삭제했습니다.");
        setOpenManageId(null);
      } else {
        toast.error(result.error ?? "삭제 처리 중 오류가 발생했습니다.");
      }
    });
  };

  // 상태별 배지 스타일 및 텍스트 반환 헬퍼
  const getStatusBadge = (status: CarpoolRequestWithProfile["status"]) => {
    const config = {
      pending: {
        label: "대기중",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      approved: {
        label: "승인됨",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      rejected: {
        label: "거절됨",
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
    };
    return config[status] ?? config.pending;
  };

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 — 탑승 신청 관리 제목 */}
      <div className="flex items-center gap-2">
        <Users className="text-muted-foreground h-4 w-4" />
        <h3 className="text-sm font-medium">탑승 신청 관리</h3>
      </div>

      {/* 탑승 신청 목록 */}
      {sortedRequests.length === 0 ? (
        /* 빈 상태 — 탑승 신청이 없을 때 */
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <Users className="text-muted-foreground/50 h-8 w-8" />
          <p className="text-muted-foreground text-sm">탑승 신청이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedRequests.map((request) => {
            const statusBadge = getStatusBadge(request.status);
            // 이름 이니셜 — 아바타 fallback용
            const displayName =
              request.profiles.name ?? request.profiles.email ?? "알 수 없음";
            const initials = displayName.slice(0, 1).toUpperCase();

            // pending 상태는 바로 승인/거절 버튼 표시, 그 외에는 관리 버튼 토글 방식 사용
            const isPending_ = request.status === "pending";
            const isManageOpen = openManageId === request.id;

            return (
              <div
                key={request.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                {/* 신청자 정보 — 아바타 + 이름 + 이메일 */}
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                      src={request.profiles.avatar_url ?? undefined}
                      alt={displayName}
                    />
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {request.profiles.name ?? "이름 없음"}
                    </p>
                    {request.profiles.email && (
                      <p className="text-muted-foreground truncate text-xs">
                        {request.profiles.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* 상태 배지 + 액션 버튼 영역 */}
                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("border-0 text-xs", statusBadge.className)}
                  >
                    {statusBadge.label}
                  </Badge>

                  {/* pending: 승인/거절 버튼 바로 표시 */}
                  {/* approved/rejected: 관리 버튼 클릭 시 승인/거절 버튼 토글 표시 */}
                  {!isPending_ && !isManageOpen ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpenManageId(request.id)}
                      aria-label="관리"
                      aria-expanded={false}
                    >
                      <Wrench className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <>
                      {/* 승인 버튼 — 만석이거나 처리 중이면 비활성화 */}
                      <ConfirmDialog
                        title="탑승 신청 승인"
                        description="이 탑승 신청을 승인하시겠습니까?"
                        confirmLabel="승인"
                        variant="default"
                        onConfirm={() => handleApprove(request.id)}
                        trigger={
                          <Button
                            variant="default"
                            size="sm"
                            disabled={isFull || isPending}
                            aria-label="승인"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        }
                      />

                      {/* 거절 버튼 — 이미 거절됐거나 처리 중이면 비활성화 */}
                      <ConfirmDialog
                        title="탑승 신청 거절"
                        description="이 탑승 신청을 거절하시겠습니까?"
                        confirmLabel="거절"
                        variant="destructive"
                        onConfirm={() => handleReject(request.id)}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              request.status === "rejected" || isPending
                            }
                            aria-label="거절"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        }
                      />

                      {/* 삭제 버튼 — 거절된 신청에만 표시, 목록에서 완전히 제거하고 재신청 가능하게 함 */}
                      {request.status === "rejected" && (
                        <ConfirmDialog
                          title="탑승 신청 삭제"
                          description="이 신청을 목록에서 삭제합니다. 해당 신청자는 다시 탑승 신청을 할 수 있게 됩니다."
                          confirmLabel="삭제"
                          variant="destructive"
                          onConfirm={() => handleDismiss(request.id)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              className="text-destructive hover:text-destructive"
                              aria-label="신청 삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                      )}

                      {/* 관리 패널 닫기 버튼 — approved/rejected 상태에서만 표시 */}
                      {!isPending_ && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenManageId(null)}
                          aria-label="관리 패널 닫기"
                          aria-expanded={true}
                        >
                          <Wrench className="text-muted-foreground h-3.5 w-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
