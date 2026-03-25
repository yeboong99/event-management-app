"use client";

import { useState } from "react";

import { loadMorePosts } from "@/actions/posts";
import { PostForm } from "@/components/forms/post-form";
import { PostItem } from "@/components/shared/post-item";
import { Button } from "@/components/ui/button";
import type { PostWithAuthor } from "@/types/post";

interface PostsSectionProps {
  initialPosts: PostWithAuthor[];
  initialHasMore: boolean;
  eventId: string;
  currentUserId: string;
  isHost: boolean;
}

/**
 * 게시물 목록 + 작성 폼을 통합 관리하는 클라이언트 컴포넌트
 * - 새 게시글 작성 시 새로고침 없이 목록 즉시 반영
 * - notice 먼저, 동일 type 내 최신순 정렬 유지
 * - "더보기" 버튼으로 추가 게시물 로드
 */
export function PostsSection({
  initialPosts,
  initialHasMore,
  eventId,
  currentUserId,
  isHost,
}: PostsSectionProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(initialPosts.length);
  const [isLoading, setIsLoading] = useState(false);

  // 게시글 삭제 완료 시 목록에서 즉시 제거
  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setOffset((prev) => Math.max(0, prev - 1));
  };

  // 새 게시글 작성 완료 시 목록 최상단에 삽입 후 정렬
  const handlePostCreated = (newPost: PostWithAuthor) => {
    const updated = [newPost, ...posts].sort((a, b) => {
      // notice 타입을 항상 앞에 배치
      if (a.type !== b.type) return a.type === "notice" ? -1 : 1;
      // 동일 타입 내에서는 최신순 정렬
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      );
    });
    setPosts(updated);
  };

  // 더보기 버튼 클릭 시 Server Action으로 추가 게시물 로드
  const handleLoadMore = async () => {
    setIsLoading(true);
    const result = await loadMorePosts(eventId, offset);
    setPosts((prev) => [...prev, ...result.posts]);
    setHasMore(result.hasMore);
    setOffset((prev) => prev + result.posts.length);
    setIsLoading(false);
  };

  return (
    <div>
      {/* 게시물 목록 */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">아직 게시물이 없습니다.</p>
          {isHost && (
            <p className="text-muted-foreground text-sm">
              첫 번째 공지를 작성해보세요.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              eventId={eventId}
              currentUserId={currentUserId}
              isHost={isHost}
              onDelete={() => handlePostDeleted(post.id)}
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
      )}

      {/* 게시글 작성 폼 */}
      <div className="mt-6">
        <PostForm
          eventId={eventId}
          isHost={isHost}
          onPostCreated={handlePostCreated}
        />
      </div>
    </div>
  );
}
