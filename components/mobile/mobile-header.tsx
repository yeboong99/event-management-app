import { cn } from "@/lib/utils";

type MobileHeaderProps = {
  className?: string;
};

export function MobileHeader({ className }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "border-border bg-background sticky top-0 z-40 border-b",
        className,
      )}
    >
      <div className="flex h-14 items-center px-4">
        <span className="text-foreground text-lg font-semibold">
          이벤트 매니저
        </span>
      </div>
    </header>
  );
}
