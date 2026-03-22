# Task 29: 이벤트 카테고리별 커버 이미지 Placeholder 개선

## Context

커버 이미지가 없는 이벤트 카드/상세 페이지에서 모든 카테고리가 동일한 기본 gradient(`from-primary/20 to-primary/5`)와 Calendar 아이콘을 사용하고 있음. 카테고리별로 다른 색상 gradient와 아이콘을 적용해 시각적 다양성 개선.

## 현재 상태 파악

### 수정 대상 파일

1. `components/mobile/event-card-mobile.tsx` — 카드 커버 이미지 placeholder (h-32)
2. `app/(app)/events/[eventId]/page.tsx` — 상세 페이지 커버 이미지 placeholder (h-48)

### 신규 생성 파일

- `lib/constants/event-gradients.ts` — 카테고리별 gradient 클래스 및 아이콘 매핑 (공유 상수)

### 카테고리 정의 (types/event.ts → database.types.ts)

6개: 생일파티, 파티모임, 워크샵, 스터디, 운동스포츠, 기타

### Tailwind v4 주의사항

- `tailwind.config.ts` 없음 (v4 CSS 기반 스캔 방식)
- 동적 클래스 생성 금지 — 객체 값으로 완전한 클래스 문자열 정의해야 스캐너가 감지
- `event-category-badge.tsx`에서 이미 동일 패턴 사용 중 (참고)

---

## 구현 계획

### Step 1: 상수 파일 생성 (nextjs-ui-markup 에이전트)

**파일**: `lib/constants/event-gradients.ts`

```typescript
import {
  BookOpen,
  Briefcase,
  Calendar,
  Dumbbell,
  Music,
  PartyPopper,
} from "lucide-react";
import type { EventCategory } from "@/types/event";

// 완전한 클래스 문자열로 정의 (Tailwind v4 스캐너 감지용)
export const CATEGORY_GRADIENTS: Record<EventCategory, string> = {
  생일파티: "from-pink-400 to-purple-500",
  파티모임: "from-orange-400 to-yellow-400",
  워크샵: "from-blue-400 to-indigo-500",
  스터디: "from-green-400 to-teal-500",
  운동스포츠: "from-red-400 to-orange-500",
  기타: "from-slate-400 to-gray-500",
};

export const CATEGORY_ICONS = {
  생일파티: PartyPopper,
  파티모임: Music,
  워크샵: Briefcase,
  스터디: BookOpen,
  운동스포츠: Dumbbell,
  기타: Calendar,
} satisfies Record<EventCategory, React.ComponentType<{ className?: string }>>;
```

### Step 2a: EventCardMobile 수정 (nextjs-ui-markup 에이전트)

**파일**: `components/mobile/event-card-mobile.tsx`

- `CATEGORY_GRADIENTS`, `CATEGORY_ICONS` import
- 커버 영역 className: 이미지 없을 때 `bg-gradient-to-br ${gradientClass}` 적용
- Calendar 아이콘 → 카테고리별 `CategoryIcon` 사용
- 아이콘 색상: `text-white/60`

### Step 2b: 이벤트 상세 페이지 수정 (nextjs-supabase-fullstack 에이전트)

**파일**: `app/(app)/events/[eventId]/page.tsx`

- `CATEGORY_GRADIENTS`, `CATEGORY_ICONS` import from `@/lib/constants/event-gradients`
- 기존 `bg-gradient-to-br from-primary/20 to-primary/5` → 카테고리별 gradient로 교체
- `<img>` 태그 유지 (기존 ESLint ignore 주석 포함)
- Calendar 아이콘 → `CategoryIcon`, 색상 `text-white/60`

---

## 에이전트 분담

| 에이전트                      | 담당 작업                                                              |
| ----------------------------- | ---------------------------------------------------------------------- |
| **nextjs-ui-markup**          | `lib/constants/event-gradients.ts` 생성 + `event-card-mobile.tsx` 수정 |
| **nextjs-supabase-fullstack** | `app/(app)/events/[eventId]/page.tsx` 수정                             |

- Step 1 + 2a는 nextjs-ui-markup이 순차 처리
- Step 2b는 상수 파일 경로(`@/lib/constants/event-gradients`)를 미리 알고 있으므로 병렬 가능

---

## 검증 방법

1. `npm run type-check` — EventCategory 타입 호환성 확인
2. `npm run build` — Tailwind v4 gradient 클래스 빌드 포함 확인
3. 브라우저에서 6개 카테고리 카드 및 상세 페이지 시각적 확인
