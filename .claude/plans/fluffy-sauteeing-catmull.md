# Task 8 후속: 참여자 탭 Placeholder 페이지 추가

## Context

Task 8에서 `app/(participant)/` 레이아웃과 `/discover` 페이지는 완성됨. 그러나 하단 탭의 나머지 3개 경로(`/my-events`, `/carpools`, `/profile`)에 대응하는 페이지가 없어 404 발생. 현 단계에서 전체 기능 구현은 불필요하며, 레이아웃이 정상 표시되는 Placeholder 페이지만 추가.

---

## 생성할 파일 목록

| 파일 경로                              | 유형             | 담당 에이전트      |
| -------------------------------------- | ---------------- | ------------------ |
| `app/(participant)/my-events/page.tsx` | Server Component | `nextjs-ui-markup` |
| `app/(participant)/carpools/page.tsx`  | Server Component | `nextjs-ui-markup` |
| `app/(participant)/profile/page.tsx`   | Server Component | `nextjs-ui-markup` |

**수정 파일 없음.** 기존 `discover/page.tsx` 패턴을 그대로 따름.

---

## 구현 세부사항

기존 `app/(participant)/discover/page.tsx`와 동일한 패턴:

- Server Component, `'use client'` 불필요
- `<h1>` 페이지 제목 + `<p>` 설명 텍스트
- 시맨틱 색상: `text-foreground`, `text-muted-foreground`
- 래퍼: `<div className="p-4">`

각 페이지 텍스트:

- `/my-events` → 제목 "참여중", 설명 "참여 중인 이벤트 목록입니다."
- `/carpools` → 제목 "카풀", 설명 "카풀 정보를 확인하세요."
- `/profile` → 제목 "프로필", 설명 "내 프로필을 관리하세요."

---

## 참조 파일

- `app/(participant)/discover/page.tsx` — 동일 패턴 참고

---

## 검증 방법

- `/my-events`, `/carpools`, `/profile` 접속 시 404 대신 페이지 정상 렌더링
- 각 탭 클릭 시 해당 탭이 활성화(`bg-primary`) 상태로 표시
- `npm run type-check` + `npm run lint` 오류 없음
