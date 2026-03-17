# 개발 도구 설정 계획

## Context

현재 프로젝트는 Next.js + TypeScript + TailwindCSS + shadcn/ui 기반이며, ESLint 9 flat config만 기본 설정되어 있습니다. Prettier, Husky, lint-staged 등이 없어 코드 품질 자동화가 부족한 상태입니다. 커밋 전 자동 검증 파이프라인을 구축하여 안전한 개발 환경을 만드는 것이 목표입니다.

## 현재 상태

- **ESLint 9**: `eslint.config.mjs` — `next/core-web-vitals`, `next/typescript`만 적용
- **Prettier**: 미설정
- **Type Check**: `tsc --noEmit` 스크립트 없음
- **Husky / lint-staged**: 미설정
- **package manager**: npm (lock 파일 기준)

---

## 1단계: Prettier 설치 및 설정

### 설치 패키지

```
prettier prettier-plugin-tailwindcss
```

### 설정 파일: `prettier.config.mjs`

```js
/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  printWidth: 80,
  bracketSpacing: true,
  arrowParens: "always",
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
```

### `.prettierignore` 생성

```
node_modules/
.next/
out/
build/
coverage/
pnpm-lock.yaml
package-lock.json
*.tsbuildinfo
types/database.types.ts
```

### `package.json` scripts 추가

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

---

## 2단계: ESLint 설정 강화

### 설치 패키지

```
eslint-config-prettier eslint-plugin-simple-import-sort
```

- `eslint-config-prettier`: Prettier와 충돌하는 ESLint 규칙 비활성화
- `eslint-plugin-simple-import-sort`: import 정렬 자동화 (가볍고 빠름)

### `eslint.config.mjs` 수정

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    ignores: [".next/", "node_modules/", "types/database.types.ts"],
  },
];

export default eslintConfig;
```

---

## 3단계: TypeScript Type Check 스크립트

### `package.json` scripts 추가

```json
"type-check": "tsc --noEmit"
```

기존 `tsconfig.json`에 `"strict": true`가 이미 설정되어 있으므로 추가 변경 불필요.

---

## 4단계: Husky + lint-staged 설정

### 설치 패키지

```
husky lint-staged
```

### Husky 초기화

```bash
npx husky init
```

→ `.husky/pre-commit` 파일 자동 생성, `package.json`에 `"prepare": "husky"` 스크립트 자동 추가

### `.husky/pre-commit` 내용

```bash
npx lint-staged
```

### `lint-staged` 설정 (`package.json`에 추가)

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{js,mjs,cjs}": [
    "prettier --write"
  ],
  "*.{json,md,css}": [
    "prettier --write"
  ]
}
```

> **참고**: lint-staged에서 `tsc --noEmit`은 포함하지 않습니다. tsc는 스테이징된 파일만 개별 검사할 수 없고 전체 프로젝트를 검사해야 하므로, pre-commit에서는 빠른 lint + format만 수행합니다. type-check는 CI/CD 또는 수동으로 실행합니다.

---

## 5단계: 추가 도구 — `knip` (미사용 코드 탐지)

### 설치 패키지

```
knip
```

### `package.json` scripts 추가

```json
"knip": "knip"
```

`knip`은 사용하지 않는 파일, export, 의존성을 탐지합니다. Next.js + TypeScript 프로젝트를 자동 감지하므로 별도 설정 파일 불필요.

---

## 6단계: 초기 포맷팅 적용

모든 도구 설정 후 전체 코드에 포맷팅 일괄 적용:

```bash
npm run format
npm run lint -- --fix
```

---

---

## 7단계: CLAUDE.md 업데이트

기존 CLAUDE.md에 다음 섹션들을 추가합니다.

### 7-1. "자주 사용하는 명령어" 섹션에 명령어 추가

기존 명령어 목록 뒤에 추가:

```markdown
- `npm run format` — Prettier 전체 포맷팅
- `npm run format:check` — Prettier 포맷 검증 (CI용)
- `npm run type-check` — TypeScript 타입 검사
- `npm run knip` — 미사용 코드/의존성 탐지
```

### 7-2. "코드 품질 도구" 섹션 신규 추가 (핵심 개발 규칙 뒤에)

```markdown
## 코드 품질 도구

### 자동화 파이프라인

- **pre-commit hook** (Husky + lint-staged): 커밋 시 자동으로 ESLint fix + Prettier 포맷 실행
- 별도 설정이나 수동 실행 없이 `git commit`만 하면 자동 적용됨

### 코드 작성 시 지침

- 새 코드 작성 후 반드시 `npm run lint`와 `npm run type-check`로 검증
- import 순서는 `eslint-plugin-simple-import-sort`가 자동 정렬 — 수동 정렬 불필요
- Tailwind 클래스 순서는 `prettier-plugin-tailwindcss`가 자동 정렬
- `types/database.types.ts`는 자동생성 파일 → lint/format 대상에서 제외됨

### 코드 일관성 규칙

- Prettier 설정: 세미콜론 사용, 쌍따옴표, trailing comma, 80자 줄바꿈
- ESLint: `next/core-web-vitals` + `next/typescript` + `prettier`(충돌 방지) 적용
- 파일 저장 시 자동 포맷팅에 의존하지 말고, 커밋 전 `npm run format:check`으로 확인 가능

### 안전한 작업 흐름

- 코드 변경 후 커밋 전: `npm run type-check` → `npm run lint` → `npm run build` 순서로 검증
- 대규모 리팩토링 후: `npm run knip`으로 미사용 코드 정리
- `components/ui/` 파일은 lint-staged 대상이지만, 직접 수정은 여전히 금지 (shadcn 자동생성)
```

---

## 수정 대상 파일 요약

| 파일                  | 작업                                                 |
| --------------------- | ---------------------------------------------------- |
| `package.json`        | scripts 추가, lint-staged 설정, devDependencies 추가 |
| `prettier.config.mjs` | **신규 생성**                                        |
| `.prettierignore`     | **신규 생성**                                        |
| `eslint.config.mjs`   | prettier + import-sort 통합                          |
| `.husky/pre-commit`   | **신규 생성** (husky init으로 자동)                  |
| `CLAUDE.md`           | 명령어 추가 + 코드 품질 도구 섹션 추가               |

## 검증 방법

1. `npm run format:check` — Prettier 검증 통과 확인
2. `npm run lint` — ESLint 오류 없음 확인
3. `npm run type-check` — TypeScript 컴파일 오류 없음 확인
4. `npm run knip` — 미사용 코드 리포트 확인
5. 테스트 커밋 생성 → pre-commit 훅이 lint-staged 실행되는지 확인
6. `npm run build` — 프로덕션 빌드 정상 확인
