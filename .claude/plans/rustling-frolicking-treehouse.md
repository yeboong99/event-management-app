# Task 85: 아바타 Storage 유틸리티 확장

## Context

Phase 5 프로필 관리 기능의 일환으로, 사용자 아바타 이미지를 Supabase Storage에 업로드/삭제하는 유틸리티가 필요합니다. 이미 `event-covers` 버킷용 Storage 유틸(`lib/supabase/storage.ts`)이 구현되어 있으므로 동일 패턴을 `avatars` 버킷에 적용합니다. 의존 태스크 84(프로필 타입/스키마 정의)는 완료 상태입니다.

## 구현 대상 파일

- **수정**: `lib/supabase/storage.ts`

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] Supabase avatars 버킷 생성 및 RLS 정책 설정

Supabase MCP를 활용해 아래 마이그레이션 SQL을 적용합니다.

```sql
-- avatars 버킷 생성 (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 인증 사용자가 자신의 경로에 업로드 가능
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 인증 사용자가 자신의 파일 삭제 가능
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 공개 읽기 접근
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### Step 2: [nextjs-supabase-fullstack] storage.ts 아바타 함수 추가

`lib/supabase/storage.ts`에 다음 함수를 추가합니다. 기존 `event-covers` 패턴을 그대로 따릅니다.

**기존 패턴 참고:**

- 버킷 상수: `const AVATAR_BUCKET_NAME = "avatars"`
- 파일 경로: `{userId}/{timestamp}_{sanitizedFileName}`
- 인증 확인 → 파일명 sanitize → upload → publicUrl 반환
- `upsert: false`, `contentType: file.type`

**추가할 함수:**

```typescript
// 파일 경로: {userId}/{timestamp}_{sanitizedFileName}
export async function uploadAvatarImage(
  file: File,
  userId: string,
): Promise<string>;

// avatarUrl에서 "/avatars/" 이후 경로 추출 후 삭제
export async function deleteAvatarImage(avatarUrl: string): Promise<void>;

// 동기 함수: process.env.NEXT_PUBLIC_SUPABASE_URL 기반 URL 생성
export function getAvatarImageUrl(filePath: string): string;
```

## 기존 패턴 재사용

| 기존 함수               | 참조 위치                    | 아바타 버전                                       |
| ----------------------- | ---------------------------- | ------------------------------------------------- |
| `uploadEventCoverImage` | `lib/supabase/storage.ts:16` | `uploadAvatarImage` — eventId 인자 제거           |
| `deleteEventCoverImage` | `lib/supabase/storage.ts:55` | `deleteAvatarImage` — URL에서 경로 추출 로직 내장 |
| `getEventCoverImageUrl` | `lib/supabase/storage.ts:68` | `getAvatarImageUrl` — 버킷 이름만 변경            |

## 검증 방법

1. `npm run type-check` — 타입 오류 없음 확인
2. `npm run lint` — ESLint 오류 없음 확인
3. Supabase MCP `list_tables` 또는 `execute_sql`로 버킷 생성 확인
4. 로컬 개발 서버에서 프로필 이미지 업로드 → 공개 URL 접근 확인
