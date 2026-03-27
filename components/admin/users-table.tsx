"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateUserRole } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { UserWithEventCount } from "@/types/admin";

// 컴포넌트 Props 타입 정의
interface UsersTableProps {
  users: UserWithEventCount[];
  currentUserId: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentSearch: string;
}

// 역할 레이블 매핑
const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  user: "일반 사용자",
};

// 가입일을 한국어 형식으로 포맷 (예: "2026년 3월 27일")
function formatCreatedAt(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 역할 값을 정규화 (null → "user" 기본값)
function normalizeRole(role: string | null): string {
  return role ?? "user";
}

// ─────────────────────────────────────────────
// 개별 사용자 행 컴포넌트 (Row별 독립 로딩 상태)
// ─────────────────────────────────────────────
interface UserRowProps {
  user: UserWithEventCount;
  currentUserId: string;
}

function UserRow({ user, currentUserId }: UserRowProps) {
  const [isPending, startTransition] = useTransition();

  const isCurrentUser = user.id === currentUserId;
  const role = normalizeRole(user.role);

  // Select 변경 시 Server Action 호출
  const handleRoleChange = (newRole: string) => {
    const formData = new FormData();
    formData.set("targetUserId", user.id);
    formData.set("newRole", newRole);

    startTransition(async () => {
      const result = await updateUserRole(formData);
      if (result.success) {
        toast.success("역할이 변경되었습니다.");
      } else {
        toast.error(result.error ?? "역할 변경 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <TableRow
      className={cn(
        // 현재 사용자 행 배경 강조
        isCurrentUser && "bg-muted/40",
      )}
    >
      {/* 이름: null이면 "이름 미설정" 텍스트 음소거 스타일 */}
      <TableCell>
        <div className="flex items-center gap-2">
          {user.name ? (
            <span className="font-medium">{user.name}</span>
          ) : (
            <span className="text-muted-foreground">이름 미설정</span>
          )}
          {/* 현재 사용자 뱃지 */}
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              나
            </Badge>
          )}
        </div>
      </TableCell>

      {/* 이메일 */}
      <TableCell className="text-muted-foreground">{user.email}</TableCell>

      {/* 역할: 현재 사용자면 Badge로 표시, 아니면 역할 변경 Select */}
      <TableCell>
        {isCurrentUser ? (
          // 본인 계정은 역할 변경 불가 — Badge로 표시
          <Badge variant={role === "admin" ? "default" : "secondary"}>
            {ROLE_LABELS[role] ?? role}
          </Badge>
        ) : (
          // 다른 사용자는 역할 변경 Select — 요청 중 disabled 처리
          <Select
            value={role}
            onValueChange={handleRoleChange}
            disabled={isPending}
          >
            <SelectTrigger
              className={cn("h-8 w-[140px]", isPending && "opacity-50")}
              aria-label={`${user.name ?? user.email} 역할 변경`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">일반 사용자</SelectItem>
              <SelectItem value="admin">관리자</SelectItem>
            </SelectContent>
          </Select>
        )}
      </TableCell>

      {/* 가입일 한국어 포맷 */}
      <TableCell className="text-muted-foreground whitespace-nowrap">
        {formatCreatedAt(user.created_at)}
      </TableCell>

      {/* 주최 이벤트 수 */}
      <TableCell>
        <span className="font-medium">{user.eventCount}</span>
        <span className="text-muted-foreground ml-1">개</span>
      </TableCell>

      {/* 참여 이벤트 수 */}
      <TableCell>
        <span className="font-medium">{user.participationCount}</span>
        <span className="text-muted-foreground ml-1">개</span>
      </TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────
// 사용자 테이블 컴포넌트
// ─────────────────────────────────────────────
export function UsersTable({
  users,
  currentUserId,
  totalCount,
  currentPage,
  totalPages,
  currentSearch,
}: UsersTableProps) {
  const router = useRouter();

  // 검색 입력값 상태 (현재 URL searchParam으로 초기화)
  const [searchValue, setSearchValue] = useState(currentSearch);

  // 디바운스 300ms: 검색어 변경 시 URL 업데이트 + page=1 리셋
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`?search=${encodeURIComponent(searchValue)}&page=1`);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, router]);

  // 이전 페이지로 이동
  const handlePrevPage = () => {
    router.push(
      `?search=${encodeURIComponent(searchValue)}&page=${currentPage - 1}`,
    );
  };

  // 다음 페이지로 이동
  const handleNextPage = () => {
    router.push(
      `?search=${encodeURIComponent(searchValue)}&page=${currentPage + 1}`,
    );
  };

  return (
    <div className="space-y-4">
      {/* 검색창 및 총 사용자 수 */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          총 <span className="text-foreground font-medium">{totalCount}명</span>
        </p>
        <Input
          type="text"
          placeholder="이름 또는 이메일로 검색"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-[240px]"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead>역할</TableHead>
            <TableHead>가입일</TableHead>
            <TableHead>주최 이벤트</TableHead>
            <TableHead>참여 이벤트</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            // 검색 결과 없음 또는 사용자 없음 빈 상태 표시
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-muted-foreground py-10 text-center"
              >
                {currentSearch
                  ? "검색 결과가 없습니다."
                  : "등록된 사용자가 없습니다."}
              </TableCell>
            </TableRow>
          ) : (
            // 각 행은 독립적인 isPending 상태를 가진 UserRow로 렌더링
            users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUserId}
              />
            ))
          )}
        </TableBody>
      </Table>

      {/* 페이지네이션: totalPages가 1 초과일 때만 표시 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            이전
          </Button>
          <span className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">{currentPage}</span> /{" "}
            {totalPages} 페이지
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
