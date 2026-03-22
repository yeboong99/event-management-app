import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@/types/event";

type EventCategoryBadgeProps = {
  category: EventCategory;
  className?: string;
};

// 카테고리별 색상 매핑
const categoryColors: Record<EventCategory, string> = {
  생일파티: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
  파티모임:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  워크샵: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  스터디: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  운동스포츠:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  기타: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

export function EventCategoryBadge({
  category,
  className,
}: EventCategoryBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(categoryColors[category], "text-xs font-medium", className)}
    >
      {category}
    </Badge>
  );
}
