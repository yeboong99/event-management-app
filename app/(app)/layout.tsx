import { MobileHeader } from "@/components/mobile/mobile-header";
import { UnifiedBottomNav } from "@/components/mobile/unified-bottom-nav";

// 호스트와 참가자 라우트 그룹을 통합한 공통 레이아웃
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 flex min-h-screen justify-center">
      {/* 모바일 최대 너비 컨테이너 */}
      <div className="bg-background flex h-screen w-full max-w-[430px] flex-col shadow-lg">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <UnifiedBottomNav />
      </div>
    </div>
  );
}
