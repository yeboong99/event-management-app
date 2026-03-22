"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// 확인 다이얼로그 컴포넌트 Props 타입 정의
type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  trigger: React.ReactNode;
};

// 비동기 작업 확인용 다이얼로그 컴포넌트
// 로딩 상태와 오류 처리를 내부에서 관리합니다
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  variant = "default",
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  // 다이얼로그 열림/닫힘 상태
  const [open, setOpen] = useState(false);
  // 확인 버튼 클릭 후 처리 중 상태
  const [isLoading, setIsLoading] = useState(false);

  // 확인 버튼 클릭 핸들러 — 비동기 작업 처리 후 다이얼로그 닫기
  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {/* 취소 버튼 — 로딩 중에는 비활성화 */}
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          {/* 확인 버튼 — 로딩 중 스피너 표시 */}
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
