# Task 25: 앱 메타데이터 및 페이지별 탭 타이틀 설정

## Context

브라우저 탭에 기본값인 "Next.js and Supabase Starter Kit"가 그대로 표시되고 있어, 서비스 정체성 및 현재 페이지 맥락을 사용자에게 전달하지 못함. 이를 해결하기 위해 루트 레이아웃의 기본 메타데이터를 한국어로 업데이트하고, 각 페이지마다 의미 있는 탭 타이틀을 추가함.

**라우트 구조 변경 반영**: 태스크 명세는 구 `(host)/(participant)` 라우트를 기준으로 작성되어 있으나, 실제 코드베이스는 `app/(app)/`으로 통합 완료됨. 실제 파일 기준으로 작업.

---

## 담당 에이전트 분배

이 태스크는 모두 TypeScript 메타데이터 설정 작업으로 UI 마크업이 없음. 전체 작업을 **nextjs-supabase-fullstack** 에이전트가 담당.

---

## 구현 계획

### 담당: nextjs-supabase-fullstack

#### 1단계: 루트 레이아웃 메타데이터 수정

**파일**: `app/layout.tsx`

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "이벤트 매니저",
    template: "%s | 이벤트 매니저",
  },
  description:
    "일회성 이벤트를 쉽게 관리하고 참여자와 소통하세요. 공지, 카풀, 정산까지 한 번에 해결하는 이벤트 관리 플랫폼입니다.",
};
```

- 기존 `defaultUrl` 변수 확인 후 `metadataBase` 설정
- 기존 스타터킷 기본값 완전 제거

#### 2단계: 정적 페이지 metadata export 추가

각 파일 상단에 `import type { Metadata } from 'next'` 추가 후 `metadata` export:

| 파일                            | title 값          |
| ------------------------------- | ----------------- |
| `app/(app)/discover/page.tsx`   | `'이벤트 탐색'`   |
| `app/(app)/my-events/page.tsx`  | `'내 이벤트'`     |
| `app/(app)/events/new/page.tsx` | `'이벤트 만들기'` |
| `app/(app)/carpools/page.tsx`   | `'카풀'`          |
| `app/(app)/profile/page.tsx`    | `'프로필'`        |

#### 3단계: 동적 페이지 generateMetadata 추가

**파일**: `app/(app)/events/[eventId]/page.tsx`

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("id", eventId)
    .single();

  if (!event) return { title: "이벤트" };
  return { title: event.title };
}
```

**파일**: `app/(app)/events/[eventId]/edit/page.tsx`

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("id", eventId)
    .single();

  if (!event) return { title: "이벤트 수정" };
  return { title: `${event.title} 수정` };
}
```

- `createClient`는 이미 두 파일에서 import되어 있으므로 재사용
- `notFound()` 호출 없이 기본 타이틀 반환 (명세 요구사항)

---

## 수정 대상 파일 목록

- `app/layout.tsx`
- `app/(app)/discover/page.tsx`
- `app/(app)/my-events/page.tsx`
- `app/(app)/events/new/page.tsx`
- `app/(app)/events/[eventId]/page.tsx`
- `app/(app)/events/[eventId]/edit/page.tsx`
- `app/(app)/carpools/page.tsx`
- `app/(app)/profile/page.tsx`

---

## 검증 방법

```bash
npm run type-check
npm run build
```

브라우저에서 각 페이지 접속 후 탭 타이틀 확인:

- `/discover` → "이벤트 탐색 | 이벤트 매니저"
- `/my-events` → "내 이벤트 | 이벤트 매니저"
- `/events/new` → "이벤트 만들기 | 이벤트 매니저"
- `/events/[id]` → "[이벤트제목] | 이벤트 매니저"
- `/events/[id]/edit` → "[이벤트제목] 수정 | 이벤트 매니저"
