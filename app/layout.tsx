import "./globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "이벤트 매니저",
    template: "%s | 이벤트 매니저",
  },
  description:
    "일회성 이벤트를 쉽게 관리하고 참여자와 소통하세요. 공지, 카풀, 정산까지 한 번에 해결하는 이벤트 관리 플랫폼입니다.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {/* 전역 Toast 알림 컴포넌트 */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
