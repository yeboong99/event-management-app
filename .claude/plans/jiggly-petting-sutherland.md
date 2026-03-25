# 플랜: 이벤트 주최자 정보 표시 추가

## Context

이벤트 상세 페이지와 탐색 페이지의 이벤트 카드에 주최자(host) 정보가 표시되지 않는 문제를 해결합니다.
이미 모든 이벤트 쿼리에 `host:profiles!host_id(name, avatar_url)` 조인이 포함되어 있어 데이터는 준비되어 있으나, UI에서 렌더링하지 않고 있습니다.
일정/장소/인원수와 동일한 스타일로 주최자 정보를 추가하여 사용자가 이벤트 주최자를 바로 확인할 수 있게 합니다.

---

## 현황 분석

- **데이터**: 이미 쿼리에 포함됨 (`EventWithHost` 타입, `event.host.name`, `event.host.avatar_url`) — 추가 쿼리 수정 불필요
- **이벤트 상세 페이지**: 일정/장소/인원수 블록(Line 178–203)에 주최자 행만 추가하면 됨
- **이벤트 카드**: `CardContent` 내 참여 현황 아래에 주최자 행 추가하면 됨
- **아이콘**: `UserRound` (lucide-react) — 기존 Calendar/MapPin/Users와 동일한 선 스타일

---

## 수정 대상 파일

| 파일                                      | 변경 내용                                                    |
| ----------------------------------------- | ------------------------------------------------------------ |
| `app/(app)/events/[eventId]/page.tsx`     | import에 `UserRound` 추가, 일정 정보 **위**에 주최자 행 삽입 |
| `components/mobile/event-card-mobile.tsx` | import에 `UserRound` 추가, 참여 현황 아래 주최자 행 삽입     |

---

## 구현 단계

### Step 1: [nextjs-ui-markup] 이벤트 상세 페이지 주최자 정보 UI 추가

**파일**: `app/(app)/events/[eventId]/page.tsx`

1. import에 `UserRound` 추가 (`lucide-react`)
2. 이벤트 정보 블록 (`mb-6 flex flex-col gap-2`) 내 Calendar 행 **위에** 주최자 행 삽입:

```tsx
{
  /* 주최자 */
}
<div className="text-muted-foreground flex items-center gap-2 text-sm">
  <UserRound className="h-4 w-4 shrink-0" />
  <span>{event.host.name ?? "알 수 없음"}</span>
</div>;
```

- 기존 일정/장소/인원수와 동일한 클래스 패턴 적용
- `event.host.name`이 null일 경우 "알 수 없음" 폴백

---

### Step 2: [nextjs-ui-markup] 이벤트 카드 주최자 정보 UI 추가

**파일**: `components/mobile/event-card-mobile.tsx`

1. import에 `UserRound` 추가 (`lucide-react`)
2. 참여 현황 블록 닫힌 후, `</CardContent>` 위에 주최자 행 삽입:

```tsx
{
  /* 주최자 */
}
{
  event.host.name && (
    <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
      <UserRound className="h-3 w-3" />
      <span className="line-clamp-1">{event.host.name}</span>
    </div>
  );
}
```

- 카드 공간 최소화를 위해 `h-3 w-3` + `text-xs` 사용 (기존 카드 패턴 동일)
- `event.host.name`이 없으면 미표시 (조건부 렌더링)
- `line-clamp-1`으로 긴 이름 오버플로우 처리

> Step 1과 Step 2는 독립적이므로 병렬 위임 가능

---

## 검증 방법

1. `npm run dev`로 개발 서버 실행
2. 탐색 페이지(`/discover`)에서 이벤트 카드 하단에 주최자 이름 표시 확인
3. 이벤트 상세 페이지에서 제목 아래 일정 정보 위에 주최자 이름 표시 확인
4. `npm run type-check`로 타입 오류 없음 확인
5. `npm run lint`로 lint 오류 없음 확인
