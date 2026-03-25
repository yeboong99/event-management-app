import {
  getCarpoolRequests,
  getCarpoolsByEventId,
  getMyCarpoolRequests,
} from "@/actions/carpools";
import { AccessRestrictedNotice } from "@/components/shared/access-restricted-notice";
import { CarpoolTabs } from "@/components/shared/carpool-tabs";
import type {
  CarpoolRequestWithCarpool,
  CarpoolRequestWithProfile,
} from "@/types/carpool";

interface CarpoolSectionProps {
  eventId: string;
  currentUserId: string;
  isHost: boolean;
  isApproved: boolean;
}

// 이벤트 상세 페이지 카풀 탭 — 데이터 페칭 후 CarpoolTabs에 위임하는 Server Component
export async function CarpoolSection({
  eventId,
  currentUserId,
  isHost,
  isApproved,
}: CarpoolSectionProps) {
  // 접근 제한: 주최자도 아니고 승인된 참여자도 아닌 경우 조기 반환
  if (!isHost && !isApproved) {
    return <AccessRestrictedNotice />;
  }

  // Level 1: 카풀 목록 + 내 신청 목록 병렬 조회
  const [carpools, allMyRequests] = await Promise.all([
    getCarpoolsByEventId(eventId),
    isApproved
      ? getMyCarpoolRequests(currentUserId)
      : Promise.resolve([] as CarpoolRequestWithCarpool[]),
  ]);

  // Level 2: 드라이버 또는 주최자 카풀에 대해서만 탑승 신청 목록 병렬 조회
  const requestsMap = new Map<string, CarpoolRequestWithProfile[]>();
  await Promise.all(
    carpools
      .filter((c) => c.driver_id === currentUserId || isHost)
      .map(async (c) => {
        const requests = await getCarpoolRequests(c.id);
        requestsMap.set(c.id, requests);
      }),
  );

  // 이 이벤트에 속한 내 카풀 신청만 필터링 (메모리 내 필터)
  const carpoolIdSet = new Set(carpools.map((c) => c.id));
  const myRequestsForEvent = allMyRequests.filter((r) =>
    carpoolIdSet.has(r.carpool_id),
  );

  // 본인 카풀(드라이버)을 앞으로, 나머지는 뒤로 정렬
  const sortedCarpools = [
    ...carpools.filter((c) => c.driver_id === currentUserId),
    ...carpools.filter((c) => c.driver_id !== currentUserId),
  ];

  // Map → plain object 변환 (Client Component props 직렬화)
  const requestsRecord = Object.fromEntries(requestsMap.entries());

  const canRegister = isHost || isApproved;

  return (
    <CarpoolTabs
      eventId={eventId}
      currentUserId={currentUserId}
      isHost={isHost}
      isApproved={isApproved}
      canRegister={canRegister}
      carpools={sortedCarpools}
      requestsRecord={requestsRecord}
      myRequestsForEvent={myRequestsForEvent}
    />
  );
}
