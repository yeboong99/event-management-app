import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Edit, MapPin, Trash2, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { deleteEvent, getEventById } from "@/actions/events";
import { EventCategoryBadge } from "@/components/mobile/event-category-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CopyLinkButton } from "@/components/shared/copy-link-button";
import { ToastHandler } from "@/components/shared/toast-handler";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_ICONS,
} from "@/lib/constants/event-gradients";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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

  if (!event) return { title: "이벤트" };
  return { title: event.title };
}

export default async function EventDetailPage({ params }: PageProps) {
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

  // 날짜 포맷
  const eventDate = new Date(event.event_date);
  const formattedDate = format(eventDate, "yyyy년 M월 d일 (E) HH:mm", {
    locale: ko,
  });

  // 카테고리별 gradient 및 아이콘
  const gradientClass =
    CATEGORY_GRADIENTS[event.category] ?? CATEGORY_GRADIENTS["기타"];
  const CategoryIcon = CATEGORY_ICONS[event.category] ?? CATEGORY_ICONS["기타"];

  // 초대 링크 URL
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/events/${eventId}`;

  // 이벤트 삭제 서버 액션 (Server Component 내 인라인 정의)
  const handleDelete = async () => {
    "use server";
    await deleteEvent(eventId);
  };

  return (
    <div className="flex min-h-screen flex-col pb-24">
      {/* URL 쿼리 파라미터를 감지하여 생성/수정 성공 Toast를 표시 */}
      <Suspense fallback={null}>
        <ToastHandler />
      </Suspense>
      {/* 커버 이미지 */}
      <div
        className={cn(
          "relative h-48 w-full",
          event.cover_image_url
            ? "bg-muted"
            : `bg-gradient-to-br ${gradientClass}`,
        )}
      >
        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CategoryIcon className="h-16 w-16 text-white/60" />
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="flex-1 p-4">
        {/* 카테고리 + 제목 */}
        <div className="mb-4">
          <EventCategoryBadge category={event.category} />
          <h1 className="text-foreground mt-2 text-2xl font-bold">
            {event.title}
          </h1>
        </div>

        {/* 이벤트 정보 */}
        <div className="mb-6 flex flex-col gap-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 shrink-0" />
            {/* 긴 날짜 텍스트 오버플로우 방지 */}
            <span className="min-w-0 break-words">{formattedDate}</span>
          </div>
          {event.location && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0" />
              {/* 긴 장소명 오버플로우 방지 */}
              <span className="min-w-0 break-words">{event.location}</span>
            </div>
          )}
          {event.max_participants && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 shrink-0" />
              {/* 참여자 수 텍스트 오버플로우 방지 */}
              <span className="min-w-0 break-words">
                최대 {event.max_participants}명
              </span>
            </div>
          )}
          <div className="text-muted-foreground mt-1 text-xs">
            {event.is_public ? "공개 이벤트" : "비공개 이벤트"}
          </div>
        </div>

        {/* 설명 */}
        {event.description && (
          <div className="mb-6">
            <h2 className="text-foreground mb-2 text-lg font-semibold">설명</h2>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* 액션 버튼 — 3개 버튼을 균등 분할하여 320px 화면에서도 정렬감 있게 배치 */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          {/* CopyLinkButton은 className prop을 받지 않으므로 div로 너비 감싸기 */}
          <div className="contents">
            <CopyLinkButton url={inviteUrl} />
          </div>
          <Link href={`/events/${eventId}/edit`} className="w-full">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Edit className="h-4 w-4" />
              수정
            </Button>
          </Link>
          <ConfirmDialog
            title="이벤트 삭제"
            description="정말 이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
            confirmLabel="삭제"
            variant="destructive"
            onConfirm={handleDelete}
            trigger={
              <Button variant="destructive" size="sm" className="w-full gap-2">
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            }
          />
        </div>

        {/* 하위 탭 (Phase 2~4에서 실제 기능 구현 예정) */}
        <Tabs defaultValue="participants" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="participants" className="flex-1">
              참여자
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex-1">
              공지댓글
            </TabsTrigger>
            <TabsTrigger value="carpools" className="flex-1">
              카풀
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex-1">
              정산
            </TabsTrigger>
          </TabsList>
          <TabsContent value="participants" className="py-4">
            <p className="text-muted-foreground text-center text-sm">
              준비 중입니다
            </p>
          </TabsContent>
          <TabsContent value="announcements" className="py-4">
            <p className="text-muted-foreground text-center text-sm">
              준비 중입니다
            </p>
          </TabsContent>
          <TabsContent value="carpools" className="py-4">
            <p className="text-muted-foreground text-center text-sm">
              준비 중입니다
            </p>
          </TabsContent>
          <TabsContent value="expenses" className="py-4">
            <p className="text-muted-foreground text-center text-sm">
              준비 중입니다
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
