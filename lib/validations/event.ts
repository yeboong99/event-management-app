import { z } from "zod";

import { Constants } from "@/types/database.types";

// 이벤트 생성 스키마
export const eventCreateSchema = z.object({
  title: z
    .string()
    .min(2, "제목은 최소 2자 이상이어야 합니다")
    .max(100, "제목은 최대 100자까지 가능합니다"),
  description: z
    .string()
    .max(2000, "설명은 최대 2000자까지 가능합니다")
    .optional(),
  category: z.enum(Constants.public.Enums.event_category),
  eventDate: z
    .string()
    .refine(
      (date) => new Date(date) > new Date(),
      "이벤트 날짜는 미래 날짜여야 합니다",
    ),
  location: z.string().max(200, "장소는 최대 200자까지 가능합니다").optional(),
  maxParticipants: z.number().int().min(1).max(999).optional(),
  isPublic: z.boolean().default(true),
  coverImageUrl: z.string().url().optional(),
});

// 이벤트 수정 스키마 (모든 필드 선택적)
export const eventUpdateSchema = eventCreateSchema.partial();
