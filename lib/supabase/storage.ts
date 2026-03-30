import { createClient } from "@/lib/supabase/server";

// 스토리지 버킷 이름
const BUCKET_NAME = "event-covers";
const AVATAR_BUCKET_NAME = "avatars";

// validateImageFile은 Client Component에서도 사용 가능하도록 별도 파일로 분리
export { validateImageFile } from "@/lib/validations/image";

/**
 * 이벤트 커버 이미지를 Supabase Storage에 업로드하고 공개 URL을 반환합니다.
 * 파일 경로: {userId}/{eventId}/{timestamp}_{sanitizedFileName}
 */
export async function uploadEventCoverImage(
  file: File,
  userId: string,
  eventId: string,
): Promise<string> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("이미지를 업로드하려면 로그인이 필요합니다.");
  }

  // 파일명 sanitize: 영문자, 숫자, 점, 하이픈 외 문자를 언더스코어로 치환
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();
  const filePath = `${userId}/${eventId}/${timestamp}_${sanitizedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false, // 중복 업로드 방지
    });

  if (uploadError) {
    throw new Error(`이미지 업로드에 실패했습니다: ${uploadError.message}`);
  }

  // 공개 URL 반환
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Supabase Storage에서 이벤트 커버 이미지를 삭제합니다.
 * @param filePath - 버킷 내 상대 경로 (예: userId/eventId/timestamp_filename.jpg)
 */
export async function deleteEventCoverImage(filePath: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    throw new Error(`이미지 삭제에 실패했습니다: ${error.message}`);
  }
}

/**
 * 파일 경로로 공개 URL을 생성합니다. (환경변수 기반, 동기 함수)
 * @param filePath - 버킷 내 상대 경로
 */
export function getEventCoverImageUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
}

/**
 * 아바타 이미지를 Supabase Storage에 업로드하고 공개 URL을 반환합니다.
 * 파일 경로: {userId}/{timestamp}_{sanitizedFileName}
 */
export async function uploadAvatarImage(
  file: File,
  userId: string,
): Promise<string> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("이미지를 업로드하려면 로그인이 필요합니다.");
  }

  // 파일명 sanitize: 영문자, 숫자, 점, 하이픈 외 문자를 언더스코어로 치환
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}_${sanitizedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET_NAME)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false, // 중복 업로드 방지
    });

  if (uploadError) {
    throw new Error(`이미지 업로드에 실패했습니다: ${uploadError.message}`);
  }

  // 공개 URL 반환
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET_NAME).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Supabase Storage에서 아바타 이미지를 삭제합니다.
 * @param avatarUrl - 아바타 공개 URL (예: https://.../avatars/userId/timestamp_filename.jpg)
 */
export async function deleteAvatarImage(avatarUrl: string): Promise<void> {
  const supabase = await createClient();

  // URL에서 버킷 이후의 파일 경로 추출
  const filePath = avatarUrl.split("/avatars/")[1];

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw new Error(`이미지 삭제에 실패했습니다: ${error.message}`);
  }
}

/**
 * 파일 경로로 아바타 공개 URL을 생성합니다. (환경변수 기반, 동기 함수)
 * @param filePath - 버킷 내 상대 경로 (예: userId/timestamp_filename.jpg)
 */
export function getAvatarImageUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${supabaseUrl}/storage/v1/object/public/avatars/${filePath}`;
}
