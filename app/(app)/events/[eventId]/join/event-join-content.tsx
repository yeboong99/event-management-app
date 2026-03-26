"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Lock, MapPin, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { EventByInviteToken } from "@/actions/events";
import { ParticipationForm } from "@/components/forms/participation-form";
import { EventCategoryBadge } from "@/components/mobile/event-category-badge";
import { CancelParticipationButton } from "@/components/shared/cancel-participation-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_ICONS,
} from "@/lib/constants/event-gradients";
import { cn } from "@/lib/utils";
import type { Participation } from "@/types/participation";

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

type EventJoinContentProps = {
  /** 초대 토큰으로 조회된 이벤트 정보 */
  event: EventByInviteToken;
  /** 현재 사용자의 참여 정보 (비인증 또는 미신청 시 null) */
  participation: Participation | null;
  /** 인증 여부 */
  isAuthenticated: boolean;
  /** URL의 eventId (미인증 사용자 로그인 후 redirectTo URL 생성용) */
  eventId: string;
  /** 초대 토큰 (미인증 사용자 로그인 후 redirectTo URL 생성용) */
  token: string;
};

// ─────────────────────────────────────────────
// 이벤트 초대 랜딩 페이지 콘텐츠 컴포넌트
// — router.refresh() 호출이 필요하므로 Client Component로 구현
// ─────────────────────────────────────────────

export function EventJoinContent({
  event,
  participation,
  isAuthenticated,
  eventId,
  token,
}: EventJoinContentProps) {
  const router = useRouter();

  // 날짜 포맷 — 이벤트 상세 페이지와 동일한 포맷 사용
  const formattedDate = format(
    new Date(event.event_date),
    "yyyy년 M월 d일 (E) HH:mm",
    { locale: ko },
  );

  // 카테고리별 gradient 클래스 및 아이콘
  const gradientClass =
    CATEGORY_GRADIENTS[event.category] ?? CATEGORY_GRADIENTS["기타"];
  const CategoryIcon = CATEGORY_ICONS[event.category] ?? CATEGORY_ICONS["기타"];

  // 참여 신청 성공 후 페이지를 새로고침하여 상태 반영
  const handleParticipationSuccess = () => {
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col pb-24">
      {/* 커버 이미지 또는 카테고리별 그라디언트 배경 */}
      <div
        className={cn(
          "relative h-[300px] w-full",
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
            <CategoryIcon className="h-20 w-20 text-white/60" />
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="flex-1 px-5 pt-6">
        {/* 카테고리 배지 + 비공개 배지 */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <EventCategoryBadge category={event.category} />
          {/* 비공개 이벤트 배지 — 자물쇠 아이콘 포함 */}
          <Badge
            variant="outline"
            className="text-muted-foreground gap-1 text-xs"
          >
            <Lock className="h-3 w-3" aria-hidden="true" />
            비공개
          </Badge>
        </div>

        {/* 이벤트 제목 */}
        <h1 className="text-foreground mb-4 text-2xl font-bold">
          {event.title}
        </h1>

        {/* 이벤트 기본 정보 */}
        <div className="mb-6 flex flex-col gap-2">
          {/* 주최자 */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{event.host_name ?? "알 수 없음"}</span>
          </div>

          {/* 날짜 */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{formattedDate}</span>
          </div>

          {/* 장소 */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">
              {event.location ?? "장소 미정"}
            </span>
          </div>

          {/* 최대 인원 */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">
              {event.max_participants
                ? `최대 ${event.max_participants}명`
                : "제한 없음"}
            </span>
          </div>
        </div>

        {/* 이벤트 설명 */}
        {event.description && (
          <div className="mb-6">
            <h2 className="text-foreground mb-2 text-lg font-semibold">설명</h2>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* 구분선 */}
        <hr className="border-border mb-6" />

        {/* ─────────────────────────────────────────────
            하단 액션 영역 — 상태별 분기
            ───────────────────────────────────────────── */}

        {/* 상태 A — 미인증 사용자: 로그인 유도 */}
        {!isAuthenticated && (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-center text-sm">
              참여 신청하려면 로그인이 필요합니다.
            </p>
            <Button asChild className="w-full">
              <Link
                href={`/auth/login?redirectTo=${encodeURIComponent(`/events/${eventId}/join?token=${token}`)}`}
              >
                로그인하러 가기
              </Link>
            </Button>
          </div>
        )}

        {/* 상태 B — 인증 사용자, 미신청: 참여 신청 폼 표시 */}
        {isAuthenticated && !participation && (
          <ParticipationFormWrapper
            eventId={event.id}
            onSuccess={handleParticipationSuccess}
          />
        )}

        {/* 상태 C — pending: 승인 대기 중 메시지 */}
        {isAuthenticated && participation?.status === "pending" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">신청 대기중</Badge>
            </div>
            <p className="text-foreground text-sm font-medium">
              참여 신청을 완료했습니다. 주최자의 승인을 기다려 주세요.
            </p>
            <p className="text-muted-foreground text-sm">
              승인되면 이벤트 상세 페이지에서 전체 내용을 확인할 수 있습니다.
            </p>
            {/* 신청 취소 버튼 */}
            <CancelParticipationButton
              participationId={participation.id}
              eventId={event.id}
            />
          </div>
        )}

        {/* 상태 D — approved: 승인 완료 및 이벤트 페이지 이동 버튼 */}
        {isAuthenticated && participation?.status === "approved" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="default">참여 승인됨 ✓</Badge>
            </div>
            <p className="text-foreground text-sm font-medium">
              참여가 승인되었습니다!
            </p>
            <Button asChild className="w-full">
              <Link href={`/events/${event.id}`}>이벤트 페이지로 이동</Link>
            </Button>
          </div>
        )}

        {/* 상태 E — rejected: 거절 메시지 */}
        {isAuthenticated && participation?.status === "rejected" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">참여 거절됨</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              참여 신청이 거절되었습니다. 주최자에게 문의해 주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ParticipationForm 래퍼 컴포넌트
// — 신청 성공 시 onSuccess 콜백을 통해 부모에서 router.refresh() 호출
// ─────────────────────────────────────────────

type ParticipationFormWrapperProps = {
  eventId: string;
  onSuccess: () => void;
};

function ParticipationFormWrapper({
  eventId,
  onSuccess,
}: ParticipationFormWrapperProps) {
  return <ParticipationForm eventId={eventId} onSuccess={onSuccess} />;
}
