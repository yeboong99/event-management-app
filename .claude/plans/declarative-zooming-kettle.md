# 구글 로그인 설정 가이드

## Context

구글 로그인 코드(`signInWithOAuth`)는 `components/login-form.tsx`에 이미 구현되어 있음.
동작하지 않는 이유는 Supabase Dashboard와 Google Cloud Console의 OAuth 설정이 누락되어 있기 때문.
코드 변경 없이 외부 설정만으로 해결 가능.

## 현재 상태

- **코드**: `components/login-form.tsx:56` — `supabase.auth.signInWithOAuth({ provider: "google" })` 구현 완료
- **콜백 URL**: `${window.location.origin}/auth/callback` → `app/auth/callback/route.ts` 에서 처리
- **환경변수**: `.env.local`에 Supabase URL/Key 이미 설정됨

## 설정 단계

### 1단계: Google Cloud Console — OAuth 앱 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **APIs & Services** → **OAuth consent screen**
   - User Type: External 선택
   - 앱 이름, 이메일 입력 후 저장
4. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: 프로젝트명 입력
   - **Authorized redirect URIs** 에 아래 URL 추가:
     ```
     https://hevzfzweqykilsxmwsyz.supabase.co/auth/v1/callback
     ```
5. **Client ID**와 **Client Secret** 복사

### 2단계: Supabase Dashboard — Google Provider 활성화

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트(`hevzfzweqykilsxmwsyz`) 선택
3. 좌측 메뉴 **Authentication** → **Providers**
4. **Google** 찾아서 클릭 → Enable 토글 ON
5. 1단계에서 복사한 값 입력:
   - **Client ID (OAuth)**: Google Client ID
   - **Client Secret**: Google Client Secret
6. **Save** 클릭

### 3단계: 로컬 개발 시 Redirect URL 추가 (선택)

로컬(`localhost:3000`)에서도 테스트하려면:

- Supabase Dashboard → **Authentication** → **URL Configuration**
- **Redirect URLs**에 추가: `http://localhost:3000/auth/callback`

## 검증 방법

1. `npm run dev` 실행
2. `/auth/login` 페이지에서 "Continue with Google" 버튼 클릭
3. Google 계정 선택 화면이 뜨는지 확인
4. 로그인 완료 후 `/` 로 리다이렉트 되는지 확인

## 코드 변경 없음

모든 설정은 외부 서비스(Google Cloud Console, Supabase Dashboard)에서만 진행.
