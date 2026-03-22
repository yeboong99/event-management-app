import { type ClassValue, clsx } from "clsx";
import { addHours, format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * UTC ISO 문자열을 KST(UTC+9) 기준 datetime-local 포맷으로 변환 (표시용)
 * datetime-local 입력 필드에 바인딩할 때 사용합니다.
 */
export function utcToKstDatetimeLocal(utcIsoString: string): string {
  const utcDate = new Date(utcIsoString);
  const kstDate = addHours(utcDate, 9);
  return format(kstDate, "yyyy-MM-dd'T'HH:mm");
}

/**
 * KST datetime-local 포맷 문자열을 UTC ISO 문자열로 변환 (저장용)
 * datetime-local 입력 필드에서 받은 값을 DB에 저장하기 전에 사용합니다.
 */
export function kstDatetimeLocalToUtc(datetimeLocal: string): string {
  const kstDate = new Date(`${datetimeLocal}:00+09:00`);
  return kstDate.toISOString();
}
