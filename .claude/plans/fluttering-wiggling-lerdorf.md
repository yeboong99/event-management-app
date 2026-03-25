# 로그인/회원가입 페이지 한국어 텍스트 변환 플랜

## Context

로그인 및 회원가입 관련 페이지의 모든 UI 텍스트(제목, 라벨, 플레이스홀더, 버튼, 에러/안내 메시지)가 영문으로 작성되어 있어 한국어 사용자 경험을 해치고 있음. 한국어 서비스 일관성을 위해 모든 사용자 노출 텍스트를 한국어로 변환한다.

---

## 수정 대상 파일 및 변환 목록

### 1. `components/login-form.tsx`

| 기존 영문                                       | 변환 한국어                           |
| ----------------------------------------------- | ------------------------------------- |
| Login                                           | 로그인                                |
| Enter your email below to login to your account | 이메일을 입력하여 계정에 로그인하세요 |
| Continue with Google                            | Google로 계속하기                     |
| Redirecting...                                  | 리디렉션 중...                        |
| OR                                              | 또는                                  |
| Email                                           | 이메일                                |
| m@example.com (placeholder)                     | m@example.com                         |
| Password                                        | 비밀번호                              |
| Forgot your password?                           | 비밀번호를 잊으셨나요?                |
| Login (버튼)                                    | 로그인                                |
| Logging in...                                   | 로그인 중...                          |
| Don't have an account?                          | 계정이 없으신가요?                    |
| Sign up                                         | 회원가입                              |

### 2. `components/sign-up-form.tsx`

| 기존 영문                | 변환 한국어                  |
| ------------------------ | ---------------------------- |
| Sign up                  | 회원가입                     |
| Create a new account     | 새 계정을 만드세요           |
| Full Name                | 이름                         |
| John Doe (placeholder)   | 홍길동                       |
| Email                    | 이메일                       |
| Password                 | 비밀번호                     |
| Repeat Password          | 비밀번호 확인                |
| Passwords do not match   | 비밀번호가 일치하지 않습니다 |
| Sign up (버튼)           | 회원가입                     |
| Creating an account...   | 계정 생성 중...              |
| Already have an account? | 이미 계정이 있으신가요?      |
| Login                    | 로그인                       |

### 3. `app/auth/sign-up-success/page.tsx`

| 기존 영문                                                                                         | 변환 한국어                                                                    |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Thank you for signing up!                                                                         | 회원가입을 완료했습니다!                                                       |
| Check your email to confirm                                                                       | 이메일을 확인하세요                                                            |
| You've successfully signed up. Please check your email to confirm your account before signing in. | 회원가입이 완료되었습니다. 로그인 전에 이메일을 확인하여 계정을 인증해 주세요. |

### 4. `components/forgot-password-form.tsx`

| 기존 영문                                                                                 | 변환 한국어                                                             |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Reset Your Password                                                                       | 비밀번호 재설정                                                         |
| Type in your email and we'll send you a link to reset your password                       | 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다                 |
| Send reset email                                                                          | 재설정 이메일 보내기                                                    |
| Sending...                                                                                | 전송 중...                                                              |
| Already have an account?                                                                  | 이미 계정이 있으신가요?                                                 |
| Login                                                                                     | 로그인                                                                  |
| Check Your Email                                                                          | 이메일을 확인하세요                                                     |
| Password reset instructions sent                                                          | 비밀번호 재설정 안내를 전송했습니다                                     |
| If you registered using your email and password, you will receive a password reset email. | 이메일과 비밀번호로 가입하신 경우, 비밀번호 재설정 이메일이 발송됩니다. |

### 5. `components/update-password-form.tsx`

| 기존 영문                             | 변환 한국어                  |
| ------------------------------------- | ---------------------------- |
| Reset Your Password                   | 비밀번호 재설정              |
| Please enter your new password below. | 새 비밀번호를 입력해 주세요. |
| New password                          | 새 비밀번호                  |
| New password (placeholder)            | 새 비밀번호                  |
| Save new password                     | 새 비밀번호 저장             |
| Saving...                             | 저장 중...                   |

### 6. `app/auth/error/page.tsx`

| 기존 영문                      | 변환 한국어                     |
| ------------------------------ | ------------------------------- |
| Sorry, something went wrong.   | 오류가 발생했습니다.            |
| Code error: {params.error}     | 오류 코드: {params.error}       |
| An unspecified error occurred. | 알 수 없는 오류가 발생했습니다. |

### 7. `components/auth-button.tsx`

| 기존 영문          | 변환 한국어                 |
| ------------------ | --------------------------- |
| Hey, {user.email}! | 안녕하세요, {user.email}님! |
| Sign in            | 로그인                      |
| Sign up            | 회원가입                    |

### 8. `components/logout-button.tsx`

| 기존 영문 | 변환 한국어 |
| --------- | ----------- |
| Logout    | 로그아웃    |

---

## 구현 계획

### Step 1: [nextjs-ui-markup] 로그인/회원가입 텍스트 한국어 변환

아래 8개 파일의 영문 UI 텍스트를 위 표에 따라 한국어로 교체:

1. `components/login-form.tsx`
2. `components/sign-up-form.tsx`
3. `app/auth/sign-up-success/page.tsx`
4. `components/forgot-password-form.tsx`
5. `components/update-password-form.tsx`
6. `app/auth/error/page.tsx`
7. `components/auth-button.tsx`
8. `components/logout-button.tsx`

**주의 사항:**

- 동적 값(user.email, error.message, params.error)은 그대로 유지
- 컴포넌트 로직, 스타일, 구조 변경 없이 텍스트만 변환
- placeholder 속성도 포함하여 변환

---

## 검증 방법

1. `npm run type-check` — 타입 오류 없음 확인
2. `npm run lint` — ESLint 오류 없음 확인
3. 개발 서버(`npm run dev`) 실행 후 다음 페이지 수동 확인:
   - `/auth/login` — 로그인 페이지 전체 한국어 표시 확인
   - `/auth/sign-up` — 회원가입 페이지 전체 한국어 표시 확인
   - `/auth/sign-up-success` — 회원가입 완료 페이지 확인
   - `/auth/forgot-password` — 비밀번호 찾기 페이지 확인 (성공 전/후 상태 모두)
   - `/auth/update-password` — 비밀번호 업데이트 페이지 확인
   - `/auth/error` — 에러 페이지 확인
