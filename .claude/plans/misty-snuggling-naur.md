# Task 55: 카풀/정산 Placeholder 페이지 생성

## Context

Phase 3/4에서 구현 예정인 카풀·정산 기능의 탭 링크가 `layout.tsx`의 `EventTabNav`에 이미 존재한다.
해당 탭을 클릭했을 때 404 대신 "준비 중" 안내 메시지를 보여주는 최소 placeholder 페이지를 생성한다.
의존 태스크 Task 54는 `done` 상태이므로 즉시 진행 가능하다.

## 구현 계획

### Step 1: [nextjs-ui-markup] 카풀·정산 Placeholder 페이지 생성

아래 두 파일을 신규 생성한다.

**파일 1:** `app/(app)/events/[eventId]/carpool/page.tsx`

```typescript
export default function CarpoolPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h2 className="text-xl font-semibold">카풀 기능</h2>
      <p className="text-muted-foreground">카풀 기능은 Phase 3에서 제공됩니다.</p>
    </div>
  );
}
```

**파일 2:** `app/(app)/events/[eventId]/settlement/page.tsx`

```typescript
export default function SettlementPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h2 className="text-xl font-semibold">정산 기능</h2>
      <p className="text-muted-foreground">정산 기능은 Phase 4에서 제공됩니다.</p>
    </div>
  );
}
```

## 수정 대상 파일

- (신규) `app/(app)/events/[eventId]/carpool/page.tsx`
- (신규) `app/(app)/events/[eventId]/settlement/page.tsx`

## 검증

1. `/events/[id]/carpool` 접근 → "카풀 기능은 Phase 3에서 제공됩니다" 표시 확인
2. `/events/[id]/settlement` 접근 → "정산 기능은 Phase 4에서 제공됩니다" 표시 확인
3. `layout.tsx`의 공통 레이아웃(커버 이미지, 탭 바)이 정상 적용되는지 확인
4. `npm run type-check` 및 `npm run lint` 통과 확인
