"use client";

import { Calendar, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// 사이드바 메뉴 항목 타입 정의
interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 관리자 사이드바 메뉴 항목 목록
const menuItems: MenuItem[] = [
  { label: "대시보드", href: "/admin", icon: LayoutDashboard },
  { label: "이벤트 관리", href: "/admin/events", icon: Calendar },
  { label: "사용자 관리", href: "/admin/users", icon: Users },
];

export function AdminSidebar() {
  // 현재 경로로 활성 메뉴 항목 판별
  const pathname = usePathname();

  return (
    <aside
      className="border-border bg-background flex h-full w-64 flex-col border-r"
      aria-label="관리자 사이드바 내비게이션"
    >
      {/* 서비스 로고/타이틀 영역 */}
      <div className="border-border flex h-16 items-center border-b px-6">
        <span className="text-foreground text-lg font-bold">관리자</span>
      </div>

      {/* 네비게이션 메뉴 영역 */}
      <nav className="flex-1 px-3 py-4" aria-label="주요 메뉴">
        <ul className="space-y-1" role="list">
          {menuItems.map((item) => {
            // 정확한 경로 일치 여부 확인 (대시보드는 정확히 /admin만 활성화)
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
