# approve_participation 동시성 테스트

Task 43: `approve_participation` 함수의 `FOR UPDATE` 잠금이 `max_participants` 제한을 올바르게 적용하는지 동시성 시나리오로 검증합니다.

## 사전 조건

### 1. Docker Desktop 설치 및 실행

- [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- macOS: `brew install --cask docker`

### 2. Supabase CLI

```bash
npm install -g supabase
# 또는 npx supabase (설치 없이 사용)
```

### 3. PostgreSQL 클라이언트 (psql + pgbench)

```bash
# macOS
brew install postgresql

# 설치 확인
psql --version
pgbench --version
```

## 실행 방법

### 자동 실행 (권장)

프로젝트 루트에서 실행합니다.

```bash
# 1. Supabase 로컬 환경 시작
npx supabase start

# 2. 마이그레이션 적용 확인
npx supabase status
# → DB URL 메모 (보통 postgresql://postgres:postgres@localhost:54322/postgres)

# 3. 테스트 실행
chmod +x run_concurrent_test.sh
./run_concurrent_test.sh
```

### 수동 실행

```bash
DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# 1. 테스트 데이터 준비 (이벤트 1개 max=5, pending 참여자 10명)
psql $DB_URL -f supabase/tests/concurrent/01_setup.sql

# 2. 동시 승인 테스트 (10개 클라이언트 동시 실행)
pgbench -c 10 -t 1 -n -f supabase/tests/concurrent/02_pgbench_script.sql $DB_URL

# 3. 결과 검증 (approved=5인지 확인)
psql $DB_URL -f supabase/tests/concurrent/03_verify.sql

# 4. 에러 메시지 및 롤백 확인
psql $DB_URL -f supabase/tests/concurrent/04_error_check.sql

# 5. 테스트 데이터 정리
psql $DB_URL -f supabase/tests/concurrent/05_cleanup.sql
```

## 기대 결과

| 항목                 | 기대값                      | 의미                                       |
| -------------------- | --------------------------- | ------------------------------------------ |
| approved 수          | **정확히 5**                | FOR UPDATE 잠금 정상 동작                  |
| pgbench 실패 수      | 5                           | `max_participants_exceeded` 예외 정상 발생 |
| 에러 메시지          | `max_participants_exceeded` | 예외 문자열 일치                           |
| pending 수 (검증 후) | 5                           | 롤백으로 부분 업데이트 없음                |

## 실패 판단 기준

| 조건             | 의미                                 |
| ---------------- | ------------------------------------ |
| `approved > 5`   | `FOR UPDATE` 잠금 실패 — 동시성 버그 |
| pgbench 실패 0건 | `max_participants` 제한 무시 버그    |

## 파일 구성

| 파일                           | 역할                             |
| ------------------------------ | -------------------------------- |
| `01_setup.sql`                 | 테스트 데이터 준비 (재실행 안전) |
| `02_pgbench_script.sql`        | pgbench 전용 동시 실행 스크립트  |
| `03_verify.sql`                | 결과 검증 및 PASS/FAIL 출력      |
| `04_error_check.sql`           | 에러 3종 재현 및 롤백 확인       |
| `05_cleanup.sql`               | 테스트 데이터 정리               |
| `../../run_concurrent_test.sh` | 전체 자동화 실행 스크립트        |
