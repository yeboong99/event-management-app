# Task 43: approve_participation 동시성 테스트 수행 계획

## Context

Task 42에서 `approve_participation` RPC 함수가 완성되었고 (FOR UPDATE 락 기반 동시성 제어),
Task 43에서 동시성 검증용 테스트 스크립트 5개와 자동화 쉘 스크립트 1개가 이미 작성된 상태입니다.

이번 작업의 목적은 **작성된 테스트 스크립트를 실제 실행하여 결과를 검증**하는 것입니다.

---

## 테스트 구성 파일

| 파일                                              | 역할                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `run_concurrent_test.sh`                          | 전체 테스트 자동화 진입점                                         |
| `supabase/tests/concurrent/01_setup.sql`          | 테스트 데이터 준비 (호스트 1명 + 참여자 10명, max_participants=5) |
| `supabase/tests/concurrent/02_pgbench_script.sql` | pgbench 동시 10클라이언트 승인 스크립트                           |
| `supabase/tests/concurrent/03_verify.sql`         | 결과 검증 (approved ≤ 5이면 PASS)                                 |
| `supabase/tests/concurrent/04_error_check.sql`    | 예외 3종 검증 (max_exceeded / not_found / event_not_found)        |
| `supabase/tests/concurrent/05_cleanup.sql`        | 테스트 데이터 정리                                                |

**검증 대상 함수**: `supabase/migrations/20260322000500_update_approve_participation_rpc.sql`

- 핵심: `FOR UPDATE` 락으로 events 행 선점 → 순차적 max_participants 체크 → UPDATE

---

## 실행 계획

### Step 1: 로컬 Supabase 상태 확인

```bash
npx supabase status
```

- 실행 중이면 → Step 2로
- 미실행이면 → `npx supabase start` 실행 후 Step 2로

### Step 2: 테스트 스크립트 실행

```bash
chmod +x run_concurrent_test.sh
./run_concurrent_test.sh
```

**Supabase 및 PostgreSQL(psql/pgbench) 모두 설치 확인됨 → pgbench 경로로 실행**

### Step 3: 결과 해석

**성공 기준 (PASS)**:

1. `03_verify.sql`: `approved_count <= 5` → `PASS ✓ — 동시성 제어 정상 동작`
2. `04_error_check.sql`: 3개 케이스 모두 `PASS ✓ — 올바른 에러가 발생했습니다`

**실패 기준 (FAIL)**:

- `approved_count > 5` → FOR UPDATE 락이 동작하지 않음
- 에러 케이스에서 예외 미발생 → 예외 처리 로직 버그

### Step 4: 결과에 따른 처리

- **전체 PASS**: `cleanup` 선택(y) → task 43 완료 처리
- **FAIL 발생**: 원인 분석 후 `20260322000500_update_approve_participation_rpc.sql` 수정 검토

---

## 검증 방법

1. `run_concurrent_test.sh` 실행 stdout에서 `PASS ✓` 확인
2. Supabase MCP `execute_sql`로 최종 상태 직접 확인:
   ```sql
   SELECT status, COUNT(*) FROM participations
   JOIN events ON events.id = participations.event_id
   WHERE events.title = '[TEST] Concurrent Approval Test'
   GROUP BY status;
   ```
3. approved 수가 정확히 5인지 확인
