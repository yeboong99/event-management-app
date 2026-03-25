"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CarpoolRegisterToggleProps {
  // 외부에서 열림 상태를 제어하는 controlled 컴포넌트
  isOpen: boolean;
  onToggle: () => void;
}

// "카풀 만들기" 토글 버튼 — 상태 및 폼 렌더링은 부모(CarpoolTabs)에서 담당
export function CarpoolRegisterToggle({
  isOpen,
  onToggle,
}: CarpoolRegisterToggleProps) {
  return (
    <Button
      variant={isOpen ? "ghost" : "outline"}
      size="sm"
      onClick={onToggle}
      className="gap-1.5"
    >
      {isOpen ? (
        <>
          <X className="h-4 w-4" />
          닫기
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          카풀 만들기
        </>
      )}
    </Button>
  );
}
