"use client";

import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { useState } from "react";

import { deleteSettlementItem } from "@/actions/settlements";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SettlementItemForm } from "@/components/shared/settlement-item-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import type { SettlementItemWithPayer } from "@/types/settlement";

interface SettlementItemListProps {
  items: SettlementItemWithPayer[];
  /** 주최자 여부 — true일 때 모든 항목 수정/삭제 버튼 노출 */
  isHost: boolean;
  /** 승인된 참여자 여부 — true일 때 항목 추가 버튼 노출 */
  isApproved: boolean;
  /** 현재 로그인 사용자 ID — 자신이 작성한 항목 수정/삭제 여부 판별 */
  currentUserId: string;
  eventId: string;
  /** 정산 참여자 목록 — 편집 폼에서 지출자 선택 시 활용 예정 */
  participants?: { id: string; name: string | null }[];
  /** 정산 확정 여부 — true이면 모든 편집 잠금 */
  isFinalized?: boolean;
}

// 정산 지출 항목 목록 컴포넌트
// - 항목이 없으면 빈 상태 안내 표시
// - 항목이 있으면 행 목록 + 총 합계 footer 표시
// - isHost=true이거나 item.created_by === currentUserId인 경우 수정/삭제 버튼 노출
// - isHost || isApproved인 경우 항목 추가 버튼 노출
// - editingItemId와 일치하는 행은 인라인 편집 영역(placeholder)으로 대체
export function SettlementItemList({
  items,
  isHost,
  isApproved,
  currentUserId,
  eventId,
  participants = [],
  isFinalized = false,
}: SettlementItemListProps) {
  // 현재 편집 중인 항목 id — null이면 편집 없음
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  // 추가 폼 표시 여부
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // 총 합계 계산
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-1">
      {/* 헤더: 제목 + 항목 추가 버튼 */}
      <div className="flex items-center justify-between pb-2">
        <span className="text-sm font-semibold">지출 항목</span>
        {(isHost || isApproved) && !isFinalized && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setIsAddFormOpen((prev) => !prev)}
          >
            <Plus className="size-3" />
            정산 항목 추가
          </Button>
        )}
      </div>

      {/* 추가 폼 — isAddFormOpen일 때만 표시 */}
      {isAddFormOpen && (
        <div className="pb-3">
          <SettlementItemForm
            eventId={eventId}
            participants={participants}
            onCancel={() => setIsAddFormOpen(false)}
          />
        </div>
      )}

      {/* 빈 상태: 항목이 하나도 없을 때 */}
      {items.length === 0 ? (
        <EmptyState icon={Receipt} title="등록된 지출 항목이 없습니다." />
      ) : (
        <>
          {/* 헤더 행 — sm 이상에서만 표시 */}
          {/* 주최자이거나 편집 가능한 항목이 하나라도 있으면 액션 컬럼 포함한 4열 */}
          {(() => {
            const hasAnyEditable =
              !isFinalized &&
              (isHost ||
                items.some((item) => item.created_by === currentUserId));
            return (
              <div
                className={cn(
                  "text-muted-foreground hidden px-3 pb-1 text-xs font-medium",
                  hasAnyEditable
                    ? "sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-3"
                    : "sm:grid sm:grid-cols-[1fr_auto_auto] sm:gap-3",
                )}
              >
                <span>항목명</span>
                <span className="text-right">금액</span>
                <span>지출자</span>
                {hasAnyEditable && <span className="sr-only">액션</span>}
              </div>
            );
          })()}

          <Separator />

          {/* 항목 목록 */}
          <ul role="list" className="divide-border divide-y">
            {items.map((item) => {
              const isEditing = editingItemId === item.id;

              // 편집 중인 항목 — SettlementItemForm 인라인 렌더링
              if (isEditing) {
                return (
                  <li key={item.id} className="py-2">
                    <SettlementItemForm
                      eventId={eventId}
                      participants={participants}
                      initialValues={{
                        itemId: item.id,
                        label: item.label,
                        amount: item.amount,
                        paidBy: item.paid_by,
                      }}
                      onCancel={() => setEditingItemId(null)}
                    />
                  </li>
                );
              }

              const payerName = item.payer.name ?? "알 수 없음";

              const canEdit =
                (isHost || item.created_by === currentUserId) && !isFinalized;

              return (
                <li
                  key={item.id}
                  className={cn(
                    // 모바일: 세로 스택, sm 이상: 그리드 가로 배치
                    "flex flex-col gap-1 px-3 py-3",
                    canEdit
                      ? "sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-3"
                      : "sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-3",
                  )}
                >
                  {/* 항목명 */}
                  <span className="text-sm font-medium">{item.label}</span>

                  {/* 금액 */}
                  <span className="text-sm font-semibold tabular-nums sm:text-right">
                    {formatCurrency(item.amount)}
                  </span>

                  {/* 지출자 — 모바일에서는 muted 텍스트로 작게 표시 */}
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    {payerName}
                  </span>

                  {/* 주최자 또는 항목 작성자에게만 수정/삭제 버튼 노출 */}
                  {canEdit && (
                    <div className="flex shrink-0 items-center gap-1">
                      {/* 수정 버튼 — onClick은 editingItemId 상태 변경 */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => setEditingItemId(item.id)}
                        aria-label={`${item.label} 수정`}
                      >
                        <Pencil className="size-3" />
                        <span className="hidden sm:inline">수정</span>
                      </Button>

                      {/* 삭제 버튼 — ConfirmDialog로 삭제 확인 후 deleteSettlementItem 호출 */}
                      <ConfirmDialog
                        title="지출 항목 삭제"
                        description={`'${item.label}' 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                        variant="destructive"
                        confirmLabel="삭제"
                        onConfirm={async () => {
                          const formData = new FormData();
                          formData.set("itemId", item.id);
                          await deleteSettlementItem(formData);
                        }}
                        trigger={
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 px-2"
                            aria-label={`${item.label} 삭제`}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        }
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* 총 합계 footer */}
          <Separator />
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <span className="text-muted-foreground text-sm font-medium">
              총 지출
            </span>
            <span className="text-base font-bold tabular-nums">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
