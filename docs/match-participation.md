# 경기 본인 참석 응답과 대리 기능 제거

갱신일: 2026-10-28. 사용자 요청으로 F01 운영진 대리 참석 기능을 제거했다. 과거 D-F01 승인·구현 기록은 이력으로만 보존하며 최신 제거 결정을 우선한다.

## 현재 동작

- 경기 상세에서 로그인한 본인이 참여/불참을 선택하고 본인 메모를 저장한다.
- 기존 `PUT /matches/{matchId}/participation`과 참가자 조회를 유지한다. 서버는 인증된 사용자에 연결된 팀원만 수정한다.
- 본인 투표는 기존처럼 SCHEDULED·경기 시작 전·투표 마감 전일 때 가능하다. 메모만 저장하면 기존 응답 시각을 유지한다.
- 운영진의 타인 대리 변경 UI, 대리 변경 API, 상세 이력 API, 현재 응답의 본인/대리 출처 표시를 제거했다. 이전 대리 API를 직접 호출해도 사용할 수 없다.
- 과거 명단 편집(F10), 자체 경기 점수·편 정정(F02), 포메이션·본인 투표는 유지한다.
- 기존 참석/불참·개인 기록·점수·편 배정·메모를 초기화하거나 대리 응답을 추정 취소하지 않는다. 이미 저장된 응답은 일반 참가 기록으로 남는다.

## 제거한 API와 코드

- `PUT /matches/{matchId}/participants/{teamMemberId}/participation`
- `GET /matches/{matchId}/participants/{teamMemberId}/participation-history`
- 참가자 응답의 `participationSource` 필드와 해당 ORM 필드·이력 저장 로직
- 대리 참석 전용 UI·요청/응답 모델·출처 enum·이력 테이블 매핑·전용 테스트

삭제된 두 경로는 404다. 본인 투표의 인증·권한·마감 검사는 유지한다. 대리 기능 제거를 검증하는 최소 BE 회귀로 본인 투표·메모 시각 보존·삭제 API 직접 호출을 확인한다.

## DB에서 정리 가능한 항목

| 대상 | 용도 | 현재 상태 |
| --- | --- | --- |
| `match_participants.participation_source` | SELF/PROXY 출처 | 현재 코드에서 미사용, 정리 가능 |
| `match_participation_histories` 테이블 전체 | 대리/본인 응답 변경자·시각·사유 이력 | 현재 코드에서 미사용, 정리 가능 |

**기능 제거에 DB 삭제가 필수는 아니다.** 이미 적용한 DB에 두 항목이 남아 있어도 새 코드는 사용하지 않는다. 아직 F01 SQL을 적용하지 않았다면 추가하거나 삭제할 필요가 없다.

신규 `schema.sql`에서는 두 항목을 제외했다. 누적 `change_schema.sql`의 기존 F01 블록은 적용 이력을 위해 남기고 폐기 주석을 붙였다. 미적용 DB에는 이 F01 블록을 실행하지 않는다. F02 블록은 독립적으로 유지한다. 누적 파일 전체를 재실행하지 않는다.

사용자의 후속 요청에 따라 [change_schema.sql](../be/src/main/resources/change_schema.sql) 끝에 `F01 removal (2026-10-28)` 블록으로 아래 삭제 DDL을 추가했다. **이미 F01을 적용한 DB에서 선택적으로 정리할 때만** 사용하며 실제 DB에는 실행하지 않았다. 실제 컬럼·테이블의 존재와 사용 여부를 각각 확인하고, 필요하면 기존 이력을 먼저 내보내 보존한 뒤 해당 블록만 검토한다. 테이블을 삭제하면 당시 변경자·사유 이력은 복원 자료 없이 되살릴 수 없다.

```sql
ALTER TABLE match_participants DROP COLUMN participation_source;
DROP TABLE IF EXISTS match_participation_histories;
```

`participation_source`가 없거나 이미 제거했다면 `ALTER TABLE` 문은 건너뛴다. 이 문은 재실행할 수 없다. 테이블 삭제는 `IF EXISTS`로 없는 경우를 허용한다. F01을 적용하지 않은 DB나 신규 설치에서는 삭제 블록 전체가 필요 없다. 기존 F01 생성 블록을 먼저 실행해서 삭제 대상을 만들지 않는다.

`vote_status`, `responded_at`, `actual_participated`, 개인 기록·메모·편 컬럼과 `match_participants` 자체는 삭제 대상이 아니다. F02의 `away_unknown_goal_count`, `away_unknown_assist_count`, `internal_record_confirmed`, `side_assignment_version`도 유지한다.

## 후속 세션

F01을 다시 구현하거나 DB 적용 검증 대기 항목으로 되살리지 않는다. 후속 기능은 [작업 계획](project-improvement-work-plan.md)의 최신 진행표·결정표·마지막 기록을 따른다. 실제 DB·배포 변경은 이 제거 작업에 포함하지 않았다.

제거 검증 결과: BE 관련 44개·FE 기본 18개 테스트, 린트·TypeScript·빌드 통과. 375px·1440px에서 팀장/일반 팀원의 대리 영역·요청 없음과 본인 투표·메모 유지를 모의 API로 확인했다. 실제 MySQL·DB 정리·배포는 미실행이다. 상세 명령·한계는 작업 계획의 최신 제거 기록을 따른다.
