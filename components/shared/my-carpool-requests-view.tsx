"use client";

import { Car, Clock, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CarpoolRequestStatus } from "@/components/shared/carpool-request-status";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CarpoolRequestWithCarpool } from "@/types/carpool";

interface MyCarpoolRequestsViewProps {
  requests: CarpoolRequestWithCarpool[];
}

// 상태 필터 항목 정의 (my-events의 STATUS_FILTERS 패턴과 동일)
const STATUS_FILTERS = [
  { label: "전체", status: undefined },
  { label: "대기", status: "pending" },
  { label: "승인", status: "approved" },
  { label: "거절", status: "rejected" },
] as const;

type FilterStatus = (typeof STATUS_FILTERS)[number]["status"];

// 출발 시간 포맷팅 헬퍼
function formatDepartureTime(time: string | null): string {
  if (!time) return "시간 미정";
  return new Date(time).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 내가 탑승 신청한 카풀 목록 뷰 컴포넌트
export function MyCarpoolRequestsView({
  requests,
}: MyCarpoolRequestsViewProps) {
  // 클라이언트 사이드 필터 상태
  const [activeFilter, setActiveFilter] = useState<FilterStatus>(undefined);

  // 선택된 필터에 따라 목록 필터링
  const filteredRequests =
    activeFilter === undefined
      ? requests
      : requests.filter((r) => r.status === activeFilter);

  return (
    <section aria-label="내 카풀 탑승 신청 목록">
      {/* 상태 필터 버튼 */}
      <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {STATUS_FILTERS.map(({ label, status }) => (
          <Button
            key={label}
            variant={activeFilter === status ? "default" : "outline"}
            size="sm"
            className="shrink-0"
            onClick={() => setActiveFilter(status)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 총 건수 표시 */}
      <div className="mt-4 mb-4">
        <p className="text-muted-foreground text-sm">
          총 {filteredRequests.length}건
        </p>
      </div>

      {/* 카풀 신청 목록 또는 빈 상태 */}
      {requests.length === 0 ? (
        /* 전체 목록이 비어있는 경우 */
        <EmptyState
          icon={Car}
          title="탑승 신청한 카풀이 없습니다"
          description="이벤트 페이지에서 카풀 탑승을 신청해보세요."
          className="py-16"
        />
      ) : filteredRequests.length === 0 ? (
        /* 필터 적용 후 결과 없는 경우 */
        <EmptyState title="해당 상태의 신청이 없습니다" />
      ) : (
        /* 카풀 신청 카드 목록 */
        <div className="flex flex-col gap-3">
          {filteredRequests.map((request) => {
            const carpool = request.carpools;
            const event = carpool.events;
            const driverName = carpool.profiles.name ?? "알 수 없음";

            return (
              <Card key={request.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    {/* 상단: 이벤트명 (Link) + 드라이버 */}
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/events/${event.id}`}
                        className={cn(
                          "text-foreground font-semibold underline-offset-2",
                          "hover:underline",
                        )}
                        aria-label={`${event.title} 이벤트로 이동`}
                      >
                        {event.title}
                      </Link>
                    </div>

                    {/* 드라이버 정보 */}
                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <User className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{driverName} 드라이버</span>
                    </div>

                    {/* 출발지 */}
                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{carpool.departure_place}</span>
                    </div>

                    {/* 출발 시간 */}
                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{formatDepartureTime(carpool.departure_time)}</span>
                    </div>

                    {/* 구분선 */}
                    <hr className="border-border" />

                    {/* 신청 상태 + 취소 버튼 (CarpoolRequestStatus 재사용) */}
                    <CarpoolRequestStatus
                      request={request}
                      eventId={event.id}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
