# 기능 오류 수정 기록

> E2E 테스트 중 발견된 기능 오류 및 수정 내역을 기록합니다.
> 테스트 일시: 2026-03-22

---

## [FIX-001] 이벤트 수정 페이지 일시(eventDate) 필드 공백 문제

### 발견 경위

- Task 20.7 Playwright E2E 테스트 중 `/events/[eventId]/edit` 페이지 접근 시 확인
- 이벤트 수정 폼의 `일시 *` 필드가 기존 데이터 없이 빈 상태로 표시됨

### 증상

- 이벤트 상세 → 수정 버튼 클릭 → 수정 페이지 진입
- 제목, 카테고리, 최대 참여자 수, 공개 여부는 기존 값으로 정상 표시
- **일시(eventDate) 필드만 비어 있음**
- 사용자가 날짜를 다시 직접 입력해야 하는 불편함 + 수정하지 않으면 Zod 검증 실패

### 원인 분석

**DB 저장 형식 vs `datetime-local` 입력 형식 불일치**

| 항목                                   | 값 예시                                  |
| -------------------------------------- | ---------------------------------------- |
| Supabase DB `timestamptz`              | `"2026-12-25T19:00:00+00:00"`            |
| `datetime-local` input이 요구하는 형식 | `"2026-12-25T19:00"` (16자, 타임존 없음) |

`edit/page.tsx`에서 `eventDate: event.event_date`로 그대로 전달 시,
`datetime-local` input이 타임존 포함 ISO 문자열을 인식하지 못해 필드를 비워둠.

### 수정 내용

**파일**: `app/(host)/events/[eventId]/edit/page.tsx`

```diff
- eventDate: event.event_date,
+ // datetime-local 입력은 "YYYY-MM-DDTHH:MM" 형식이 필요하므로
+ // DB의 ISO 타임스탬프("2026-12-25T19:00:00+00:00")에서 앞 16자만 추출
+ eventDate: event.event_date ? event.event_date.slice(0, 16) : undefined,
```

### 검증

- `npm run type-check` 통과 ✅
- 수정 후 `/events/[eventId]/edit` 재접근 시 일시 필드에 `2026-12-25T10:00` 정상 표시 ✅
- 제목 수정 후 "수정 완료" 클릭 → 상세 페이지로 리다이렉트 정상 ✅

### 참고 사항

- 표시되는 시간이 UTC 기준(`10:00`)으로, 원래 입력한 KST(`19:00`)와 9시간 차이 발생
- 이는 별도의 UI/UX 개선 사항(`uiux-improvement.md` #UI-006)으로 분류하여 추후 대응 예정
