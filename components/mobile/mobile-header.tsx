"use client";

import { usePathname } from "next/navigation";

import { BackButton } from "@/components/shared/back-button";
import { cn } from "@/lib/utils";

type MobileHeaderProps = {
  className?: string;
};

export function MobileHeader({ className }: MobileHeaderProps) {
  const pathname = usePathname();
  // /events/[id] 패턴만 감지 (new, edit 페이지는 제외)
  const isEventDetail = /^\/events\/[^/]+$/.test(pathname);

  return (
    <header
      className={cn(
        "border-border bg-background sticky top-0 z-40 border-b",
        className,
      )}
    >
      <div className="flex h-14 items-center px-4">
        {isEventDetail && (
          <BackButton fallbackHref="/events" className="mr-2" />
        )}
        <span className="text-foreground text-lg font-semibold">
          이벤트 매니저
        </span>
      </div>
    </header>
  );
}
