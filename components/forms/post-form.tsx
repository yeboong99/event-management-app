"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createPost } from "@/actions/posts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type CreatePostInput, createPostSchema } from "@/lib/validations/post";
import type { PostWithAuthor } from "@/types/post";

interface PostFormProps {
  eventId: string;
  isHost: boolean;
  onPostCreated?: (post: PostWithAuthor) => void;
}

export function PostForm({ eventId, isHost, onPostCreated }: PostFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      eventId,
      type: "comment",
      content: "",
    },
  });

  const content = form.watch("content");

  const onSubmit = (data: CreatePostInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("eventId", data.eventId);
      formData.set("type", data.type);
      formData.set("content", data.content);

      const result = await createPost(formData);
      if (result.success) {
        toast.success(
          data.type === "notice"
            ? "공지를 등록했습니다."
            : "댓글을 작성했습니다.",
        );
        form.reset({ eventId, type: "comment", content: "" });
        onPostCreated?.(result.post);
      } else {
        toast.error(result.error ?? "작성 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {/* 주최자에게만 공지 등록 체크박스 표시 */}
        {isHost && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="is-notice"
              checked={form.watch("type") === "notice"}
              onCheckedChange={(checked) =>
                form.setValue("type", checked ? "notice" : "comment")
              }
            />
            <Label
              htmlFor="is-notice"
              className="cursor-pointer text-sm font-normal"
            >
              공지로 등록
            </Label>
          </div>
        )}

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="내용을 입력해주세요..."
                  rows={3}
                  maxLength={1000}
                />
              </FormControl>
              <div className="flex justify-between">
                <FormMessage />
                <span className="text-muted-foreground text-xs">
                  {content.length}/1000
                </span>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "등록 중..." : "등록"}
        </Button>
      </form>
    </Form>
  );
}
