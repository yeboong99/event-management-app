import { Calendar, Compass, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getMyEvents } from "@/actions/events";
import { getMyParticipations } from "@/actions/participations";
import { CategoryTabsScroll } from "@/components/mobile/category-tabs-scroll";
import { EventCardMobile } from "@/components/mobile/event-card-mobile";
import { CancelParticipationButton } from "@/components/shared/cancel-participation-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type EventWithHost } from "@/types/event";
import { type ParticipationWithEvent } from "@/types/participation";

export const metadata: Metadata = {
  title: "내 이벤트",
};

type PageProps = {
  // Next.js 16 패턴: searchParams는 Promise로 처리
  searchParams: Promise<{ tab?: string; category?: string; status?: string }>;
};

export default async function MyEventsPage({ searchParams }: PageProps) {
  // searchParams await 처리 (Next.js 16 필수 패턴)
  const params = await searchParams;
  const activeTab = params.tab === "hosting" ? "hosting" : "participating";
  const selectedCategory = params.category;
  const selectedStatus = params.status;

  // 각 탭에 해당하는 데이터만 fetch (불필요한 DB 호출 방지)
  const hostingEvents =
    activeTab === "hosting" ? await getMyEvents(selectedCategory) : [];
  const participations =
    activeTab === "participating"
      ? await getMyParticipations(selectedStatus)
      : [];

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
        <ParticipatingView
          participations={participations}
          selectedStatus={selectedStatus}
        />
      ) : (
        <HostingView
          events={hostingEvents}
          selectedCategory={selectedCategory}
        />
      )}
    </div>
  );
}

// 참여 상태별 배지 variant 및 텍스트 매핑
const STATUS_BADGE_MAP = {
  pending: { variant: "secondary" as const, label: "대기중" },
  approved: { variant: "default" as const, label: "승인됨" },
  rejected: { variant: "destructive" as const, label: "거절됨" },
};

// 참여 상태 필터 탭 항목 정의
const STATUS_FILTERS = [
  { label: "전체", status: undefined },
  { label: "대기중", status: "pending" },
  { label: "승인", status: "approved" },
  { label: "거절", status: "rejected" },
];

type ParticipatingViewProps = {
  participations: ParticipationWithEvent[];
  selectedStatus?: string;
};

// 참여 중 뷰 — 실제 데이터 연결 (상태 필터 지원)
function ParticipatingView({
  participations,
  selectedStatus,
}: ParticipatingViewProps) {
  // 필터 상태별 빈 상태 메시지 매핑
  const EMPTY_STATE_MAP = {
    pending: {
      title: "대기 중인 신청이 없습니다",
      desc: "승인을 기다리는 참여 신청이 없습니다.",
    },
    approved: {
      title: "승인된 이벤트가 없습니다",
      desc: "아직 승인된 참여 신청이 없습니다.",
    },
    rejected: {
      title: "거절된 신청이 없습니다",
      desc: "거절된 참여 신청이 없습니다.",
    },
  };

  const emptyStateMessage = selectedStatus
    ? (EMPTY_STATE_MAP[selectedStatus as keyof typeof EMPTY_STATE_MAP] ?? {
        title: "아직 참여한 이벤트가 없습니다",
        desc: "관심 있는 이벤트를 탐색하고 참여해보세요.",
      })
    : {
        title: "아직 참여한 이벤트가 없습니다",
        desc: "관심 있는 이벤트를 탐색하고 참여해보세요.",
      };

  return (
    <section aria-label="참여 중인 이벤트 목록">
      {/* 상태 필터 탭 — HostingView의 카테고리 필터와 동일한 패턴 */}
      <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {STATUS_FILTERS.map(({ label, status }) => {
          const isActive = selectedStatus === status;
          const href = status
            ? `/my-events?tab=participating&status=${status}`
            : "/my-events";

          return (
            <Link key={label} href={href}>
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="shrink-0"
              >
                {label}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* 헤더: 참여 수 표시 */}
      <div className="mt-4 mb-4">
        <p className="text-muted-foreground text-sm">
          총 {participations.length}개의 참여
        </p>
      </div>

      {/* 참여 목록 또는 빈 상태 */}
      {participations.length > 0 ? (
        /* 참여 카드 그리드 */
        <div className="grid grid-cols-2 gap-3">
          {participations.map((participation) => (
            <div key={participation.id} className="flex flex-col gap-2">
              {/* 이벤트 카드 */}
              <EventCardMobile
                event={participation.events as EventWithHost}
                href={`/events/${participation.event_id}`}
              />
              {/* 참여 상태 배지 및 취소 버튼 */}
              <div className="flex items-center justify-between px-1">
                <Badge
                  variant={
                    STATUS_BADGE_MAP[
                      participation.status as keyof typeof STATUS_BADGE_MAP
                    ]?.variant ?? "secondary"
                  }
                >
                  {STATUS_BADGE_MAP[
                    participation.status as keyof typeof STATUS_BADGE_MAP
                  ]?.label ?? participation.status}
                </Badge>
                {/* pending 상태일 때만 취소 버튼 표시 */}
                {participation.status === "pending" && (
                  <CancelParticipationButton
                    participationId={participation.id}
                    eventId={participation.event_id}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 빈 상태 */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="text-muted-foreground/40 mb-4 h-16 w-16" />
          <h2 className="text-foreground text-lg font-semibold">
            {emptyStateMessage.title}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {emptyStateMessage.desc}
          </p>
          <Link href="/events">
            <Button variant="outline" className="mt-4">
              <Compass className="mr-2 h-4 w-4" />
              이벤트 탐색하기
            </Button>
          </Link>
        </div>
      )}
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
      {/* 카테고리 필터 탭 — 탐색 페이지와 동일한 UI */}
      <CategoryTabsScroll
        selectedCategory={selectedCategory}
        allHref="/my-events?tab=hosting"
        categoryHrefBase="/my-events?tab=hosting&category="
      />

      {/* 헤더 영역: 이벤트 수 + 만들기 버튼 */}
      <div className="mt-4 mb-4 flex items-center justify-between">
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
