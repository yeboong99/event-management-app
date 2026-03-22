"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * URL 쿼리 파라미터를 감지하여 Toast 알림을 표시하는 컴포넌트.
 * Server Action redirect 이후 성공 피드백을 제공합니다.
 * 알림 표시 후 URL 파라미터를 제거하여 새로고침 시 중복 표시를 방지합니다.
 */
export function ToastHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const created = searchParams.get("created");
    const updated = searchParams.get("updated");

    if (created === "true") {
      // 이벤트 생성 성공 알림
      toast.success("이벤트가 생성되었습니다.");
      const url = new URL(window.location.href);
      url.searchParams.delete("created");
      router.replace(url.pathname + url.search);
    } else if (updated === "true") {
      // 이벤트 수정 성공 알림
      toast.success("이벤트가 수정되었습니다.");
      const url = new URL(window.location.href);
      url.searchParams.delete("updated");
      router.replace(url.pathname + url.search);
    }
  }, [searchParams, router]);

  // UI 렌더링 없음 — 사이드 이펙트만 처리
  return null;
}
