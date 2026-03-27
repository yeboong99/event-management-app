"use client";

import { AlertCircle, ArrowRight, CheckCircle2, LockOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { finalizeSettlement } from "@/actions/settlements";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type {
  SettlementResult,
  SettlementTransaction,
} from "@/types/settlement";

// 거래 행 Props
interface TransactionRowProps {
  tx: SettlementTransaction;
  currentUserId: string;
}

// 단일 거래 행 컴포넌트
function TransactionRow({ tx, currentUserId }: TransactionRowProps) {
  // 내가 받을 돈 (채권자)
  const isReceiving = tx.toId === currentUserId;
  // 내가 낼 돈 (채무자)
  const isPaying = tx.fromId === currentUserId;

  return (
    <li
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm",
        isReceiving && "bg-emerald-50 dark:bg-emerald-950/30",
        isPaying && "bg-destructive/5",
      )}
    >
      {/* 거래 당사자 표시 */}
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span
          className={cn(
            "truncate font-medium",
            isPaying && "text-destructive",
            isReceiving && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {tx.from}
        </span>
        <ArrowRight
          className={cn(
            "size-3.5 shrink-0",
            isPaying && "text-destructive",
            isReceiving && "text-emerald-600 dark:text-emerald-400",
            !isPaying && !isReceiving && "text-muted-foreground",
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "truncate font-medium",
            isPaying && "text-destructive",
            isReceiving && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {tx.to}
        </span>
      </span>

      {/* 금액 */}
      <span
        className={cn(
          "shrink-0 font-semibold tabular-nums",
          isPaying && "text-destructive",
          isReceiving && "text-emerald-600 dark:text-emerald-400",
          !isPaying && !isReceiving && "text-foreground",
        )}
        aria-label={`${tx.from}이(가) ${tx.to}에게 ${formatCurrency(tx.amount)} 송금`}
      >
        {formatCurrency(tx.amount)}
      </span>
    </li>
  );
}

// 내 정산 결과 배너 Props
interface MySettlementBannerProps {
  transactions: SettlementTransaction[];
  currentUserId: string;
}

// 내 정산 결과 개인 요약 배너 컴포넌트
function MySettlementBanner({
  transactions,
  currentUserId,
}: MySettlementBannerProps) {
  // 내가 보내야 할 거래 목록 (채무자)
  const myPayingTxs = transactions.filter((tx) => tx.fromId === currentUserId);
  // 내가 받을 거래 목록 (채권자)
  const myReceivingTxs = transactions.filter((tx) => tx.toId === currentUserId);

  // 나와 관련된 거래가 없는 경우
  if (myPayingTxs.length === 0 && myReceivingTxs.length === 0) {
    return (
      <div
        className="bg-muted/30 rounded-lg border px-4 py-3"
        role="status"
        aria-label="내 정산 결과"
      >
        <p className="text-muted-foreground text-sm font-medium">
          정산이 완료되었습니다
        </p>
      </div>
    );
  }

  // 받을 금액 합계
  const receivingTotal = myReceivingTxs.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-2" aria-label="내 정산 결과">
      {/* 보낼 금액 배너 — 채무가 있는 거래마다 개별 표시 */}
      {myPayingTxs.map((tx, index) => (
        <div
          key={`paying-${tx.toId}-${index}`}
          className="border-destructive/30 bg-destructive/5 flex items-start gap-2.5 rounded-lg border px-4 py-3"
          role="status"
        >
          <AlertCircle
            className="text-destructive mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <p className="text-destructive text-sm font-medium">
            <span className="font-semibold">{tx.to}</span>에게{" "}
            <span className="tabular-nums">{formatCurrency(tx.amount)}</span>을
            보내야 합니다
          </p>
        </div>
      ))}

      {/* 받을 금액 배너 — 채권이 있는 경우 합산하여 표시 */}
      {myReceivingTxs.length > 0 && (
        <div
          className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30"
          role="status"
        >
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <span className="tabular-nums">
              {formatCurrency(receivingTotal)}
            </span>
            을 받을 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}

// 정산 확정 버튼 Props
interface FinalizeSettlementButtonProps {
  isHost: boolean;
  isFinalized: boolean;
  eventId: string;
}

// 정산 확정 버튼 컴포넌트
// - 확정 완료: 모든 사용자에게 비활성화된 확정 완료 버튼 표시
// - 주최자: ConfirmDialog를 통해 확정 처리
// - 비주최자: 클릭 시 주최자만 가능하다는 AlertDialog 표시
function FinalizeSettlementButton({
  isHost,
  isFinalized,
  eventId,
}: FinalizeSettlementButtonProps) {
  const [nonHostDialogOpen, setNonHostDialogOpen] = useState(false);

  // 확정 완료 상태 — 모든 사용자 동일
  if (isFinalized) {
    return (
      <div className="flex justify-end">
        <Button variant="outline" size="sm" disabled className="gap-1.5">
          <CheckCircle2 className="size-4 text-emerald-500" />
          확정 완료
        </Button>
      </div>
    );
  }

  // 주최자 — ConfirmDialog로 확정 처리
  if (isHost) {
    return (
      <div className="flex justify-end">
        <ConfirmDialog
          title="정산 확정"
          description="정산을 확정하면 되돌릴 수 없으며, 이후 모든 멤버의 항목 추가·수정·삭제가 불가능합니다. 모든 항목이 올바른지 다시 한번 확인해 주세요."
          confirmLabel="확정하기"
          variant="destructive"
          onConfirm={async () => {
            const result = await finalizeSettlement(eventId);
            if (!result.success) {
              toast.error(result.error ?? "정산 확정에 실패했습니다.");
            }
          }}
          trigger={
            <Button size="sm" variant="destructive">
              정산 확정
            </Button>
          }
        />
      </div>
    );
  }

  // 비주최자 — 클릭 시 안내 AlertDialog
  return (
    <>
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="cursor-not-allowed opacity-60"
          onClick={() => setNonHostDialogOpen(true)}
        >
          정산 확정
        </Button>
      </div>
      <AlertDialog open={nonHostDialogOpen} onOpenChange={setNonHostDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정산 확정 불가</AlertDialogTitle>
            <AlertDialogDescription>
              정산 결과 확정은 이벤트 주최자만 가능합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setNonHostDialogOpen(false)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// 정산 결과 Props
interface SettlementResultProps {
  result: SettlementResult | null;
  currentUserId: string;
  isHost: boolean;
  isFinalized: boolean;
  eventId: string;
}

// 정산 결과 컴포넌트
export function SettlementResult({
  result,
  currentUserId,
  isHost,
  isFinalized,
  eventId,
}: SettlementResultProps) {
  // 정산 항목이 없는 경우 안내 메시지 + 확정 버튼 표시
  if (!result) {
    return (
      <Card>
        <CardContent className="space-y-4 py-6">
          <p className="text-muted-foreground text-center text-sm">
            정산 항목을 추가하면 결과가 표시됩니다
          </p>
          <FinalizeSettlementButton
            isHost={isHost}
            isFinalized={isFinalized}
            eventId={eventId}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">정산 결과</CardTitle>
        {/* 확정 전 안내 문구 — 미확정 상태일 때만 표시 */}
        {!isFinalized && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            <LockOpen className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              주최자가 정산을 확정하기 전에는 금액과 송금 대상자 정보가 변경될
              수 있습니다. 정산 확정 후 송금하세요.
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* 요약 섹션 — 총 지출 / 대상자 수 / 1인 부담액 */}
        <dl className="bg-muted/50 grid grid-cols-3 gap-2 rounded-lg px-4 py-3">
          <div className="flex flex-col gap-0.5 text-center">
            <dt className="text-muted-foreground text-xs">총 지출</dt>
            <dd className="truncate text-sm font-semibold tabular-nums">
              {formatCurrency(result.totalAmount)}
            </dd>
          </div>

          <div className="flex flex-col gap-0.5 border-x text-center">
            <dt className="text-muted-foreground text-xs">정산 대상</dt>
            <dd className="text-sm font-semibold">
              {result.participantCount}
              <span className="text-muted-foreground font-normal">명</span>
            </dd>
          </div>

          <div className="flex flex-col gap-0.5 text-center">
            <dt className="text-muted-foreground text-xs">1인 부담</dt>
            <dd className="truncate text-sm font-semibold tabular-nums">
              {formatCurrency(result.perPerson)}
            </dd>
          </div>
        </dl>

        {/* 내 정산 결과 개인 배너 — 거래가 있을 때만 표시 */}
        {result.transactions.length > 0 && (
          <MySettlementBanner
            transactions={result.transactions}
            currentUserId={currentUserId}
          />
        )}

        {/* 거래 목록 */}
        <section aria-label="송금 목록">
          {result.transactions.length === 0 ? (
            // 모두 균등하게 낸 경우
            <p className="py-4 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
              정산이 완료되었습니다
            </p>
          ) : (
            <ul className="space-y-1.5" role="list">
              {result.transactions.map((tx, index) => (
                <TransactionRow
                  key={`${tx.fromId}-${tx.toId}-${index}`}
                  tx={tx}
                  currentUserId={currentUserId}
                />
              ))}
            </ul>
          )}
        </section>

        {/* 색상 범례 — 내 거래가 포함된 경우만 표시 */}
        {result.transactions.some(
          (tx) => tx.fromId === currentUserId || tx.toId === currentUserId,
        ) && (
          <div
            className="flex flex-wrap gap-x-4 gap-y-1"
            aria-label="색상 범례"
          >
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <span
                className="inline-block size-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              받을 금액
            </span>
            <span className="text-destructive flex items-center gap-1.5 text-xs">
              <span
                className="bg-destructive inline-block size-2 rounded-full"
                aria-hidden="true"
              />
              보낼 금액
            </span>
          </div>
        )}

        {/* 정산 확정 버튼 */}
        <FinalizeSettlementButton
          isHost={isHost}
          isFinalized={isFinalized}
          eventId={eventId}
        />
      </CardContent>
    </Card>
  );
}
