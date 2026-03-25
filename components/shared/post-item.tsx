"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updatePost } from "@/actions/posts";
import { PostActions } from "@/components/shared/post-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PostWithAuthor } from "@/types/post";

interface PostItemProps {
  post: PostWithAuthor;
  eventId: string;
  currentUserId: string;
  isHost: boolean;
  onDelete?: () => void;
}

// 개별 게시물 아이템 컴포넌트
// - 인라인 수정 모드 지원 (isEditing 상태)
// - 작성자 또는 주최자는 삭제 가능, 작성자만 수정 가능
export function PostItem({
  post,
  currentUserId,
  isHost,
  onDelete,
}: PostItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isPending, startTransition] = useTransition();

  // 현재 로그인한 사용자가 작성자인지 여부
  const isAuthor = post.author_id === currentUserId;

  // 수정 Server Action 호출 — FormData 방식으로 postId, content 전달
  const handleUpdate = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", post.id);
      formData.set("content", editContent);

      const result = await updatePost(formData);
      if (result.success) {
        toast.success("수정되었습니다.");
        setIsEditing(false);
      } else {
        toast.error(result.error ?? "수정 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <div className="space-y-2 rounded-lg border p-4">
      {/* 작성자 정보 및 액션 버튼 영역 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.profiles.avatar_url ?? undefined} />
            <AvatarFallback>
              {post.profiles.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="text-sm font-medium">
              {post.profiles.name ?? "이름 없음"}
            </span>
            <p className="text-muted-foreground text-xs">
              {post.created_at
                ? formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ko,
                  })
                : ""}
            </p>
          </div>
          {/* 공지 타입인 경우 눈에 띄는 빨간 계열 배지 표시 */}
          {post.type === "notice" && (
            <Badge variant="destructive" className="text-xs">
              공지
            </Badge>
          )}
        </div>
        {/* 작성자 또는 주최자에게만 액션 메뉴 노출 */}
        {(isAuthor || isHost) && (
          <PostActions
            post={post}
            onEdit={() => setIsEditing(true)}
            onDelete={onDelete}
            isAuthor={isAuthor}
          />
        )}
      </div>

      {/* 수정 모드: 텍스트에리어와 저장/취소 버튼 */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={1000}
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUpdate} disabled={isPending}>
              저장
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              취소
            </Button>
          </div>
        </div>
      ) : (
        /* 일반 모드: 게시물 내용 표시 */
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
      )}
    </div>
  );
}
