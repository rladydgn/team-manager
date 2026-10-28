# 자체 경기의 편별 점수와 기록 정정

갱신일: 2026-10-28 · D-F02 세 정책 확정, F02 구현·로컬 검증 완료. 실제 MySQL 설치·갱신 검증은 미실행이므로 [작업 계획](project-improvement-work-plan.md)의 상태는 검증 중이다. 배포 설정이나 운영 DB를 변경하지 않았다.

## 확정한 동작

- 자체 경기는 HOME/AWAY별 개인 골과 편별 미상 골을 더한다. 홈 2골·어웨이 1골은 **홈 2 : 어웨이 1**이다. 각 편의 개인+미상 어시스트 합계는 그 편의 개인+미상 골 합계 이하여야 한다.
- 골·도움·클린시트가 있는 선수는 HOME/AWAY를 지정해야 한다. UNASSIGNED인 선수는 실제 출석·지각만 기록한다. 불참+개인 기록·지각 차단(F03)을 유지한다.
- 기록 저장 후에는 일반 편 배정 API·화면에서 편만 바꿀 수 없다. 경기 기록 화면에서 참가자 편·개인 기록·편별 미상 기록을 함께 저장하고 점수를 다시 계산한다.
- 투표·메모·응답 시각·탈퇴한 기존 참가자·포메이션 원본 배치를 보존한다. 편 변경으로 반대편이 된 기존 배치는 SIDE_MISMATCH로 표시한다. 기록 편 정정 때문에 투표를 AVAILABLE로 바꾸지 않는다. F01 대리 참석·출처 표시는 이후 사용자 요청으로 제거했다.
- 자체 경기는 팀 전체의 승·무·패 배지를 표시하지 않고 목록·상세에 편별 결과를 표시한다. 외부 경기의 우리 팀·상대 점수와 승무패는 유지한다.

## 기존 자체 경기의 수동 전환

`internalRecordConfirmed=false`이고 완료 상태 또는 저장된 점수가 있는 자체 경기는 **편별 기록 확인 필요**다. 기존 점수·개인 기록·미상 기록·편은 조회만으로 재계산하거나 저장하지 않는다. 기존 HOME 값은 예전 기본값일 수 있으므로 자동 전환의 근거로 삼지 않는다.

운영진은 기록 화면에서 기존 점수와 미상 골·도움을 확인하고 선수 편을 정정한다. 기존 미상 기록을 HOME에 자동 귀속하지 않도록 **편별 미상 입력은 0부터 시작**하며 기존 값은 별도 안내에 표시한다. 새 점수는 저장 전 미리보기다.

운영진이 편별 미상 기록을 직접 입력하고 `기존 점수·미상 기록과 편 배정을 확인했으며 편별 기록으로 전환합니다`를 선택해야 저장할 수 있다. 서버도 전환 동의를 검사한다. 전환 저장 시에만 새 점수·미상 기록·편을 명시적 정정으로 반영하고 `internalRecordConfirmed=true`가 된다.

확인 전 원본은 보존하지만 **사용자가 전환 저장한 뒤의 이전 점수 스냅샷·정정 감사 이력은 이번 범위에 없다**. T01-c의 후속 범위다. 코드 되돌리기가 이미 정정한 값을 자동 복원하지 않는다.

## 기록 저장 API

기존 `PUT /matches/{matchId}/record`에 `internalRecord`와 참가자별 `teamSide`를 추가했다. 인증·운영진 권한은 기존 서버 검사를 따른다. 외부 경기는 기존 본문을 유지하며 `internalRecord`를 보내면 거절한다.

```json
{
  "opponentScore": 0,
  "unknownGoalCount": 0,
  "unknownAssistCount": 0,
  "internalRecord": {
    "sideAssignmentVersion": 1,
    "homeUnknownGoalCount": 0,
    "homeUnknownAssistCount": 0,
    "awayUnknownGoalCount": 0,
    "awayUnknownAssistCount": 0,
    "confirmLegacyConversion": false
  },
  "participants": [
    { "teamMemberId": 1, "teamSide": "HOME", "actualParticipated": true, "late": false, "goalCount": 2, "assistCount": 0, "cleanSheetCount": 0 },
    { "teamMemberId": 2, "teamSide": "AWAY", "actualParticipated": true, "late": false, "goalCount": 1, "assistCount": 0, "cleanSheetCount": 0 }
  ]
}
```

예시는 두 명만 참가하는 경기다. 실제 요청에는 탈퇴자를 포함해 해당 경기의 미삭제 기존 참가자 전원을 중복 없이 보낸다. 자체 경기는 모든 참가자의 `teamSide`와 `internalRecord`가 필수다. 루트의 `opponentScore`·`unknownGoalCount`·`unknownAssistCount`는 0이며, 편별 미상 값은 중첩 필드로 보낸다. 개인·미상 기록은 각각 기존과 같은 0~99 범위를 검사한다.

경기 응답 추가 필드:

| 필드 | 의미 |
| --- | --- |
| `sideAssignmentVersion` | 현재 편/자체 기록 버전. 자체 기록 저장에 필요 |
| `internalRecordConfirmed` | 새 편별 기준으로 저장됐는지. 기존 값은 false |
| `awayUnknownGoalCount`, `awayUnknownAssistCount` | 편별 저장 이후 어웨이 미상 기록 |

확인된 자체 경기에서 `teamScore`는 HOME, `opponentScore`는 AWAY, 기존 `unknownGoalCount`·`unknownAssistCount`는 HOME 미상 기록이다. 외부 경기와 미전환 과거 자체 경기는 기존 의미·원본 값을 유지한다. 클라이언트는 **경기 유형과 확인 여부를 함께 검사**해야 한다.

## 충돌·권한·원자성

경기 행 잠금과 같은 트랜잭션에서 전체 참가자 검증, 기록·편 갱신, 점수·확인 상태·버전 갱신을 수행한다. 성공한 자체 기록 저장은 편이 바뀌지 않아도 `sideAssignmentVersion`을 1 증가시킨다. 일반 편 배정도 같은 버전을 증가시키므로 오래된 편이나 기록에 기반한 저장은 거절된다.

| 조건 | 응답 |
| --- | --- |
| 필드 누락·편 미지정 양수 기록·루트 점수 혼용·잘못된 미상 값 | 400 `INVALID_INTERNAL_MATCH_RECORD` 또는 기존 기본 입력 오류 |
| 편별 도움 합계가 그 편의 골보다 큼 | 400 `INVALID_MATCH_ASSIST_COUNT` |
| 오래된 버전 | 409 `INTERNAL_MATCH_RECORD_VERSION_CONFLICT` |
| 기존 경기 전환 동의 없음 | 409 `INTERNAL_MATCH_RECORD_CONFIRMATION_REQUIRED` |
| 기록이 있는 경기의 일반 편 배정 저장 | 409 `MATCH_SIDE_ASSIGNMENT_RECORD_EDIT_REQUIRED` |
| 취소 경기 기록 저장 | 기존 409 `MATCH_RECORD_UNAVAILABLE` |
| 비운영진·다른 팀·삭제 팀/경기 | 기존 인증·권한 검사, 403/404는 공통 404 |

FE는 충돌 시 편·개인/미상 기록·전환 동의를 유지하고 저장을 잠근다. `최신 기록 다시 불러오기`에서 입력을 버릴지 확인한 경우에만 초기화한다. 자동으로 최신 버전을 붙여 오래된 입력을 다시 저장하지 않는다.

`GET /matches/{matchId}/participant-sides`에는 `recordEditingRequired`를 추가했다. COMPLETED 또는 어느 한쪽 점수가 저장된 경기면 `canManage=false`와 기록 화면 링크를 제공한다. 포메이션 목록의 `canAssignSides`도 제한한다. 기록 전의 일반 편 배정은 유지한다.

버전 보호는 F02 자체 기록과 편 배정에 한정한다. 외부 기록·회비·역할 등 전체 T01 보호와 정정 감사 이력을 완료했다는 뜻은 아니다. 미래 경기 기록 확정·취소 정책 변경은 F04의 별도 미확정 범위다.

## 스키마·복구·검증

[schema.sql](../be/src/main/resources/schema.sql)에 `matches.away_unknown_goal_count`, `away_unknown_assist_count`(0 기본값), `internal_record_confirmed`(false 기본값)를 추가했다. 기존 DB는 [change_schema.sql](../be/src/main/resources/change_schema.sql) 끝의 **`F02 (2026-10-28)` 블록만** 미적용 여부를 확인해 한 번씩 적용하는 구조다. 세 ALTER 문을 사용하므로 부분 적용 여부도 컬럼별로 확인한다. 파일 전체나 이미 적용한 F01을 재실행하지 않는다.

기존 점수·미상 기록·편을 바꾸는 UPDATE와 신규 UNIQUE·FK·CHECK는 없다. 실제 F02 신규/기존 SQL을 격리 H2 MySQL 호환 모드에서 실행해 원본 점수·미상 값·확인 false·버전 보존과 ORM 조회를 확인했다. 실제 MySQL·운영 DB에는 연결하거나 적용하지 않았다.

코드 복구 시 추가한 컬럼은 남겨 자료를 보존할 수 있다. 다만 이전 코드로 자체 기록을 저장하면 편별 기록을 예전 합산 방식으로 덮어쓸 수 있으므로 코드 되돌림만으로 안전한 편집을 보장하지 않는다. 자체 기록 편집 재개 전 호환성을 확인해야 한다. 이미 정정한 점수를 추정 복구하거나 컬럼을 즉시 삭제하지 않는다.

- BE 관련 9개 클래스 **46개 통과**. 신규 `InternalMatchRecordTest` 7개는 편별 점수·미상 기록, 모순 입력의 원자적 거절, 수동 전환, 편 동시 정정·배치 보존, 버전/권한/취소 제한, 외부 경기, 실제 SQL 경로를 검사한다.
- FE 기본 테스트 **20개**, 린트·TypeScript·빌드 통과. 모델 테스트 2개와 375px·1440px 모의 API 브라우저로 편별 입력, 도움/미배정 차단, 충돌 입력 보존·명시적 새로고침, 과거 전환, 목록/상세 결과, 편 배정 안내, 외부 경기 점수·승리 표시와 가로 넘침 없음을 확인했다.
- 실제 MySQL 설치·갱신·동시성, 전체 BE 테스트, FE 별도 메모 테스트, 실제 JWT·BE 연결 브라우저 E2E, 운영 적용·배포는 미실행이다.

다음 세션은 D-F02를 다시 묻지 않는다. 남은 DB 검증은 격리 MySQL에서 신규/기존 F02 경로·ORM·자료 보존을 확인하는 일이다. 다음 독립 기능은 F04-a 일정 변경·취소이며 D-F04-a를 먼저 질문한다. 배포 관련 변경·CI 구축 제외를 유지한다.
