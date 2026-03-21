# Task 10 후속: 이벤트 관리 / 사용자 관리 Placeholder 페이지 생성

## Context

사이드바의 "이벤트 관리", "사용자 관리" 메뉴 클릭 시 404 에러가 발생합니다.
해당 라우트 페이지 파일이 존재하지 않기 때문입니다.
현 단계에서는 구체적인 기능 구현 없이 기본 레이아웃 화면만 완성합니다.

---

## 생성할 파일

| 파일                        | 담당 에이전트        |
| --------------------------- | -------------------- |
| `app/admin/events/page.tsx` | **nextjs-ui-markup** |
| `app/admin/users/page.tsx`  | **nextjs-ui-markup** |

---

## 구현 내용

기존 `app/admin/page.tsx` 패턴과 동일하게 구성합니다.

### `app/admin/events/page.tsx`

- Server Component
- 제목: "이벤트 관리"
- Card 컴포넌트로 "준비 중" 표시

### `app/admin/users/page.tsx`

- Server Component
- 제목: "사용자 관리"
- Card 컴포넌트로 "준비 중" 표시

---

## 재사용할 패턴

- `app/admin/page.tsx` — 동일한 구조 복사 후 제목/설명만 변경
- `components/ui/card.tsx` — `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`

---

## 검증

- `/admin/events` 접속 시 404 대신 페이지 렌더링 확인
- `/admin/users` 접속 시 404 대신 페이지 렌더링 확인
- `npm run build` 성공 확인
