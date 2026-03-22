import { formatDistanceToNow, isPast } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { EventCategoryBadge } from "@/components/mobile/event-category-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_ICONS,
} from "@/lib/constants/event-gradients";
import { cn } from "@/lib/utils";
import type { EventWithHost } from "@/types/event";

type EventCardMobileProps = {
  event: EventWithHost;
  href: string;
  showNewBadge?: boolean;
};

export function EventCardMobile({
  event,
  href,
  showNewBadge = false,
}: EventCardMobileProps) {
  const eventDate = new Date(event.event_date);
  const isEventPast = isPast(eventDate);

  // 24시간 이내 생성된 이벤트에 NEW 배지 표시
  const isNew =
    showNewBadge &&
    event.created_at !== null &&
    Date.now() - new Date(event.created_at).getTime() < 24 * 60 * 60 * 1000;

  // 날짜 상대적 표시 ("3일 후", "내일", "오늘" 등)
  const relativeDateText = formatDistanceToNow(eventDate, {
    addSuffix: true,
    locale: ko,
  });

  // 카테고리별 그래디언트 클래스 및 아이콘 도출
  const gradientClass = CATEGORY_GRADIENTS[event.category];
  const CategoryIcon = CATEGORY_ICONS[event.category];

  return (
    <Link href={href}>
      <Card
        className={cn(
          "overflow-hidden transition-shadow hover:shadow-md",
          isEventPast && "opacity-60",
        )}
      >
        {/* 커버 이미지 */}
        <div
          className={cn(
            "relative h-32 w-full",
            event.cover_image_url
              ? "bg-muted"
              : `bg-gradient-to-br ${gradientClass}`,
          )}
        >
          {event.cover_image_url ? (
            <Image
              src={event.cover_image_url}
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <CategoryIcon className="h-12 w-12 text-white/60" />
            </div>
          )}
          {/* NEW 배지 */}
          {isNew && (
            <div className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              NEW
            </div>
          )}
          {/* 카테고리 배지 */}
          <div className="absolute bottom-2 left-2">
            <EventCategoryBadge category={event.category} />
          </div>
        </div>

        <CardContent className="p-3">
          {/* 제목 */}
          <h3 className="text-foreground line-clamp-2 text-base font-semibold">
            {event.title}
          </h3>

          {/* 일시 */}
          <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            <span>{relativeDateText}</span>
          </div>

          {/* 장소 */}
          {event.location && (
            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          {/* 참여 현황 */}
          {event.max_participants && (
            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              <span>최대 {event.max_participants}명</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
