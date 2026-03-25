import { z } from "zod";

import { eventCreateSchema, eventUpdateSchema } from "@/lib/validations/event";
import { Constants, Database } from "@/types/database.types";

// 이벤트 카테고리 타입
export type EventCategory = Database["public"]["Enums"]["event_category"];

// 폼 데이터 타입
export type EventFormData = z.infer<typeof eventCreateSchema>;
export type EventUpdateFormData = z.infer<typeof eventUpdateSchema>;

// 이벤트 + 주최자 정보 + 승인된 참여자 수 조인 타입
export type EventWithHost = Database["public"]["Tables"]["events"]["Row"] & {
  host: {
    name: string | null;
    avatar_url: string | null;
  };
  current_participants_count: number;
};

// 카테고리 배열 상수
export const EVENT_CATEGORIES = Constants.public.Enums
  .event_category as readonly EventCategory[];
