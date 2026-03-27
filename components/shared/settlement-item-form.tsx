"use client";

// 정산 항목 추가/수정 폼 컴포넌트 — React Hook Form + Zod + Server Action 연동

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createSettlementItem,
  updateSettlementItem,
} from "@/actions/settlements";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type SettlementItemFormData,
  settlementItemFormSchema,
} from "@/lib/validations/settlement";

interface SettlementItemFormProps {
  eventId: string;
  participants: { id: string; name: string | null }[];
  /** 수정 모드일 때 기존 항목 값 전달 */
  initialValues?: {
    itemId: string;
    label: string;
    amount: number;
    paidBy: string;
  };
  /** 수정 모드에서 취소 버튼 클릭 시 호출 */
  onCancel?: () => void;
}

export function SettlementItemForm({
  eventId,
  participants,
  initialValues,
  onCancel,
}: SettlementItemFormProps) {
  const [isPending, startTransition] = useTransition();
  // 수정 모드 여부 판별
  const isEditMode = Boolean(initialValues);

  const form = useForm<SettlementItemFormData>({
    resolver: zodResolver(settlementItemFormSchema),
    defaultValues: {
      label: initialValues?.label ?? "",
      amount: initialValues?.amount ?? (undefined as unknown as number),
      paidBy: initialValues?.paidBy ?? "",
    },
  });

  const { setValue, watch, formState } = form;
  const paidByValue = watch("paidBy");

  const onSubmit = (data: SettlementItemFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("label", data.label);
      formData.set("amount", String(data.amount));
      formData.set("paidBy", data.paidBy);

      if (isEditMode && initialValues) {
        // 수정 모드
        formData.set("itemId", initialValues.itemId);
        const result = await updateSettlementItem(formData);
        if (result.success) {
          toast.success("정산 항목이 수정되었습니다.");
          onCancel?.();
        } else {
          toast.error(result.error ?? "수정에 실패했습니다.");
        }
      } else {
        // 생성 모드
        formData.set("eventId", eventId);
        const result = await createSettlementItem(formData);
        if (result.success) {
          form.reset();
          toast.success("정산 항목이 추가되었습니다.");
          onCancel?.();
        } else {
          toast.error(result.error ?? "추가에 실패했습니다.");
        }
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "항목 수정" : "항목 추가"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 항목명 필드 */}
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>항목명</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="식비, 숙박비, 교통비 등"
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 금액 필드 */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>금액</FormLabel>
                  <FormControl>
                    {/* 입력창 + 초기화(x) 버튼 */}
                    <div className="relative">
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        placeholder="10000"
                        min={1}
                        className="[appearance:textfield] pr-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : e.target.valueAsNumber,
                          )
                        }
                      />
                      {/* 값이 있을 때만 초기화 버튼 표시 */}
                      {field.value != null && (
                        <button
                          type="button"
                          onClick={() => field.onChange(undefined)}
                          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-0.5"
                          aria-label="금액 초기화"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </FormControl>
                  {/* 빠른 금액 추가 버튼 */}
                  <div className="flex gap-1.5">
                    {[50000, 10000, 5000, 1000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() =>
                          field.onChange((field.value ?? 0) + amount)
                        }
                        className="border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground rounded-md border px-2 py-1 text-xs"
                      >
                        +
                        {amount >= 10000
                          ? `${amount / 10000}만`
                          : amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 지출자 선택 필드 — form.setValue + watch 패턴으로 RHF 상태 직접 제어 */}
            <FormField
              control={form.control}
              name="paidBy"
              render={() => (
                <FormItem>
                  <FormLabel>지출자</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      setValue("paidBy", value, {
                        shouldValidate: formState.isSubmitted,
                        shouldDirty: true,
                      });
                    }}
                    value={paidByValue}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="지출자를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {participants.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name ?? "이름 없음"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 버튼 영역 */}
            <div className="flex justify-end gap-2">
              {/* 취소 핸들러가 있을 때 취소 버튼 표시 (추가 폼 닫기 / 수정 취소 공통) */}
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={onCancel}
                >
                  취소
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditMode
                    ? "수정 중..."
                    : "추가 중..."
                  : isEditMode
                    ? "수정"
                    : "추가"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
