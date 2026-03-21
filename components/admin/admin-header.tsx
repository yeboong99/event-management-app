import { redirect } from "next/navigation";

import { AdminHeaderProfile } from "@/components/admin/admin-header-profile";
import { createClient } from "@/lib/supabase/server";

/**
 * 관리자 헤더 컴포넌트 (Server Component)
 * - 현재 로그인한 사용자의 프로필 정보를 서버에서 조회
 * - 인터랙티브한 드롭다운 UI는 AdminHeaderProfile(Client Component)에 위임
 */
export async function AdminHeader() {
  const supabase = await createClient();

  // 현재 인증된 사용자 조회 (getUser()로 서버에서 신뢰할 수 있는 검증)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user) {
    redirect("/auth/login");
  }

  // profiles 테이블에서 사용자 프로필 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, avatar_url")
    .eq("id", user.id)
    .single();

  // 이름 또는 이메일 첫 글자를 이니셜로 사용
  const displayName = profile?.name ?? profile?.email ?? user.email ?? "";
  const displayEmail = profile?.email ?? user.email ?? "";
  const avatarUrl = profile?.avatar_url ?? null;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="border-border bg-background flex h-16 w-full items-center border-b px-6">
      {/* 좌측 빈 공간 — 사이드바와 높이를 맞추는 레이아웃 역할 */}
      <div className="flex-1" />

      {/* 우측 프로필 드롭다운 — 인터랙션이 필요하므로 Client Component로 분리 */}
      <AdminHeaderProfile
        name={displayName}
        email={displayEmail}
        avatarUrl={avatarUrl}
        initials={initials}
      />
    </header>
  );
}
