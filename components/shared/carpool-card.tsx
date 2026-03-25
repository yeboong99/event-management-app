import { Car, Clock, MapPin, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CarpoolWithDetails } from "@/types/carpool";

interface CarpoolCardProps {
  carpool: CarpoolWithDetails;
  children?: React.ReactNode;
  headerAction?: React.ReactNode;
}

// 출발 시간 ISO 문자열을 한국어 날짜/시간 형식으로 포맷팅
function formatDepartureTime(isoString: string): string {
  return new Date(isoString).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 카풀 정보 카드 — 드라이버 프로필, 출발지, 시간, 좌석 수 등을 표시하는 순수 표시 컴포넌트
export function CarpoolCard({
  carpool,
  children,
  headerAction,
}: CarpoolCardProps) {
  // 승인된 탑승자 수가 전체 좌석 수에 도달하면 마감 처리
  const isFull = carpool.approved_count >= carpool.total_seats;
  const driverName = carpool.profiles.name ?? "알 수 없음";

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {/* 헤더 행: 드라이버 정보 + 마감 배지 */}
        <div className="flex items-start justify-between gap-3">
          {/* 좌측: 드라이버 아바타 + 이름 */}
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="shrink-0">
              {carpool.profiles.avatar_url && (
                <AvatarImage
                  src={carpool.profiles.avatar_url}
                  alt={`${driverName} 프로필 이미지`}
                />
              )}
              <AvatarFallback>
                {driverName[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>

            {/* 드라이버 레이블 + 이름 */}
            <div className="space-y-0.5">
              <div className="text-muted-foreground flex items-center gap-1">
                <Car className="size-3.5 shrink-0" />
                <span className="text-xs">드라이버</span>
              </div>
              <p className="text-sm font-medium">{driverName}</p>
            </div>
          </div>

          {/* 우측: 마감 배지 + 헤더 액션 슬롯 */}
          <div className="flex shrink-0 items-center gap-1">
            {isFull && <Badge variant="secondary">마감</Badge>}
            {headerAction}
          </div>
        </div>

        {/* 카풀 정보 목록 */}
        <div className="space-y-2">
          {/* 출발지 */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <MapPin className="size-4 shrink-0" />
            <span>{carpool.departure_place}</span>
          </div>

          {/* 출발 시간 — null이면 "시간 미정" 표시 */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Clock className="size-4 shrink-0" />
            <span>
              {carpool.departure_time
                ? formatDepartureTime(carpool.departure_time)
                : "시간 미정"}
            </span>
          </div>

          {/* 좌석 현황 */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Users className="size-4 shrink-0" />
            <span>
              {carpool.approved_count} / {carpool.total_seats}석
            </span>
          </div>
        </div>

        {/* 안내사항 — description이 있을 때만 표시 */}
        {carpool.description && (
          <div className="bg-muted rounded px-3 py-2">
            <p className="text-muted-foreground text-xs">
              {carpool.description}
            </p>
          </div>
        )}

        {/* 액션 버튼 슬롯 — children이 있을 때만 표시 (드라이버/탑승자별 다른 버튼) */}
        {children && <div>{children}</div>}
      </CardContent>
    </Card>
  );
}
