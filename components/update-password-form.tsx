"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// 비밀번호 정책: 8자 이상, 영문 대/소문자·숫자·특수문자 중 2가지 이상 조합
const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .refine((val) => {
    const types = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
    return types.filter((r) => r.test(val)).length >= 2;
  }, "영문 대/소문자, 숫자, 특수문자 중 2가지 이상을 포함해야 합니다.");

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // 비밀번호 정책 검증 (Supabase 호출 전)
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setError("비밀번호 형식이 만족되지 않습니다.");
      setIsLoading(false);
      return;
    }

    // 비밀번호 일치 여부 검증
    if (password !== repeatPassword) {
      setError("비밀번호가 일치하지 않습니다");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/auth/login");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">비밀번호 재설정</CardTitle>
          <CardDescription>새 비밀번호를 입력해 주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">새 비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="새 비밀번호"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {/* 비밀번호 형식 안내 */}
                <p className="text-muted-foreground text-sm">
                  8자 이상, 영문 대/소문자·숫자·특수문자 중 2가지 이상 조합
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">새 비밀번호 확인</Label>
                {/* 새 비밀번호 확인 입력란 + 일치 여부 아이콘 */}
                <div className="relative">
                  <Input
                    id="repeat-password"
                    type="password"
                    placeholder="새 비밀번호를 다시 입력해주세요"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className={cn(repeatPassword.length > 0 && "pr-10")}
                  />
                  {repeatPassword.length > 0 && (
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                      {password === repeatPassword ? (
                        <CheckCircle2
                          className="text-green-500"
                          size={18}
                          aria-label="비밀번호 일치"
                        />
                      ) : (
                        <XCircle
                          className="text-destructive"
                          size={18}
                          aria-label="비밀번호 불일치"
                        />
                      )}
                    </span>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "저장 중..." : "새 비밀번호 저장"}
              </Button>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
