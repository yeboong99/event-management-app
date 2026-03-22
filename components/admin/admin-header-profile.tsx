"use client";

import { DarkModeToggle } from "@/components/admin/dark-mode-toggle";
import { LogoutButton } from "@/components/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 프로필 드롭다운에 필요한 props 타입 정의
interface AdminHeaderProfileProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
}

/**
 * 관리자 헤더 프로필 드롭다운 컴포넌트 (Client Component)
 * - Avatar 클릭 시 드롭다운 메뉴 표시
 * - 사용자 정보(이름, 이메일) 및 로그아웃 버튼 포함
 * - 데이터는 Server Component(AdminHeader)에서 props로 전달받음
 */
export function AdminHeaderProfile({
  name,
  email,
  avatarUrl,
  initials,
}: AdminHeaderProfileProps) {
  return (
    <div className="flex items-center gap-3">
      {/* 다크모드 토글 스위치 — 프로필 아바타 왼쪽 배치 */}
      <DarkModeToggle />

      <DropdownMenu>
        {/* Avatar를 드롭다운 트리거로 사용 */}
        <DropdownMenuTrigger asChild>
          <button
            className="ring-offset-background focus-visible:ring-ring cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="프로필 메뉴 열기"
          >
            <Avatar>
              {/* 아바타 이미지: avatar_url이 있을 때만 표시 */}
              {avatarUrl && (
                <AvatarImage src={avatarUrl} alt={`${name} 프로필 이미지`} />
              )}
              {/* 이미지가 없거나 로드 실패 시 이니셜 표시 */}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {/* 사용자 정보 영역 */}
          <div className="px-2 py-1.5">
            <p className="text-foreground text-sm font-semibold">{name}</p>
            <p className="text-muted-foreground truncate text-xs">{email}</p>
          </div>

          <DropdownMenuSeparator />

          {/* 로그아웃 버튼 — 기존 LogoutButton 컴포넌트 재사용 */}
          <DropdownMenuItem asChild>
            <LogoutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
