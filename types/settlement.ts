import type { Database } from "@/types/database.types";

// DB Row 타입
export type SettlementItem =
  Database["public"]["Tables"]["settlement_items"]["Row"];
export type SettlementItemInsert =
  Database["public"]["Tables"]["settlement_items"]["Insert"];
export type SettlementItemUpdate =
  Database["public"]["Tables"]["settlement_items"]["Update"];

// 지출자 이름이 포함된 조인 타입
export type SettlementItemWithPayer = SettlementItem & {
  payer: {
    id: string;
    name: string | null;
  };
};

// 정산 계산 결과 타입
export type SettlementTransaction = {
  from: string; // debtor 이름
  fromId: string; // debtor user ID
  to: string; // creditor 이름
  toId: string; // creditor user ID
  amount: number; // 거래 금액 (원)
};

export type SettlementResult = {
  totalAmount: number; // 총 지출 금액
  participantCount: number; // 정산 대상자 수 (주최자 포함)
  perPerson: number; // 1인 균등 부담액
  transactions: SettlementTransaction[]; // 최소 거래 쌍 목록
};
