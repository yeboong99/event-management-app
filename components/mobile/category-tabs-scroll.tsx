"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { EVENT_CATEGORIES, type EventCategory } from "@/types/event";

interface CategoryTabsScrollProps {
  /** 현재 선택된 카테고리 (undefined이면 "all") */
  selectedCategory?: EventCategory | string;
}

export function CategoryTabsScroll({
  selectedCategory,
}: CategoryTabsScrollProps) {
  // 스크롤 컨테이너 참조
  const scrollRef = useRef<HTMLDivElement>(null);

  // 드래그 상태 관리
  const isDraggingRef = useRef(false); // 마우스가 눌린 상태인지
  const hasMoved = useRef(false); // 실제로 이동이 발생했는지 (클릭과 드래그 구분)
  const startXRef = useRef(0); // 드래그 시작 X 좌표
  const scrollLeftRef = useRef(0); // 드래그 시작 시점의 scrollLeft

  // 커서 스타일 상태 (cursor-grab / cursor-grabbing)
  const [isGrabbing, setIsGrabbing] = useState(false);

  // 그라디언트 표시 상태
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  // 스크롤 위치에 따라 그라디언트 상태 업데이트
  const updateGradients = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    // 왼쪽에 숨겨진 콘텐츠가 있으면 왼쪽 그라디언트 표시
    setShowLeftGradient(scrollLeft > 0);
    // 오른쪽에 숨겨진 콘텐츠가 있으면 오른쪽 그라디언트 표시 (1px 여유)
    setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // 마운트 시 초기 그라디언트 상태 계산
  useEffect(() => {
    updateGradients();
  }, [updateGradients]);

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    hasMoved.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    setIsGrabbing(true);
  };

  // 드래그 이동
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;

    // 텍스트 선택 방지
    e.preventDefault();

    const x = e.pageX - el.offsetLeft;
    const walk = x - startXRef.current;

    // 3px 이상 이동했을 때만 드래그로 간주
    if (Math.abs(walk) > 3) {
      hasMoved.current = true;
    }

    el.scrollLeft = scrollLeftRef.current - walk;
  };

  // 드래그 종료 (마우스 버튼 해제)
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsGrabbing(false);
  };

  // 드래그 종료 (컨테이너 밖으로 나갔을 때)
  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setIsGrabbing(false);
  };

  // 드래그 중 링크 클릭 이벤트 차단
  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    // 그라디언트를 절대 위치로 배치하기 위한 relative 래퍼
    <div className="relative">
      {/* 왼쪽 스크롤 힌트 그라디언트 */}
      <div
        className={cn(
          "from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r to-transparent",
          "transition-opacity duration-200",
          showLeftGradient ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />

      {/* 오른쪽 스크롤 힌트 그라디언트 */}
      <div
        className={cn(
          "from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l to-transparent",
          "transition-opacity duration-200",
          showRightGradient ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />

      {/* 드래그 스크롤 가능한 탭 컨테이너 */}
      <div
        ref={scrollRef}
        className={cn(
          // 가로 스크롤, 스크롤바 숨김
          "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // 드래그 커서 스타일
          isGrabbing ? "cursor-grabbing" : "cursor-grab",
          // 드래그 중 텍스트 선택 방지
          "select-none",
        )}
        onScroll={updateGradients}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClickCapture={handleClickCapture}
      >
        <Tabs defaultValue={selectedCategory || "all"} className="w-full">
          {/* TabsList 안에 Link + TabsTrigger를 함께 배치하면 Radix가 직계 자식을
              인식하지 못해 마지막 항목이 컨테이너 밖으로 밀리는 문제가 발생함.
              asChild 패턴을 사용해 TabsTrigger 자체가 Link 역할을 하도록 수정 */}
          <TabsList className="inline-flex h-auto w-max gap-1 p-1">
            <TabsTrigger value="all" asChild>
              <Link href="/discover">전체</Link>
            </TabsTrigger>
            {EVENT_CATEGORIES.map((category) => (
              <TabsTrigger key={category} value={category} asChild>
                <Link href={`/discover?category=${category}`}>{category}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
