import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// 관리자 레이아웃 — 데스크탑(1280px+) 뷰포트 최적화
// 사이드바 + 헤더 + 메인 콘텐츠 영역으로 구성
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background flex h-screen">
      {/* 좌측 고정 사이드바 */}
      <AdminSidebar />

      {/* 우측 콘텐츠 영역 (헤더 + 메인) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <AdminHeader />

        {/* 스크롤 가능한 메인 콘텐츠 영역 */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
