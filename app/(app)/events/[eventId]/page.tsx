import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Edit, MapPin, Trash2, UserRound, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { deleteEvent, getEventById } from "@/actions/events";
import {
  getParticipations,
  getParticipationStatus,
} from "@/actions/participations";
import { getPosts } from "@/actions/posts";
import { ParticipationForm } from "@/components/forms/participation-form";
import { EventCategoryBadge } from "@/components/mobile/event-category-badge";
import { AccessRestrictedNotice } from "@/components/shared/access-restricted-notice";
import { CancelParticipationButton } from "@/components/shared/cancel-participation-button";
import { CarpoolSection } from "@/components/shared/carpool-section";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CopyLinkButton } from "@/components/shared/copy-link-button";
import { ParticipantList } from "@/components/shared/participant-list";
import { PostsSection } from "@/components/shared/posts-section";
import { SettlementSection } from "@/components/shared/settlement-section";
import { ToastHandler } from "@/components/shared/toast-handler";
import { Badge } from "@/components/ui/badge";
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
  searchParams: Promise<{ status?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<{ status?: string }>;
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

export default async function EventDetailPage({
  params,
  searchParams,
}: PageProps) {
  // params, searchParams는 반드시 await 필요 (Next.js 16 규칙)
  const { eventId } = await params;
  const { status: statusFilter } = await searchParams;

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

  // 주최자 여부 확인
  const isHost = event.host_id === user.id;

  // 비주최자인 경우 참여 상태 조회
  const participation = !isHost
    ? await getParticipationStatus(eventId, user.id)
    : null;

  // 승인 여부 판단 (주최자는 항상 false, 비주최자는 approved 상태 확인)
  const isApproved = !isHost && participation?.status === "approved";

  // 주최자인 경우 참여자 데이터 fetch (필터 포함 + 전체 카운트용)
  const [participations, allParticipations] = isHost
    ? await Promise.all([
        getParticipations(eventId, statusFilter),
        getParticipations(eventId),
      ])
    : [[], []];

  // 승인된 참여자인 경우 승인된 참여자 목록만 fetch
  const approvedParticipations = isApproved
    ? await getParticipations(eventId, "approved")
    : [];

  // 콘텐츠 접근 가능 여부 (주최자 또는 승인된 참여자)
  const canAccessContent = isHost || isApproved;

  // 정산용 참여자 목록: 주최자 + 승인된 참여자 (추가 DB 조회 없이 기존 데이터 활용)
  const settlementParticipants = canAccessContent
    ? [
        { id: event.host_id, name: event.host.name },
        ...(isHost ? allParticipations : approvedParticipations)
          .filter((p) => p.status === "approved")
          .map((p) => ({ id: p.profiles.id, name: p.profiles.name })),
      ]
    : [];

  // 주최자 또는 승인된 참여자인 경우 게시물 데이터 fetch
  const { posts, hasMore: postsHasMore } = canAccessContent
    ? await getPosts(eventId, { limit: 5 })
    : { posts: [], hasMore: false };

  // 모든 로그인 사용자에게 탭 영역 항상 표시
  const defaultTab = "participants";

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // 비공개 이벤트: 초대 토큰 기반 join URL, 공개 이벤트: 일반 상세 URL
  const inviteUrl = event.is_public
    ? `${siteUrl}/events/${eventId}`
    : `${siteUrl}/events/${eventId}/join?token=${event.invite_token}`;

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
      <div className="flex-1 px-5 pt-6">
        {/* 카테고리 + 제목 */}
        <div className="mb-4">
          <EventCategoryBadge category={event.category} />
          <h1 className="text-foreground mt-2 text-2xl font-bold">
            {event.title}
          </h1>
        </div>

        {/* 이벤트 정보 */}
        <div className="mb-6 flex flex-col gap-2">
          {/* 주최자 */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <UserRound className="h-4 w-4 shrink-0" />
            <span>{event.host.name ?? "알 수 없음"}</span>
          </div>
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
                {event.current_participants_count}명 / 최대{" "}
                {event.max_participants}명
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

        {/* 참여 신청 영역 (비주최자만 표시) */}
        {!isHost && (
          <div className="mb-6">
            {!participation && <ParticipationForm eventId={eventId} />}
            {participation?.status === "pending" && (
              <div className="flex items-center gap-3">
                <Badge variant="secondary">신청 대기중</Badge>
                <CancelParticipationButton
                  participationId={participation.id}
                  eventId={eventId}
                />
              </div>
            )}
            {participation?.status === "approved" && (
              <Badge variant="default">참여 승인됨</Badge>
            )}
            {participation?.status === "rejected" && (
              <Badge variant="destructive">참여 거절됨</Badge>
            )}
          </div>
        )}

        {/* 액션 버튼 — 주최자만 표시 */}
        {isHost && (
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
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </Button>
              }
            />
          </div>
        )}

        {/* 하위 탭 — 모든 로그인 사용자에게 표시, 접근 권한에 따라 콘텐츠 제한 */}
        <div className="mt-6">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="participants">참여자</TabsTrigger>
              <TabsTrigger value="posts">게시판</TabsTrigger>
              <TabsTrigger value="carpool">카풀</TabsTrigger>
              <TabsTrigger value="settlement">정산</TabsTrigger>
            </TabsList>

            <TabsContent value="participants">
              {canAccessContent ? (
                <Suspense fallback={<div>로딩 중...</div>}>
                  <ParticipantList
                    participations={
                      isHost ? participations : approvedParticipations
                    }
                    eventId={eventId}
                    totalCount={
                      isHost
                        ? allParticipations.length
                        : approvedParticipations.length
                    }
                    isHost={isHost}
                  />
                </Suspense>
              ) : (
                <AccessRestrictedNotice />
              )}
            </TabsContent>

            <TabsContent value="posts">
              {canAccessContent ? (
                <PostsSection
                  initialPosts={posts}
                  initialHasMore={postsHasMore}
                  eventId={eventId}
                  currentUserId={user.id}
                  isHost={isHost}
                />
              ) : (
                <AccessRestrictedNotice />
              )}
            </TabsContent>

            <TabsContent value="carpool">
              <Suspense fallback={<div>로딩 중...</div>}>
                <CarpoolSection
                  eventId={eventId}
                  currentUserId={user.id}
                  isHost={isHost}
                  isApproved={isApproved}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="settlement">
              {canAccessContent ? (
                <Suspense fallback={<div>로딩 중...</div>}>
                  <SettlementSection
                    eventId={eventId}
                    currentUserId={user.id}
                    isHost={isHost}
                    isApproved={isApproved}
                    participants={settlementParticipants}
                  />
                </Suspense>
              ) : (
                <AccessRestrictedNotice />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
