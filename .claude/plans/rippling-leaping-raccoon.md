# Task 6: 미들웨어 admin 접근 제어 추가

## Context

profiles 테이블에 `role` 컬럼이 추가된 후(Task 3), `/admin/*` 경로에 대해 role 기반 접근 제어가 필요합니다. 현재 미들웨어(`lib/supabase/proxy.ts`)는 비인증 사용자만 차단하고 있어, role='user'인 인증된 사용자도 `/admin` 경로에 접근할 수 있는 상태입니다.

## 수정 대상 파일

- **`lib/supabase/proxy.ts`** — `updateSession()` 함수에 admin 접근 제어 로직 추가 (유일한 수정 파일)

## 현재 구조 분석

`lib/supabase/proxy.ts`의 `updateSession()` 흐름:

1. 환경변수 검증
2. Supabase 클라이언트 생성 (쿠키 동기화 포함)
3. `supabase.auth.getClaims()` → `user` 추출
4. 경로 기반 인증 확인 (비인증 사용자 → `/auth/login` 리다이렉트)
5. `supabaseResponse` 반환 (**쿠키 무결성 필수 유지**)

`user` 객체: `getClaims()` 반환값, `user.sub`이 사용자 UUID

## 구현 계획

### 변경 위치

기존 비인증 사용자 리다이렉트 블록(if문) **이후**, `return supabaseResponse` **이전**에 추가

### 추가 로직

```typescript
// /admin/* 경로 role 기반 접근 제어
if (user && request.nextUrl.pathname.startsWith("/admin")) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.sub)
    .single();

  if (error || profile?.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
}
```

### 핵심 고려사항

1. **쿠키 무결성**: 리다이렉트 시 `NextResponse.redirect(url)` 사용 (새 Response) — `supabaseResponse`를 래핑할 필요 없음 (이미 세션 체크 완료 후 시점)
2. **에러 처리**: DB 조회 실패(`error`) 또는 `profile?.role !== 'admin'` 양쪽 모두 홈으로 리다이렉트
3. **비인증 처리**: 기존 로직이 먼저 `/auth/login`으로 보내므로 중복 불필요 (`user &&` 조건)
4. **user.sub**: `getClaims()` 반환 타입에서 사용자 ID 필드

## 검증 방법

1. Supabase Dashboard에서 특정 사용자의 `profiles.role = 'admin'`으로 설정
2. admin 사용자로 `/admin` 접근 → 정상 접근
3. role='user' 사용자로 `/admin` 접근 → `/` 리다이렉트
4. 비인증 사용자로 `/admin` 접근 → `/auth/login` 리다이렉트 (기존 로직)
5. `/discover`, `/profile` 등 일반 경로 → 영향 없음
6. `npm run type-check` 통과
