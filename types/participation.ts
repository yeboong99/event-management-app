import { Database } from "@/types/database.types";
import { EventWithHost } from "@/types/event";

// DB 기본 타입
export type Participation =
  Database["public"]["Tables"]["participations"]["Row"];
export type ParticipationInsert =
  Database["public"]["Tables"]["participations"]["Insert"];
export type ParticipationStatus =
  Database["public"]["Enums"]["participation_status"];

// 참여자 프로필 정보가 포함된 조인 타입
export type ParticipationWithProfile = Participation & {
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
};

// 이벤트 정보가 포함된 조인 타입 (내 참여 목록 조회용)
export type ParticipationWithEvent = Participation & {
  events: EventWithHost;
};
