# Task 18: 주최자 홈 페이지 구현

## Context

주최자가 앱을 열었을 때 최초로 보게 되는 홈 화면이 현재 스켈레톤 상태("준비 중" 메시지만)로 비어 있음. 의존 태스크(13: Server Actions, 16: EventCardMobile 컴포넌트)가 모두 완료되었으므로 홈 페이지를 구현할 준비가 됨.

**의존 완료 확인:**

- Task 13 (`done`): `actions/events.ts` → `getMyEvents(): Promise<EventWithHost[]>` 사용 가능
- Task 16 (`done`): `components/mobile/event-card-mobile.tsx` → `EventCardMobile` 컴포넌트 사용 가능

---

## 구현 범위

수정 파일: `app/(host)/home/page.tsx` **단 하나**

---

## 담당 에이전트 분배

### nextjs-supabase-fullstack (메인)

전체 페이지 구현:

1. Supabase `createClient()`로 인증 확인 → 미인증 시 `/auth/login` redirect
2. `profiles` 테이블에서 사용자 이름 조회 (`select("name").eq("id", user.id).single()`)
3. `getMyEvents()` 호출 → `recentEvents = events.slice(0, 6)`
4. 조건부 렌더링: 이벤트 있을 때 / 없을 때(빈 상태 UI)
5. FAB (Floating Action Button) → `/events/new`로 이동
6. `npm run type-check` 및 `npm run lint` 검증

> **UI 참고사항** (nextjs-ui-markup 별도 작업 불필요):
> 이 페이지의 마크업은 태스크 상세에 완성 코드가 이미 포함되어 있으므로 단일 에이전트로 처리.
> 레이아웃은 `layout.tsx`의 `MobileHeader` + `HostBottomNav`(h-16) 위에 렌더되므로 `pb-24`로 FAB/탭바 겹침 방지.

---

## 핵심 코드 패턴 (재사용)

| 항목                     | 경로                                      | 사용 방법                                      |
| ------------------------ | ----------------------------------------- | ---------------------------------------------- |
| Supabase 서버 클라이언트 | `lib/supabase/server.ts`                  | `const supabase = await createClient()`        |
| 이벤트 목록 조회         | `actions/events.ts:342`                   | `await getMyEvents()`                          |
| 이벤트 카드              | `components/mobile/event-card-mobile.tsx` | `<EventCardMobile event={e} href={...} />`     |
| EventWithHost 타입       | `types/event.ts`                          | import 없이 getMyEvents 반환타입으로 자동 추론 |

---

## 레이아웃 제약

- `app/(host)/layout.tsx`: `MobileHeader(h-14)` + `main(flex-1 overflow-y-auto)` + `HostBottomNav(h-16)`
- FAB 위치: `fixed bottom-20 right-4 z-50` (탭 네비 h-16 + 여유 4px)
- safe-area: `style={{ marginBottom: "env(safe-area-inset-bottom)" }}`

---

## 구현 상세

```
app/(host)/home/page.tsx
└─ HostHomePage (async Server Component)
   ├─ 인증: supabase.auth.getUser() → redirect("/auth/login")
   ├─ 프로필: profiles.select("name").eq("id", user.id).single()
   ├─ 이벤트: getMyEvents() → slice(0, 6)
   ├─ 렌더
   │   ├─ 인사말 섹션 (user name)
   │   ├─ [이벤트 있을 때]
   │   │   ├─ 헤더 + "전체 보기" 버튼 (events.length > 6일 때만)
   │   │   └─ grid grid-cols-2 gap-3 → EventCardMobile 반복
   │   ├─ [이벤트 없을 때]
   │   │   └─ 빈 상태 UI (아이콘 + 메시지 + "이벤트 만들기" 버튼)
   │   └─ FAB: fixed bottom-20 right-4 → /events/new
```

---

## 검증 방법

1. `npm run type-check` — TypeScript 오류 없음
2. `npm run lint` — ESLint 통과
3. 브라우저 확인 (Playwright 선택):
   - 로그인 후 `/home` 접속 → 이름 인사말 표시
   - 이벤트 있을 때: 2열 그리드, 6개 초과 시 "전체 보기" 표시
   - 이벤트 없을 때: 빈 상태 UI 표시
   - FAB 클릭 → `/events/new` 이동
   - 스크롤 시 FAB 고정 유지
