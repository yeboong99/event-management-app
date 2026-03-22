import { Calendar } from "lucide-react";
import type { Metadata } from "next";

import { getPublicEvents } from "@/actions/events";
import { CategoryTabsScroll } from "@/components/mobile/category-tabs-scroll";
import { EventCardMobile } from "@/components/mobile/event-card-mobile";

export const metadata: Metadata = {
  title: "이벤트 탐색",
};

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function DiscoverPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedCategory = params.category;
  const events = await getPublicEvents(selectedCategory);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">탐색</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          참여할 수 있는 이벤트를 찾아보세요
        </p>
      </div>

      {/* 카테고리 세그먼트 탭 (드래그 스크롤 + 동적 페이드 힌트) */}
      <CategoryTabsScroll selectedCategory={selectedCategory} />

      {/* 이벤트 목록 */}
      {events.length > 0 ? (
        <>
          <div className="text-muted-foreground text-sm">
            {events.length}개의 이벤트
          </div>
          <div className="grid grid-cols-2 gap-3">
            {events.map((event) => (
              <EventCardMobile
                key={event.id}
                event={event}
                href={`/events/${event.id}`}
                showNewBadge
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="text-muted-foreground/40 mb-4 h-16 w-16" />
          <h3 className="text-foreground text-lg font-semibold">
            {selectedCategory
              ? `${selectedCategory} 이벤트가 없습니다`
              : "아직 공개된 이벤트가 없습니다"}
          </h3>
          <p className="text-muted-foreground mt-2 text-sm">
            나중에 다시 확인해보세요!
          </p>
        </div>
      )}
    </div>
  );
}
