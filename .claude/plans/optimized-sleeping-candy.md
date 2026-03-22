# Task 43: approve_participation 동시성 테스트 시나리오 작성

## Context

Task 42에서 완성된 `approve_participation` PostgreSQL 함수의 `FOR UPDATE` 잠금 메커니즘이 실제로 동시 요청에서 `max_participants` 제한을 초과하지 않는지 검증해야 한다. 순수 SQL/Shell 스크립트 작업이며 UI는 없으므로 **nextjs-supabase-fullstack 에이전트**만 사용한다.

## 구현 담당

- **nextjs-supabase-fullstack**: 전체 구현 (SQL 스크립트 5개 + 실행 셸 스크립트 1개)
- **nextjs-ui-markup**: 해당 없음 (UI 작업 없음)

## 생성할 파일 목록

```
supabase/
└── tests/
    └── concurrent/
        ├── 01_setup.sql           — 테스트 데이터 준비
        ├── 02_pgbench_script.sql  — pgbench 동시 실행용 스크립트
        ├── 03_verify.sql          — 결과 검증 쿼리
        ├── 04_error_check.sql     — 에러 메시지 및 롤백 확인
        └── 05_cleanup.sql         — 테스트 데이터 정리
run_concurrent_test.sh             — 전체 자동화 실행 스크립트 (프로젝트 루트)
```

## 핵심 DB 정보

### 테이블 스키마 (참조 파일: `types/database.types.ts`)

- **profiles**: `id` (UUID, FK → auth.users), `email`, `name`
- **events**: `id`, `host_id` (FK → profiles), `title`, `category`, `event_date`, `max_participants` (nullable)
- **participations**: `id`, `event_id` (FK → events), `user_id` (FK → profiles), `status`
- **event_category enum**: `'기타'` 사용 (유효한 값: 생일파티/파티모임/워크샵/스터디/운동스포츠/기타)

### 테스트 대상 함수 (`supabase/migrations/20260322000500_update_approve_participation_rpc.sql`)

- `FOR UPDATE` 잠금으로 동시성 제어
- `max_participants` 초과 시 `max_participants_exceeded` 예외 발생
- 미존재 participation → `participation_not_found` 예외
- 미존재 event → `event_not_found` 예외

## 각 파일 구현 지침

### `01_setup.sql` — 테스트 데이터 준비

- **재실행 안전**: cleanup-first 패턴 (제목 `[TEST] Concurrent Approval Test`로 기존 데이터 먼저 삭제)
- **profiles FK 처리**: `auth.users` FK가 있으므로 superuser 환경에서 `auth.users`에 먼저 INSERT 후 `profiles` INSERT
  - 고정 UUID 사용: `'00000000-0000-0000-0000-000000000001'` (호스트) ~ `'00000000-0000-0000-0001-00000000000a'` (참여자 10명)
  - `ON CONFLICT (id) DO NOTHING`으로 재실행 안전하게 처리
- **이벤트**: `max_participants = 5`, `category = '기타'`, `event_date = now() + INTERVAL '7 days'`
- **참여자**: pending 상태 10명
- 마지막에 생성 확인 SELECT 출력

### `02_pgbench_script.sql` — pgbench 동시 실행용

- pgbench 메타 커맨드 `\gset`로 변수 바인딩
- `:client_id` (0~9) 내장 변수를 OFFSET으로 활용 → 각 클라이언트가 다른 participation 담당
- `approve_participation(p_id::uuid, e_id::uuid)` 호출

```sql
-- 이벤트 ID 조회
SELECT id AS event_id FROM events
WHERE title = '[TEST] Concurrent Approval Test' LIMIT 1 \gset

-- 클라이언트별 고유 participation 선택
SELECT id AS participation_id FROM participations
WHERE event_id = :'event_id' AND status = 'pending'
ORDER BY created_at LIMIT 1 OFFSET :client_id \gset

-- 승인 시도
SELECT approve_participation(:'participation_id'::uuid, :'event_id'::uuid);
```

### `03_verify.sql` — 결과 검증

- 상태별 참여자 수 집계 (approved/pending/rejected)
- `approved COUNT <= max_participants` 검증 → PASS/FAIL 출력
- 승인 시간 순서 상세 조회 (ROW_NUMBER 포함)

### `04_error_check.sql` — 에러 확인

DO 블록 3개:

1. `max_participants_exceeded` 재현: 현재 approved=5인 상태에서 추가 승인 시도
2. `participation_not_found` 재현: `gen_random_uuid()`로 가짜 participation_id 사용
3. `event_not_found` 재현: `gen_random_uuid()`로 가짜 event_id 사용

각 블록에서 `RAISE NOTICE 'EXPECTED ERROR: %', SQLERRM`으로 에러 메시지 출력

### `05_cleanup.sql` — 정리

- participations → events → profiles → auth.users 순서 삭제 (FK 의존성 역순)
- 고정 UUID 패턴으로 삭제 (`id::text LIKE '00000000-0000-0000-%'`)

### `run_concurrent_test.sh` — 자동화 실행

```bash
#!/bin/bash
set -e
DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
# 1. 데이터 준비 → 2. pgbench -c 10 -t 1 -n → 3. 검증 → 4. 에러확인
# 완료 후 cleanup 여부 인터랙티브 확인
```

- Supabase 로컬 포트 기본값: `54322`
- pgbench 미설치 시 bash 백그라운드 프로세스 대안 포함 (주석 처리)

## 사전 설치 및 준비 작업 (nextjs-supabase-fullstack 에이전트가 안내 문서로 작성)

### 0단계: 필요 도구 설치

#### Docker Desktop (Supabase 로컬 환경 필수)

```bash
# 설치 확인
docker --version
# 미설치 시: https://www.docker.com/products/docker-desktop 에서 설치
```

#### Supabase CLI

```bash
# 설치 확인
npx supabase --version

# 미설치 시 (npm 글로벌 설치)
npm install -g supabase
# 또는 npx 사용 (설치 불필요, 매번 최신 버전 실행)
npx supabase --version
```

#### pgbench (PostgreSQL 클라이언트 도구에 포함)

```bash
# 설치 확인
pgbench --version

# Windows: PostgreSQL 설치 시 bin/ 폴더에 자동 포함
# 설치: https://www.postgresql.org/download/windows/ (PostgreSQL 16+)
# 설치 후 PATH에 추가: C:\Program Files\PostgreSQL\16\bin

# 또는 psql만 사용하는 대안 스크립트도 제공 (run_concurrent_test.sh 내 주석 처리된 대안)
```

#### psql (PostgreSQL 클라이언트)

```bash
# pgbench와 동일하게 PostgreSQL 설치에 포함됨
psql --version
```

### 1단계: Supabase 로컬 환경 시작

```bash
# 프로젝트 루트에서 실행
cd C:\Users\HighTech\Desktop\event-management

# Docker Desktop이 실행 중인 상태에서
npx supabase start

# 완료 후 연결 정보 확인
npx supabase status
# → "DB URL: postgresql://postgres:postgres@localhost:54322/postgres" 확인
```

> **포트 충돌 시**: `supabase/config.toml`에서 `db.port` 수정 가능

### 2단계: 마이그레이션 적용 확인

```bash
# 로컬 DB에 마이그레이션이 적용되어 있는지 확인
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'approve_participation';"
# → approve_participation 함수가 존재해야 함

# 미적용 시
npx supabase db reset   # 모든 마이그레이션 재적용
```

## 검증 방법

### 실행 순서

```bash
DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
psql $DB_URL -f supabase/tests/concurrent/01_setup.sql
pgbench -c 10 -t 1 -n -f supabase/tests/concurrent/02_pgbench_script.sql $DB_URL
psql $DB_URL -f supabase/tests/concurrent/03_verify.sql
psql $DB_URL -f supabase/tests/concurrent/04_error_check.sql
```

### 기대 결과

| 검증 항목       | 기대값                      | 의미                                |
| --------------- | --------------------------- | ----------------------------------- |
| approved 수     | **정확히 5**                | FOR UPDATE 잠금 정상 동작           |
| pgbench 실패 수 | 5                           | max_participants_exceeded 정상 예외 |
| 에러 메시지     | `max_participants_exceeded` | 예외 문자열 일치                    |
| 트랜잭션 롤백   | pending 수 불변             | 부분 업데이트 없음                  |

| 실패 판단        | 의미                               |
| ---------------- | ---------------------------------- |
| `approved > 5`   | FOR UPDATE 잠금 실패 — 동시성 버그 |
| pgbench 실패 0개 | 제한 무시 버그                     |

## 참고 파일

- `supabase/migrations/20260322000500_update_approve_participation_rpc.sql` — 테스트 대상 함수
- `supabase/migrations/20260322000000_create_participations.sql` — 테이블 스키마 및 RLS
- `types/database.types.ts` — enum 값 및 타입 정의
