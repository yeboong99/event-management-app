---
argument-hint: [Message]
description: git 커밋 생성
allowed-tools: Bash(git *), Read
model: claude-sonnet-4-5-20250929
---

커밋 메시지: $ARGUMENTS
현재 변경사항을 분석하고 깃 커밋을 생성해주세요.

## 커밋 메시지 형식

순수 Conventional Commits 형식을 사용합니다. 이모지는 사용하지 않습니다.

```
<타입>(<스코프>): <설명>

[본문 - 선택사항]

[푸터 - 선택사항]
```

## 타입 목록

| 타입     | 설명                                           | Bump Level |
| -------- | ---------------------------------------------- | ---------- |
| feat     | 새로운 기능 추가                               | minor      |
| fix      | 버그 수정                                      | patch      |
| docs     | 문서 변경                                      | -          |
| style    | 코드 포맷팅, 세미콜론 누락 등 (로직 변경 없음) | -          |
| refactor | 리팩토링 (버그 수정도, 기능 추가도 아님)       | -          |
| perf     | 성능 개선                                      | patch      |
| test     | 테스트 추가 또는 수정                          | -          |
| chore    | 빌드 프로세스, 보조 도구 변경                  | -          |
| ci       | CI/CD 설정 변경                                | -          |
| build    | 빌드 시스템 또는 외부 의존성 변경              | -          |
| revert   | 이전 커밋 되돌리기                             | -          |

BREAKING CHANGE가 포함된 경우: major 버전 업

## 커밋 규칙

1. **원자적 커밋**: 하나의 커밋은 하나의 논리적 변경사항만 포함
2. **72자 제한**: 헤더(첫 줄)는 72자를 넘지 않도록
3. **명령형 어조**: "추가했다" 가 아닌 "추가" (동사 원형)
4. **스코프**: 변경 영역을 괄호 안에 명시 (선택사항, 예: `feat(auth): ...`)

## BREAKING CHANGE 판단 기준

diff 분석 시 아래 패턴이 감지되면 BREAKING CHANGE 후보로 판단:

- 기존 public API 시그니처 변경/삭제
- 응답/요청 DTO 필드 변경/삭제
- DB 스키마 변경 (컬럼 삭제, 타입 변경 등)
- 설정값/환경변수 이름 변경
- 의존성의 major 버전 업그레이드

## BREAKING CHANGE 사용자 확인 플로우

BREAKING CHANGE로 판단될 경우 바로 커밋하지 말고 사용자에게 확인합니다:

> "major 업데이트로 판단됩니다. BREAKING CHANGE를 푸터에 추가할까요?"

- **승인 시**: 헤더에 `!` 추가 + Footer에 `BREAKING CHANGE: <상세 설명>` 추가

  ```
  feat(api)!: 응답 DTO 필드 구조 변경

  BREAKING CHANGE: userId 필드가 id로 변경됨
  ```

- **거부 시**: minor 레벨로 판단하여 `feat:` 프리픽스로 커밋 생성

## 커밋 분할 기준

다음의 경우 커밋을 분할하여 여러 번 커밋:

- 서로 다른 기능/버그 수정이 섞인 경우
- 프론트엔드/백엔드 변경이 독립적인 경우
- 리팩토링과 기능 추가가 함께 있는 경우

## 올바른 예시

```
feat(auth): JWT 토큰 갱신 기능 추가
fix(api): 사용자 조회 시 null 포인터 예외 수정
docs: API 엔드포인트 문서 업데이트
refactor(service): 중복 로직 공통 메서드로 추출
chore: 의존성 버전 업그레이드
```

## Claude Plans 파일

- 계획 파일을 커밋에서 제외하지 마세요.
- 추후 이전 작업 파악 및 이전 계획에 대해 살펴볼 때 중요한 자료입니다.
