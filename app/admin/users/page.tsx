import { Metadata } from "next";

import { UsersTable } from "@/components/admin/users-table";
import { createClient } from "@/lib/supabase/server";
import { UserWithEventCount } from "@/types/admin";

export const metadata: Metadata = {
  title: "사용자 관리 | Admin",
};

// 페이지당 표시할 사용자 수
const PAGE_SIZE = 15;

// 사용자 관리 페이지 — Server Component
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const supabase = await createClient();

  // searchParams에서 검색어와 페이지 번호 추출
  const { search = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  // 현재 로그인 사용자 ID 조회
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // 총 사용자 수 조회 (페이지네이션 계산용)
  let countQuery = supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  if (search) {
    countQuery = countQuery.or(
      `name.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }
  const { count: totalCount } = await countQuery;
  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / PAGE_SIZE));

  // profiles 페이지 단위 조회 — 검색 필터 + 가입일 내림차순
  let listQuery = supabase
    .from("profiles")
    .select("id, name, email, role, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (search) {
    listQuery = listQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  const { data: profiles, error: profilesError } = await listQuery;

  if (profilesError) {
    console.error("사용자 목록 조회 실패:", profilesError.message);
  }

  // 현재 페이지 사용자 ID 목록 (events/participations 조회 최적화)
  const userIds = (profiles ?? []).map((p) => p.id);

  // 해당 페이지 사용자의 이벤트 수만 조회 (N+1 방지)
  const { data: events, error: eventsError } =
    userIds.length > 0
      ? await supabase.from("events").select("host_id").in("host_id", userIds)
      : { data: [], error: null };

  if (eventsError) {
    console.error("이벤트 목록 조회 실패:", eventsError.message);
  }

  // 해당 페이지 사용자의 참여 수만 조회 (N+1 방지)
  const { data: participations, error: participationsError } =
    userIds.length > 0
      ? await supabase
          .from("participations")
          .select("user_id")
          .in("user_id", userIds)
      : { data: [], error: null };

  if (participationsError) {
    console.error("참여 목록 조회 실패:", participationsError.message);
  }

  // JS Map으로 userId → eventCount 집계
  const eventCountMap = new Map<string, number>();
  for (const event of events ?? []) {
    const prev = eventCountMap.get(event.host_id) ?? 0;
    eventCountMap.set(event.host_id, prev + 1);
  }

  // JS Map으로 userId → participationCount 집계
  const participationCountMap = new Map<string, number>();
  for (const participation of participations ?? []) {
    const prev = participationCountMap.get(participation.user_id) ?? 0;
    participationCountMap.set(participation.user_id, prev + 1);
  }

  // UserWithEventCount 배열로 조합
  const usersWithCount: UserWithEventCount[] = (profiles ?? []).map(
    (profile) => ({
      id: profile.id,
      name: profile.name,
      email: profile.email ?? "",
      role: profile.role,
      created_at: profile.created_at,
      eventCount: eventCountMap.get(profile.id) ?? 0,
      participationCount: participationCountMap.get(profile.id) ?? 0,
    }),
  );

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          사용자 계정과 권한을 관리합니다. 총{" "}
          <span className="text-foreground font-medium">{totalCount ?? 0}</span>
          명
        </p>
      </div>

      {/* 사용자 테이블 */}
      <UsersTable
        users={usersWithCount}
        currentUserId={currentUser?.id ?? ""}
        totalCount={totalCount ?? 0}
        currentPage={currentPage}
        totalPages={totalPages}
        currentSearch={search}
      />
    </div>
  );
}
