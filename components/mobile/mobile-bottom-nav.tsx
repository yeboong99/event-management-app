"use client";

import type { LucideIcon } from "lucide-react";
import { Calendar, Car, Compass, Home, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type MobileBottomNavProps = {
  tabs: Tab[];
};

export function MobileBottomNav({ tabs }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="border-border bg-background border-t"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-stretch">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-xs transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const participantTabs: Tab[] = [
  { label: "탐색", href: "/discover", icon: Compass },
  { label: "참여중", href: "/my-events", icon: Calendar },
  { label: "카풀", href: "/carpools", icon: Car },
  { label: "프로필", href: "/profile", icon: User },
];

export function ParticipantBottomNav() {
  return <MobileBottomNav tabs={participantTabs} />;
}

const hostTabs: Tab[] = [
  { label: "홈", href: "/home", icon: Home },
  { label: "내이벤트", href: "/events", icon: Calendar },
  { label: "만들기", href: "/events/new", icon: Plus },
  { label: "프로필", href: "/profile", icon: User },
];

export function HostBottomNav() {
  return <MobileBottomNav tabs={hostTabs} />;
}
