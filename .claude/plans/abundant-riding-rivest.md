# Plan: 빈 메시지 참여 신청 null 에러 수정

## Context

`participation-form.tsx`에서 message 필드가 비어있을 때 FormData에 추가하지 않는 조건부 로직이 있어, 서버 액션에서 `formData.get("message")`가 `null`을 반환한다. Zod 스키마는 `z.string().optional()`로 `undefined`는 허용하지만 `null`은 허용하지 않아 검증 실패가 발생한다.

**근본 원인:**

```typescript
// participation-form.tsx (현재)
if (data.message) formData.set("message", data.message); // 빈 값이면 FormData에 추가 안 함
// → formData.get("message") === null → Zod 검증 실패
```

**수정 방향:** 클라이언트 폼에서 항상 message 필드를 FormData에 추가 (빈 값이면 빈 문자열로 변환)

## 수정 대상 파일

- `components/forms/participation-form.tsx` — FormData 구성 로직 수정

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] participation-form.tsx message 필드 처리 수정

**수정 위치:** `components/forms/participation-form.tsx`

**변경 내용:**

```typescript
// Before
if (data.message) formData.set("message", data.message);

// After
formData.set("message", data.message ?? "");
```

message 필드를 조건부가 아닌 항상 FormData에 세팅. 값이 없으면 빈 문자열 `""`로 변환하여 서버 액션이 `null` 대신 `""` 수신.

## 데이터 흐름 확인

수정 후 전체 흐름:

1. 사용자가 message 미입력 → `data.message = ""`
2. `formData.set("message", "")` → FormData에 빈 문자열 세팅
3. Server Action: `formData.get("message")` → `""` (null이 아님)
4. Zod: `z.string().optional()` → `""` 통과 (string이므로)
5. DB 저장: `message: message || null` → `null` 저장 (기존 로직 유지)

서버 액션(`actions/participations.ts`)과 Zod 스키마(`lib/validations/participation.ts`)는 변경 불필요.

## 검증 방법

1. 이벤트 상세 페이지 접속
2. [참여 신청] 버튼 클릭
3. message 입력 없이 [참여 신청] 제출
4. 정상 신청 처리 확인 (에러 없음)
5. 메시지 입력 후 제출도 정상 동작 확인
