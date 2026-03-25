# Context

CLAUDE.md의 서브에이전트 섹션이 plan mode에서 자동으로 반영되지 않는 문제를 해결한다.

현재 문제:

1. "적극적으로 활용하세요" — 권장 표현이라 LLM이 무시할 수 있음
2. 지시문이 "언제 활용하라"는 것인지 "plan 파일에 무엇을 포함하라"는 것인지 모호함
3. Plan 파일 자체에 서브에이전트 위임 단계가 포함되어야 한다는 명시가 없음

# 해결 방향

CLAUDE.md의 서브에이전트 섹션을 아래 두 가지 방향으로 강화한다.

## 1. 언어 강도 강화

- "활용하세요" → **IMPORTANT: MUST** 수준의 강제 표현으로 변경
- Claude는 IMPORTANT/MUST 키워드에 민감하게 반응함

## 2. Plan 파일에 포함할 내용 명시

모호한 지시 대신, 플랜 파일의 "구현 단계"에 **어떤 서브에이전트가 어떤 단계를 담당하는지** 명시하도록 지시를 구체화한다.

# 변경 내용 (CLAUDE.md)

기존:

```
## 자주 사용하는 서브에이전트

plan 모드로 작업 계획을 세울 때 작업에서 구현 사항이 있다면 각 구현 분야에 대하여 아래 서브에이전트를 적극적으로 활용하세요.
만약 해당 서브에이전트가 존재하지 않을 경우 보고합니다.

- 일반적인 nextjs + supabase 관련 개발 구현: nextjs-supabase-fullstack 서브에이전트
- ui 관련 개발 구현: nextjs-ui-markup 서브에이전트
```

변경 후:

```
## 서브에이전트 위임 규칙

IMPORTANT: 구현 작업이 포함된 plan을 작성할 때, plan 파일의 구현 단계에 반드시 아래 서브에이전트 위임을 명시해야 합니다.
만약 해당 서브에이전트가 존재하지 않을 경우 보고합니다.

| 작업 유형 | 담당 서브에이전트 |
|---|---|
| Next.js 페이지, Server Action, Supabase 쿼리, API, 인증 등 일반 fullstack 구현 | `nextjs-supabase-fullstack` |
| UI 마크업, 컴포넌트 레이아웃, 스타일링 (비즈니스 로직 없는 순수 UI) | `nextjs-ui-markup` |

MUST: plan 파일의 구현 단계는 아래 형식으로 서브에이전트 위임을 명시할 것:
- 예: "Step 2: [nextjs-supabase-fullstack] 이벤트 목록 Server Action 구현"
- 예: "Step 3: [nextjs-ui-markup] 이벤트 카드 UI 마크업 작성"

plan 모드 종료 후 실행 단계에서 위 서브에이전트들을 Agent 도구로 호출하여 각 단계를 위임한다.
```

# 수정 대상 파일

- `/Users/yeboong99/workspace/projects/event-management/CLAUDE.md` — 서브에이전트 섹션 교체

# 검증 방법

1. CLAUDE.md 수정 후 새 대화에서 plan mode로 구현 태스크 계획 요청
2. Plan 파일에 `[nextjs-supabase-fullstack]`, `[nextjs-ui-markup]` 레이블이 구현 단계에 자동 포함되는지 확인
3. Plan 승인 후 실행 시 해당 서브에이전트가 Agent 도구로 자동 호출되는지 확인
