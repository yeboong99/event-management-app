"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * 관리자 헤더 다크모드 토글 스위치 컴포넌트
 * - 클릭 시 html에 .theme-transitioning 클래스를 붙여 전역 색상 전환(0.3s) 활성화
 * - 썸(thumb)은 Tailwind transition-transform duration-300으로 좌우 슬라이드
 */
export function DarkModeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // 클라이언트 마운트 후에만 렌더링 (hydration mismatch 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // 마운트 전 플레이스홀더 — 레이아웃 이탈 방지
    return <div className="h-7 w-[52px]" />;
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    // 1) 먼저 transition 규칙 활성화
    document.documentElement.classList.add("theme-transitioning");

    // 2) 다음 프레임까지 대기 → 브라우저가 transition 규칙을 인식한 뒤 색상 변경
    //    같은 프레임에서 두 변경이 일어나면 "이전 상태"가 없어 transition이 동작하지 않음
    requestAnimationFrame(() => {
      setTheme(isDark ? "light" : "dark");

      // 3) 0.3s 전환 완료 후 클래스 제거
      setTimeout(() => {
        document.documentElement.classList.remove("theme-transitioning");
      }, 300);
    });
  };

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      onClick={handleToggle}
      className={cn(
        // 트랙(track) — 배경색은 theme-transitioning 규칙으로 0.3s 전환됨
        "relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent outline-none",
        "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2",
        isDark ? "bg-primary" : "bg-border",
      )}
    >
      {/* 썸(thumb) — translateX로 좌우 슬라이드, Tailwind transition으로 애니메이션 */}
      <span
        className={cn(
          "pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md",
          "transition-transform duration-300 ease-in-out",
          isDark ? "translate-x-[26px]" : "translate-x-[1px]",
        )}
      >
        {isDark ? (
          <Moon size={11} className="text-primary" />
        ) : (
          <Sun size={11} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}
