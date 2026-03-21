# 플랜: roadmap-update.md 커스텀 커맨드 개선

## Context

`/docs/roadmap-update.md` 커스텀 커맨드는 ROADMAP.md의 체크리스트를 업데이트하는 용도입니다.
현재 `allowed-tools: Read`만 설정되어 있어 **ROADMAP.md를 실제로 편집할 수 없는 치명적인 오류**가 있습니다.

완료 여부는 TaskMaster와 무관하게, **실제 코드베이스와 ROADMAP.md의 완료 기준을 직접 비교**하여 판단해야 합니다.

---

## 문제점 분석

| 항목            | 현재 값                      | 문제                                                   |
| --------------- | ---------------------------- | ------------------------------------------------------ |
| `allowed-tools` | `Read`                       | `Edit` 누락 → 체크박스 수정 불가 (치명적)              |
| `allowed-tools` | `Read`                       | `Glob`, `Grep` 누락 → 파일 존재 여부 및 구현 확인 불가 |
| `model`         | `claude-sonnet-4-5-20250929` | 구버전 모델 ID                                         |
| 프롬프트        | 완료 판단 기준 불명확        | 코드베이스를 어떻게 검증할지 미명시                    |

---

## 수정 계획

### 1. `allowed-tools` 수정

```
Read, Edit, Glob, Grep
```

- `Edit`: ROADMAP.md의 `- [ ]` → `- [x]` 체크박스 변경
- `Glob`: ROADMAP 태스크에 명시된 파일 존재 여부 확인
- `Grep`: 파일 내 특정 구현(함수, 컴포넌트, 설정 등) 존재 여부 확인

### 2. `model` 업데이트

```
claude-sonnet-4-6
```

### 3. 프롬프트 개선 — 완료 판단 기준 명확화

TaskMaster는 완전히 배제하고, 아래 순서로 완료 여부를 판단하도록 명시:

1. ROADMAP.md의 각 태스크에 기술된 **파일 경로**가 실제로 존재하는지 `Glob`으로 확인
2. 해당 파일 내 **완료 기준(완료 기준 항목)**에 명시된 구현이 `Read` / `Grep`으로 존재하는지 확인
3. 위 두 조건을 모두 충족한 경우에만 `[x]`로 표시
4. 하나라도 미충족 시 `[ ]` 유지하고 사용자에게 알림

---

## 수정할 파일

- `.claude/commands/docs/roadmap-update.md`

---

## 최종 파일 내용

```markdown
---
argument-hint: [Phase number]
description: ROADMAP.md 현재 상태 업데이트
allowed-tools: Read, Edit, Glob, Grep
model: claude-sonnet-4-6
---

현재 코드베이스와 ROADMAP.md를 비교하여 개발 로드맵 문서인 docs/planning/ROADMAP.md를 업데이트합니다.

## 완료 여부 판단 기준

TaskMaster는 사용하지 않습니다. 반드시 실제 코드베이스와 ROADMAP.md를 직접 비교하여 판단합니다.

각 태스크에 대해 아래 순서로 검증합니다:

1. ROADMAP.md의 태스크에 명시된 파일 경로가 실제로 존재하는지 Glob으로 확인합니다
2. 해당 파일의 내용을 Read / Grep으로 확인하여 완료 기준 항목이 구현되었는지 검증합니다
3. 위 두 조건을 모두 충족한 경우에만 `[x]`로 표시합니다
4. 하나라도 미충족 시 `[ ]` 유지하고 해당 사항을 사용자에게 보고합니다

## 문서 편집 시 유의사항

1. ROADMAP.md의 진행사항 표현한 체크리스트만 체크표시 및 체크해제 표시할 수 있습니다.
2. 체크 및 체크해제 외의 어떠한 편집도 할 수 없습니다.
3. 만약 argument로 phase number를 입력할 경우, 미완료 사항이 있으면 ROADMAP.md에 체크하지 말고 저에게 알려주세요.
```
