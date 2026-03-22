import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getEventById } from "@/actions/events";
import { EventForm } from "@/components/forms/event-form";
import { createClient } from "@/lib/supabase/server";
import { utcToKstDatetimeLocal } from "@/lib/utils";

type PageProps = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("id", eventId)
    .single();

  if (!event) return { title: "이벤트 수정" };
  return { title: `${event.title} 수정` };
}

export default async function EventEditPage({ params }: PageProps) {
  // params는 반드시 await 필요 (Next.js 16 규칙)
  const { eventId } = await params;

  // 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 이벤트 조회
  const event = await getEventById(eventId);

  if (!event) {
    notFound();
  }

  // 권한 확인 (주최자만 접근 가능)
  if (event.host_id !== user.id) {
    redirect("/my-events");
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="mb-4">
        <h1 className="text-foreground text-2xl font-bold">이벤트 수정</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          이벤트 정보를 수정하세요.
        </p>
      </div>

      {/* EventForm에 기존 데이터를 defaultValues로 전달 */}
      <EventForm
        mode="edit"
        eventId={eventId}
        defaultValues={{
          title: event.title,
          description: event.description ?? undefined,
          category: event.category,
          // datetime-local 입력은 "YYYY-MM-DDTHH:MM" 형식이 필요하므로
          // DB의 UTC 타임스탬프를 KST(UTC+9)로 변환 후 전달
          eventDate: event.event_date
            ? utcToKstDatetimeLocal(event.event_date)
            : undefined,
          location: event.location ?? undefined,
          maxParticipants: event.max_participants ?? undefined,
          isPublic: event.is_public ?? true,
          coverImageUrl: event.cover_image_url ?? undefined,
        }}
      />
    </div>
  );
}
