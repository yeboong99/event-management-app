import { Database } from "@/types/database.types";

// DB 기본 타입
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];

// 작성자 프로필 정보가 포함된 조인 타입
// - type 필드를 string에서 리터럴 유니온으로 override
export type PostWithAuthor = Omit<Post, "type"> & {
  type: "notice" | "comment";
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
};
