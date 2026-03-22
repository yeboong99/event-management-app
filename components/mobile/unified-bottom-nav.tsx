"use client";

import type { LucideIcon } from "lucide-react";
import { Calendar, Car, Compass, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// 탭 타입 정의
type NavTab = {
  label: string;
  href: string;
  icon: LucideIcon;
  // 중앙 FAB 스타일 여부
  isFab?: boolean;
};

// 통합 하단 네비게이션 탭 구성
const UNIFIED_TABS: NavTab[] = [
  { label: "탐색", href: "/discover", icon: Compass },
  { label: "내 활동", href: "/my-events", icon: Calendar },
  { label: "만들기", href: "/events/new", icon: Plus, isFab: true },
  { label: "카풀", href: "/carpools", icon: Car },
  { label: "프로필", href: "/profile", icon: User },
];

/**
 * 현재 경로가 특정 탭에 해당하는지 판별하는 헬퍼 함수
 * - /events/new 탭은 정확히 일치할 때만 활성
 * - /my-events 탭은 해당 경로로 시작할 때 활성
 * - 나머지 탭은 경로 일치 또는 하위 경로 포함 시 활성
 */
function isTabActive(tabHref: string, pathname: string): boolean {
  if (tabHref === "/events/new") {
    return pathname === "/events/new";
  }
  if (tabHref === "/my-events") {
    return pathname.startsWith("/my-events");
  }
  return pathname === tabHref || pathname.startsWith(tabHref + "/");
}

export function UnifiedBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주 내비게이션"
      className="border-border bg-background border-t"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-stretch">
        {UNIFIED_TABS.map((tab) => {
          const isActive = isTabActive(tab.href, pathname);
          const Icon = tab.icon;

          // 만들기 탭(FAB 스타일) — 중앙 강조 디자인
          if (tab.isFab) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2"
              >
                {/* 원형 FAB 버튼 — 위로 살짝 올라오는 효과 */}
                <span
                  className={cn(
                    "-translate-y-1 rounded-full p-3 shadow-md transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-primary text-primary-foreground hover:scale-105",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={cn(
                    "text-xs leading-none",
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          // 일반 탭
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
