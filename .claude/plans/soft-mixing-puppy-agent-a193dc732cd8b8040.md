# Task 7: 루트 페이지 역할별 리디렉션 구현

## 목표

`app/page.tsx`를 Supabase 스타터 템플릿 UI에서 역할 기반 리디렉션 Server Component로 교체합니다.

## 현재 상태 분석

- `app/page.tsx`에 DeployButton, AuthButton, Hero, ThemeSwitcher 등 스타터 템플릿 UI가 존재
- `lib/supabase/server.ts`의 `createClient()` 함수를 활용해야 함
- `app/admin/page.tsx`가 이미 존재하여 admin 리디렉션 대상으로 사용 가능

## 구현 계획

### 1. `app/page.tsx` 교체

기존 스타터 UI 전체를 아래 로직으로 교체합니다:

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인 사용자
  if (!user) {
    redirect("/auth/login");
  }

  // role 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // admin → /admin, 그 외 → /discover
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  redirect("/discover");
}
```

### 2. 검증

- `npm run type-check` — TypeScript 타입 검사
- `npm run lint` — ESLint 검사

## 변경 파일 목록

- `app/page.tsx` — 전체 교체 (스타터 UI → 리디렉션 로직)

## 주의 사항

- Server Component이므로 `'use client'` 불필요
- `createClient()`는 async이므로 반드시 `await` 사용
- `getUser()`로 인증 확인 (`getSession()` 대신)
- 기존 스타터 컴포넌트 import는 모두 제거 (DeployButton, AuthButton, Hero 등)
