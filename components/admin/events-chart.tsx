"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 월별 이벤트 현황 데이터 타입
interface EventsChartProps {
  data: { month: string; count: number }[];
}

export function EventsChart({ data }: EventsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          월별 이벤트 생성 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 데이터가 없을 때 빈 상태 표시 */}
        {data.length === 0 ? (
          <p className={cn("text-muted-foreground py-16 text-center text-sm")}>
            데이터가 없습니다.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              {/* 격자 배경 — 수평선만 표시 */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />

              {/* X축 — 월 레이블 */}
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />

              {/* Y축 — 이벤트 수, 소수점 미표시 */}
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />

              {/* 툴팁 — 시맨틱 색상 변수 기반으로 다크모드 자동 지원 */}
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                itemStyle={{ color: "var(--primary)" }}
              />

              {/* 바 차트 — 상단 모서리 라운드 처리 */}
              <Bar
                dataKey="count"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
                name="이벤트 수"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
