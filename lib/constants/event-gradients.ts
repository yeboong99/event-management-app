import {
  BookOpen,
  Briefcase,
  Calendar,
  Dumbbell,
  Music,
  PartyPopper,
} from "lucide-react";

import type { EventCategory } from "@/types/event";

// 카테고리별 gradient 클래스 매핑 (Tailwind v4: 완전한 클래스 문자열로 정의)
export const CATEGORY_GRADIENTS: Record<EventCategory, string> = {
  생일파티: "from-pink-400 to-purple-500",
  파티모임: "from-orange-400 to-yellow-400",
  워크샵: "from-blue-400 to-indigo-500",
  스터디: "from-green-400 to-teal-500",
  운동스포츠: "from-red-400 to-orange-500",
  기타: "from-slate-400 to-gray-500",
};

// 카테고리별 아이콘 매핑
export const CATEGORY_ICONS = {
  생일파티: PartyPopper,
  파티모임: Music,
  워크샵: Briefcase,
  스터디: BookOpen,
  운동스포츠: Dumbbell,
  기타: Calendar,
} satisfies Record<EventCategory, React.ComponentType<{ className?: string }>>;
