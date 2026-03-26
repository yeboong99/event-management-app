import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getEventByInviteToken } from "@/actions/events";
import { getParticipationStatus } from "@/actions/participations";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { EventJoinContent } from "./event-join-content";

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

type PageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ token?: string }>;
};

// ─────────────────────────────────────────────
// 메타데이터
// ─────────────────────────────────────────────

export const metadata: Metadata = {
  title: "이벤트 초대",
};

// ─────────────────────────────────────────────
// 에러 상태 컴포넌트 — 토큰 없음 또는 무효한 경우
// ─────────────────────────────────────────────

function InvalidInviteView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-16">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        {/* 자물쇠 아이콘 */}
        <Lock className="text-muted-foreground h-12 w-12" aria-hidden="true" />

        {/* 에러 제목 */}
        <h1 className="text-foreground text-xl font-bold">
          유효하지 않은 초대 링크입니다
        </h1>

        {/* 에러 설명 */}
        <p className="text-muted-foreground text-sm">
          이 초대 링크가 만료되었거나 올바르지 않습니다.
          <br />
          주최자에게 새 초대 링크를 요청해 주세요.
        </p>

        {/* 이벤트 목록으로 이동 버튼 */}
        <Button asChild variant="outline" className="mt-2 w-full">
          <Link href="/events">이벤트 목록으로 이동</Link>
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 비공개 이벤트 초대 랜딩 페이지 (Server Component)
// ─────────────────────────────────────────────

export default async function EventJoinPage({
  params,
  searchParams,
}: PageProps) {
  // params, searchParams는 반드시 await 필요 (Next.js 16 규칙)
  const { eventId } = await params;
  const { token } = await searchParams;

  // 토큰이 없으면 에러 상태 표시
  if (!token) {
    return <InvalidInviteView />;
  }

  // 초대 토큰으로 이벤트 기본 정보 조회 (SECURITY DEFINER RPC — RLS 우회)
  const event = await getEventByInviteToken(token);

  // 토큰 무효 또는 eventId 불일치
  if (!event || event.id !== eventId) {
    return <InvalidInviteView />;
  }

  // 공개 이벤트는 초대 링크가 필요 없으므로 상세 페이지로 리다이렉트
  if (event.is_public) {
    redirect(`/events/${eventId}`);
  }

  // 현재 인증 사용자 조회
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 주최자 본인은 상세 페이지로 리다이렉트
  if (user && event.host_id === user.id) {
    redirect(`/events/${eventId}`);
  }

  // 인증 사용자의 참여 상태 조회
  const participation = user
    ? await getParticipationStatus(eventId, user.id)
    : null;

  return (
    <EventJoinContent
      event={event}
      participation={participation}
      isAuthenticated={!!user}
      eventId={eventId}
      token={token}
    />
  );
}
