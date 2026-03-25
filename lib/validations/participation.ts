import { z } from "zod";

// 이벤트 참여 신청 스키마
export const applyParticipationSchema = z.object({
  eventId: z.string().uuid("유효한 이벤트 ID가 아닙니다"),
  message: z.string().max(200, "메시지는 200자 이내로 입력해주세요").optional(),
});

// 참여 상태 변경 스키마 (승인/거절)
export const updateParticipationStatusSchema = z.object({
  participationId: z.string().uuid("유효한 참여 ID가 아닙니다"),
  eventId: z.string().uuid("유효한 이벤트 ID가 아닙니다"),
  status: z.enum(["approved", "rejected"], {
    error: () => ({ message: "승인 또는 거절만 선택 가능합니다" }),
  }),
});

// 출석 여부 토글 스키마
export const toggleAttendanceSchema = z.object({
  participationId: z.string().uuid("유효한 참여 ID가 아닙니다"),
  attended: z.boolean(),
});

export type ApplyParticipationInput = z.infer<typeof applyParticipationSchema>;
export type UpdateParticipationStatusInput = z.infer<
  typeof updateParticipationStatusSchema
>;
export type ToggleAttendanceInput = z.infer<typeof toggleAttendanceSchema>;
