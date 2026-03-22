# Task 12: Supabase Storage 버킷 설정 및 이미지 업로드 유틸리티

## Context

이벤트 커버 이미지를 저장하기 위한 Supabase Storage 인프라를 구축합니다. `events` 테이블에는 이미 `cover_image_url` 컬럼이 존재하며, 이 작업에서는 실제 이미지를 저장할 Storage 버킷과 유틸리티 함수를 마련합니다. 이후 이벤트 생성/수정 폼에서 이 유틸리티를 사용하게 됩니다.

## 구현 담당

**nextjs-supabase-fullstack 서브에이전트**가 전담합니다.

---

## 구현 계획

### Step 1: Supabase Storage 버킷 + RLS 정책 마이그레이션

`mcp__supabase__apply_migration`을 사용하여 SQL 마이그레이션 실행:

```sql
-- event-covers 버킷 생성 (공개 버킷)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-covers', 'event-covers', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload event covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-covers');

-- RLS: 파일 소유자만 삭제 가능 (폴더명이 user id)
CREATE POLICY "Users can delete own event covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: 공개 읽기 허용
CREATE POLICY "Anyone can view event covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-covers');
```

### Step 2: `lib/supabase/storage.ts` 유틸리티 함수 작성

새 파일 생성. 기존 `lib/supabase/server.ts`의 `createClient()`를 재사용.

구현할 함수:

- `validateImageFile(file: File)` — 클라이언트 사이드 파일 검증 (5MB 제한, JPG/PNG/WebP만 허용)
- `uploadEventCoverImage(file: File, userId: string, eventId: string)` — 업로드 후 공개 URL 반환
  - 파일 경로: `{userId}/{eventId}/{timestamp}_{sanitizedFilename}`
  - `createClient()` (서버 클라이언트) 사용
- `deleteEventCoverImage(filePath: string)` — Storage에서 파일 삭제
- `getEventCoverImageUrl(filePath: string)` — 경로로 공개 URL 생성 (환경변수 기반)

> **주의**: 태스크 세부사항의 `uploadEventCoverImage`는 `eventId`만 받지만, RLS 정책이 `auth.uid()` 기반 폴더명으로 소유권을 확인하므로 `userId`를 경로에 포함시킵니다.

### Step 3: `next.config.ts` 이미지 도메인 추가

현재 `next.config.ts`는 빈 설정이므로, Supabase Storage URL을 Next.js `<Image>` 컴포넌트가 사용할 수 있도록 `remotePatterns` 추가:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "") ?? "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
```

---

## 수정/생성 파일 목록

| 파일                      | 작업                             |
| ------------------------- | -------------------------------- |
| `lib/supabase/storage.ts` | 신규 생성                        |
| `next.config.ts`          | 수정 (`remotePatterns` 추가)     |
| Supabase migration        | SQL 마이그레이션 실행 (MCP 도구) |

## 검증 방법

1. `npm run type-check` — TypeScript 오류 없는지 확인
2. `npm run lint` — ESLint 통과 확인
3. Supabase 대시보드에서 `event-covers` 버킷 생성 확인
4. RLS 정책 3개 정상 등록 확인
