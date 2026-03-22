// 최대 파일 크기: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 허용된 MIME 타입
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * 클라이언트 사이드 이미지 파일 검증 (순수 함수)
 * 파일 크기 및 MIME 타입을 검사합니다.
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "파일 크기는 5MB 이하여야 합니다" };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: "JPG, PNG, WebP 형식만 업로드 가능합니다" };
  }
  return { valid: true };
}
