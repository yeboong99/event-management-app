import { Lock } from "lucide-react";

// 비참여자가 참여자/게시판/카풀/정산 탭 접근 시 표시되는 안내 컴포넌트
export function AccessRestrictedNotice() {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <Lock className="text-muted-foreground/50 h-10 w-10" />
      <div className="text-center">
        <p className="text-muted-foreground text-sm font-medium">
          주최자 및 참여자 전용
        </p>
        <p className="text-muted-foreground/70 mt-1 text-xs">
          이 내용은 이벤트 주최자와 승인된 참여자만 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
