# Task 24: 커스텀 404 페이지 생성

## Context

존재하지 않는 경로에 접근할 때 Next.js 기본 404 페이지 대신 앱 디자인 언어와 일관된 한국어 커스텀 페이지를 표시해야 합니다. 현재 `app/not-found.tsx` 파일이 없으므로 신규 생성이 필요합니다.

## 담당 에이전트

이 태스크는 **단일 정적 UI 컴포넌트** 생성 작업이므로:

- **`nextjs-ui-markup` 에이전트** — `app/not-found.tsx` 전체 구현 담당
- `nextjs-supabase-fullstack` 에이전트는 불필요 (데이터 패칭/서버 액션 없음)

## 생성할 파일

| 파일                | 작업      | 에이전트         |
| ------------------- | --------- | ---------------- |
| `app/not-found.tsx` | 신규 생성 | nextjs-ui-markup |

## 구현 사양

### 기술 사항

- Server Component (기본값, `'use client'` 불필요)
- Next.js App Router `not-found.tsx` 컨벤션 사용
- 재사용할 기존 컴포넌트: `components/ui/button.tsx`

### 페이지 구성 요소

1. `Calendar` 아이콘 (lucide-react) — 큰 배경 아이콘
2. `"404"` — `text-8xl font-bold text-primary`
3. `"페이지를 찾을 수 없습니다"` — `text-2xl font-semibold`
4. `"요청하신 페이지가 존재하지 않습니다"` — `text-muted-foreground`
5. `"주소를 다시 확인해 주세요"` — `text-sm text-muted-foreground`
6. `<Button size="lg">홈으로 이동</Button>` — `Link href="/"`로 감싸기

### 메타데이터

```typescript
export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
};
```

### 레이아웃

- `flex min-h-screen flex-col items-center justify-center bg-background p-4`
- 모든 요소 중앙 정렬, `text-center`

## nextjs-ui-markup 에이전트 프롬프트 요약

> `app/not-found.tsx` 파일을 신규 생성. Server Component. lucide-react의 Calendar 아이콘, "404" 텍스트, 한국어 메시지 2줄, shadcn/ui Button으로 구성. 전체 화면 중앙 정렬. 위 사양 코드 그대로 구현.

## 검증

1. `npm run type-check` — 타입 오류 없음 확인
2. `npm run dev` 실행 후 `http://localhost:3000/nonexistent` 접근 → 커스텀 404 페이지 표시 확인
3. "홈으로 이동" 버튼 클릭 → `/` 경로로 이동 확인
4. 브라우저 탭 제목 `"페이지를 찾을 수 없습니다"` 표시 확인
