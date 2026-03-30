import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide 아이콘 컴포넌트 */
  icon?: LucideIcon;
  /** 제목 (필수) */
  title: string;
  /** 설명 텍스트 */
  description?: string;
  /** CTA 버튼 등 액션 영역 */
  action?: ReactNode;
  /** 컨테이너 커스터마이징 클래스 */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className,
      )}
    >
      {/* 아이콘 */}
      {Icon && <Icon className="text-muted-foreground/40 size-12" />}

      {/* 제목 */}
      <p className="text-foreground text-base font-semibold">{title}</p>

      {/* 설명 */}
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}

      {/* 액션 영역 */}
      {action && action}
    </div>
  );
}
