import {
  getIsSettlementFinalized,
  getSettlementItems,
  getSettlementResult,
} from "@/actions/settlements";
import { AccessRestrictedNotice } from "@/components/shared/access-restricted-notice";
import { SettlementItemList } from "@/components/shared/settlement-item-list";
import { SettlementResult } from "@/components/shared/settlement-result";

interface SettlementSectionProps {
  eventId: string;
  currentUserId: string;
  isHost: boolean;
  isApproved: boolean;
  participants: { id: string; name: string | null }[];
}

// 이벤트 상세 페이지 정산 탭 — 데이터 페칭 후 하위 컴포넌트에 위임하는 Server Component
export async function SettlementSection({
  eventId,
  currentUserId,
  isHost,
  isApproved,
  participants,
}: SettlementSectionProps) {
  // 접근 제한: 주최자도 아니고 승인된 참여자도 아닌 경우 조기 반환
  if (!isHost && !isApproved) {
    return <AccessRestrictedNotice />;
  }

  // 정산 항목, 정산 결과, 확정 여부 병렬 조회
  const [items, result, isFinalized] = await Promise.all([
    getSettlementItems(eventId),
    getSettlementResult(eventId),
    getIsSettlementFinalized(eventId),
  ]);

  // 주최자 또는 승인된 참여자: 항목 추가 폼 + 목록 + 결과 모두 표시
  // (수정/삭제 버튼은 isHost 여부에 따라 SettlementItemList 내부에서 제어)
  return (
    <div className="space-y-6">
      <SettlementItemList
        items={items}
        isHost={isHost}
        isApproved={isApproved}
        currentUserId={currentUserId}
        eventId={eventId}
        participants={participants}
        isFinalized={isFinalized}
      />
      <SettlementResult
        result={result}
        currentUserId={currentUserId}
        isHost={isHost}
        isFinalized={isFinalized}
        eventId={eventId}
      />
    </div>
  );
}
