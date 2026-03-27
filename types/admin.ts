// Admin 전용 타입 정의

/** 사용자 정보 + 주최한 이벤트 수 및 참여한 이벤트 수를 포함한 타입 */
export type UserWithEventCount = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  created_at: string;
  eventCount: number;
  participationCount: number;
};
