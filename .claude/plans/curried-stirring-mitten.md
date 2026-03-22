# Task 42: approve_participation max_participants 검증 및 예외 처리 구현

## Context

Task 32에서 `approve_participation` RPC 함수의 기본 구조(FOR UPDATE 잠금, event_not_found 예외, 현재 승인자 수 조회)를 작성했으나, 실제 검증 및 승인 처리 로직은 TODO 상태로 남겨졌습니다. Task 42에서 해당 함수를 완성합니다.

- **현재 상태**: `supabase/migrations/20260322000400_create_approve_participation_rpc.sql` — 기본 구조만 존재, `RETURN TRUE` 플레이스홀더
- **목표**: max_participants 초과 검증, participations UPDATE, 예외 처리 완성

## 구현 계획

### 작업할 파일

- **신규 생성**: `supabase/migrations/20260322000500_update_approve_participation_rpc.sql`

> Supabase 마이그레이션 규칙상, 이미 작성된 마이그레이션 파일을 수정하는 대신 새 마이그레이션 파일에 `CREATE OR REPLACE FUNCTION`으로 덮어씁니다.

### 구현 내용

```sql
CREATE OR REPLACE FUNCTION approve_participation(
  p_participation_id UUID,
  p_event_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INT;
  v_max INT;
BEGIN
  -- events 행에 대한 잠금 획득 (동시성 제어)
  SELECT max_participants INTO v_max
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  -- 현재 승인된 참여자 수 조회
  SELECT COUNT(*) INTO v_current_count
  FROM participations
  WHERE event_id = p_event_id AND status = 'approved';

  -- max_participants가 NULL이면 무제한
  IF v_max IS NOT NULL AND v_current_count >= v_max THEN
    RAISE EXCEPTION 'max_participants_exceeded';
  END IF;

  -- 승인 처리
  UPDATE participations
  SET status = 'approved', updated_at = now()
  WHERE id = p_participation_id AND event_id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'participation_not_found';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 핵심 로직

| 조건                                      | 처리                                                       |
| ----------------------------------------- | ---------------------------------------------------------- |
| `p_event_id`에 해당하는 이벤트 없음       | `RAISE EXCEPTION 'event_not_found'`                        |
| `max_participants IS NULL`                | 무제한 — 검증 건너뜀                                       |
| `v_current_count >= v_max`                | `RAISE EXCEPTION 'max_participants_exceeded'`              |
| `p_participation_id`에 해당하는 참여 없음 | `RAISE EXCEPTION 'participation_not_found'`                |
| 정상 승인                                 | `status = 'approved'`, `updated_at = now()`, `RETURN TRUE` |

## 서브에이전트 활용

- **`nextjs-supabase-fullstack` 서브에이전트**가 마이그레이션 파일 생성 및 Supabase MCP를 통한 적용을 담당합니다.
- 에이전트 작업 범위:
  1. `supabase/migrations/20260322000500_update_approve_participation_rpc.sql` 파일 생성
  2. Supabase MCP `apply_migration` 도구로 마이그레이션 적용

## 검증 방법

Supabase MCP (`apply_migration`) 또는 Supabase 대시보드 SQL 에디터에서 다음 시나리오 확인:

1. **정상 승인**: 유효한 `participation_id` + `event_id` → `TRUE` 반환, status = 'approved'
2. **max_participants 초과**: 최대 인원까지 승인 후 추가 승인 시도 → `max_participants_exceeded` 예외
3. **NULL max_participants**: `max_participants = NULL`인 이벤트에서 무제한 승인 가능 확인
4. **존재하지 않는 participation**: 잘못된 UUID → `participation_not_found` 예외
