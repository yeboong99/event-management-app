"use client";

import { Car, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CarpoolWithEvent } from "@/types/carpool";

interface MyCarpoolsDriverViewProps {
  carpools: CarpoolWithEvent[];
}

// 출발 시간 포맷팅 유틸
function formatDepartureTime(time: string | null): string {
  if (!time) return "시간 미정";
  return new Date(time).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MyCarpoolsDriverView({ carpools }: MyCarpoolsDriverViewProps) {
  // 빈 상태 UI
  if (carpools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Car
          className="text-muted-foreground/40 h-12 w-12"
          aria-hidden="true"
        />
        <p className="text-foreground font-semibold">등록한 카풀이 없습니다</p>
        <p className="text-muted-foreground text-sm">
          이벤트에 참여 후 카풀을 등록해보세요.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="내가 등록한 카풀 목록">
      {/* 총 건수 표시 */}
      <p className="text-muted-foreground mb-4 text-sm">
        총 {carpools.length}개의 카풀
      </p>

      {/* 카풀 카드 목록 */}
      <div className="flex flex-col gap-3">
        {carpools.map((carpool) => {
          // 만석 여부 판단
          const isFull = carpool.approved_count >= carpool.total_seats;

          return (
            <Link
              key={carpool.id}
              href={`/events/${carpool.events.id}`}
              className="focus-visible:ring-ring block rounded-lg transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none"
              aria-label={`${carpool.events.title} 카풀 상세 보기`}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    {/* 이벤트명 */}
                    <span className="text-foreground font-semibold">
                      {carpool.events.title}
                    </span>

                    {/* 만석 / 탑승 가능 뱃지 */}
                    {isFull ? (
                      <Badge variant="destructive" className="shrink-0">
                        마감
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">
                        탑승 가능
                      </Badge>
                    )}
                  </div>

                  {/* 카풀 상세 정보 */}
                  <div className="mt-3 flex flex-col gap-1.5">
                    {/* 출발지 */}
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <MapPin
                        className="text-muted-foreground h-4 w-4"
                        aria-hidden="true"
                      />
                      <span>{carpool.departure_place}</span>
                    </div>

                    {/* 출발 시간 */}
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Clock
                        className="text-muted-foreground h-4 w-4"
                        aria-hidden="true"
                      />
                      <span>{formatDepartureTime(carpool.departure_time)}</span>
                    </div>

                    {/* 좌석 현황 */}
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Users
                        className="text-muted-foreground h-4 w-4"
                        aria-hidden="true"
                      />
                      <span>
                        {carpool.approved_count}/{carpool.total_seats}석
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
