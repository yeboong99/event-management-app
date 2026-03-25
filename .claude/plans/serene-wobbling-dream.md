# 태스크 33: TypeScript 타입 재생성 계획

## Context

태스크 30 (participations 테이블), 41 (posts 테이블 트리거), 43 (approve_participation RPC 동시성 테스트)이 모두 완료된 상태로, DB 스키마가 최신화되었습니다. `types/database.types.ts`를 Supabase 실제 스키마와 동기화하여 `approve_participation` RPC 함수 타입을 포함한 최신 타입을 반영해야 합니다.

### 현재 상태

- `participations`, `posts` 테이블 타입: 이미 존재하지만 재생성으로 최신화 필요
- `approve_participation` RPC 함수 타입: **아직 미반영** (DB Functions 섹션에 없음)
- Supabase 프로젝트 ID: `hevzfzweqykilsxmwsyz`
- 의존 태스크 30, 41, 43: 모두 **done**

---

## 구현 계획

### Step 1: Supabase MCP로 타입 재생성

`mcp__supabase__generate_typescript_types` 도구를 사용하여 현재 DB 스키마 기반 TypeScript 타입을 생성합니다.

### Step 2: `types/database.types.ts` 파일 교체

생성된 타입을 `types/database.types.ts`에 덮어씁니다.

**대상 파일:** `types/database.types.ts`

### Step 3: 검증

생성된 파일에서 다음 항목 존재 여부를 확인합니다:

1. `Database['public']['Tables']['participations']` (Row, Insert, Update)
2. `Database['public']['Tables']['posts']` (Row, Insert, Update)
3. `Database['public']['Functions']['approve_participation']`
4. 기존 `events`, `profiles` 타입 유지
5. `participation_status` 등 Enum 타입 유지

---

## 담당 서브에이전트

**`nextjs-supabase-fullstack` 서브에이전트**가 다음 작업을 수행합니다:

1. `mcp__supabase__generate_typescript_types` 도구로 타입 생성
2. 생성된 타입을 `types/database.types.ts`에 Write 도구로 교체
3. 검증 항목 확인 후 보고

---

## 검증 방법

```bash
npm run type-check
```

- `types/database.types.ts`에서 위 3개 타입 수동 확인
- 타입 오류 없음 확인
