import { Calendar, Compass, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getMyEvents } from "@/actions/events";
import { EventCardMobile } from "@/components/mobile/event-card-mobile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EVENT_CATEGORIES, type EventWithHost } from "@/types/event";

export const metadata: Metadata = {
  title: "내 이벤트",
};

type PageProps = {
  // Next.js 16 패턴: searchParams는 Promise로 처리
  searchParams: Promise<{ tab?: string; category?: string }>;
};

export default async function MyEventsPage({ searchParams }: PageProps) {
  // searchParams await 처리 (Next.js 16 필수 패턴)
  const params = await searchParams;
  const activeTab = params.tab === "hosting" ? "hosting" : "participating";
  const selectedCategory = params.category;

  // hosting 탭일 때만 데이터 fetch (불필요한 DB 호출 방지)
  const hostingEvents =
    activeTab === "hosting" ? await getMyEvents(selectedCategory) : [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 페이지 제목 */}
      <h1 className="text-foreground text-2xl font-bold">내 활동</h1>

      {/* 참여 중 / 주최 중 세그먼트 탭 */}
      <div
        className="bg-muted flex rounded-lg p-1"
        role="tablist"
        aria-label="활동 유형 선택"
      >
        <Link
          href="/my-events"
          role="tab"
          aria-selected={activeTab === "participating"}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all",
            activeTab === "participating"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          참여 중
        </Link>
        <Link
          href="/my-events?tab=hosting"
          role="tab"
          aria-selected={activeTab === "hosting"}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all",
            activeTab === "hosting"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          주최 중
        </Link>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === "participating" ? (
        <ParticipatingView />
      ) : (
        <HostingView
          events={hostingEvents}
          selectedCategory={selectedCategory}
        />
      )}
    </div>
  );
}

// 참여 중 뷰 — placeholder UI (데이터 연결은 별도 작업)
function ParticipatingView() {
  return (
    <section aria-label="참여 중인 이벤트 목록">
      {/* 빈 상태 placeholder */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="text-muted-foreground/40 mb-4 h-16 w-16" />
        <h2 className="text-foreground text-lg font-semibold">
          참여 중인 이벤트가 없습니다
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          관심 있는 이벤트를 탐색하고 참여해보세요.
        </p>
        <Link href="/discover">
          <Button variant="outline" className="mt-4">
            <Compass className="mr-2 h-4 w-4" />
            이벤트 탐색하기
          </Button>
        </Link>
      </div>
    </section>
  );
}

type HostingViewProps = {
  events: EventWithHost[];
  selectedCategory?: string;
};

// 주최 중 뷰 — DB 데이터 연결 (카테고리 필터 지원)
function HostingView({ events, selectedCategory }: HostingViewProps) {
  return (
    <section aria-label="주최 중인 이벤트 목록">
      {/* 카테고리 필터 탭 — /my-events URL 기반 인라인 구현 */}
      <div
        className="mb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="카테고리 필터"
      >
        <div className="flex gap-2 pb-1">
          {/* 전체 탭 */}
          <Link
            href="/my-events?tab=hosting"
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            전체
          </Link>

          {/* 각 카테고리 탭 */}
          {EVENT_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/my-events?tab=hosting&category=${cat}`}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* 헤더 영역: 이벤트 수 + 만들기 버튼 */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          총 {events.length}개의 이벤트
        </p>
        <Link href="/events/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            만들기
          </Button>
        </Link>
      </div>

      {/* 이벤트 목록 또는 빈 상태 */}
      {events.length > 0 ? (
        /* 이벤트 카드 그리드 */
        <div className="grid grid-cols-2 gap-3">
          {events.map((event) => (
            <EventCardMobile
              key={event.id}
              event={event}
              href={`/events/${event.id}`}
            />
          ))}
        </div>
      ) : (
        /* 빈 상태 */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="text-muted-foreground/40 mb-4 h-16 w-16" />
          <h2 className="text-foreground text-lg font-semibold">
            아직 만든 이벤트가 없습니다
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            새로운 이벤트를 만들어보세요!
          </p>
          <Link href="/events/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              이벤트 만들기
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
