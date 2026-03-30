import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/types/database.types";

/**
 * Supabase Service Role 클라이언트 생성 (서버 사이드 전용)
 * RLS를 우회하는 관리자 권한을 가지므로 절대 클라이언트에 노출하지 않을 것
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
