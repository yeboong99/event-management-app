# Task 60: Server Actions — 카풀 등록/삭제 구현

## Context

카풀 기능(Phase 3)의 일환으로, 이벤트 상세 페이지에서 카풀 등록/삭제를 처리하는 Server Actions를 구현합니다.
DB 스키마(`carpools` 테이블)와 Zod 검증 스키마(`lib/validations/carpool.ts`)는 Task 59에서 이미 완료된 상태이며,
`actions/participations.ts` 패턴을 참조하여 일관성 있게 구현합니다.

## 구현 대상 파일

- **신규 생성:** `actions/carpools.ts`

## 참조 파일

- `actions/participations.ts` — Server Actions 작성 패턴 (인증→검증→DB→revalidate→반환)
- `lib/validations/carpool.ts` — `registerCarpoolSchema`
- `types/action.ts` — `ActionResult<T = undefined>`
- `lib/supabase/server.ts` — `createClient()`

## 구현 상세

### Import 경로 확인

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { registerCarpoolSchema } from "@/lib/validations/carpool";
import type { ActionResult } from "@/types/action";
```

### registerCarpool(formData: FormData)

1. `createClient()` → `getUser()`로 인증 확인
2. `formData`에서 필드 추출 (eventId, departurePlace, departureTime, totalSeats, description)
3. `registerCarpoolSchema.safeParse()`로 Zod 검증
4. 권한 확인: `participations` 테이블에서 `status = 'approved'` OR `events.host_id = user.id`
5. `carpools` 테이블에 INSERT (driver_id = user.id)
6. `revalidatePath(\`/events/${eventId}\`)`
7. `{ success: true }` 반환

### deleteCarpool(carpoolId: string, eventId: string)

1. `createClient()` → `getUser()`로 인증 확인
2. `carpools.driver_id` 조회 + `events.host_id` 조회
3. 권한 확인: `driver_id = user.id` OR `host_id = user.id`
4. `carpools` 테이블에서 DELETE
5. `revalidatePath(\`/events/${eventId}\`)`
6. `{ success: true }` 반환

> **Note:** RLS 정책이 DB 레벨에서 이미 권한을 제어하지만, 애플리케이션 레벨에서도 권한 체크를 수행하여 명확한 에러 메시지를 반환합니다.

## 구현 단계

- **Step 1: [nextjs-supabase-fullstack]** `actions/carpools.ts` 파일 생성
  - `registerCarpool` Server Action 구현 (인증 → Zod 검증 → 권한 확인 → INSERT → revalidate)
  - `deleteCarpool` Server Action 구현 (인증 → 권한 확인 → DELETE → revalidate)
  - `actions/participations.ts` 패턴 준수

## 검증

- `npm run type-check` — TypeScript 타입 오류 없음 확인
- `npm run lint` — ESLint 오류 없음 확인
- 주최자/승인된 참여자 → 카풀 등록 성공
- 미승인 사용자 → 등록 거부 (`"카풀을 등록할 권한이 없습니다."`)
- 드라이버 본인 or 주최자 → 카풀 삭제 성공
- 권한 없는 사용자 → 삭제 거부 (`"권한이 없습니다."`)
