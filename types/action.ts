// Server Action 공통 반환 타입
export type ActionResult<T = undefined> = {
  success: boolean;
  error?: string;
  data?: T;
};
