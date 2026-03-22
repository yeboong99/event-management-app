import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EventForm } from "@/components/forms/event-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "이벤트 만들기",
};

export default async function HostEventNewPage() {
  // 인증 확인: 비인증 사용자는 로그인 페이지로 리다이렉트
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="mb-4">
        <h1 className="text-foreground text-2xl font-bold">새 이벤트 만들기</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          이벤트 정보를 입력하여 새로운 이벤트를 생성하세요.
        </p>
      </div>
      <EventForm mode="create" />
    </div>
  );
}
