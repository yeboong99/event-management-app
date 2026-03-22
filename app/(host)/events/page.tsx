import { redirect } from "next/navigation";

// (host)/events 경로는 (app)/my-events?tab=hosting으로 통합됩니다.
// UnifiedBottomNav의 "내 활동" 탭 → "주최 중" 탭에서 확인하세요.
export default function HostEventsPage() {
  redirect("/my-events?tab=hosting");
}
