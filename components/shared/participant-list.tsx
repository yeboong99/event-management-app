"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AttendanceToggle } from "@/components/shared/attendance-toggle";
import { CopyLinkButton } from "@/components/shared/copy-link-button";
import { ParticipantActions } from "@/components/shared/participant-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ParticipationWithProfile } from "@/types/participation";

type ParticipantListProps = {
  /** 서버에서 필터링된 참여자 목록 */
  participations: ParticipationWithProfile[];
  /** 이벤트 ID */
  eventId: string;
  /** 전체 참여자 존재 여부 판단을 위한 총 참여자 수 */
  totalCount: number;
  /** 현재 사용자가 주최자인지 여부 — false이면 필터 탭/액션 버튼 숨김 */
  isHost: boolean;
};

// 참여 상태별 Badge를 렌더링하는 내부 컴포넌트
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">대기 중</Badge>;
    case "approved":
      return <Badge variant="default">승인됨</Badge>;
    case "rejected":
      return <Badge variant="destructive">거절됨</Badge>;
    case "cancelled":
      return <Badge variant="outline">취소됨</Badge>;
    default:
      return null;
  }
}

// 이벤트 참여자 목록 컴포넌트
// isHost가 true이면 URL SearchParams 기반 상태 필터와 주최자 액션 버튼을 제공합니다.
// isHost가 false이면 필터 탭·액션 컨트롤 없이 참여자 카드 목록만 표시합니다.
export function ParticipantList({
  participations,
  eventId,
  totalCount,
  isHost,
}: ParticipantListProps) {
  // 훅 규칙상 항상 최상단에서 호출 — isHost가 false이면 렌더링에서만 미사용
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // URL의 status 쿼리 파라미터를 현재 활성 탭으로 사용 (주최자 전용)
  const activeStatus = searchParams.get("status") ?? "all";

  // 탭 변경 시 URL SearchParams를 업데이트하여 서버 측 필터링 트리거 (주최자 전용)
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`?${params.toString()}`);
  };

  // 초대 링크: 현재 페이지 pathname 기반으로 조합 (주최자 전용)
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${pathname}`
      : pathname;

  return (
    <div className="space-y-4">
      {/* 상태별 필터 탭 — 주최자에게만 표시, URL SearchParams와 동기화 */}
      {isHost && (
        <Tabs value={activeStatus} onValueChange={handleTabChange}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="pending">대기</TabsTrigger>
            <TabsTrigger value="approved">승인</TabsTrigger>
            <TabsTrigger value="rejected">거절</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* 참여자 카드 목록 */}
      <div className="space-y-3">
        {participations.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              {/* 참여자 정보 영역 */}
              <div className="flex items-start gap-3">
                {/* 프로필 아바타 */}
                <Avatar size="lg" className="shrink-0">
                  {p.profiles?.avatar_url && (
                    <AvatarImage
                      src={p.profiles.avatar_url}
                      alt={p.profiles.name ?? "참여자 프로필 이미지"}
                    />
                  )}
                  <AvatarFallback>
                    {p.profiles?.name?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>

                {/* 이름, 상태 배지, 이메일, 신청 메시지 */}
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {p.profiles?.name ?? "알 수 없음"}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-muted-foreground truncate text-sm">
                    {p.profiles?.email ?? ""}
                  </p>
                  {/* 신청 메시지 — 있는 경우만 표시 */}
                  {p.message && (
                    <p className="text-muted-foreground text-xs">{p.message}</p>
                  )}
                </div>
              </div>

              {/* 우측 액션 영역 — 주최자에게만 표시 */}
              {isHost && (
                <div className="flex shrink-0 items-center gap-3 sm:ml-auto">
                  {/* 출석 토글 — 승인된 참여자에게만 표시 */}
                  {p.status === "approved" && (
                    <AttendanceToggle participation={p} eventId={eventId} />
                  )}

                  {/* 승인/거절 액션 버튼 — pending 상태인 경우만 표시 */}
                  <ParticipantActions participation={p} eventId={eventId} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* 빈 상태 처리 */}
        {participations.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-12">
            {isHost ? (
              /* 주최자용 빈 상태 */
              totalCount === 0 ? (
                /* 전체 참여자가 없는 경우 — 초대 링크 복사 유도 */
                <>
                  <p className="text-muted-foreground text-sm">
                    아직 참여 신청이 없습니다.
                  </p>
                  <CopyLinkButton url={inviteUrl} />
                </>
              ) : (
                /* 필터 결과가 없는 경우 */
                <p className="text-muted-foreground text-sm">
                  해당 상태의 참여자가 없습니다.
                </p>
              )
            ) : (
              /* 참여자용 빈 상태 — 단순 안내 메시지만 표시 */
              <p className="text-muted-foreground text-sm">
                아직 승인된 참여자가 없습니다.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
