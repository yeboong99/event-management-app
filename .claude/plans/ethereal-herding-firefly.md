# FEAT-001 + FEAT-002 병렬 해결 계획

## Context

`docs/planning/PROJECT_ISSUES.md`에 추적된 두 기능 갭(Feature Gap) 이슈를 해결합니다.

- **FEAT-001**: 비공개 이벤트 RLS SELECT 정책에 승인된 참여자 예외 누락 → 순수 마이그레이션 1개로 해결
- **FEAT-002**: `carpools` 테이블에 UPDATE RLS 정책 및 카풀 수정 기능 전무 → DB + App 레이어 전체 구현 필요

두 이슈는 서로 독립적이므로 병렬로 진행 후, 완료 시 문서를 일괄 업데이트합니다.

---

## 실행 구조 (병렬)

```
[Track A] A1 → (검증)
[Track B] B1 → B2 → B3 → B4 → B5 → (검증)
[완료 후] C: 문서 3종 업데이트
```

---

## Track A: FEAT-001

### Step A1: [nextjs-supabase-fullstack] 마이그레이션 작성 및 적용

**파일 생성:** `supabase/migrations/20260325000400_feat001_private_events_participant_select.sql`

```sql
CREATE POLICY "승인된 참여자도 이벤트 조회 가능"
  ON events FOR SELECT
  USING (is_approved_participant_for_event(id));
```

- `is_approved_participant_for_event()` 함수는 이미 존재 (`20260325000200` 마이그레이션)
- 함수 내부가 `(SELECT auth.uid())` 최적화 적용됨 → 추가 최적화 불필요
- 기존 events 정책 4개는 DROP 없이 유지 (누적 추가)
- MCP `mcp__supabase__apply_migration`으로 적용

**검증:** `mcp__supabase__execute_sql`로 `pg_policies` 확인 → events 정책 6개(기존 4 + 주최자 1 + 신규 1)

---

## Track B: FEAT-002

### Step B1: [nextjs-supabase-fullstack] RLS UPDATE 정책 마이그레이션

**파일 생성:** `supabase/migrations/20260325000500_feat002_carpools_update_rls.sql`

```sql
CREATE POLICY "카풀 수정"
  ON carpools FOR UPDATE
  TO authenticated
  USING (
    driver_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = carpools.event_id
        AND events.host_id = (SELECT auth.uid())
    )
  );
```

- `TO authenticated` 명시 (기존 carpools INSERT/DELETE와 동일)
- `(SELECT auth.uid())` 최적화 패턴 적용
- `WITH CHECK` 생략 → `driver_id`/`event_id` 변경 차단은 RPC에서 처리

### Step B2: [nextjs-supabase-fullstack] update_carpool_info RPC 마이그레이션

**파일 생성:** `supabase/migrations/20260325000600_feat002_update_carpool_info_rpc.sql`

`approve_carpool_request` 패턴 참조 (`supabase/migrations/20260324000100_approve_carpool_request_rpc.sql`)

RPC 설계:

```sql
CREATE OR REPLACE FUNCTION update_carpool_info(
  p_carpool_id      UUID,
  p_departure_place TEXT,
  p_departure_time  TIMESTAMPTZ,  -- NULL 허용
  p_total_seats     INTEGER,
  p_description     TEXT          -- NULL 허용
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approved_count INTEGER;
BEGIN
  -- FOR UPDATE 잠금 (동시성 제어)
  PERFORM id FROM carpools WHERE id = p_carpool_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'carpool_not_found';
  END IF;

  -- 현재 승인된 탑승자 수 조회
  SELECT COUNT(*) INTO v_approved_count
  FROM carpool_requests
  WHERE carpool_id = p_carpool_id AND status = 'approved';

  -- total_seats 감소 방지
  IF p_total_seats < v_approved_count THEN
    RAISE EXCEPTION 'seats_below_approved';
  END IF;

  -- driver_id, event_id 파라미터 제외로 변경 원천 차단
  UPDATE carpools SET
    departure_place = p_departure_place,
    departure_time  = p_departure_time,
    total_seats     = p_total_seats,
    description     = p_description
  WHERE id = p_carpool_id;

  RETURN TRUE;
END;
$$;
```

에러 코드: `carpool_not_found`, `seats_below_approved`

### Step B3: [nextjs-supabase-fullstack] Zod 스키마 + Server Action 추가

**파일 수정:** `lib/validations/carpool.ts`

- `updateCarpoolSchema` 추가: `carpoolId(UUID)` + 등록 폼과 동일한 필드
- `UpdateCarpoolInput` 타입 export

**파일 수정:** `actions/carpools.ts`

- `updateCarpool` Server Action 추가
- `registerCarpool` 패턴 준용: 인증 → 파싱 → 권한 확인 → `supabase.rpc("update_carpool_info", ...)` → revalidatePath
- 에러 매핑:
  - `carpool_not_found` → "카풀을 찾을 수 없습니다"
  - `seats_below_approved` → "현재 승인된 탑승자 수 이상으로만 변경 가능합니다"

### Step B4: [nextjs-ui-markup] CarpoolUpdateForm 컴포넌트

**파일 생성:** `components/forms/carpool-update-form.tsx`

`CarpoolRegisterForm` 구조 기반으로 작성:

- Props: `carpoolId`, `eventId`, `defaultValues: UpdateCarpoolInput`, `approvedCount: number`, `onSuccess?: () => void`
- `useForm` defaultValues에 기존 카풀 데이터 주입
- `totalSeats` 필드에 "현재 승인된 탑승자: N명" 힌트 표시
- submit 시 `updateCarpool` Server Action 호출
- 성공 toast: "카풀 정보가 수정되었습니다."

### Step B5: [nextjs-ui-markup] 수정 버튼 UI 연결

수정 버튼은 드라이버 본인에게만 표시 (주최자는 삭제만 가능 — 소유권 UX 명확화).

**파일 수정:** `components/shared/carpool-tabs.tsx` (또는 `carpool-actions.tsx`)

- `CarpoolEditButton` 컴포넌트 추가 (Pencil 아이콘, `Button variant="ghost" size="sm"`)
- `isDriver` 조건에서 CarpoolDeleteButton 옆에 배치
- 클릭 시 `CarpoolUpdateForm` 인라인 토글 (`CarpoolRegisterToggle` 패턴 참조)

---

## Track C: 문서 업데이트 (A + B 완료 후)

### Step C: [nextjs-supabase-fullstack] 문서 3종 업데이트

**1. `docs/guides/supabase-rls.md`**

- events 테이블 SELECT 정책 테이블: `승인된 참여자도 이벤트 조회 가능` 행 추가
- events 테이블 `⚠️ 주의` 문구 제거
- carpools 테이블 UPDATE 정책 행 추가

**2. `docs/guides/supabase-database-schema.md`**

- 함수 목록에 `update_carpool_info()` 섹션 추가 (파라미터, 에러 코드, SECURITY DEFINER 여부)

**3. `docs/planning/PROJECT_ISSUES.md`**

- 이슈 현황 요약 테이블 업데이트
- FEAT-001: `🟡 잠재적 (비공개 기능 미활성화)` → `✅ 해결됨`
- FEAT-002: `🔴 미해결` → `✅ 해결됨`
- 각 이슈에 해결 일자, 마이그레이션 파일명, 관련 컴포넌트 기재

---

## 수정/생성 파일 목록

| 파일                                                                               | 작업                              |
| ---------------------------------------------------------------------------------- | --------------------------------- |
| `supabase/migrations/20260325000400_feat001_private_events_participant_select.sql` | 생성                              |
| `supabase/migrations/20260325000500_feat002_carpools_update_rls.sql`               | 생성                              |
| `supabase/migrations/20260325000600_feat002_update_carpool_info_rpc.sql`           | 생성                              |
| `lib/validations/carpool.ts`                                                       | 수정 (`updateCarpoolSchema` 추가) |
| `actions/carpools.ts`                                                              | 수정 (`updateCarpool` 추가)       |
| `components/forms/carpool-update-form.tsx`                                         | 생성                              |
| `components/shared/carpool-tabs.tsx`                                               | 수정 (수정 버튼 연결)             |
| `docs/guides/supabase-rls.md`                                                      | 수정                              |
| `docs/guides/supabase-database-schema.md`                                          | 수정                              |
| `docs/planning/PROJECT_ISSUES.md`                                                  | 수정                              |

## 검증

1. `mcp__supabase__apply_migration` 각 마이그레이션 적용
2. `mcp__supabase__execute_sql` → `pg_policies` 확인 (events 6개, carpools 4개)
3. `mcp__supabase__execute_sql` → `pg_proc` 확인 (`update_carpool_info` 존재)
4. `npm run type-check` → TypeScript 오류 없음
5. `npm run lint` → ESLint 통과
6. `npm run build` → 빌드 성공
