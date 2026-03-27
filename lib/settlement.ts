import type {
  SettlementResult,
  SettlementTransaction,
} from "@/types/settlement";

// 파일 내부에서만 사용하는 참여자 지출 타입
type ParticipantPayment = {
  userId: string;
  name: string;
  totalPaid: number; // 해당 참여자가 지출한 총액 (0 포함)
};

// 잔액 계산에 사용하는 내부 타입
type BalanceEntry = {
  userId: string;
  name: string;
  balance: number;
};

/**
 * 정산 알고리즘 순수 함수
 *
 * 각 참여자의 지출 내역을 바탕으로 균등 분담 기준의 최소 거래 쌍을 계산합니다.
 * - 100원 단위로 올림(Math.ceil) 후 잉여금을 최대 지출자에게 귀속
 * - 그리디 매칭으로 거래 횟수를 최소화
 */
export function calculateSettlement(
  payments: ParticipantPayment[],
  totalAmount: number,
): SettlementResult {
  // Step 1: 엣지 케이스 처리
  if (payments.length === 0 || totalAmount === 0) {
    return {
      totalAmount: 0,
      participantCount: payments.length,
      perPerson: 0,
      transactions: [],
    };
  }

  // Step 2: 100원 단위로 올림한 균등 부담액 계산
  // Math.ceil 사용: 나머지 발생 시 모든 팀원이 100원씩 더 부담 (주최자 혜택)
  const participantCount = payments.length;
  const perPerson = Math.ceil(totalAmount / participantCount / 100) * 100;

  // Step 3: 순잔액 계산 (balance = totalPaid - perPerson)
  const allEntries: BalanceEntry[] = payments.map((p) => ({
    userId: p.userId,
    name: p.name,
    balance: p.totalPaid - perPerson,
  }));

  // Step 4: 잉여금(surplus) 처리
  // perPerson 올림으로 인해 n*perPerson > totalAmount인 경우,
  // 잔액 최대 참여자에게 surplus를 더해 모든 채무자가 perPerson 전액을 납부할 수 있게 함
  const surplus = perPerson * participantCount - totalAmount;
  if (surplus > 0) {
    allEntries.sort((a, b) => b.balance - a.balance);
    allEntries[0].balance += surplus;
  }

  // Step 5: creditor/debtor 분류 및 정렬
  const creditors = allEntries
    .filter((e) => e.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  const debtors = allEntries
    .filter((e) => e.balance < 0)
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

  const transactions: SettlementTransaction[] = [];

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

    transactions.push({
      from: debtor.name,
      fromId: debtor.userId,
      to: creditor.name,
      toId: creditor.userId,
      amount,
    });

    creditor.balance -= amount;
    debtor.balance += amount;

    if (creditor.balance === 0) creditors.shift();
    if (debtor.balance === 0) debtors.shift();
  }

  // Step 6: 결과 반환
  return {
    totalAmount,
    participantCount,
    perPerson,
    transactions,
  };
}
