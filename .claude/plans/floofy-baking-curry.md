# Task 54: 이벤트 상세 페이지 참여 신청 UI 추가

## Context

현재 `app/(app)/events/[eventId]/page.tsx`는 `host_id !== user.id`인 경우 `/my-events`로 강제 리다이렉트한다 (line 67~69). 즉, 비주최자는 이벤트 상세 페이지에 접근 자체가 불가능하다.

Task 54는 비주최자가 이벤트 상세 페이지에 접근했을 때 참여 신청 UI(신청폼/대기/승인/거절)를 보여주는 기능을 구현하는 것이다.

## 수정 대상 파일

- **수정**: `app/(app)/events/[eventId]/page.tsx`
- **신규 생성**: `components/forms/participation-form.tsx`

## 의존 관계 확인

- `actions/participations.ts` — `getParticipationStatus`, `cancelParticipation`, `applyParticipation` 이미 구현됨
- `lib/validations/participation.ts` — `applyParticipationSchema`, `ApplyParticipationInput` 이미 정의됨
- `types/participation.ts` — `ParticipationStatus` 타입 이미 정의됨

## 구현 계획

### Step 1: [nextjs-supabase-fullstack] page.tsx 수정

**변경 포인트**:

1. **호스트 전용 리다이렉트 제거** (line 66-69)
   - 기존 `if (event.host_id !== user.id) redirect("/my-events")` 제거
   - 대신 `const isHost = event.host_id === user.id` 변수 정의

2. **비주최자용 참여 상태 조회 추가**
   - `isHost`가 false일 때 `getParticipationStatus(eventId, user.id)` 호출

3. **JSX 조건부 렌더링 분기**
   - 주최자(`isHost === true`): 기존 UI 그대로 (초대 링크 복사, 수정, 삭제 버튼 + 탭)
   - 비주최자(`isHost === false`): 이벤트 정보(커버, 제목, 날짜, 장소, 인원, 설명) + 참여 상태별 UI
     - `participation === null` → `<ParticipationForm eventId={eventId} />`
     - `participation.status === "pending"` → 대기중 Badge + 취소 form
     - `participation.status === "approved"` → 승인됨 Badge
     - `participation.status === "rejected"` → 거절됨 Badge

**Import 추가**:

```ts
import {
  getParticipationStatus,
  cancelParticipation,
} from "@/actions/participations";
import { ParticipationForm } from "@/components/forms/participation-form";
import { Badge } from "@/components/ui/badge";
```

### Step 2: [nextjs-ui-markup] participation-form.tsx 신규 생성

`components/forms/participation-form.tsx` 생성:

- `"use client"` 컴포넌트
- React Hook Form + `zodResolver(applyParticipationSchema)`
- `useTransition`으로 로딩 상태 관리
- FormData를 직접 생성해 `applyParticipation(formData)` Server Action 호출
- 성공 시 `toast.success`, 실패 시 `toast.error`
- 필드: `message` (Textarea, 선택, 200자 제한)
- 제출 버튼: 로딩 중 "신청 중..." 표시

기존 `post-form.tsx` 패턴 그대로 적용 (Form > FormField > FormItem > FormControl > FormMessage 구조)

## 검증 방법

1. 비주최자 계정으로 이벤트 URL 직접 접근 → 페이지 정상 렌더링 확인 (리다이렉트 없음)
2. 미신청 상태 → 참여 신청 폼 표시 확인
3. 폼 제출 후 → "신청 대기중" Badge + 취소 버튼으로 전환 확인
4. 주최자가 승인 → "참여 승인됨" Badge 표시 확인
5. 주최자가 거절 → "참여 거절됨" Badge 표시 확인
6. 메시지 200자 초과 입력 → 폼 에러 표시 확인
7. 주최자 계정으로 접근 → 기존 호스트 UI(수정/삭제/탭) 정상 표시 확인
