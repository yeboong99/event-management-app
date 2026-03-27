import { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// KPI 카드 컴포넌트 Props 인터페이스
interface KpiCardProps {
  // 카드 제목 (예: "총 이벤트 수")
  title: string;
  // 포맷팅된 수치 값 (예: "1,234" 또는 "72.5%")
  value: string;
  // 부연 설명 (예: "이번 달 +12개")
  description: string;
  // 카드 좌측 상단에 표시할 Lucide 아이콘
  icon: LucideIcon;
  // 아이콘 색상 커스터마이징 (기본값: text-muted-foreground)
  iconClassName?: string;
}

/**
 * 관리자 대시보드용 KPI(핵심 성과 지표) 카드 컴포넌트
 * - 제목, 수치, 설명, 아이콘을 표시하는 정보 카드
 * - Server Component (인터랙션 없음)
 */
export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}: KpiCardProps) {
  return (
    <Card>
      {/* 카드 헤더: 제목과 아이콘을 가로로 배치 */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <Icon
          className={cn("text-muted-foreground h-5 w-5", iconClassName)}
          aria-hidden="true"
        />
      </CardHeader>

      {/* 카드 본문: 수치와 설명 표시 */}
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}
