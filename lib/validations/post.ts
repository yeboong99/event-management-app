import { z } from "zod";

// 게시물(공지/댓글) 생성 스키마
export const createPostSchema = z.object({
  eventId: z.string().uuid("유효한 이벤트 ID가 아닙니다"),
  type: z.enum(["notice", "comment"], {
    error: () => ({ message: "공지 또는 댓글만 선택 가능합니다" }),
  }),
  content: z
    .string()
    .min(1, "내용을 입력해주세요")
    .max(1000, "1000자 이내로 입력해주세요"),
});

// 게시물 수정 스키마
export const updatePostSchema = z.object({
  postId: z.string().uuid("유효한 게시물 ID가 아닙니다"),
  content: z
    .string()
    .min(1, "내용을 입력해주세요")
    .max(1000, "1000자 이내로 입력해주세요"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
