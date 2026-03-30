import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthProvider } from "@/actions/profile";
import { ChangePasswordForm } from "@/components/forms/change-password-form";

export const metadata: Metadata = {
  title: "비밀번호 변경",
};

export default async function ChangePasswordPage() {
  // OAuth 계정은 비밀번호 변경 불가 → 프로필 페이지로 리다이렉트
  const provider = await getAuthProvider();

  if (provider !== "email") {
    redirect("/profile");
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">비밀번호 변경</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        새 비밀번호를 설정하세요
      </p>
      <ChangePasswordForm />
    </div>
  );
}
