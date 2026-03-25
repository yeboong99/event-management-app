# 참여자 수 표시 버그 수정 플랜

## Context

이벤트 상세 페이지 및 목록 페이지에서 표시되는 "현재 참여 인원 수"가 로그인한 사용자에 따라 다르게 나타나는 버그 수정.

- **주최자** 로그인 시: 3명 (실제: 4명이 정상)
- **일반 참여자** 로그인 시: 1명 (RLS로 인해 본인 row만 집계)

### 근본 원인

1. **RLS 정책 제한** — `participations` 테이블 SELECT 정책이 `user_id = auth.uid() OR 주최자`만 허용. 일반 참여자가 `participations(count)` 쿼리 시 본인 row(1개)만 반환되어 count = 1 발생
2. **주최자 미포함** — `participations(count)` 는 approved 신청자만 집계, 주최자(host) +1 없음

---

## 수정 방법

### SECURITY DEFINER PostgreSQL 함수 도입

- RLS를 우회하여 집계(count)만 반환 → 개인 정보(user_id) 노출 없이 올바른 수 제공
- 함수 내부에서 주최자 +1 포함
- 목록 페이지 N+1 방지를 위한 배치 함수 별도 생성

---

## 구현 단계

### Step 1: [mcp__supabase__apply_migration] DB 마이그레이션 적용

마이그레이션 이름: `20260325000000_create_participant_count_functions`

```sql
-- 단일 이벤트용: approved 참여자 수 + 주최자 1명 반환
CREATE OR REPLACE FUNCTION get_event_participant_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count  -- +1: 주최자 포함
  FROM participations
  WHERE event_id = p_event_id AND status = 'approved';
  RETURN v_count;
END;
$$;

-- 배치용: 여러 이벤트 ID 한 번에 처리 (N+1 방지)
CREATE OR REPLACE FUNCTION get_events_participant_counts(p_event_ids UUID[])
RETURNS TABLE(event_id UUID, participant_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.event_id,
    (COUNT(*) + 1)::INTEGER AS participant_count  -- +1: 주최자 포함
  FROM participations p
  WHERE p.event_id = ANY(p_event_ids) AND p.status = 'approved'
  GROUP BY p.event_id;
END;
$$;
```

> **주의**: `get_events_participant_counts`는 approved 참여자가 없는 이벤트는 결과 행에 포함되지 않음 → 애플리케이션에서 기본값 `1`(주최자만 있음)로 처리

### Step 2: [nextjs-supabase-fullstack] `actions/events.ts` 3개 함수 수정

**수정 파일**: `actions/events.ts`

공통 변경: `participations(count)` 관련 select/eq 제거 후 RPC 호출로 대체

#### `getEventById` (라인 350-381)

```typescript
// select에서 participations(count) 제거
.select(`*, host:profiles!host_id(name, avatar_url)`)
// .eq("participations.status", "approved") 제거

// 이벤트 조회 후 RPC 호출
const { data: countData, error: countError } = await supabase.rpc(
  "get_event_participant_count",
  { p_event_id: eventId },
);

return {
  ...data,
  current_participants_count: countError ? 1 : (countData ?? 1),
} as EventWithHost;
```

#### `getMyEvents` (라인 387-432)

```typescript
// select에서 participations(count) 제거
// .eq("participations.status", "approved") 제거

// 이벤트 목록 조회 후 배치 RPC
const eventIds = data.map((e) => e.id);
const { data: countsData } = await supabase.rpc(
  "get_events_participant_counts",
  { p_event_ids: eventIds },
);
const countMap = new Map<string, number>(
  (countsData ?? []).map(
    (row: { event_id: string; participant_count: number }) => [
      row.event_id,
      row.participant_count,
    ],
  ),
);
return data.map((item) => ({
  ...item,
  current_participants_count: countMap.get(item.id) ?? 1,
})) as EventWithHost[];
```

#### `getPublicEvents` (라인 438-476)

— `getMyEvents`와 동일한 패턴 적용

---

## 수정하지 않는 것

- `supabase/migrations/20260322000000_create_participations.sql` — 기존 RLS 정책 유지 (개인 정보 보호 목적)
- `types/event.ts` — `EventWithHost.current_participants_count: number` 타입 변경 불필요
- 참여자 목록 조회 함수(`getParticipations`) — 호스트/본인 전용이며 별도 동작

---

## 검증

1. **DB 함수 생성 확인**
   ```sql
   SELECT proname, prosecdef FROM pg_proc
   WHERE proname IN ('get_event_participant_count', 'get_events_participant_counts');
   ```
2. **"E2E 테스트 이벤트"로 RPC 실행**
   ```sql
   SELECT get_event_participant_count('<event_id>');
   -- 기대값: 4 (approved 3 + host 1)
   ```
3. **브라우저 확인** — "이테스트" 계정으로 이벤트 상세 접속 → 4명 표시 확인
4. **빌드 검증** — `npm run type-check && npm run lint`
