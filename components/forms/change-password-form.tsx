"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { changePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordSchema } from "@/lib/validations/profile";

// changePasswordSchema에서 infer한 타입
type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const router = useRouter();

  // 비동기 전환 상태 (폼 제출 중 로딩 표시용)
  const [isPending, startTransition] = useTransition();

  // React Hook Form 연결
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(changePasswordSchema) as any,
  });

  // 폼 제출 핸들러 — FormData를 구성하여 Server Action에 전달
  const onSubmit = (data: ChangePasswordInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("currentPassword", data.currentPassword);
      formData.append("newPassword", data.newPassword);
      formData.append("confirmPassword", data.confirmPassword);

      const result = await changePassword(formData);

      if (result.success) {
        toast.success("비밀번호가 변경되었습니다.");
        router.push("/profile");
      } else {
        // 서버 에러를 루트 에러로 설정
        setError("root", { message: result.error });
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}
      className="space-y-4"
      aria-label="비밀번호 변경 폼"
    >
      {/* 현재 비밀번호 필드 */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">현재 비밀번호</Label>
        <Input
          id="currentPassword"
          type="password"
          placeholder="현재 비밀번호를 입력하세요"
          autoComplete="current-password"
          disabled={isPending}
          {...register("currentPassword")}
        />
        {/* 현재 비밀번호 에러 메시지 (에러가 있을 때만 표시) */}
        {errors.currentPassword && (
          <p
            className="text-destructive text-sm"
            role="alert"
            aria-live="polite"
          >
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      {/* 새 비밀번호 필드 */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">새 비밀번호</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="새 비밀번호를 입력하세요"
          autoComplete="new-password"
          disabled={isPending}
          {...register("newPassword")}
        />
        {/* 새 비밀번호 에러 메시지 (에러가 있을 때만 표시) */}
        {errors.newPassword && (
          <p
            className="text-destructive text-sm"
            role="alert"
            aria-live="polite"
          >
            {errors.newPassword.message}
          </p>
        )}
      </div>

      {/* 새 비밀번호 확인 필드 */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="새 비밀번호를 다시 입력하세요"
          autoComplete="new-password"
          disabled={isPending}
          {...register("confirmPassword")}
        />
        {/* 새 비밀번호 확인 에러 메시지 (에러가 있을 때만 표시) */}
        {errors.confirmPassword && (
          <p
            className="text-destructive text-sm"
            role="alert"
            aria-live="polite"
          >
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* 루트 에러 메시지 — 서버 응답 오류 표시 (에러가 있을 때만 표시) */}
      {errors.root && (
        <p className="text-destructive text-sm" role="alert" aria-live="polite">
          {errors.root.message}
        </p>
      )}

      {/* 액션 버튼 영역 */}
      <div className="space-y-2">
        {/* 비밀번호 변경 제출 버튼 */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              변경 중...
            </>
          ) : (
            "비밀번호 변경"
          )}
        </Button>

        {/* 취소 버튼 — 프로필 페이지로 복귀 */}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/profile">취소</Link>
        </Button>
      </div>
    </form>
  );
}
