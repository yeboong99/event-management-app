"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createPostSchema, updatePostSchema } from "@/lib/validations/post";
import { ActionResult } from "@/types/action";
import type { PostWithAuthor } from "@/types/post";

// 이벤트 주최자 여부 확인
async function isEventHost(
  supabase: SupabaseClient,
  eventId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  return data?.host_id === userId;
}

// 승인된 참여자 여부 확인
async function isApprovedParticipant(
  supabase: SupabaseClient,
  eventId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("participations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "approved")
    .single();

  return !!data;
}

export async function createPost(
  formData: FormData,
): Promise<
  { success: false; error: string } | { success: true; post: PostWithAuthor }
> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // FormData 추출
  const rawData = {
    eventId: formData.get("eventId") as string,
    type: formData.get("type") as string,
    content: formData.get("content") as string,
  };

  // Zod 스키마 검증
  const validated = createPostSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const { eventId, type, content } = validated.data;

  const host = await isEventHost(supabase, eventId, user.id);

  // 공지는 주최자만 작성 가능
  if (type === "notice" && !host) {
    return { success: false, error: "공지는 주최자만 작성할 수 있습니다." };
  }

  // 댓글은 주최자 또는 승인된 참여자만 작성 가능
  if (type === "comment" && !host) {
    const approved = await isApprovedParticipant(supabase, eventId, user.id);
    if (!approved) {
      return {
        success: false,
        error: "승인된 참여자만 댓글을 작성할 수 있습니다.",
      };
    }
  }

  // 게시물 저장 후 profiles 조인하여 반환
  const { data: inserted, error: insertError } = await supabase
    .from("posts")
    .insert({
      event_id: eventId,
      author_id: user.id,
      type,
      content,
    })
    .select(`*, profiles(id, name, avatar_url)`)
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true, post: inserted as unknown as PostWithAuthor };
}

export async function updatePost(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const rawData = {
    postId: formData.get("postId") as string,
    content: formData.get("content") as string,
  };

  const validated = updatePostSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  // 본인 작성 게시물인지 확인
  const { data: post } = await supabase
    .from("posts")
    .select("author_id, event_id")
    .eq("id", validated.data.postId)
    .single();

  if (!post) return { success: false, error: "게시물을 찾을 수 없습니다." };
  if (post.author_id !== user.id)
    return { success: false, error: "권한이 없습니다." };

  const { error } = await supabase
    .from("posts")
    .update({ content: validated.data.content })
    .eq("id", validated.data.postId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/events/${post.event_id}`);
  return { success: true };
}

export async function deletePost(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const postId = formData.get("postId") as string;

  // 본인 작성 또는 주최자 권한 확인
  const { data: post } = await supabase
    .from("posts")
    .select("author_id, event_id")
    .eq("id", postId)
    .single();

  if (!post) return { success: false, error: "게시물을 찾을 수 없습니다." };

  const host = await isEventHost(supabase, post.event_id, user.id);

  if (post.author_id !== user.id && !host) {
    return { success: false, error: "권한이 없습니다." };
  }

  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/events/${post.event_id}`);
  return { success: true };
}

// 이벤트 게시물 목록 조회 (RLS: 승인된 참여자만 접근 가능)
// - type 기준 내림차순(notice > comment 알파벳순이므로 공지 먼저), 이후 created_at 내림차순
// - limit+1개 fetch 후 hasMore 판단, 실제 반환은 limit개
export async function getPosts(
  eventId: string,
  options?: { limit?: number; offset?: number },
): Promise<{ posts: PostWithAuthor[]; hasMore: boolean }> {
  const limit = options?.limit ?? 5;
  const offset = options?.offset ?? 0;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      `
        *,
        profiles (
          id,
          name,
          avatar_url
        )
      `,
    )
    .eq("event_id", eventId)
    .order("type", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) throw new Error(error.message);

  // limit+1개 fetch 후 더 있는지 확인
  const hasMore = data.length > limit;
  const posts = data.slice(0, limit);

  // database.types.ts에 posts-profiles 관계 미정의로 unknown 경유 캐스팅 필요
  return { posts: posts as unknown as PostWithAuthor[], hasMore };
}

// 클라이언트 "더보기" 버튼 클릭 시 호출되는 Server Action
export async function loadMorePosts(
  eventId: string,
  offset: number,
  limit: number = 5,
): Promise<{ posts: PostWithAuthor[]; hasMore: boolean }> {
  "use server";
  return getPosts(eventId, { limit, offset });
}
