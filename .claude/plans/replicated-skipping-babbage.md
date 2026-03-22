# Task 14: 이벤트 폼 컴포넌트 구현 + Playwright 통합 테스트

## Context

Task 11(Zod 스키마/타입)과 Task 13(Server Actions)이 완료된 상태에서, 이벤트 생성·수정에 재사용 가능한 `EventForm` 컴포넌트를 구현하고, Playwright MCP로 CRUD 동작을 실제 브라우저에서 검증한다.

## 생성 파일

- `components/forms/event-form.tsx` — 신규 생성 (폴더도 신규)

## 의존 파일 (이미 존재)

| 경로                       | 제공 항목                                                |
| -------------------------- | -------------------------------------------------------- |
| `lib/validations/event.ts` | `eventCreateSchema`                                      |
| `types/event.ts`           | `EventFormData`, `EVENT_CATEGORIES`                      |
| `lib/supabase/storage.ts`  | `validateImageFile`                                      |
| `actions/events.ts`        | `createEvent`, `updateEvent`, `deleteEvent`              |
| `components/ui/`           | button, input, label, textarea, select, checkbox, sonner |

---

## 에이전트 역할 분담 (순차 실행)

### Step 1 — nextjs-ui-markup

**역할**: `components/forms/event-form.tsx`의 정적 마크업 작성

담당 내용:

- `components/forms/` 폴더 생성 및 파일 작성
- `EventFormProps` 타입 정의 (`mode: "create" | "edit"`, `defaultValues?`, `eventId?`)
- 모든 필드의 shadcn/ui 컴포넌트 레이아웃 (Label + 입력 요소)
  - 제목 (Input)
  - 카테고리 (Select + SelectItem × EVENT_CATEGORIES)
  - 일시 (Input type="datetime-local")
  - 장소 (Input)
  - 최대 참여자 수 (Input type="number" min=1 max=999)
  - 설명 (Textarea rows={4})
  - 커버 이미지 (Input type="file" accept="image/jpeg,image/png,image/webp" + 미리보기 img)
  - 공개/비공개 (Checkbox + Label)
- 에러 메시지 표시 영역 (`text-sm text-destructive`)
- 제출 버튼: Loader2 아이콘 + create/edit 모드별 텍스트 분기
- `'use client'` 지시어 및 임포트 구조 작성
- **로직 없음**: 상태/핸들러는 빈 stub으로만 작성

### Step 2 — nextjs-supabase-fullstack

**역할**: Step 1 파일에 폼 로직 연결 및 코드 품질 검증

담당 내용:

- `useForm<EventFormData>({ resolver: zodResolver(eventCreateSchema), defaultValues: { isPublic: true, ...defaultValues } })` 연결
- `register`, `handleSubmit`, `setValue`, `watch`, `formState.errors` 바인딩
- `useTransition` + `isPending` 상태로 버튼 disabled 처리
- `handleImageChange`: `validateImageFile` 검증 → `FileReader` 미리보기 → 실패 시 `toast.error`
- `onSubmit`: FormData 구성 → `createEvent` / `updateEvent` 호출
  - 파일 input은 `document.querySelector('input[name="coverImage"]')`로 참조
- `try/catch` + `toast.error` 에러 핸들링
- `npm run type-check` 및 `npm run lint` 통과 확인

### Step 3 — nextjs-supabase-fullstack (Playwright E2E 테스트)

**역할**: 구현 완료 후 실제 브라우저에서 이벤트 CRUD 검증

**전제**: `pnpm dev` 서버가 실행 중이어야 함 (포트: 3000)

> **브라우저 세션 주의**: Playwright MCP는 기존 브라우저 탭을 공유하지 않고 자체 브라우저를 새로 열기 때문에, 테스트 흐름 안에서 직접 로그인한 뒤 진행합니다. 미리 로그인해둔 탭은 참조할 수 없습니다.

**테스트 계정**:

- 이메일: `yechani99@naver.com`
- 비밀번호: `yclee37647568`

**테스트 항목**:

1. **로그인**: `/auth/login`에서 위 계정으로 로그인
2. **이벤트 생성 (Create)**:
   - 이벤트 생성 페이지 진입
   - 유효한 필드 입력 (제목, 카테고리, 미래 일시)
   - 제출 후 상세 페이지로 리다이렉트 확인
3. **이벤트 수정 (Update)**:
   - 생성한 이벤트 수정 페이지 진입
   - 제목 변경 후 제출
   - 변경된 내용 반영 확인
4. **이벤트 삭제 (Delete)**:
   - 삭제 버튼 클릭 → 확인 다이얼로그 처리
   - 이벤트 목록에서 삭제 확인
5. **클라이언트 검증**:
   - 제목 미입력 상태로 제출 시 에러 메시지 표시 확인
   - 5MB 초과 파일 선택 시 toast 에러 확인

---

## 실행 순서

```
Step 1 (nextjs-ui-markup)
  → Step 2 (nextjs-supabase-fullstack, 로직 연결)
    → Step 3 (nextjs-supabase-fullstack, Playwright 테스트)
```

모든 단계는 동일 파일을 순차적으로 수정하므로 반드시 직렬 실행.

## 최종 검증

- `npm run type-check` 통과
- `npm run lint` 통과
- Playwright 테스트 전 항목 통과
