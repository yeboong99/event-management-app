# Task 11: 이벤트 Zod 스키마 및 공통 타입 정의

## Context

이벤트 생성/수정 기능 구현에 앞서, 클라이언트/서버 양측에서 재사용할 수 있는 Zod 검증 스키마와 TypeScript 공통 타입을 먼저 정의합니다. 이후 Task 12 이상의 이벤트 폼, Server Action 등에서 이 파일들을 import하여 사용합니다.

## 서브에이전트 역할 분담

| 서브에이전트                | 담당 작업                                                    |
| --------------------------- | ------------------------------------------------------------ |
| `nextjs-ui-markup`          | **없음** (UI 없는 순수 타입/검증 작업)                       |
| `nextjs-supabase-fullstack` | **전체** — `lib/validations/event.ts`, `types/event.ts` 생성 |

## 현재 코드베이스 상태

- `types/database.types.ts` — 자동생성 타입 파일, **수정 금지**
  - `event_category` enum: `"생일파티" | "파티모임" | "워크샵" | "스터디" | "운동스포츠" | "기타"`
  - `Constants.public.Enums.event_category` 배열 상수 존재
  - `events` 테이블 Row 타입 존재 (host_id → profiles.id FK)
- `lib/validations/` — 디렉토리 미존재 → 신규 생성 필요
- `types/event.ts` — 미존재 → 신규 생성 필요

## 구현 계획 (nextjs-supabase-fullstack 서브에이전트)

### 1단계: `lib/validations/event.ts` 생성

```typescript
import { z } from "zod";
import { Constants } from "@/types/database.types";

export const eventCreateSchema = z.object({
  title: z
    .string()
    .min(2, "제목은 최소 2자 이상이어야 합니다")
    .max(100, "제목은 최대 100자까지 가능합니다"),
  description: z
    .string()
    .max(2000, "설명은 최대 2000자까지 가능합니다")
    .optional(),
  category: z.enum(Constants.public.Enums.event_category),
  eventDate: z
    .string()
    .refine(
      (date) => new Date(date) > new Date(),
      "이벤트 날짜는 미래 날짜여야 합니다",
    ),
  location: z.string().max(200, "장소는 최대 200자까지 가능합니다").optional(),
  maxParticipants: z.number().int().min(1).max(999).optional(),
  isPublic: z.boolean().default(true),
  coverImageUrl: z.string().url().optional(),
});

export const eventUpdateSchema = eventCreateSchema.partial();
```

### 2단계: `types/event.ts` 생성

```typescript
import { z } from "zod";
import { Database, Constants } from "@/types/database.types";
import { eventCreateSchema, eventUpdateSchema } from "@/lib/validations/event";

export type EventCategory = Database["public"]["Enums"]["event_category"];
export type EventFormData = z.infer<typeof eventCreateSchema>;
export type EventUpdateFormData = z.infer<typeof eventUpdateSchema>;

export type EventWithHost = Database["public"]["Tables"]["events"]["Row"] & {
  host: {
    name: string | null;
    avatar_url: string | null;
  };
};

export const EVENT_CATEGORIES = Constants.public.Enums
  .event_category as readonly EventCategory[];
```

## 주요 검증 규칙

| 필드              | 규칙                           |
| ----------------- | ------------------------------ |
| `title`           | 2–100자, 필수                  |
| `description`     | 0–2000자, 선택                 |
| `category`        | DB enum 값 중 하나, 필수       |
| `eventDate`       | ISO 8601 형식, 미래 날짜, 필수 |
| `location`        | 0–200자, 선택                  |
| `maxParticipants` | 1–999 정수, 선택               |
| `isPublic`        | boolean, 기본값 true           |
| `coverImageUrl`   | URL 형식, 선택                 |

## 참조할 기존 파일

- `types/database.types.ts` — Constants, Database 타입 import 출처
- `lib/utils.ts` — 패턴 참고용

## 검증 방법

```bash
npm run type-check   # TypeScript 타입 에러 없음 확인
npm run lint         # ESLint 통과 확인
```

- `Constants.public.Enums.event_category`를 `z.enum()`에 직접 전달 시 타입 에러 없는지 확인
- `EventWithHost` 타입이 events Row + host 조인 구조와 일치하는지 확인
