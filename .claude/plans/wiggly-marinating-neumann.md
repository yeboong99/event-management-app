# Task 16: 이벤트 카드 및 카테고리 배지 컴포넌트 구현

## Context

이벤트 목록 화면에서 각 이벤트를 표시하기 위한 카드 컴포넌트와 카테고리 배지 컴포넌트가 필요합니다.
Task 11(이벤트 Zod 스키마 및 공통 타입 정의)이 완료되어 `EventCategory`, `EventWithHost` 타입을 사용할 수 있습니다.

## 전제 조건

- Task 11: **완료(done)** ✅
- `date-fns` v4.1.0: 이미 설치됨 ✅
- `Badge`, `Card` shadcn/ui 컴포넌트: 사용 가능 ✅
- 기존 `components/mobile/` 패턴: `mobile-bottom-nav.tsx`, `mobile-header.tsx` 참고

## 서브에이전트 역할 분담

### nextjs-ui-markup 에이전트 (Badge 컴포넌트)

**파일**: `components/mobile/event-category-badge.tsx`

- 6개 카테고리별 색상 매핑 객체 구현
- shadcn Badge 컴포넌트 + `cn()` 조합
- 라이트/다크 모드 Tailwind 클래스 적용
- `EventCategory` 타입 사용 (`@/types/event`)

### nextjs-supabase-fullstack 에이전트 (Card 컴포넌트)

**파일**: `components/mobile/event-card-mobile.tsx`

- `EventWithHost` 타입 연동
- `date-fns` v4: `format`, `formatDistanceToNow`, `isPast` + `ko` locale
- 커버 이미지 조건부 렌더링 (있을 때 `<img>`, 없을 때 Calendar 아이콘 플레이스홀더)
- NEW 배지 로직: `created_at` 기준 24시간 이내 여부 계산
- 과거 이벤트 `opacity-60` 처리
- `EventCategoryBadge` 컴포넌트 임포트 및 사용

## 실행 계획

### Step 1: 병렬 실행 (두 에이전트 동시 실행)

**[nextjs-ui-markup] event-category-badge.tsx 생성**

```
경로: components/mobile/event-category-badge.tsx
참고:
- Badge 컴포넌트: components/ui/badge.tsx (variant="secondary" 사용)
- cn() 유틸리티: lib/utils.ts
- EventCategory 타입: types/event.ts
- 기존 모바일 컴포넌트 패턴: components/mobile/mobile-header.tsx
```

**[nextjs-supabase-fullstack] event-card-mobile.tsx 생성**

```
경로: components/mobile/event-card-mobile.tsx
참고:
- EventWithHost 타입: types/event.ts
- Card, CardContent: components/ui/card.tsx
- EventCategoryBadge: (위 에이전트가 생성한 파일)
- date-fns v4 API 사용 (ko locale 포함)
```

### Step 2: 검증

- `npm run type-check` 타입 오류 없음 확인
- `npm run lint` lint 오류 없음 확인

## 핵심 구현 참고사항

### EventCategory 실제 값

`types/event.ts`의 `EventCategory`는 Supabase `event_category` enum에서 유도됨.
태스크 details의 카테고리 매핑 키: `"생일파티"`, `"파티모임"`, `"워크샵"`, `"스터디"`, `"운동스포츠"`, `"기타"`

### date-fns v4 주의사항

- v4에서 locale import: `import { ko } from "date-fns/locale"`
- `formatDistanceToNow(date, { addSuffix: true, locale: ko })`

### CardContent padding 조정

기본 CardContent는 `p-6 pt-0`. 카드 모바일 특성상 `p-3`으로 오버라이드 필요.

## 검증 방법

1. `npm run type-check` — 타입 오류 0건 확인
2. `npm run lint` — lint 오류 0건 확인
3. 수동 시각 확인 (선택): 스토리북 또는 실제 페이지에 카드 마운트 후 카테고리별 색상, NEW 배지, 이미지 플레이스홀더, 과거 이벤트 opacity 확인
