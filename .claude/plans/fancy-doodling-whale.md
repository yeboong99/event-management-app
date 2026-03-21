# Task 2: 추가 shadcn/ui 컴포넌트 설치

## Context

Task 1(TailwindCSS v4 업그레이드)이 완료된 상태. 현재 `components/ui/`에는 7개 컴포넌트만 설치됨 (button, input, label, badge, card, checkbox, dropdown-menu). 후속 Phase(이벤트 생성 폼, 프로필 페이지, 관리자 레이아웃 등)에서 필요한 컴포넌트를 사전 설치하여 개발 시 즉시 사용 가능하도록 한다.

## 현재 상태

- **설치된 컴포넌트**: 7개 (`components/ui/` 내)
- **TailwindCSS**: v4.2.2 (`@import "tailwindcss"` 방식)
- **shadcn 설정**: `components.json` — style: new-york, baseColor: neutral, CSS variables: true
- **PostCSS**: `@tailwindcss/postcss` 플러그인 사용 중

## 설치 대상 컴포넌트 (9개)

| 컴포넌트    | 용도                               |
| ----------- | ---------------------------------- |
| `textarea`  | 이벤트 설명 등 긴 텍스트 입력      |
| `select`    | 카테고리, 상태 드롭다운 선택       |
| `separator` | 구분선                             |
| `tabs`      | 탭 UI (이벤트 상세, 관리자 페이지) |
| `avatar`    | 사용자 프로필 이미지               |
| `toast`     | 알림 메시지 (성공/실패 피드백)     |
| `skeleton`  | 로딩 상태 플레이스홀더             |
| `dialog`    | 모달 (삭제 확인, 상세 보기)        |
| `sheet`     | 사이드 드로어 (모바일 메뉴 등)     |

## 구현 계획

### Step 1: 컴포넌트 일괄 설치

```bash
npx shadcn@latest add textarea select separator tabs avatar toast skeleton dialog sheet
```

- `components/ui/` 에 파일 자동 생성
- 필요한 Radix UI 패키지 자동 설치

### Step 2: 설치 결과 검증

- `components/ui/` 디렉토리에 9개 파일 존재 확인
- `package.json`에 신규 `@radix-ui/*` 패키지 추가 확인

### Step 3: 타입 및 빌드 검증

```bash
npm run type-check   # TypeScript 타입 오류 없음 확인
npm run build        # 프로덕션 빌드 성공 확인
```

## 수정 대상 파일

- `components/ui/` — 9개 파일 자동 생성 (shadcn CLI가 처리)
- `package.json` — Radix UI 패키지 추가 (CLI 자동 처리)
- `package-lock.json` — 자동 업데이트

> ⚠️ `components/ui/` 파일은 shadcn 자동생성 파일이므로 직접 수정 금지

## 검증 방법

1. `components/ui/` 에 신규 9개 파일 존재: `textarea.tsx`, `select.tsx`, `separator.tsx`, `tabs.tsx`, `avatar.tsx`, `toaster.tsx`(또는 `toast.tsx`), `skeleton.tsx`, `dialog.tsx`, `sheet.tsx`
2. `npm run type-check` 통과 (오류 0건)
3. `npm run build` 성공
