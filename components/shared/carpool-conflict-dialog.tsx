"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CarpoolConflictDialogProps {
  open: boolean;
  onClose: () => void;
  message: string;
}

// 카풀 참여 제한 안내 다이얼로그 — 이미 카풀을 생성하거나 신청한 경우 표시
export function CarpoolConflictDialog({
  open,
  onClose,
  message,
}: CarpoolConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="text-destructive h-5 w-5" />
            카풀 참여 제한
          </DialogTitle>
          <DialogDescription className="pt-1">
            {message}
            <span className="text-foreground/70 mt-2 block text-xs">
              한 이벤트에서 하나의 카풀만 생성하거나 참여할 수 있습니다.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
