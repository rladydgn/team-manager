# 경기 참석 응답과 대리 등록

갱신일: 2026-10-28 · F01 구현·로컬 검증 완료. 실제 MySQL 설치·갱신 검증과 운영 적용은 수행하지 않았다. 결정·실행 결과의 기준은 [개선 작업 계획](project-improvement-work-plan.md)의 D-F01과 마지막 작업 기록이다.

## 확정 정책과 화면 흐름

- 팀장·부팀장은 같은 팀의 **ACTIVE 팀원 전체**를 대리 변경할 수 있다. 계정 없는 선수·용병과 회원을 모두 포함하며 회원이 이미 한 응답도 정정할 수 있다.
- 본인 응답은 기존처럼 투표 마감 전·경기 시작 전·SCHEDULED에서 가능하다. 대리 변경 뒤에도 본인이 마감 전에 다시 응답할 수 있다.
- 대리 변경은 경기 시작 전·SCHEDULED·점수 미저장일 때 가능하다. **투표 마감 시각부터 정정 사유가 필수**다. 시작 시각부터, COMPLETED·CANCELED, 또는 점수가 있는 경기는 차단한다.
- 대리 변경은 AVAILABLE/UNAVAILABLE만 지원한다. 탈퇴·가입 대기·삭제·타팀 선수는 새로 등록하거나 대리 변경할 수 없다.
- 경기 상세의 `운영진 대리 참석`에서 선수를 선택하고 응답·사유를 저장한다. 기존 경기 참가 기록이 없는 활성 팀원도 선택할 수 있다. 과거 참가자는 이력 조회만 가능하다.
- 불참으로 바꾸기 전 포메이션 배치 제외 안내를 확인한다. 저장된 배치를 삭제하지 않으며 다시 참석하면 기존 자격을 재평가한다. 자체 경기 신규 참가자는 UNASSIGNED이므로 편 배정 후 해당 편의 포메이션 후보에 표시된다.
- 실제 출석·지각·골·도움·클린시트·경기 점수·편 배정·본인 메모를 대리 투표로 변경하지 않는다. 화면의 본인 메모 초안도 보존한다.
- 일반 팀원에게 현재 응답의 `본인 응답` / `대리 등록`만 표시한다. 출처를 알 수 없는 기존 참석·불참은 `기존 기록`이며 미응답에는 출처를 붙이지 않는다. 상세 변경자·전후 상태·시각·사유는 운영진만 조회한다.

## API 계약

| API | 요청·응답 | 권한 |
| --- | --- | --- |
| `PUT /matches/{matchId}/participation` | 기존 `{ voteStatus, memo? }`. 응답에 `participationSource` 추가 | 인증된 본인, 기존 마감 유지 |
| `PUT /matches/{matchId}/participants/{teamMemberId}/participation` | `{ voteStatus: "AVAILABLE" 또는 "UNAVAILABLE", reason?: string }`. 기존 참가자 응답과 같은 필드 반환 | 현재 팀장·부팀장 |
| `GET /matches/{matchId}/participants/{teamMemberId}/participation-history` | 새 이력부터 반환. `{ id, actorName, source, previousStatus, voteStatus, reason, changedAt }[]` | 현재 팀장·부팀장 |
| `GET /matches/{matchId}/participants` | 기존 필드 + `participationSource: "SELF" 또는 "PROXY" 또는 null` | 기존 활성 팀원 조회 권한 유지 |

성공 응답은 `CommonResponse`를 사용한다. 인증된 사용자 ID는 서버의 request attribute로만 받으며 요청 본문에서 변경자를 받지 않는다. 이력 API와 대리 변경 응답은 `Cache-Control: no-store`다. 일반 참가자 응답에는 변경자·정정 사유를 넣지 않는다.

| 실패 | 실제 HTTP 응답 |
| --- | --- |
| 인증 없음 | 401, 기존 인증 오류 |
| 일반 팀원의 대리 변경·상세 이력 조회, 타팀 접근, 삭제 팀·경기 | 공통 404 `RESOURCE_NOT_FOUND`(서비스의 403·404는 공통 처리) |
| 마감 후 사유 누락·공백, 정리 후 500자 초과 사유 | 400 `INVALID_PROXY_PARTICIPATION_REASON` |
| PENDING·INVITED 대리 요청 | 400 `INVALID_MATCH_PARTICIPATION_REQUEST` |
| 비활성·삭제·타팀·존재하지 않는 대상 | 400 `INVALID_PROXY_PARTICIPATION_TARGET` |
| 시작·종료·취소·점수 저장 후 변경 | 409 `MATCH_PARTICIPATION_CLOSED` |

사유는 앞뒤 공백을 제거하고 빈 문자열은 null로 저장한다. 500자는 Kotlin/JavaScript 문자열 길이 기준이다. FE 차단만 믿지 않고 저장 시각에 서버가 다시 검사한다. 오류가 나면 대상·응답·사유 입력을 유지하며 이력 조회 실패는 빈 이력과 구분해 다시 시도할 수 있다.

## 저장 구조와 이력 범위

`match_participants.participation_source`는 nullable VARCHAR(10)이다. 기존 자료는 null을 유지하고 과거 출처나 이력을 만들어 넣지 않는다. `MatchParticipationHistoriesTable`은 `match_participation_histories`에 경기·대상 팀원·인증 사용자 ID·변경자 이름 스냅샷·response_source·전후 상태·사유·changed_at을 저장한다. 이름 변경 뒤에도 당시 변경자 표시를 보존한다.

경기 행 잠금 아래 참석 응답과 이력을 같은 트랜잭션으로 쓴다. 새 본인 응답·상태 변경·복원은 SELF 이력을 남긴다. 본인 메모만 저장하면 기존 응답 출처·응답 시각을 유지하며 이력을 추가하지 않는다. 운영진의 명시적 대리 저장은 같은 상태를 재확인한 경우도 PROXY 이력을 남긴다. 기존 `respondedAt`은 상태 변경 또는 응답 시각이 없을 때만 갱신하며, 모든 대리 저장의 시각은 이력의 `changedAt`으로 확인한다.

과거 명단 편집은 F10의 별도 경로다. 무변경 저장은 기존 출처를 보존하지만 투표 상태를 바꾸면 출처를 null로 돌려 잘못된 본인/대리 표시를 방지한다. 이 경로의 별도 감사 이력과 경기 기록·회비·역할 이력은 T01-c의 후속 범위다. 이번 참석 이력이 전체 변경 감사 기능을 대신하지 않는다.

## DB 변경 파일과 되돌림

- 빈 DB: [schema.sql](../be/src/main/resources/schema.sql)의 현재 정의 사용. 출처 컬럼과 이력 테이블이 포함된다.
- 기존 DB: [change_schema.sql](../be/src/main/resources/change_schema.sql) 끝의 **`F01 (2026-10-28)` 블록만**, 해당 컬럼·테이블이 아직 없는지와 적용 이력을 확인한 뒤 한 번 적용하는 구조다. 파일 전체를 재실행하지 않는다.
- 신규 UNIQUE·FK·CHECK 제약은 추가하지 않았다. 이력은 경기·대상 팀원 조회용 일반 인덱스를 사용한다.
- 이번 세션은 DDL 파일 준비와 격리 H2 실행만 수행했다. 원격/운영 DB에는 연결하거나 SQL을 적용하지 않았다. 실제 MySQL에서의 DDL·자료형·인덱스 대조는 미실행이다.
- 코드 복구 시 추가한 nullable 컬럼·이력 테이블을 남겨 기존 기록과 신규 이력을 보존할 수 있다. 이미 사용한 이력 테이블·컬럼을 즉시 DROP하지 않는다. 현재 응답을 이력만으로 자동 역산하거나 운영 자료를 일괄 수정하지 않는다.

실제 MySQL 검증을 진행할 다음 세션은 격리 DB에서 신규 설치와 F01 적용 전 구조의 갱신을 각각 실행하고, 기존 투표·개인 기록·메모·편이 그대로인지, 출처가 null인지, 새 이력 쓰기·조회가 가능한지 확인한다. 현재 프로젝트에는 자동 migration 실행을 가정하지 않는다. [개발 안내](development.md)의 DB 파일 구분·적용 이력 기록 원칙을 따른다.

## 검증과 다음 작업

- BE: `ProxyParticipationTest` 7개와 기존 경기 접근·포메이션·기록 보존·통계 회귀를 합해 **39개 통과**. 실제 서비스·저장소와 H2, HTTP 권한·응답 확인은 MockMvc로 검증했다. 신규/기존 SQL 경로는 실제 F01 DDL을 H2 MySQL 호환 모드에서 실행했다.
- FE: 기본 테스트 **18개**, 린트·TypeScript·프로덕션 빌드 통과. 375px·1440px의 임시 Chrome·모의 API로 신규 비회원 등록, 출처 표시, 본인 메모 초안 보존, 마감 후 사유, 오류 후 입력 보존, 이력 재시도, 시작 후 차단·일반 팀원 상세 이력 비노출과 가로 넘침 없음을 확인했다.
- 미실행: 실제 MySQL 설치·갱신·동시성, 전체 BE 테스트, 기본 범위 밖 FE 메모 테스트, 실제 JWT와 BE를 연결한 브라우저 E2E, 운영 적용·배포.

F01의 세 정책 질문은 모두 확정됐다. 후속 F02도 2026-10-28 정책 확정·구현·로컬 검증을 반영했으며 [자체 경기 편별 기록](internal-match-records.md)을 따른다. F01·F02의 실제 MySQL 검증은 남아 있다. 다음 독립 기능 작업은 F04-a이며 D-F04-a를 먼저 질문한다. 배포 관련 변경·CI 구축 제외를 유지한다.
