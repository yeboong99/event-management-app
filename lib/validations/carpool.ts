import { z } from "zod";

// 카풀 등록 스키마
export const registerCarpoolSchema = z.object({
  eventId: z.string().uuid("유효한 이벤트 ID가 아닙니다"),
  departurePlace: z
    .string()
    .min(1, "출발지를 입력해주세요")
    .max(100, "출발지는 100자 이내로 입력해주세요"),
  departureTime: z.string().optional(),
  totalSeats: z
    .number({ message: "좌석 수를 입력해주세요" })
    .int("좌석 수는 정수여야 합니다")
    .min(1, "최소 1석 이상이어야 합니다")
    .max(10, "최대 10석까지 등록 가능합니다"),
  description: z
    .string()
    .max(300, "안내사항은 300자 이내로 입력해주세요")
    .optional(),
});

// 카풀 탑승 신청 스키마
export const requestCarpoolSchema = z.object({
  carpoolId: z.string().uuid("유효한 카풀 ID가 아닙니다"),
  message: z.string().max(200, "메시지는 200자 이내로 입력해주세요").optional(),
});

// 카풀 요청 상태 변경 스키마
export const updateCarpoolRequestStatusSchema = z.object({
  requestId: z.string().uuid("유효한 요청 ID가 아닙니다"),
  carpoolId: z.string().uuid("유효한 카풀 ID가 아닙니다"),
  status: z.enum(["approved", "rejected"], {
    error: () => ({ message: "승인 또는 거절만 선택 가능합니다" }),
  }),
});

// 카풀 수정 스키마
export const updateCarpoolSchema = z.object({
  carpoolId: z.string().uuid("유효하지 않은 카풀 ID입니다"),
  departurePlace: z.string().min(1, "출발 장소를 입력해주세요").max(100),
  departureTime: z.string().optional().nullable(),
  totalSeats: z
    .number()
    .int()
    .min(1, "최소 1명 이상이어야 합니다")
    .max(20, "최대 20명까지 가능합니다"),
  description: z.string().max(500).optional().nullable(),
});

export type RegisterCarpoolInput = z.infer<typeof registerCarpoolSchema>;
export type RequestCarpoolInput = z.infer<typeof requestCarpoolSchema>;
export type UpdateCarpoolRequestStatusInput = z.infer<
  typeof updateCarpoolRequestStatusSchema
>;
export type UpdateCarpoolInput = z.infer<typeof updateCarpoolSchema>;
