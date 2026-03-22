"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  className?: string;
  fallbackHref?: string;
  variant?: "default" | "ghost" | "overlay";
};

export function BackButton({
  className,
  fallbackHref = "/events",
  variant = "ghost",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  const buttonVariant = variant === "overlay" ? "ghost" : variant;
  const buttonClasses = cn(
    variant === "overlay" &&
      "absolute left-4 top-4 z-10 bg-black/40 text-white hover:bg-black/60 hover:text-white",
    className,
  );

  return (
    <Button
      onClick={handleBack}
      variant={buttonVariant}
      size="icon"
      className={buttonClasses}
      aria-label="뒤로가기"
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  );
}
