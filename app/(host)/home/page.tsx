import { redirect } from "next/navigation";

// (host)/home 경로는 (app)/my-events?tab=hosting으로 통합됩니다.
// UnifiedBottomNav의 "내 활동" 탭에서 주최 중 이벤트를 확인할 수 있습니다.
export default function HostHomePage() {
  redirect("/discover");
}
