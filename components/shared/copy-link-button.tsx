"use client";

import { Check, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// 링크 복사 버튼 컴포넌트 Props 타입 정의
type CopyLinkButtonProps = {
  url: string;
};

// 클립보드 복사 기능을 갖춘 초대 링크 복사 버튼 컴포넌트
// 복사 성공 시 2초간 체크 아이콘을 표시하고 토스트 알림을 보여줍니다
export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  // 복사 완료 상태 — 2초 후 초기화됩니다
  const [copied, setCopied] = useState(false);

  // 클립보드 복사 핸들러 — 성공/실패 시 토스트 알림 표시
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("초대 링크가 복사되었습니다");
      // 2초 후 복사 상태 초기화
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("링크 복사에 실패했습니다");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="w-full gap-2"
    >
      {copied ? (
        <>
          {/* 복사 완료 상태 — 체크 아이콘 표시 */}
          <Check className="h-4 w-4" />
          복사됨!
        </>
      ) : (
        <>
          {/* 기본 상태 — 링크 아이콘 표시 */}
          <LinkIcon className="h-4 w-4" />
          초대 링크 복사
        </>
      )}
    </Button>
  );
}
