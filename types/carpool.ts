import { Database } from "@/types/database.types";
import { EventWithHost } from "@/types/event";

export type Carpool = Database["public"]["Tables"]["carpools"]["Row"];
export type CarpoolInsert = Database["public"]["Tables"]["carpools"]["Insert"];
export type CarpoolRequest =
  Database["public"]["Tables"]["carpool_requests"]["Row"];
export type CarpoolRequestInsert =
  Database["public"]["Tables"]["carpool_requests"]["Insert"];
export type CarpoolRequestStatus =
  Database["public"]["Enums"]["carpool_request_status"];

// 드라이버 프로필 포함 카풀
export type CarpoolWithDriver = Carpool & {
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
};

// 카풀 + 드라이버 + 승인된 탑승자 수
export type CarpoolWithDetails = CarpoolWithDriver & {
  approved_count: number;
  carpool_requests?: CarpoolRequestWithProfile[];
};

// 탑승자 프로필 포함 요청
export type CarpoolRequestWithProfile = CarpoolRequest & {
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
};

// 카풀 + 이벤트 정보 (내 카풀 요청 목록용)
export type CarpoolRequestWithCarpool = CarpoolRequest & {
  carpools: CarpoolWithDriver & {
    events: EventWithHost;
  };
};

// 내가 등록한 카풀 + 이벤트
export type CarpoolWithEvent = Carpool & {
  events: EventWithHost;
  approved_count: number;
};
