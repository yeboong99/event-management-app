# Task 32: approve_participation RPC 함수 구조 작성 및 FOR UPDATE 잠금 구현

## Context

참여자 승인 시 동시에 여러 요청이 들어올 경우 정원 초과 승인이 발생할 수 있다. 이를 막기 위해 PostgreSQL의 `FOR UPDATE` 행 레벨 잠금을 사용하는 `approve_participation` RPC 함수를 Supabase 마이그레이션으로 구현한다. Task 30(participations 테이블)이 완료되었으므로 이 태스크를 진행 가능하다. Task 42에서 정원 초과 검증 및 상태 변경 로직이 추가될 예정이다.

## 구현 대상 파일

### 생성: `supabase/migrations/20260322000400_create_approve_participation_rpc.sql`

기존 마이그레이션 타임스탬프가 `20260322000300`까지 존재하므로 `20260322000400`을 사용한다.

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
  -- FOR UPDATE: 트랜잭션 종료 전까지 다른 세션의 동일 행 잠금 차단
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

  -- max_participants 검증 및 승인 처리는 Task 42에서 구현
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**핵심 설계 포인트:**

- `FOR UPDATE`: events 행에 잠금을 걸어 동시 승인 요청 시 직렬화 보장
- `SECURITY DEFINER`: RLS를 우회하여 함수 소유자 권한으로 실행 (서버 측 로직)
- `p_` 접두사: 함수 인자 명명 규칙
- `v_` 접두사: 로컬 변수 명명 규칙
- `event_not_found` 예외: 존재하지 않는 이벤트 호출 방어

## 구현 전략

- nextjs-supabase-fullstack 서브에이전트로 SQL 마이그레이션 파일 생성
- 별도 타입 파일 수정 불필요 (RPC 함수는 database.types.ts에 반영 불필요)

## 검증 방법

1. 마이그레이션 파일이 올바른 경로에 생성되었는지 확인
2. `SELECT approve_participation('<참여ID>', '<이벤트ID>')` 호출 시 `TRUE` 반환 확인
3. 존재하지 않는 이벤트 ID 호출 시 `event_not_found` 예외 발생 확인
4. (선택) 두 세션에서 동시 호출 시 하나가 대기(블로킹)되는지 확인
