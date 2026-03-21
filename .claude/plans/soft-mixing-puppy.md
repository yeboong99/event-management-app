# Task 7: 루트 페이지 역할별 리디렉션 구현

## Context

현재 `app/page.tsx`는 Supabase 스타터 템플릿 기반으로 DeployButton, AuthButton, Hero 섹션 등 프로젝트와 무관한 UI가 렌더링되고 있음. 이 페이지를 역할 기반 리디렉션 로직으로 완전히 교체하여 사용자가 로그인 상태와 role에 따라 적절한 페이지로 이동되도록 구현함.

미들웨어(`proxy.ts`)에는 이미 비인증 사용자 → `/auth/login`, `/admin/*` 접근 제어 로직이 있으나, 루트(/)에 대한 role 기반 분기는 없음. 이를 루트 페이지 Server Component에서 처리.

## 구현 계획

### 수정 파일

- `app/page.tsx` — 전체 교체

### 구현 내용

`app/page.tsx`를 아래 로직의 Server Component로 교체:

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

### 제거 대상

- 기존 Supabase 스타터 템플릿 전체 (DeployButton, AuthButton, Hero, ConnectSupabaseSteps, SignUpUserSteps, ThemeSwitcher 등 모든 import 및 JSX)

### 참조 파일

- `lib/supabase/server.ts` — `createClient()` 사용 (Server Component 전용)
- `lib/supabase/proxy.ts` — 미들웨어 접근 제어 (수정 불필요)
- `app/admin/page.tsx` — admin 리디렉션 대상

## 검증

1. 비로그인 상태로 `/` 접근 → `/auth/login` 리디렉션 확인
2. `role='admin'` 사용자로 `/` 접근 → `/admin` 리디렉션 확인
3. `role='user'` 사용자로 `/` 접근 → `/discover` 리디렉션 확인
4. `profile` 없는 사용자(role null) → `/discover` 리디렉션 확인
5. `npm run type-check` 통과
6. `npm run build` 성공
