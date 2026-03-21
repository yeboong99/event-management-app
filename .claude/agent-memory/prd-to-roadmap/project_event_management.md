---
name: 이벤트 관리 플랫폼 MVP 프로젝트 컨텍스트
description: Next.js 16 + Supabase 기반 이벤트 관리 플랫폼 MVP의 핵심 아키텍처 결정 사항 및 현재 상태
type: project
---

이벤트 관리 플랫폼 MVP — 소규모 일회성 이벤트의 공지/참여자/카풀/정산을 통합 관리하는 서비스.

**Why:** 사용자가 PRD 기반으로 ROADMAP을 생성 요청함 (2026-03-18). Supabase 스타터 템플릿 위에 구축 중이며, 인증만 완료된 초기 단계.

**How to apply:**

- 현재 DB에는 profiles 테이블만 존재하고 role 컬럼이 없음 — 모든 기능 구현 전에 Migration 001이 선행되어야 함
- TailwindCSS v3에서 v4로 업그레이드 필요 (PRD 명세)
- 3개 라우트 그룹 필요: (host), (participant), admin
- 정산 알고리즘에서 Math.ceil 대신 Math.floor + 나머지 보정 패턴 적용해야 올림 오차 방지
- 참여 승인과 카풀 좌석 승인은 동시성 제어를 위해 Supabase RPC(PostgreSQL 함수) 사용 필요
