"use client";

import { Loader2, MoreHorizontal } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deletePost } from "@/actions/posts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PostWithAuthor } from "@/types/post";

interface PostActionsProps {
  post: PostWithAuthor;
  onEdit: () => void;
  onDelete?: () => void;
  isAuthor: boolean;
}

// 게시물 수정/삭제 드롭다운 액션 컴포넌트
// - DropdownMenu와 Dialog 간 포커스 충돌 방지를 위해 제어된(controlled) Dialog 사용
export function PostActions({
  post,
  onEdit,
  onDelete,
  isAuthor,
}: PostActionsProps) {
  const [isPending, startTransition] = useTransition();
  // 삭제 확인 다이얼로그 열림 상태 — DropdownMenuItem 클릭 시 직접 제어
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 삭제 Server Action 호출 — 성공 시 onDelete 콜백으로 부모 상태 즉시 갱신
  const handleDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", post.id);

      const result = await deletePost(formData);
      if (result.success) {
        setShowDeleteDialog(false);
        toast.success("삭제되었습니다.");
        onDelete?.();
      } else {
        toast.error(result.error ?? "삭제 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* 본인 작성 게시물만 수정 가능 */}
          {isAuthor && (
            <DropdownMenuItem onClick={onEdit}>수정</DropdownMenuItem>
          )}
          {/* DropdownMenu 닫힘 후 Dialog 열기 — 포커스 충돌 방지 */}
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 삭제 확인 다이얼로그 — DropdownMenu 외부에 렌더링하여 포커스 트랩 충돌 방지 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시물 삭제</DialogTitle>
            <DialogDescription>
              정말 이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "삭제"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
