"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { adminUnfinalizeSettlement } from "@/actions/admin";
import { adminDeleteEvent } from "@/actions/events";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { formatCurrency } from "@/lib/utils";
import { EventWithHost } from "@/types/event";

// 카테고리 목록 상수
const CATEGORY_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "생일파티", label: "생일파티" },
  { value: "파티모임", label: "파티모임" },
  { value: "워크샵", label: "워크샵" },
  { value: "스터디", label: "스터디" },
  { value: "운동스포츠", label: "운동스포츠" },
  { value: "기타", label: "기타" },
];

// 컴포넌트 Props 타입 정의
interface EventsTableProps {
  events: EventWithHost[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentCategory: string;
  currentSearch: string;
}

// 이벤트 일시를 한국어 형식으로 포맷
function formatEventDate(dateString: string): string {
  return new Date(dateString).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 참여 인원 표시 텍스트 생성
function formatParticipants(current: number, max: number | null): string {
  if (max === null) {
    return `${current}명 / 제한 없음`;
  }
  return `${current} / ${max}`;
}

export function EventsTable({
  events,
  totalCount,
  currentPage,
  totalPages,
  currentCategory,
  currentSearch,
}: EventsTableProps) {
  const router = useRouter();

  // 검색 입력값 상태 (현재 URL searchParam으로 초기화)
  const [searchValue, setSearchValue] = useState(currentSearch);

  // 삭제 대상 이벤트 ID (null이면 AlertDialog 닫힘)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  // 삭제 요청 로딩 상태
  const [isDeleting, setIsDeleting] = useState(false);
  // 정산 확정 해제 대상 이벤트 ID
  const [unfinalizeTargetId, setUnfinalizeTargetId] = useState<string | null>(
    null,
  );
  // 정산 확정 해제 로딩 상태
  const [isUnfinalizing, setIsUnfinalizing] = useState(false);

  // 디바운스 300ms: 검색어 변경 시 URL 업데이트 + page=1 리셋
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(
        `?search=${encodeURIComponent(searchValue)}&category=${currentCategory}&page=1`,
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, currentCategory, router]);

  // 카테고리 필터 변경: page=1로 리셋하여 URL 업데이트
  const handleCategoryChange = (category: string) => {
    router.push(
      `?search=${encodeURIComponent(searchValue)}&category=${category}&page=1`,
    );
  };

  // 이전 페이지로 이동
  const handlePrevPage = () => {
    router.push(
      `?search=${encodeURIComponent(searchValue)}&category=${currentCategory}&page=${currentPage - 1}`,
    );
  };

  // 다음 페이지로 이동
  const handleNextPage = () => {
    router.push(
      `?search=${encodeURIComponent(searchValue)}&category=${currentCategory}&page=${currentPage + 1}`,
    );
  };

  // 정산 확정 해제 확인
  const handleUnfinalizeConfirm = async () => {
    if (!unfinalizeTargetId) return;
    setIsUnfinalizing(true);
    try {
      const result = await adminUnfinalizeSettlement(unfinalizeTargetId);
      if (result.success) {
        toast.success("정산 확정이 해제되었습니다.");
        setUnfinalizeTargetId(null);
      } else {
        toast.error(result.error ?? "정산 확정 해제에 실패했습니다.");
      }
    } finally {
      setIsUnfinalizing(false);
    }
  };

  // 삭제 확인: adminDeleteEvent Server Action 호출 후 결과 처리
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    try {
      const result = await adminDeleteEvent(deleteTargetId);
      if (result.success) {
        toast.success("이벤트가 삭제되었습니다.");
        setDeleteTargetId(null);
      } else {
        toast.error(result.error ?? "이벤트 삭제에 실패했습니다.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더: 총 이벤트 수 + 검색창 + 카테고리 필터 */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          총 <span className="text-foreground font-medium">{totalCount}개</span>{" "}
          이벤트
        </p>

        <div className="flex items-center gap-2">
          {/* 이벤트명/주최자 검색 입력창 */}
          <Input
            type="text"
            placeholder="이벤트명 또는 주최자 검색"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-[240px]"
          />

          {/* 카테고리 필터 Select */}
          <Select value={currentCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 이벤트 테이블 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이벤트명</TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead>주최자</TableHead>
            <TableHead>일시</TableHead>
            <TableHead>참여 인원</TableHead>
            <TableHead>공개 여부</TableHead>
            <TableHead>정산 총액</TableHead>
            <TableHead>액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            // 이벤트가 없을 때 빈 상태 표시
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-muted-foreground py-10 text-center"
              >
                {currentSearch
                  ? "검색 결과가 없습니다."
                  : "등록된 이벤트가 없습니다."}
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <TableRow key={event.id}>
                {/* 이벤트명: 상세 페이지 링크 */}
                <TableCell>
                  <Link
                    href={`/events/${event.id}`}
                    className="font-medium hover:underline"
                  >
                    {event.title}
                  </Link>
                </TableCell>

                {/* 카테고리 */}
                <TableCell>{event.category}</TableCell>

                {/* 주최자 이름 */}
                <TableCell>{event.host.name ?? "-"}</TableCell>

                {/* 이벤트 일시 */}
                <TableCell className="whitespace-nowrap">
                  {formatEventDate(event.event_date)}
                </TableCell>

                {/* 참여 인원 */}
                <TableCell>
                  {formatParticipants(
                    event.current_participants_count,
                    event.max_participants,
                  )}
                </TableCell>

                {/* 공개 여부 뱃지 */}
                <TableCell>
                  <Badge variant={event.is_public ? "default" : "secondary"}>
                    {event.is_public ? "공개" : "비공개"}
                  </Badge>
                </TableCell>

                {/* 정산 총액 + 확정 상태 뱃지 */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm tabular-nums">
                      {event.settlement_total_amount > 0
                        ? formatCurrency(event.settlement_total_amount)
                        : "-"}
                    </span>
                    {event.is_settlement_finalized && (
                      <Badge
                        variant="outline"
                        className="border-emerald-300 text-xs text-emerald-600"
                      >
                        확정
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* 액션: 확정 해제 + 삭제 버튼 */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {event.is_settlement_finalized && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUnfinalizeTargetId(event.id)}
                      >
                        확정 해제
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTargetId(event.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* 페이지네이션: totalPages가 1 이하면 미표시 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {/* 이전 페이지 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            이전
          </Button>

          {/* 현재 페이지 / 전체 페이지 */}
          <span className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">{currentPage}</span> /{" "}
            {totalPages} 페이지
          </span>

          {/* 다음 페이지 버튼 */}
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

      {/* 정산 확정 해제 확인 AlertDialog */}
      <AlertDialog
        open={unfinalizeTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setUnfinalizeTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정산 확정을 해제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              확정 해제 후 이벤트 멤버들이 정산 항목을 다시 수정할 수 있게
              됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnfinalizing}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnfinalizeConfirm}
              disabled={isUnfinalizing}
            >
              {isUnfinalizing ? "처리 중..." : "확정 해제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 이벤트 삭제 확인 AlertDialog */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          // 다이얼로그가 닫힐 때 삭제 대상 초기화
          if (!open) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 이벤트와 관련된 모든 데이터가
              삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* 취소 버튼 */}
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>

            {/* 삭제 확인 버튼 */}
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
