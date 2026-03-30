import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getMyEvents } from "@/actions/events";
import { getProfile } from "@/actions/profile";
import { DeleteAccountForm } from "@/components/forms/delete-account-form";

export const metadata: Metadata = {
  title: "회원 탈퇴",
};

export default async function DeleteAccountPage() {
  // 인증 확인 — 비인증 사용자는 로그인 페이지로 리다이렉트
  const profileResult = await getProfile();
  if (!profileResult.success) {
    redirect("/auth/login");
  }

  // 현재 사용자가 주최하는 이벤트 조회 (id, title 만 추출)
  const myEvents = await getMyEvents();
  const hostedEvents = myEvents.map((event) => ({
    id: event.id,
    title: event.title,
  }));

  return (
    <div className="px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">회원 탈퇴</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        계정을 영구적으로 삭제합니다
      </p>
      <DeleteAccountForm hostedEvents={hostedEvents} />
    </div>
  );
}
