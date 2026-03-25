"use client";

import { useState } from "react";

import { loadMorePosts } from "@/actions/posts";
import { PostItem } from "@/components/shared/post-item";
import { Button } from "@/components/ui/button";
import type { PostWithAuthor } from "@/types/post";

interface PostFeedPaginatedProps {
  initialPosts: PostWithAuthor[];
  initialHasMore: boolean;
  eventId: string;
  currentUserId: string;
  isHost: boolean;
}

/**
 * 페이지네이션이 적용된 게시물 피드 컴포넌트
 * - 초기 데이터는 Server Component에서 주입
 * - "더보기" 버튼 클릭 시 loadMorePosts Server Action 호출
 * - notice 타입은 PostItem에서 공지 배지로 표시
 */
export function PostFeedPaginated({
  initialPosts,
  initialHasMore,
  eventId,
  currentUserId,
  isHost,
}: PostFeedPaginatedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(initialPosts.length);
  const [isLoading, setIsLoading] = useState(false);

  // 더보기 버튼 클릭 시 Server Action 호출 후 목록에 추가
  const handleLoadMore = async () => {
    setIsLoading(true);
    const result = await loadMorePosts(eventId, offset);
    setPosts((prev) => [...prev, ...result.posts]);
    setHasMore(result.hasMore);
    setOffset((prev) => prev + result.posts.length);
    setIsLoading(false);
  };

  // 빈 상태 UI
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-muted-foreground">아직 게시물이 없습니다.</p>
        {isHost && (
          <p className="text-muted-foreground text-sm">
            첫 번째 공지를 작성해보세요.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          eventId={eventId}
          currentUserId={currentUserId}
          isHost={isHost}
        />
      ))}
      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLoadMore}
          disabled={isLoading}
        >
          {isLoading ? "로딩 중..." : "더보기"}
        </Button>
      )}
    </div>
  );
}
