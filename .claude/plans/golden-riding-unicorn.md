# Task 26: 이벤트 수정 페이지 시간 표시 KST 변환

## Context

DB의 `event_date` 컬럼은 `timestamptz` 타입으로 UTC로 저장됩니다.
편집 페이지(`app/(app)/events/[eventId]/edit/page.tsx`)에서 현재 `event.event_date.slice(0, 16)`로 앞 16자만 잘라 datetime-local input에 넣고 있는데,
이는 UTC 시각 그대로를 표시해 KST보다 9시간 빠르게 보이는 문제가 있습니다.

또한 저장 시에도 datetime-local 값(`YYYY-MM-DDTHH:mm`, 타임존 정보 없음)을 그대로 DB에 넣어
PostgreSQL이 타임존 없는 문자열을 서버 로컬(UTC)로 해석하므로 실제 KST 기준 시각이 DB에 잘못 저장됩니다.

## 에이전트 역할 분담

이 태스크는 **UI 마크업 변경 없이 순수 데이터 로직 변환** 작업이므로:

- **nextjs-supabase-fullstack** 에이전트가 모든 작업 담당
- nextjs-ui-markup 에이전트는 사용하지 않음 (UI 변경 없음)

## 구현 계획

### 담당: nextjs-supabase-fullstack

**Step 1 — lib/utils.ts: KST 변환 유틸리티 추가**

```typescript
import { addHours, format } from "date-fns";

// UTC ISO → KST datetime-local (표시용)
export function utcToKstDatetimeLocal(utcIsoString: string): string {
  const utcDate = new Date(utcIsoString);
  const kstDate = addHours(utcDate, 9);
  return format(kstDate, "yyyy-MM-dd'T'HH:mm");
}

// KST datetime-local → UTC ISO (저장용)
export function kstDatetimeLocalToUtc(datetimeLocal: string): string {
  const kstDate = new Date(`${datetimeLocal}:00+09:00`);
  return kstDate.toISOString();
}
```

**Step 2 — app/(app)/events/[eventId]/edit/page.tsx: defaultValues 수정**

현재:

```typescript
eventDate: event.event_date ? event.event_date.slice(0, 16) : undefined,
```

변경 후:

```typescript
import { utcToKstDatetimeLocal } from '@/lib/utils';
// ...
eventDate: event.event_date ? utcToKstDatetimeLocal(event.event_date) : undefined,
```

**Step 3 — actions/events.ts: 저장 시 UTC 역변환**

`createEvent`와 `updateEvent` 모두에서 eventDate를 DB에 넣기 전 UTC로 변환:

```typescript
import { kstDatetimeLocalToUtc } from "@/lib/utils";
// ...
event_date: (kstDatetimeLocalToUtc(eventDate), // createEvent
  (updateData.event_date = kstDatetimeLocalToUtc(eventDate))); // updateEvent
```

## 수정 파일 목록

| 파일                                       | 변경 내용                                                       |
| ------------------------------------------ | --------------------------------------------------------------- |
| `lib/utils.ts`                             | `utcToKstDatetimeLocal`, `kstDatetimeLocalToUtc` 함수 추가      |
| `app/(app)/events/[eventId]/edit/page.tsx` | `slice(0, 16)` → `utcToKstDatetimeLocal()` 사용                 |
| `actions/events.ts`                        | `createEvent`, `updateEvent`에서 `kstDatetimeLocalToUtc()` 사용 |

## 검증

1. `npm run type-check` 통과 확인
2. `npm run build` 통과 확인
3. 이벤트 생성: 19:00(KST) 입력 → DB에 `T10:00:00Z` 저장 확인
4. 이벤트 수정 페이지: datetime-local input에 `19:00` 표시 확인 (UTC `10:00` 아님)
