# Task 58: TypeScript 타입 재생성 및 카풀 도메인 타입 정의

## Context

Phase 3 카풀 기능 구현을 위해 DB 마이그레이션(task 56, 57)이 완료된 상태입니다.
`carpools`, `carpool_requests` 테이블과 `carpool_request_status` ENUM이 이미 `types/database.types.ts`에 반영되어 있습니다.
이제 카풀 도메인 타입 파일 `types/carpool.ts`를 생성하여 후속 작업에서 타입을 재사용할 수 있게 합니다.

## 현황 파악

- `types/database.types.ts`: `carpools`, `carpool_requests` 테이블 및 `carpool_request_status` Enum이 **이미 반영됨** → 재생성 불필요
- 참고 패턴: `types/participation.ts`, `types/post.ts`, `types/event.ts`
- `EventWithHost` 타입: `types/event.ts`에 정의되어 있음

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] `types/carpool.ts` 신규 파일 생성

`types/participation.ts` 패턴을 따라 아래 타입들을 정의합니다:

**기본 타입:**

```typescript
export type Carpool = Database["public"]["Tables"]["carpools"]["Row"];
export type CarpoolInsert = Database["public"]["Tables"]["carpools"]["Insert"];
export type CarpoolRequest =
  Database["public"]["Tables"]["carpool_requests"]["Row"];
export type CarpoolRequestInsert =
  Database["public"]["Tables"]["carpool_requests"]["Insert"];
export type CarpoolRequestStatus =
  Database["public"]["Enums"]["carpool_request_status"];
```

**조인 타입:**

- `CarpoolWithDriver`: Carpool + profiles(id, name, avatar_url)
- `CarpoolWithDetails`: CarpoolWithDriver + approved_count + carpool_requests?
- `CarpoolRequestWithProfile`: CarpoolRequest + profiles(id, name, avatar_url, email)
- `CarpoolRequestWithCarpool`: CarpoolRequest + carpools(CarpoolWithDriver + events: EventWithHost)
- `CarpoolWithEvent`: Carpool + events(EventWithHost) + approved_count

**수정 파일:**

- `types/carpool.ts` (신규 생성)

## 검증

- `npm run type-check` — 타입 오류 없음 확인
- `carpools`, `carpool_requests` 테이블 타입이 `database.types.ts`에 반영되었는지 확인
- `carpool_request_status` ENUM이 `Enums` 타입에 포함되었는지 확인
