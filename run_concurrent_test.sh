#!/bin/bash
# =============================================================
# Task 43: approve_participation 동시성 테스트 자동화 스크립트
# =============================================================
#
# 사전 조건:
#   1. Docker Desktop 실행 중이어야 함
#   2. 로컬 Supabase 시작 후 이 스크립트 실행
#      명령어: npx supabase start
#   3. psql 및 pgbench 설치 필요 (PostgreSQL 클라이언트)
#      Windows: https://www.postgresql.org/download/windows/
#      PATH 추가: C:\Program Files\PostgreSQL\16\bin
#      macOS:   brew install postgresql
#      Ubuntu:  sudo apt install postgresql-client
#
# 실행 방법:
#   chmod +x run_concurrent_test.sh   # 최초 1회만 실행
#   ./run_concurrent_test.sh
#
# 환경변수로 DB URL 커스터마이징:
#   DB_URL="postgresql://postgres:mypassword@localhost:54322/postgres" ./run_concurrent_test.sh
# =============================================================

set -e

# =============================================================
# 환경 변수 설정
# =============================================================

# 로컬 Supabase 기본 DB URL (npx supabase start 실행 시 기본값)
DB_URL="${DB_URL:-postgresql://postgres:postgres@localhost:54322/postgres}"

# 스크립트 파일이 위치한 디렉토리를 기준으로 경로 계산
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/supabase/tests/concurrent"

echo "===== Task 43: approve_participation 동시성 테스트 ====="
echo "DB: $DB_URL"
echo "스크립트 디렉토리: $SCRIPT_DIR"
echo ""

# =============================================================
# psql 설치 확인 (필수 의존성)
# =============================================================
if ! command -v psql &> /dev/null; then
  echo "ERROR: psql이 설치되지 않았거나 PATH에 없습니다."
  echo ""
  echo "  설치 방법:"
  echo "    Windows: https://www.postgresql.org/download/windows/"
  echo "             PATH 추가: C:\\Program Files\\PostgreSQL\\16\\bin"
  echo "    macOS:   brew install postgresql"
  echo "    Ubuntu:  sudo apt install postgresql-client"
  exit 1
fi

# =============================================================
# pgbench 설치 확인 (선택적 의존성)
# 없을 경우 psql 병렬 실행 대안 사용 (정확도 낮음)
# =============================================================
USE_PSQL_FALLBACK=false

if ! command -v pgbench &> /dev/null; then
  echo "WARNING: pgbench가 설치되지 않았습니다."
  echo "   PostgreSQL 클라이언트 설치: https://www.postgresql.org/download/windows/"
  echo "   대안: psql 병렬 실행 모드를 사용합니다 (동시성 보장 정확도 낮음)"
  echo ""
  USE_PSQL_FALLBACK=true
fi

# =============================================================
# STEP 1: 테스트 데이터 준비
# cleanup-first 패턴으로 기존 데이터 정리 후 새 데이터 생성
# =============================================================
echo "[1/4] 테스트 데이터 준비..."
psql "$DB_URL" -f "$SCRIPT_DIR/01_setup.sql"
echo "      완료: 호스트 1명 + 참여자 10명, max_participants=5 이벤트 생성"

# =============================================================
# STEP 2: 동시 승인 테스트
# 10개 클라이언트가 동시에 approve_participation 호출
# max_participants=5 이므로 정확히 5개만 approved 되어야 함
# =============================================================
echo ""
echo "[2/4] 동시 승인 테스트 (클라이언트 10개, max_participants=5)..."

if [ "${USE_PSQL_FALLBACK}" = "true" ]; then
  # -------------------------------------------------------
  # pgbench 미설치 시 대안: psql 병렬 프로세스 실행
  # 주의: 운영 체제 스케줄러에 의존하므로 동시성 보장 정밀도가 낮음
  # -------------------------------------------------------
  echo "      psql 병렬 실행 대안 사용..."

  # 테스트 이벤트 ID 조회
  EVENT_ID=$(psql "$DB_URL" -t -c \
    "SELECT id FROM events WHERE title = '[TEST] Concurrent Approval Test' LIMIT 1;" \
    | tr -d ' \n')

  if [ -z "$EVENT_ID" ]; then
    echo "ERROR: 테스트 이벤트를 찾을 수 없습니다. 01_setup.sql 실행을 확인하세요."
    exit 1
  fi

  echo "      이벤트 ID: $EVENT_ID"

  # 10개 psql 프로세스를 백그라운드에서 병렬 실행
  for i in $(seq 0 9); do
    PART_ID=$(psql "$DB_URL" -t -c \
      "SELECT id FROM participations WHERE event_id = '$EVENT_ID' AND status = 'pending' ORDER BY created_at LIMIT 1 OFFSET $i;" \
      | tr -d ' \n')

    if [ -n "$PART_ID" ]; then
      psql "$DB_URL" -c \
        "SELECT approve_participation('$PART_ID'::uuid, '$EVENT_ID'::uuid);" \
        2>/dev/null &
    fi
  done

  # 모든 백그라운드 프로세스 완료 대기
  wait
  echo "      모든 병렬 프로세스 완료"

else
  # -------------------------------------------------------
  # pgbench 실행 (권장 방법)
  # -c 10  : 동시 클라이언트 10개
  # -t 1   : 클라이언트당 트랜잭션 1회
  # -n     : 초기화(VACUUM) 생략
  # -f     : 커스텀 스크립트 파일 지정
  #
  # UUID 변수 치환 우회 전략:
  #   pgbench의 :'var' 문법이 UUID 처리에 실패하는 경우를 대비해
  #   event_id를 psql로 먼저 조회한 뒤, 임시 스크립트에 직접 삽입
  # -------------------------------------------------------

  # event_id를 psql로 미리 조회
  EVENT_ID=$(psql "$DB_URL" -t -c \
    "SELECT id FROM events WHERE title = '[TEST] Concurrent Approval Test' LIMIT 1;" \
    | tr -d ' \n')

  if [ -z "$EVENT_ID" ]; then
    echo "ERROR: 테스트 이벤트를 찾을 수 없습니다. 01_setup.sql 실행을 확인하세요."
    exit 1
  fi

  echo "      이벤트 ID: $EVENT_ID"

  # UUID를 하드코딩한 임시 pgbench 스크립트 생성 (:client_id 는 pgbench 내장 변수)
  PGBENCH_TMP=$(mktemp /tmp/pgbench_task43_XXXXXX.sql)
  cat > "$PGBENCH_TMP" << PGBENCH_SCRIPT
SELECT approve_participation(
  (SELECT id
   FROM participations
   WHERE event_id = '$EVENT_ID'::uuid
     AND status = 'pending'
   ORDER BY created_at
   LIMIT 1 OFFSET :client_id),
  '$EVENT_ID'::uuid
) AS result;
PGBENCH_SCRIPT

  # pgbench는 일부 클라이언트가 예외(max_participants_exceeded)로 종료될 때
  # non-zero exit code를 반환하므로, set -e 의 영향을 받지 않도록 처리
  pgbench -c 10 -t 1 -n -f "$PGBENCH_TMP" "$DB_URL" || true
  rm -f "$PGBENCH_TMP"
fi

# =============================================================
# STEP 3: 결과 검증
# approved 수가 max_participants(5)를 초과하지 않으면 PASS
# =============================================================
echo ""
echo "[3/4] 결과 검증..."
psql "$DB_URL" -f "$SCRIPT_DIR/03_verify.sql"

# =============================================================
# STEP 4: 에러 메시지 및 롤백 확인
# max_participants_exceeded, participation_not_found, event_not_found
# 세 가지 예외 케이스가 올바른 에러를 반환하는지 검증
# =============================================================
echo ""
echo "[4/4] 에러 메시지 및 롤백 확인..."
psql "$DB_URL" -f "$SCRIPT_DIR/04_error_check.sql"

# =============================================================
# 완료 및 정리 선택
# =============================================================
echo ""
echo "===== 테스트 완료 ====="
echo ""
echo "결과 요약:"
echo "  - PASS: approved 수 <= max_participants(5)"
echo "  - FAIL: approved 수 > max_participants(5) → 동시성 문제 발생"
echo ""

read -p "테스트 데이터를 정리하시겠습니까? (y/N): " CLEANUP
if [[ "$CLEANUP" =~ ^[Yy]$ ]]; then
  echo "테스트 데이터 정리 중..."
  psql "$DB_URL" -f "$SCRIPT_DIR/05_cleanup.sql"
  echo "정리 완료"
else
  echo "테스트 데이터가 유지됩니다."
  echo "수동 정리 명령어:"
  echo "  psql \"\$DB_URL\" -f supabase/tests/concurrent/05_cleanup.sql"
fi
