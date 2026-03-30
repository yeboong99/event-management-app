"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { deleteAccount } from "@/actions/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { deleteAccountSchema } from "@/lib/validations/profile";
import type { DeleteAccountInput } from "@/types/profile";

// 컴포넌트 Props 타입
type DeleteAccountFormProps = {
  hostedEvents: { id: string; title: string }[];
};

export function DeleteAccountForm({ hostedEvents }: DeleteAccountFormProps) {
  // 최종 확인 다이얼로그 열림 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 비동기 전환 상태 (Server Action 호출 중 로딩 표시용)
  const [isPending, startTransition] = useTransition();

  // React Hook Form 연결
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DeleteAccountInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(deleteAccountSchema) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: { confirmation: "" } as any,
  });

  // 입력값 실시간 감시 (버튼 활성화 조건 판단용)
  const confirmationValue = watch("confirmation");

  // 폼 제출 핸들러 — Zod 검증 통과 시 최종 확인 다이얼로그 오픈
  const onSubmit = () => {
    setIsDialogOpen(true);
  };

  // 최종 탈퇴 확인 핸들러 — Server Action 호출
  const onConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("confirmation", confirmationValue);

      const result = await deleteAccount(formData);
      // deleteAccount 성공 시 redirect("/auth/login")이 실행되므로
      // 에러 반환 시에만 처리
      if (result && !result.success) {
        toast.error(result.error ?? "탈퇴 처리 중 오류가 발생했습니다.");
        setIsDialogOpen(false);
      }
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}
        className="space-y-6"
      >
        {/* ── 1. 비가역 경고 배너 ── */}
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4",
            "border-destructive/30 bg-destructive/10",
          )}
        >
          <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-destructive text-sm font-semibold">
              이 작업은 되돌릴 수 없습니다
            </p>
            <p className="text-destructive/80 text-sm">
              계정과 모든 관련 데이터가 영구적으로 삭제됩니다.
            </p>
          </div>
        </div>

        {/* ── 2. 주최 이벤트 경고 섹션 (조건부) ── */}
        {hostedEvents.length > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/30 dark:bg-orange-950/20">
            <p className="mb-2 text-sm font-semibold text-orange-800 dark:text-orange-400">
              삭제되는 이벤트 목록:
            </p>
            <ul
              className="max-h-40 space-y-1 overflow-y-auto"
              aria-label="삭제 예정 이벤트 목록"
            >
              {hostedEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  {event.title}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-orange-600 dark:text-orange-400/80">
              위 이벤트와 관련된 모든 데이터도 함께 삭제됩니다.
            </p>
          </div>
        )}

        {/* ── 3. "탈퇴합니다" 입력 확인 필드 ── */}
        <div className="space-y-2">
          <Label htmlFor="confirmation">
            탈퇴를 확인하려면{" "}
            <span className="text-destructive font-semibold">
              &quot;탈퇴합니다&quot;
            </span>
            를 입력하세요
          </Label>
          <Input
            id="confirmation"
            placeholder="탈퇴합니다"
            autoComplete="off"
            {...register("confirmation")}
          />
          {errors.confirmation && (
            <p className="text-destructive text-sm">
              {errors.confirmation.message}
            </p>
          )}
        </div>

        {/* ── 4. 버튼 영역 ── */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="submit"
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={isPending}
          >
            탈퇴 신청
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/profile">취소</Link>
          </Button>
        </div>
      </form>

      {/* ── 5. 최종 확인 AlertDialog ── */}
      <AlertDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          // 처리 중에는 다이얼로그를 닫지 않음
          if (isPending) return;
          setIsDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 탈퇴하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 취소할 수 없습니다. 계정과 모든 데이터가 영구
              삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "bg-destructive text-destructive-foreground",
                "hover:bg-destructive/90",
              )}
              disabled={isPending}
              onClick={onConfirm}
            >
              최종 탈퇴
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
