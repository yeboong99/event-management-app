# 조사: 이벤트 삭제 시 CASCADE 설정 확인

## 결과

모든 관련 테이블에 ON DELETE CASCADE가 올바르게 설정되어 있음. 구현 변경 불필요.

| 테이블           | 외래키                    | 설정                 |
| ---------------- | ------------------------- | -------------------- |
| participations   | event_id → events(id)     | ON DELETE CASCADE ✅ |
| posts            | event_id → events(id)     | ON DELETE CASCADE ✅ |
| carpools         | event_id → events(id)     | ON DELETE CASCADE ✅ |
| carpool_requests | carpool_id → carpools(id) | ON DELETE CASCADE ✅ |

carpool_requests는 carpools를 통한 연쇄 삭제로 처리됨.
