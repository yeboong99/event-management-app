import { HostBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { MobileHeader } from "@/components/mobile/mobile-header";

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/50 flex min-h-screen justify-center">
      <div className="bg-background flex h-screen w-full max-w-[430px] flex-col shadow-lg">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <HostBottomNav />
      </div>
    </div>
  );
}
