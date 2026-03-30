"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { updateProfile } from "@/actions/profile";
import { LogoutButton } from "@/components/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { validateImageFile } from "@/lib/validations/image";
import { updateProfileSchema } from "@/lib/validations/profile";
import type { ProfileData, UpdateProfileInput } from "@/types/profile";

// 컴포넌트 Props 타입
type ProfileFormProps = {
  profile: ProfileData;
  authProvider: string; // "email" | "google" 등
};

// 이름에서 이니셜 추출 (아바타 폴백용)
function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// 날짜 포맷 유틸 (ISO 문자열 → "YYYY년 MM월 DD일")
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ProfileForm({ profile, authProvider }: ProfileFormProps) {
  // 아바타 미리보기 상태 (파일 선택 시 로컬 DataURL로 교체)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    profile.avatar_url ?? undefined,
  );

  // 아바타 제거 여부 (폼 제출 시 Server Action에 전달)
  const [removeAvatar, setRemoveAvatar] = useState(false);

  // 아바타 제거 버튼 노출 여부 (기존 URL 또는 새 미리보기가 있을 때)
  const showRemoveButton = previewUrl !== undefined;

  // 비동기 전환 상태 (폼 제출 중 로딩 표시용)
  const [isPending, startTransition] = useTransition();

  // 숨겨진 파일 input ref (아바타 변경 버튼 클릭 시 트리거)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Hook Form 연결
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateProfileSchema) as any,
    defaultValues: {
      name: profile.name ?? "",
      username: profile.username ?? undefined,
    },
  });

  // 아바타 파일 변경 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 클라이언트 사이드 파일 검증 (크기, MIME 타입)
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = "";
      return;
    }

    // FileReader로 미리보기 URL 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setRemoveAvatar(false);
  };

  // 아바타 제거 핸들러
  const handleRemoveAvatar = () => {
    setPreviewUrl(undefined);
    setRemoveAvatar(true);
    // 파일 input 초기화 (같은 파일 재선택 가능하도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 파일 input 트리거
  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 폼 제출 핸들러 — FormData를 구성하여 Server Action에 전달
  const onSubmit = (data: UpdateProfileInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.username) formData.append("username", data.username);

      // 새로 선택한 파일이 있으면 첨부
      const file = fileInputRef.current?.files?.[0];
      if (file) formData.append("avatar", file);

      // 아바타 제거 요청 플래그
      if (removeAvatar) formData.append("removeAvatar", "true");

      const result = await updateProfile(formData);
      if (result.success) {
        toast.success("프로필이 저장되었습니다.");
        setRemoveAvatar(false);
      } else {
        toast.error(result.error ?? "저장에 실패했습니다.");
      }
    });
  };

  // role 표시 라벨 (DB는 string | null이므로 방어 처리)
  const roleLabel = profile.role === "admin" ? "관리자" : "일반 사용자";

  return (
    <div className="space-y-6">
      {/* ── 아바타 섹션 ── */}
      <div className="flex items-center gap-4">
        {/* 아바타 이미지 (lg 크기: 64px) */}
        <Avatar className="h-16 w-16">
          <AvatarImage
            src={previewUrl}
            alt={`${profile.name ?? "사용자"}의 프로필 이미지`}
          />
          <AvatarFallback className="text-lg">
            {getInitials(profile.name)}
          </AvatarFallback>
        </Avatar>

        {/* 아바타 제어 버튼 영역 */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAvatarButtonClick}
          >
            변경
          </Button>
          {/* 기존 아바타가 있을 때만 제거 버튼 노출 */}
          {showRemoveButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleRemoveAvatar}
            >
              제거
            </Button>
          )}
        </div>

        {/* 숨겨진 파일 input (이미지만 허용) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          aria-label="프로필 이미지 파일 선택"
        />
      </div>

      {/* ── 프로필 정보 폼 ── */}
      <form
        onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}
        className="space-y-4"
      >
        {/* 이름 필드 */}
        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            placeholder="이름을 입력하세요"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-destructive text-sm">{errors.name.message}</p>
          )}
        </div>

        {/* 닉네임 필드 */}
        <div className="space-y-2">
          <Label htmlFor="username">닉네임 (선택)</Label>
          <Input
            id="username"
            placeholder="영문, 숫자, 언더스코어만 사용 가능"
            {...register("username")}
          />
          {errors.username && (
            <p className="text-destructive text-sm">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* 이메일 필드 (읽기 전용) */}
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            defaultValue={profile.email ?? ""}
            disabled
            aria-describedby="email-hint"
          />
          <p id="email-hint" className="text-muted-foreground text-xs">
            이메일은 변경할 수 없습니다.
          </p>
        </div>

        {/* 역할 필드 */}
        <div className="space-y-2">
          <Label>역할</Label>
          <div>
            <Badge variant="secondary">{roleLabel}</Badge>
          </div>
        </div>

        {/* 가입일 필드 */}
        <div className="space-y-2">
          <Label>가입일</Label>
          <p className="text-muted-foreground text-sm">
            {formatDate(profile.created_at)}
          </p>
        </div>

        {/* 저장 버튼 */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            "저장하기"
          )}
        </Button>
      </form>

      {/* ── 설정 메뉴 섹션 ── */}
      <Separator />
      <nav className="space-y-2" aria-label="계정 설정">
        {/* 비밀번호 변경: 이메일 로그인 사용자에게만 노출 */}
        {authProvider === "email" && (
          <Link
            href="/profile/change-password"
            className="text-foreground hover:text-foreground/80 block py-1 text-sm transition-colors"
          >
            비밀번호 변경
          </Link>
        )}

        {/* 회원 탈퇴 */}
        <Link
          href="/profile/delete-account"
          className="text-destructive hover:text-destructive/80 block py-1 text-sm transition-colors"
        >
          회원 탈퇴
        </Link>

        {/* 로그아웃 버튼 */}
        <div className="pt-1">
          <LogoutButton />
        </div>
      </nav>
    </div>
  );
}
