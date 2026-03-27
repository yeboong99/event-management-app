import { z } from "zod";

// 정산 항목 생성/수정 폼 스키마
export const settlementItemFormSchema = z.object({
  label: z
    .string()
    .min(1, "항목명을 입력해주세요")
    .max(100, "항목명은 100자 이내로 입력해주세요"),
  amount: z
    .number({ error: "금액을 입력해주세요" })
    .int("금액은 정수여야 합니다")
    .positive("금액은 1원 이상이어야 합니다")
    .max(100_000_000, "금액은 1억원을 초과할 수 없습니다"),
  // 클라이언트: UUID 형식(8-4-4-4-12 hex) 체크만 수행 — RFC 4122 버전/변형 비트 미검증
  // 실제 유효성(이벤트 멤버 여부)은 서버 액션에서 검증
  paidBy: z
    .string({ error: "지출자를 선택해주세요" })
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      "유효하지 않은 사용자입니다",
    ),
});

export type SettlementItemFormData = z.infer<typeof settlementItemFormSchema>;
