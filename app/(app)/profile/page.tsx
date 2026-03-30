import type { Metadata } from "next";

import { getAuthProvider, getProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/forms/profile-form";

export const metadata: Metadata = {
  title: "프로필",
};

export default async function ProfilePage() {
  // 병렬 호출로 프로필 정보와 인증 공급자를 동시에 조회
  const [profileResult, authProvider] = await Promise.all([
    getProfile(),
    getAuthProvider(),
  ]);

  if (!profileResult.success || !profileResult.data) {
    return (
      <div className="px-4 py-6">
        <p className="text-muted-foreground text-sm">
          프로필을 불러올 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">프로필</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        내 프로필을 관리하세요
      </p>
      <ProfileForm profile={profileResult.data} authProvider={authProvider} />
    </div>
  );
}
