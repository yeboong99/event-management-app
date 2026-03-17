# 구글 로그인 기능 추가 계획

## 담당 에이전트

이 계획의 모든 구현 작업은 **`nextjs-supabase-fullstack` 서브에이전트**가 담당합니다.
계획 승인 후 해당 에이전트를 실행하여 아래 구현 상세에 따라 파일을 생성/수정해주세요.

---

## Context

현재 프로젝트는 이메일/비밀번호 기반 인증만 구현되어 있습니다. Google OAuth 소셜 로그인을 추가하여 사용자가 Google 계정으로 로그인 및 신규 가입을 동시에 처리할 수 있도록 합니다. (Supabase `signInWithOAuth`는 기존 계정이 없는 경우 자동으로 가입도 처리)

**사용자 결정 사항:**

- 버튼 위치: 이메일 폼 위 (Google 버튼 → OR 구분선 → 이메일/비밀번호 폼)
- 적용 범위: 로그인 페이지(`login-form.tsx`)만 추가
- Google Cloud Console OAuth 앱 미설정 → 가이드 포함

---

## 변경 파일 목록

| 구분      | 파일                         | 작업                                |
| --------- | ---------------------------- | ----------------------------------- |
| 신규 생성 | `app/auth/callback/route.ts` | OAuth 콜백 Route Handler            |
| 수정      | `components/login-form.tsx`  | Google 로그인 버튼 + OR 구분선 추가 |

미들웨어(`proxy.ts`) 수정 불필요 — `/auth/callback`은 `/auth`로 시작하므로 보호 경로 제외 로직에 자동 포함됨.

---

## 구현 상세

### 1. `app/auth/callback/route.ts` (신규 생성)

`app/auth/confirm/route.ts` 패턴을 참고하되, `verifyOtp` 대신 `exchangeCodeForSession` 사용.

```ts
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      redirect(next);
    }
    redirect(`/auth/error?error=${error.message}`);
  }

  redirect(`/auth/error?error=No authorization code provided`);
}
```

### 2. `components/login-form.tsx` (수정)

#### 상태 추가

```ts
const [isGoogleLoading, setIsGoogleLoading] = useState(false);
```

#### Google 핸들러 추가

```ts
const handleGoogleLogin = async () => {
  const supabase = createClient();
  setIsGoogleLoading(true);
  setError(null);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  // signInWithOAuth는 성공 시 리다이렉트되므로 에러 시에만 여기 도달
  if (error) {
    setError(error.message);
    setIsGoogleLoading(false);
  }
};
```

`window.location.origin` 사용 이유: `'use client'` 컴포넌트이므로 `window` 접근 가능하며, 로컬/스테이징/프로덕션 환경을 별도 환경변수 없이 자동 처리 가능.

#### JSX 레이아웃 변경 (버튼을 이메일 폼 위에 배치)

```
[ Continue with Google ]
────────── OR ──────────
[ Email        ]
[ Password     ]
[ Login Button ]
```

`CardContent` 내 폼 구조:

1. Google 로그인 버튼 (맨 위)
2. OR 구분선
3. 기존 이메일/비밀번호 입력 필드
4. 에러 메시지
5. Login 버튼 (`disabled={isLoading || isGoogleLoading}`으로 수정)
6. 회원가입 링크

```tsx
{
  /* Google 로그인 버튼 */
}
<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={handleGoogleLogin}
  disabled={isLoading || isGoogleLoading}
>
  {isGoogleLoading ? (
    "Redirecting..."
  ) : (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="mr-2 h-4 w-4"
      >
        <path
          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
          fill="currentColor"
        />
      </svg>
      Continue with Google
    </>
  )}
</Button>;

{
  /* OR 구분선 (Separator 컴포넌트 없음 → Tailwind 직접 구현, 시맨틱 색상 사용) */
}
<div className="relative flex items-center">
  <div className="flex-grow border-t border-border" />
  <span className="mx-3 flex-shrink text-xs text-muted-foreground">OR</span>
  <div className="flex-grow border-t border-border" />
</div>;

{
  /* 기존 이메일/비밀번호 필드 유지 */
}
```

기존 Login 버튼도 `disabled={isLoading || isGoogleLoading}`으로 수정하여 Google 로딩 중 동시 클릭 방지.

기존 `handleLogin`의 이메일 로그인 리다이렉트도 변경:

```ts
// 기존
router.push("/protected");

// 변경
router.push("/");
```

---

## Supabase 대시보드 설정 (구현 전 완료 필요)

### Step 1: Google Cloud Console OAuth 앱 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client IDs** 클릭
4. Application type: **Web application** 선택
5. **Authorized redirect URIs**에 추가:
   ```
   https://hevzfzweqykilsxmwsyz.supabase.co/auth/v1/callback
   ```
6. **Client ID**와 **Client Secret** 저장

### Step 2: Supabase 대시보드 Google Provider 활성화

1. Supabase Dashboard > 해당 프로젝트
2. **Authentication > Providers > Google** 토글 활성화
3. Step 1의 **Client ID**, **Client Secret** 입력 후 저장

### Step 3: Redirect URL 허용 목록 등록

1. **Authentication > URL Configuration > Redirect URLs**에 추가:
   ```
   http://localhost:3000/auth/callback
   https://your-production-domain.com/auth/callback   ← 프로덕션 배포 시
   ```

---

## 검증 방법

```bash
npm run type-check
npm run lint
npm run dev
```

1. `http://localhost:3000/auth/login` 접속
2. 상단에 "Continue with Google" 버튼, OR 구분선, 이메일 폼 순서 확인
3. Google 버튼 클릭 → Google OAuth 페이지 리다이렉트 확인
4. Google 계정 인증 → `/auth/callback?code=...` → `/protected` 최종 도달 확인
5. Google 로딩 중 Email Login 버튼도 비활성화 확인
