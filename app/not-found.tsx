import { Calendar } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
};

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <Calendar className="text-muted-foreground/40 h-24 w-24" />
        </div>

        <h1 className="text-primary text-8xl font-bold">404</h1>

        <h2 className="text-foreground mt-4 text-2xl font-semibold">
          페이지를 찾을 수 없습니다
        </h2>

        <p className="text-muted-foreground mt-2">
          요청하신 페이지가 존재하지 않습니다
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          주소를 다시 확인해 주세요
        </p>

        <Link href="/">
          <Button className="mt-6" size="lg">
            홈으로 이동
          </Button>
        </Link>
      </div>
    </div>
  );
}
