import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getMyCarpoolRequests, getMyCarpools } from "@/actions/carpools";
import { MyCarpoolRequestsView } from "@/components/shared/my-carpool-requests-view";
import { MyCarpoolsDriverView } from "@/components/shared/my-carpools-driver-view";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "내 카풀",
};

type PageProps = {
  // Next.js 16 패턴: searchParams는 Promise로 처리
  searchParams: Promise<{ tab?: string }>;
};

export default async function CarpoolsPage({ searchParams }: PageProps) {
  // searchParams await 처리 (Next.js 16 필수 패턴)
  const params = await searchParams;
  const activeTab = params.tab === "driver" ? "driver" : "requests";

  // 인증 사용자 조회
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 각 탭에 해당하는 데이터만 fetch (불필요한 DB 호출 방지)
  const requests =
    activeTab === "requests" ? await getMyCarpoolRequests(user.id) : [];
  const carpools = activeTab === "driver" ? await getMyCarpools(user.id) : [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 페이지 제목 */}
      <h1 className="text-foreground text-2xl font-bold">내 카풀</h1>

      {/* 탑승 신청 / 내가 등록한 카풀 세그먼트 탭 */}
      <div
        className="bg-muted flex rounded-lg p-1"
        role="tablist"
        aria-label="카풀 유형 선택"
      >
        <Link
          href="/carpools"
          role="tab"
          aria-selected={activeTab === "requests"}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all",
            activeTab === "requests"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          탑승 신청
        </Link>
        <Link
          href="/carpools?tab=driver"
          role="tab"
          aria-selected={activeTab === "driver"}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all",
            activeTab === "driver"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          내가 등록한 카풀
        </Link>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === "requests" ? (
        <MyCarpoolRequestsView requests={requests} />
      ) : (
        <MyCarpoolsDriverView carpools={carpools} />
      )}
    </div>
  );
}
