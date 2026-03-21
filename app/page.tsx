import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  // Supabase 세션 데이터를 동적으로 조회하므로 캐시 비활성화
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인 사용자
  if (!user) {
    redirect("/auth/login");
  }

  // role 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // admin → /admin, 그 외 → /discover
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  redirect("/discover");
}
