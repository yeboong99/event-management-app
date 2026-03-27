import { format } from "date-fns";
import { Calendar, Car, TrendingUp, Users } from "lucide-react";

import { EventsChart } from "@/components/admin/events-chart";
import { KpiCard } from "@/components/admin/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

// AdminKpiStats 타입 정의
type AdminKpiStats = {
  total_events: number;
  new_events_this_month: number;
  total_users: number;
  new_users_this_month: number;
  avg_participation_rate: number; // 소수점 1자리 %
  carpool_match_rate: number; // 소수점 1자리 %
};

// 최근 가입자 타입 정의
type RecentUser = {
  name: string | null;
  email: string | null;
  created_at: string;
};

const DEFAULT_STATS: AdminKpiStats = {
  total_events: 0,
  new_events_this_month: 0,
  total_users: 0,
  new_users_this_month: 0,
  avg_participation_rate: 0,
  carpool_match_rate: 0,
};

// 이번 달 포함 최근 6개월 슬롯 생성
function getLast6MonthSlots(): { key: string; label: string }[] {
  const slots = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getMonth() + 1}월`;
    slots.push({ key, label });
  }
  return slots;
}

// 최근 6개월 월별 이벤트 생성 수 조회
async function fetchMonthlyEventCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ month: string; count: number }[]> {
  // 5개월 전 1일 00:00:00 계산
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("events")
    .select("created_at")
    .gte("created_at", sixMonthsAgo.toISOString())
    .not("created_at", "is", null);

  const slots = getLast6MonthSlots();
  const countMap: Record<string, number> = {};
  slots.forEach(({ key }) => {
    countMap[key] = 0;
  });

  (data ?? []).forEach(({ created_at }) => {
    if (!created_at) return;
    const key = created_at.slice(0, 7); // "YYYY-MM"
    if (key in countMap) countMap[key]++;
  });

  return slots.map(({ key, label }) => ({
    month: label,
    count: countMap[key],
  }));
}

// 최근 가입자 10명 조회
async function fetchRecentUsers(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<RecentUser[]> {
  const { data } = await supabase
    .from("profiles")
    .select("name, email, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

// 관리자 대시보드 페이지 — Server Component
export default async function AdminPage() {
  const supabase = await createClient();

  // KPI 통계, 월별 차트, 최근 가입자를 병렬로 조회
  const [{ data: kpiData, error: kpiError }, chartData, recentUsers] =
    await Promise.all([
      supabase.rpc("get_admin_kpi_stats"),
      fetchMonthlyEventCounts(supabase),
      fetchRecentUsers(supabase),
    ]);

  const stats: AdminKpiStats =
    kpiError || !kpiData ? DEFAULT_STATS : (kpiData as AdminKpiStats);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          이벤트 관리 시스템에 오신 것을 환영합니다.
        </p>
      </div>

      {/* KPI 카드 그리드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="총 이벤트"
          value={stats.total_events.toLocaleString("ko-KR")}
          description={`이번 달 +${stats.new_events_this_month}개`}
          icon={Calendar}
          iconClassName="text-blue-500"
        />
        <KpiCard
          title="총 사용자"
          value={stats.total_users.toLocaleString("ko-KR")}
          description={`이번 달 +${stats.new_users_this_month}명`}
          icon={Users}
          iconClassName="text-green-500"
        />
        <KpiCard
          title="평균 참여율"
          value={`${stats.avg_participation_rate}%`}
          description="정원 설정 이벤트 기준"
          icon={TrendingUp}
          iconClassName="text-orange-500"
        />
        <KpiCard
          title="카풀 매칭률"
          value={`${stats.carpool_match_rate}%`}
          description="승인된 탑승 / 전체 신청"
          icon={Car}
          iconClassName="text-purple-500"
        />
      </div>

      {/* 월별 이벤트 차트 */}
      <EventsChart data={chartData} />

      {/* 최근 가입자 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">최근 가입자</CardTitle>
          <p className="text-muted-foreground text-sm">
            최근 가입한 사용자 목록입니다.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th
                    scope="col"
                    className="text-muted-foreground pr-4 pb-2 text-left font-medium"
                  >
                    이름
                  </th>
                  <th
                    scope="col"
                    className="text-muted-foreground pr-4 pb-2 text-left font-medium"
                  >
                    이메일
                  </th>
                  <th
                    scope="col"
                    className="text-muted-foreground pb-2 text-left font-medium"
                  >
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-muted-foreground py-8 text-center"
                    >
                      가입자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((user, index) => (
                    <tr
                      key={index}
                      className="hover:bg-muted/50 border-b transition-colors last:border-0"
                    >
                      <td className="py-2 pr-4">
                        {user.name ?? (
                          <span className="text-muted-foreground italic">
                            이름 미설정
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground py-2 pr-4">
                        {user.email ?? "-"}
                      </td>
                      <td className="text-muted-foreground py-2 tabular-nums">
                        {format(new Date(user.created_at), "yyyy.MM.dd")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
