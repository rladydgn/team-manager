# 월별 회비 상태

갱신일: 2026-10-29

운영진(팀장·부팀장)은 회비 화면에서 활성 팀원의 월별 상태와 메모를 조회·수정한다. 일반 팀원에게는 기존처럼 조회·수정 권한이 없다.

| API 값 | 표시 |
| --- | --- |
| PAID | 납부 |
| UNPAID | 미납 |
| INJURED | 부상 |
| EXEMPT | 면제 |
| ON_LEAVE | 휴원 |

휴원은 사용자가 요청한 월별 회비 상태다. 선택한 팀원의 해당 연도·월에만 저장하고, 상태 변경 시 기존 메모를 함께 보존한다. 다른 달·팀원 소속 상태·출석·경기 기록을 자동으로 바꾸지 않는다. 휴원 기간 예약이나 이후 월 자동 적용, 청구 금액·미납 합계·알림 정책은 추가하지 않았다. 자료가 없는 달의 기존 기본값 UNPAID는 유지한다.

기존 조회 `GET /teams/{teamId}/fee-payments?paymentYear=2026`와 수정 `PUT /teams/{teamId}/fee-payments`를 유지한다. 수정 예시:

```json
{"teamMemberId":1,"paymentYear":2026,"paymentMonth":10,"status":"ON_LEAVE","memo":"개인 사정으로 휴원"}
```

## DB 적용 구분

- 신규 DB 정의: [schema.sql](../be/src/main/resources/schema.sql)의 `team_fee_payments.status` ENUM에 ON_LEAVE가 포함된다.
- 기존 DB: [change_schema.sql](../be/src/main/resources/change_schema.sql) 끝의 **`Fee ON_LEAVE (2026-10-29)` 블록만** 적용 여부를 확인해 검토한다. 누적 파일 전체를 실행하지 않는다. 이전 F01 삭제 블록과는 독립적이다.
- 기존 ENUM의 PAID·UNPAID·INJURED·EXEMPT 순서 뒤에 ON_LEAVE를 추가하며 기존 상태·메모와 UNPAID 기본값을 유지한다. 기존 자료를 휴원으로 일괄 변경하지 않는다.
- DDL은 파일로 준비했으며 실제 DB에는 실행하지 않았다. 신규/기존 경로는 격리 H2 MySQL 모드로 확인했고 실제 MySQL 검증은 별도다. 구버전 애플리케이션은 ON_LEAVE를 모르는 enum이므로 휴원 자료 저장 후에는 단순히 코드만 되돌려 호환된다고 가정하지 않는다.

과거 팀원·납부 대상 월(F06), 회비 금액·이력(N05/T01)은 별도 미확정 범위다. 휴원 상태 추가가 해당 정책의 확정을 뜻하지 않는다. 후속 작업과 검증 결과는 [작업 계획](project-improvement-work-plan.md)을 따른다.
