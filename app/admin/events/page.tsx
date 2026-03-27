import { EventsTable } from "@/components/admin/events-table";
import { createClient } from "@/lib/supabase/server";
import { EventCategory, EventWithHost } from "@/types/event";

// 페이지당 표시할 이벤트 수
const PAGE_SIZE = 15;

// 이벤트 관리 페이지 — Server Component
export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string; search?: string }>;
}) {
  // searchParams await — Next.js 16에서 Promise
  const { category = "all", page = "1", search = "" } = await searchParams;

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // 검색어가 있는 경우 주최자 이름으로 profiles 조회 → host_id 목록 추출
  let matchingHostIds: string[] = [];
  if (search) {
    const { data: matchingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .ilike("name", `%${search}%`);
    matchingHostIds = (matchingProfiles ?? []).map((p) => p.id);
  }

  // 검색 OR 조건 문자열 (이벤트 제목 | 주최자 ID)
  const searchOrFilter = search
    ? matchingHostIds.length > 0
      ? `title.ilike.%${search}%,host_id.in.(${matchingHostIds.join(",")})`
      : `title.ilike.%${search}%`
    : null;

  // 1단계: 전체 count 조회 (페이지네이션 총 페이지 수 계산용)
  let countQuery = supabase
    .from("events")
    .select("*", { count: "exact", head: true });

  // category 필터 적용 (all이 아닌 경우, EventCategory로 타입 단언)
  if (category !== "all") {
    countQuery = countQuery.eq("category", category as EventCategory);
  }
  if (searchOrFilter) {
    countQuery = countQuery.or(searchOrFilter);
  }

  const { count: totalCount } = await countQuery;

  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / PAGE_SIZE));

  // 2단계: 이벤트 목록 조회 (주최자 프로필 join, 페이지 범위 적용)
  let listQuery = supabase
    .from("events")
    .select("*, host:profiles!host_id(name, avatar_url)")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  // category 필터 적용 (all이 아닌 경우, EventCategory로 타입 단언)
  if (category !== "all") {
    listQuery = listQuery.eq("category", category as EventCategory);
  }
  if (searchOrFilter) {
    listQuery = listQuery.or(searchOrFilter);
  }

  const { data: eventsData, error } = await listQuery;

  // 에러 발생 시 빈 배열로 처리
  if (error) {
    console.error("이벤트 목록 조회 실패:", error.message);
  }

  // 3단계: 배치 RPC로 참여자 수 일괄 조회 (N+1 방지)
  const eventIds = (eventsData ?? []).map((e) => e.id);
  const { data: countsData } =
    eventIds.length > 0
      ? await supabase.rpc("get_events_participant_counts", {
          p_event_ids: eventIds,
        })
      : { data: [] };

  // 4단계: 참여자 수를 Map으로 변환
  const countMap = new Map(
    (countsData ?? []).map((c) => [c.event_id, c.participant_count]),
  );

  // 5단계: 정산 항목 총액 배치 조회 (N+1 방지)
  const { data: settlementData } =
    eventIds.length > 0
      ? await supabase
          .from("settlement_items")
          .select("event_id, amount")
          .in("event_id", eventIds)
      : { data: [] };

  // 이벤트별 정산 총액 Map 생성
  const settlementMap = new Map<string, number>();
  for (const row of settlementData ?? []) {
    settlementMap.set(
      row.event_id,
      (settlementMap.get(row.event_id) ?? 0) + row.amount,
    );
  }

  const events: EventWithHost[] = (eventsData ?? []).map((e) => ({
    ...e,
    current_participants_count: countMap.get(e.id) ?? 0,
    settlement_total_amount: settlementMap.get(e.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">이벤트 관리</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          이벤트를 생성하고 관리합니다.
        </p>
      </div>

      {/* 이벤트 테이블 */}
      <EventsTable
        events={events}
        totalCount={totalCount ?? 0}
        currentPage={currentPage}
        totalPages={totalPages}
        currentCategory={category}
        currentSearch={search}
      />
    </div>
  );
}
