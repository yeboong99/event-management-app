# Task 30: participations 테이블 마이그레이션 및 RLS 정책 구현

## Context

Phase 2 구현의 첫 단계로 참여자 관리 기능의 기반이 되는 `participations` 테이블을 생성한다.
현재 DB에는 `events`, `profiles` 테이블과 `participation_status` ENUM이 이미 존재하며,
`update_updated_at()` 트리거 함수는 Migration 002(events) 적용 시 생성되어 있다.
이 마이그레이션으로 참여 신청/승인/거절/출석 데이터를 저장할 수 있게 된다.

## 현재 DB 상태 (database.types.ts 기준)

- ✅ `profiles` 테이블: 존재
- ✅ `events` 테이블: 존재 (host_id → profiles(id))
- ✅ `participation_status` ENUM: 존재 ('pending' | 'approved' | 'rejected')
- ✅ `event_category` ENUM: 존재
- ✅ `carpool_request_status` ENUM: 존재
- ❌ `participations` 테이블: 미생성 (이번 태스크 대상)

## 스키마 설계 주요 결정 사항

### user_id 외래키

- 태스크 명세: `REFERENCES auth.users(id)`
- 기획 문서: `REFERENCES profiles(id)`
- **결정**: `profiles(id)` 사용 — events 테이블이 `profiles(id)` 참조하는 패턴과 일관성 유지

### RLS UPDATE 정책

- 태스크 명세: 이벤트 주최자만 status/attended 변경 가능
- **결정**: 태스크 명세 준수 (주최자 전용)

### RLS DELETE 정책

- 태스크 명세: 본인의 pending 상태 참여만 삭제 가능
- **결정**: 태스크 명세 준수 (pending 상태 제한)

### 인덱스

- 태스크 명세: `idx_participations_user_id_status ON participations(user_id, status)` (복합)
- **결정**: 태스크 명세 준수 (성능 최적화에 유리)

### update_updated_at_column 함수

- `update_updated_at()` 함수가 이미 존재할 수 있으므로
- `CREATE OR REPLACE FUNCTION update_updated_at_column()` 으로 안전하게 생성
- 두 함수는 이름이 다르므로 충돌 없음

## 구현 계획

### 담당 에이전트: nextjs-supabase-fullstack (UI 없음)

#### 단계 1: 마이그레이션 SQL 파일 작성

**파일**: `supabase/migrations/20260322000000_create_participations.sql`

```sql
-- participations 테이블 생성
CREATE TABLE participations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     participation_status NOT NULL DEFAULT 'pending',
  message    TEXT,
  attended   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 인덱스
CREATE INDEX idx_participations_event_id ON participations(event_id);
CREATE INDEX idx_participations_user_id_status ON participations(user_id, status);

-- updated_at 트리거 함수 (CREATE OR REPLACE로 안전하게)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_participations_updated_at
  BEFORE UPDATE ON participations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 참여 데이터 + 이벤트 주최자는 해당 이벤트 전체 조회
CREATE POLICY "참여자 목록 조회" ON participations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events
      WHERE id = participations.event_id AND host_id = auth.uid()
    )
  );

-- INSERT: 인증 사용자는 자기 자신으로만 참여 신청
CREATE POLICY "참여 신청" ON participations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: 이벤트 주최자만 status/attended 변경 가능
CREATE POLICY "참여 상태 변경" ON participations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = participations.event_id AND host_id = auth.uid()
    )
  );

-- DELETE: 본인의 pending 상태 참여만 삭제 가능
CREATE POLICY "참여 취소" ON participations
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'pending'
  );
```

#### 단계 2: Supabase MCP로 마이그레이션 적용

`mcp__supabase__apply_migration` 도구 사용:

- name: `create_participations`
- query: 위 SQL 전체

#### 단계 3: TypeScript 타입 재생성

`mcp__supabase__generate_typescript_types` 도구로 타입 재생성 후
`types/database.types.ts` 업데이트

## 수정 파일 목록

| 파일                                                           | 작업                                          |
| -------------------------------------------------------------- | --------------------------------------------- |
| `supabase/migrations/20260322000000_create_participations.sql` | 신규 생성                                     |
| `types/database.types.ts`                                      | 자동 재생성 (participations 테이블 타입 추가) |

## 검증 방법

1. **테이블 구조 확인**: `mcp__supabase__execute_sql`로 `\d participations` 실행
2. **UNIQUE 제약 테스트**: 동일 (event_id, user_id) 두 번 INSERT → 에러 발생 확인
3. **RLS 동작 확인**: 비주최자가 UPDATE 시도 → 0 rows affected 확인
4. **트리거 확인**: UPDATE 후 updated_at 갱신 확인
5. **TypeScript 타입 확인**: `database.types.ts`에 participations 테이블 타입 추가 확인
