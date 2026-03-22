# Task 23: 카테고리 탭 가시성 개선 (그라디언트 페이드 힌트)

## Context

`app/(app)/discover/page.tsx`의 카테고리 필터 탭에서 "기타" 등 마지막 카테고리가
화면 밖으로 잘려 스크롤 없이는 보이지 않는 문제를 해결합니다.

현재 구조: 7개 탭 (전체 / 생일파티 / 파티모임 / 워크샵 / 스터디 / 운동스포츠 / 기타)
선택된 방법: **그라디언트 페이드 힌트** — 오른쪽 끝에 배경색 → 투명 그라디언트 오버레이로
더 많은 탭이 있음을 시각적으로 암시. 스크롤 동작 및 레이아웃 유지.

---

## 수정 대상 파일

- `app/(app)/discover/page.tsx` — 28~42번째 줄, 카테고리 탭 컨테이너

## 담당 에이전트

- **nextjs-ui-markup** — 탭 마크업/스타일 수정

---

## 구현 계획

### 변경 내용 (28~42번째 줄)

```tsx
{
  /* 카테고리 세그먼트 탭 (가로 스크롤 + 페이드 힌트) */
}
<div className="relative">
  <div className="overflow-x-auto">
    <Tabs defaultValue={selectedCategory || "all"} className="w-full">
      <TabsList className="inline-flex w-auto gap-2">
        <Link href="/discover">
          <TabsTrigger value="all">전체</TabsTrigger>
        </Link>
        {EVENT_CATEGORIES.map((category) => (
          <Link key={category} href={`/discover?category=${category}`}>
            <TabsTrigger value={category}>{category}</TabsTrigger>
          </Link>
        ))}
      </TabsList>
    </Tabs>
  </div>
  {/* 오른쪽 스크롤 힌트 그라디언트 */}
  <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l to-transparent" />
</div>;
```

### 핵심 포인트

- 외부 `div`에 `relative` 추가
- 스크롤 컨테이너(`overflow-x-auto`)는 그대로 유지
- `pointer-events-none`으로 그라디언트가 탭 클릭을 방해하지 않음
- `from-background`로 다크모드 테마 색상 자동 대응

---

## 검증

```bash
npm run build
```

- `/discover` 접속 → 탭 오른쪽 끝 그라디언트 페이드 확인
- 스와이프/드래그로 숨겨진 탭("운동스포츠", "기타") 접근 가능 확인
- 다크모드 전환 시 그라디언트 색상 정상 대응 확인
- 모바일 에뮬레이션(Chrome DevTools) 터치 스크롤 동작 확인
