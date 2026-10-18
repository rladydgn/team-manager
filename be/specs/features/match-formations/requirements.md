# 경기 포메이션 — 백엔드 요구사항

- 작성일: 2026-10-05
- 상태: Feature Spec 초안 · 구현 미착수
- 제품 규칙: [경기 포메이션 스펙](../../../../docs/match-formations.md)
- 화면 요구사항: [프론트엔드 요구사항](../../../../fe/specs/features/match-formations/requirements.md)

## 목표·범위

운영진이 경기별 최대 10개의 제목 있는 고정 포메이션을 저장하고, 같은 팀의 활성 팀원이 조회한다. 제품 스펙 F-01~F-09와 세부 정책을 서버에서도 강제한다. 프리셋 밖 좌표·자유 선수 이름·다른 팀 선수·참석 투표하지 않은 선수·미배정 및 반대편 선수를 받지 않는다.

이 문서가 FE/BE API 계약의 기준이다. 사용자 결정 D-01에 따라 **자체 경기 참가자 편 배정 API와 편별 포메이션 자격 검사**를 포함한다. 편 배정은 경기 전체에 적용하며 포메이션별·쿼터별 배정은 지원하지 않는다.

## 현재 코드와 연결 지점

- `MatchParticipantStatus.AVAILABLE`가 참석 투표다. `actualParticipated`는 별도 실제 출석값으로, 포메이션 자격에 사용하지 않는다.
- 경기 참가 응답은 `teamMemberId`를 사용하며, 계정이 없는 팀원도 존재한다. 배치 역시 `teamMemberId`를 참조한다.
- `MatchParticipantsTable.teamSide`와 Entity 속성은 존재하지만 현재 생성 경로는 HOME을 저장하고, `MatchParticipantRecord`·참가 응답에는 편이 없다. 현재 완성된 참가자 편 배정 기능이 있다고 가정하지 않는다.
- 조회자는 경기를 만든 `match.teamId`의 ACTIVE 팀원이어야 한다. 편집자는 그중 OWNER 또는 SUB_MANAGER다.
- `GlobalExceptionHandler`는 리소스 인가 실패와 부재를 공통 404로 변환한다. 인증 401은 기존 쿠키 갱신 용도로 유지한다.
- 현행 경기 목록·상세·참가·기록 API의 기존 필드는 유지한다. 참가 응답에 `teamSide`를 추가하고 새 포메이션·편 배정 API를 추가한다. Record부터 DTO까지 HOME/AWAY/UNASSIGNED 값을 전달한다.

## 도메인 규칙

| ID | 규칙 |
| --- | --- |
| BE-R01 | 삭제되지 않은 포메이션은 경기 전체 최대 10개. 자체 경기 홈·어웨이 합산. |
| BE-R02 | 제목은 trim 후 1~50 UTF-16 코드 단위. 빈 값·개행 불가. 동명 제목 허용. |
| BE-R03 | 프리셋은 제품 스펙의 8개 중 하나. 골키퍼 포함 정확히 11개 고정 슬롯을 제공. 배치는 0~11명 허용. |
| BE-R04 | 요청의 슬롯 ID는 선택 프리셋에 속해야 하고, 슬롯·teamMemberId 각각 중복 불가. 누락된 슬롯은 빈 자리. |
| BE-R05 | 배치 대상은 해당 경기의 미삭제 참가 기록 중 AVAILABLE이며 해당 팀의 미삭제 팀원 기록이 존재하고 포메이션과 편이 같은 선수. 계정 연결 여부·실제 출석값으로 제한하지 않음. |
| BE-R06 | 같은 편의 다른 포메이션 중복 배치는 허용. 포메이션 저장은 참가자 team_side를 수정하지 않음. |
| BE-R07 | EXTERNAL은 HOME만 허용. INTERNAL은 HOME/AWAY 중 하나 필수. |
| BE-R08 | 후보는 현재 자격 있는 같은 편 참가자에서 현재 유효 배치를 제외해 계산. 미배정·반대편 선수 제외. 저장하지 않음. |
| BE-R09 | SCHEDULED/COMPLETED에서 운영진 생성·수정·삭제 가능. CANCELED는 조회·삭제만 가능. 훈련 여부 무관. |
| BE-R10 | 배치가 투표·실제 출석·골/어시스트·통계를 변경하지 않음. 참석 자격 변경 시 읽기에서 기존 배치를 삭제하지 않음. |
| BE-R11 | 생성자는 소유자가 아님. 현재 운영진이면 다른 운영진이 만든 포메이션도 수정·삭제 가능. |
| BE-R12 | 입력 전체를 검증한 뒤 원자적으로 저장. 실패하면 제목·편·배치 중 일부만 반영되는 상태를 만들지 않음. |
| BE-R13 | 자체 경기 참가자는 경기 전체에서 HOME/AWAY/UNASSIGNED 중 하나. 운영진만 별도 편 배정 API로 변경. 편별 인원 제한 없음. |
| BE-R14 | 신규 자체 경기 참가 기록은 UNASSIGNED, 외부 경기는 HOME. 기존·복원 참가 기록의 편은 보존하며 투표/출석 수정으로 초기화하지 않음. |
| BE-R15 | 편 배정은 SCHEDULED/COMPLETED 자체 경기의 현재 참석자만 변경 가능. CANCELED 변경은 거절. 불참 시 기존 편을 보존하되 후보에서 제외. |

회원 상태가 LEFT 등으로 바뀌어도 기존 미삭제 경기 참석 기록은 배치 자격에 사용할 수 있다. 이는 과거 기록 보존용 정책이며, LEFT 사용자가 조회·편집할 수 있다는 뜻이 아니다. 삭제된 팀원은 배치 대상에서 제외한다.

## 프리셋 카탈로그

- 서버 관리 고정 카탈로그를 조회 응답에 포함한다. FE와 BE가 별도 목록을 유지하지 않는다.
- 카탈로그 항목: `id`, `label`, `slots: [{id, label, x, y}]`. `x`, `y`는 0~1 비율이며 클라이언트가 저장 요청으로 변경할 수 없다.
- 슬롯 ID는 `GK`, `R1_1` … `Rn_k`다. R1은 수비 줄이며 왼쪽에서 오른쪽으로 번호를 매긴다. 예: 4-4-2는 GK + R1_1~R1_4 + R2_1~R2_4 + R3_1~R3_2.
- 기본 좌표: GK=(0.5, 0.90). 필드 줄 수 n, 해당 줄 인원 k, 줄 번호 r, 선수 위치 j에 대해 x=j/(k+1), y=0.72−0.54×(r−1)/(n−1). 원점은 왼쪽 위이고 공격 방향은 위다.
- `label`에는 `골키퍼`, `수비 1`, `중앙 1줄 1`, `공격 1`처럼 화면·접근성에 사용할 한국어 위치 이름을 제공한다. GK를 제외한 첫 줄은 수비, 마지막은 공격, 중간은 중앙 줄 번호를 쓴다.
- 기존 templateId/slotId 의미를 재사용해 변경하지 않는다. 나중에 구조가 다른 프리셋을 추가하면 새 ID를 만든다. 그림 크기는 화면에 맞춰 바뀌어도 ID와 배치 의미는 유지한다.

## API 계약

모든 API는 HttpOnly 쿠키 인증을 사용하고, 서버가 검증한 사용자 ID로 권한을 확인한다. 경로의 경기 → 등록 팀 → 조회/편집 권한 → 포메이션 소속을 검사한다. 클라이언트가 `teamId`, `userId`, `createdBy`를 보내 권한을 결정할 수 없다.

### 엔드포인트

| Method | Endpoint | 권한 | 성공 |
| --- | --- | --- | --- |
| GET | `/matches/{matchId}/formations` | ACTIVE 팀원 | 200 `CommonResponse<FormationCollection>` |
| POST | `/matches/{matchId}/formations` | 운영진 | 201 `CommonResponse<Formation>` |
| PUT | `/matches/{matchId}/formations/{formationId}` | 운영진 | 200 `CommonResponse<Formation>` |
| DELETE | `/matches/{matchId}/formations/{formationId}?version={version}` | 운영진 | 200 `CommonResponse<{id: number}>` |
| GET | `/matches/{matchId}/participant-sides` | ACTIVE 팀원, 자체 경기 | 200 `CommonResponse<ParticipantSides>` |
| PATCH | `/matches/{matchId}/participant-sides` | 운영진, 자체 경기 | 200 `CommonResponse<ParticipantSides>` |

최대 10개이므로 페이지네이션·별도 단건 조회 API는 추가하지 않는다. 수정 화면은 목록에서 해당 ID를 찾는다. 삭제 요청의 `version` 쿼리는 필수 양의 정수다. 응답과 보호 데이터 요청은 `Cache-Control: no-store`로 공유 캐시에 남기지 않는다.

### 참가자 편 배정 요청·응답

```json
{
  "version": 1,
  "assignments": [
    { "teamMemberId": 101, "side": "HOME" },
    { "teamMemberId": 102, "side": "AWAY" },
    { "teamMemberId": 103, "side": "UNASSIGNED" }
  ]
}
```

- PATCH는 변경할 선수만 보내는 부분 갱신이다. 생략한 선수는 유지하며 UNASSIGNED는 명시적 배정 해제다. 한 요청의 전체 변경을 원자적으로 적용한다.
- `version`은 경기의 편 배정 버전이며 포메이션 버전과 독립적이다. 처음에는 1, 성공한 PATCH마다 1 증가한다. 같은 버전의 동시 변경 중 하나만 성공한다.
- `assignments`는 비어 있지 않아야 하고 중복 teamMemberId를 허용하지 않는다. 저장 시 현재 참석 명단에 없는 ID가 하나라도 있으면 전체 요청을 거절한다. 편별 11명 제한이나 전체 참가자 수의 새 제한은 만들지 않는다.
- 새 참석자가 생겨도 기존 요청에서 생략된 선수의 편을 바꾸지 않는다. 제출한 선수의 투표가 바뀌면 최신 자격 검증으로 거절한다. 기존 참가자 편을 이 API 이외의 경로에서 의도적으로 변경하는 경우에도 같은 버전·잠금 규칙을 적용한다.
- 포메이션에 배치된 선수도 편 변경·해제를 허용한다. 영향을 받은 포메이션 배치·버전을 자동 변경하지 않고 다음 조회에서 자격을 다시 판단한다.

```ts
type ParticipantSides = {
  matchId: number;
  version: number;
  canManage: boolean; // 운영진 + 예정/종료 자체 경기
  players: Array<{
    teamMemberId: number;
    name: string;
    side: "HOME" | "AWAY" | "UNASSIGNED";
  }>;
};
```

`players`는 현재 AVAILABLE이고 미삭제 팀원·참가 기록이 있는 전체 참석 명단이며 이름순/ID순이다. 미배정도 포함한다. GET/PATCH 응답은 동일한 DTO를 사용한다. 조회 당시와 이후 저장 시점의 자격 차이는 별도 검증한다. 일반 팀원도 조회할 수 있다. 외부 경기에서는 편 배정 API를 404로 처리한다.

### 작성·수정 요청

```json
{
  "title": "1쿼터",
  "side": "HOME",
  "templateId": "4-4-2",
  "placements": [
    { "slotId": "GK", "teamMemberId": 101 },
    { "slotId": "R1_1", "teamMemberId": 102 }
  ]
}
```

- POST 필수: `title`, `side`, `templateId`, `placements`. 배치 없이 생성은 빈 배열을 보낸다.
- PUT은 위 필드 전체와 `version`을 보낸다. 부분 수정이 아니며 생략한 기존 배치는 해제한다. `version`은 마지막 조회/저장에서 받은 양의 정수다.
- ID는 양의 정수이고 프론트엔드에서 안전하게 표현할 수 있는 범위를 따른다. 배열은 최대 11개이며 잘못된 JSON, null 필수값, 타입 오류를 400으로 처리한다.
- 프리셋 변경의 UI 확인 여부는 서버가 추측하지 않는다. 서버는 최종 프리셋과 모든 배치가 유효한지만 검증한다.
- 후보 배열, 선수 이름, 자유 좌표, 작성자 ID는 쓰기 필드가 아니다. API는 이 값을 반영하지 않는다.

### 조회 응답 DTO

공통 래퍼는 `{ "success": true, "data": ... }`다. 아래는 `data`의 계약이다.

```ts
type Side = "HOME" | "AWAY";
type ParticipantSide = Side | "UNASSIGNED";
type IneligibleReason =
  | "NOT_ATTENDING"           // 현재 AVAILABLE 아님
  | "PARTICIPANT_REMOVED"     // 경기 참가 기록 제거됨
  | "MEMBER_REMOVED"          // 해당 팀원 기록 제거됨
  | "SIDE_UNASSIGNED"         // 참석 중이지만 편 미배정
  | "SIDE_MISMATCH";          // 포메이션과 반대편

type Placement = {
  slotId: string;
  teamMemberId: number;
  name: string;               // 현재 displayName, 찾을 수 없으면 "삭제된 선수"
  eligible: boolean;
  ineligibleReason: IneligibleReason | null;
};

type Formation = {
  id: number;
  matchId: number;
  title: string;
  side: Side;
  templateId: string;
  placements: Placement[];    // 저장된 배치. 자격 없는 배치도 경고용으로 포함
  version: number;
  createdAt: string;
  updatedAt: string;
};

type FormationCollection = {
  matchId: number;
  matchType: "INTERNAL" | "EXTERNAL";
  matchStatus: "SCHEDULED" | "COMPLETED" | "CANCELED";
  maxFormations: 10;
  permissions: {
    canCreate: boolean;       // 운영진 + 수정 가능한 경기 + 현재 개수 < 10
    canUpdate: boolean;       // 운영진 + 수정 가능한 경기
    canDelete: boolean;       // 운영진, 취소 경기 포함
    canAssignSides: boolean;  // 운영진 + 예정/종료 자체 경기
  };
  templates: Array<{
    id: string;
    label: string;
    slots: Array<{id: string; label: string; x: number; y: number}>;
  }>;
  attendingPlayers: Array<{teamMemberId: number; name: string; side: ParticipantSide}>;
  formations: Formation[];   // createdAt, id 오름차순, 미삭제만
};
```

- `attendingPlayers`는 참석 투표 기준의 최신 대상이며 미배정도 포함한다. 이름순, 동일 이름이면 ID순이다. 후보 = 이 목록에서 포메이션과 같은 편인 선수 − 해당 포메이션의 `eligible=true` 배치. 외부 경기 대상은 HOME이다. 일반 팀원에게도 이 명단을 제공한다.
- 자격 상실 사유가 겹치면 MEMBER_REMOVED → PARTICIPANT_REMOVED → NOT_ATTENDING → SIDE_UNASSIGNED → SIDE_MISMATCH 순으로 대표 사유를 선택한다. 참가 명단에서 제거된 선수도 팀원 기록이 남아 있으면 현재 이름을 반환할 수 있다.
- GET은 같은 DB 읽기 스냅샷에서 명단과 배치 자격을 계산해 응답 내부 모순을 방지한다. 저장 이후 명단이 바뀔 수 있으므로 PUT에서 다시 검증한다.
- POST/PUT 응답의 `Formation`은 성공한 최신 저장값이다. 클라이언트는 저장 후 GET으로 전체 개수·후보를 갱신한다.
- 날짜 직렬화 형식은 기존 Match API의 LocalDateTime 형식을 따른다. 새로운 시간대 변환 규칙은 추가하지 않는다.
- 이메일, 계정 ID, 참가 메모, 운영진 전용 기록은 이 응답에 넣지 않는다. 단순 조회에도 팀원 인가를 적용한다.

### 오류

기존 `ErrorResponse` 형식 `{ "status": number, "code": string, "message": string }`을 사용한다. 권한 확인 전 리소스 존재나 입력한 선수의 소속 정보를 반환하지 않는다.

| HTTP | code | 의미 / 처리 |
| --- | --- | --- |
| 400 | `INVALID_MATCH_FORMATION_REQUEST` | 제목·프리셋·편·슬롯·ID·버전·중복·배치 개수 오류 |
| 400 | `MATCH_FORMATION_PLAYER_INELIGIBLE` | 제출한 선수가 현재 배치 대상이 아님. 다른 팀/경기 선수도 같은 일반 오류로 처리 |
| 400 | `INVALID_MATCH_SIDE_ASSIGNMENT_REQUEST` | 잘못된 편·ID·버전, 빈 변경 목록·중복 ID, 현재 참석 명단에 없는 선수의 편 변경 |
| 401 | 기존 인증 오류 코드 | 세션 없음/만료. 기존 갱신 절차 후 화면은 공통 404 |
| 404 | `RESOURCE_NOT_FOUND` | 경기/포메이션 부재·삭제, 팀 비활성·삭제, 소속 불일치, 조회/편집 권한 없음 |
| 409 | `MATCH_FORMATION_LIMIT_REACHED` | 경기당 10개 도달. 최신 목록 갱신 |
| 409 | `MATCH_FORMATION_VERSION_CONFLICT` | 수정·삭제 요청 버전이 최신이 아님. 자동 덮어쓰기 금지 |
| 409 | `MATCH_FORMATION_MATCH_CANCELED` | 취소 경기에서 생성·수정 요청 |
| 409 | `MATCH_SIDE_ASSIGNMENT_VERSION_CONFLICT` | 다른 운영진이 편 배정을 먼저 저장. 입력 유지 후 최신 편 배정 조회 |
| 409 | `MATCH_SIDE_ASSIGNMENT_MATCH_CANCELED` | 취소 경기에서 편 변경 요청 |

수정/삭제는 권한·소속 확인 → 버전 검사 → 경기 상태/입력/자격 검사 순으로 처리한다. 삭제된 대상을 다시 삭제하면 404다. 내부 오류는 기존 5xx 정책을 유지하고 404로 변환하지 않는다.
편 배정도 인증·경기 소속/유형·역할 검사 후 버전과 경기 상태·입력을 검증한다. 외부 경기 또는 권한 없는 편 배정 접근은 공통 RESOURCE_NOT_FOUND다.

## 저장 모델 제안

실제 DDL은 구현 단계에 작성한다. 아래는 데이터 계약이며 SQL 파일을 지금 변경하지 않는다.

| 엔터티 | 주요 필드 |
| --- | --- |
| `match_formations` | id, match_id, title(50), side, template_id, version, created_by_user_id, updated_by_user_id, created_at, updated_at, deleted_at |
| `match_formation_placements` | id, formation_id, slot_id, team_member_id |
| 기존 `match_participants` | team_side에 UNASSIGNED 추가. 편 배정의 단일 저장 위치로 사용 |
| 기존 `matches` | side_assignment_version 추가, 기존/신규 기본값 1 |

- 배치는 포메이션에 종속된 현재 상태다. PUT에서 전체 교체하고, 제목·메타데이터와 같은 트랜잭션으로 처리한다. 별도 배치 수정 이력·시간 필드를 도입하지 않는다.
- 포메이션 삭제는 `deleted_at`을 사용한다. 삭제된 포메이션의 배치가 남아 있더라도 모든 조회는 부모의 삭제 여부를 검사한다. 사용자 복원 API는 없다.
- 경기 삭제 시 하위 포메이션에 접근할 수 없게 한다. 기존 경기 삭제 처리 방식에 맞춘 정리는 구현 계획에서 정의하고, 읽기 시 부모 검증을 생략하지 않는다.
- 후보·표시 이름·프리셋 좌표는 DB에 중복 저장하지 않는다. 계정 연결만 변경되고 teamMemberId가 같으면 배치는 유지된다. 팀원 자체가 삭제되면 자격 상실로 처리하며 다른 ID에 임의 연결하지 않는다.
- 조회 인덱스 후보: 포메이션 `(match_id, deleted_at)`, 배치 `(formation_id)`. UNIQUE·FK·CHECK는 추가하지 않고 서비스에서 정합성을 강제한다.
- 포메이션은 새 테이블이므로 기존 경기의 최초 GET 결과는 빈 formations 배열이다. 참가자 team_side ENUM을 HOME/AWAY/UNASSIGNED로 확장하고, 편 배정 버전 컬럼은 기존 행도 1로 초기화한다. 기존 HOME/AWAY 값은 덮어쓰지 않는다. 구현 시 `schema.sql`과 기존 DB용 `change_schema.sql` 끝에 반영한다.
- 참가자 생성 경로(신규 경기 기본 명단, 이전 경기 등록·명단 추가, 첫 참석 upsert) 모두 경기 유형에 따라 INTERNAL=UNASSIGNED, EXTERNAL=HOME을 지정한다. 기존 참가자의 투표·기록 갱신 및 삭제 기록 복원은 편을 보존한다. DB 기본값 HOME에 자체 경기 생성 동작을 맡기지 않는다.
- 참가자 Record/Response에 teamSide를 전달하고 기존 클라이언트가 쓰는 나머지 필드는 유지한다. 기존 경기의 HOME은 실제 운영진 배정으로 확정된 값이 아닐 수 있으므로 화면에서 배정을 확인하도록 안내한다.

## 동시성·보안

- 최대 10개 검사와 INSERT를 별개의 무잠금 연산으로 만들지 않는다. 같은 경기 부모 행 잠금 등의 DB 기반 직렬화로 개수 검사·생성을 하나의 트랜잭션에서 처리한다. 인스턴스 내부 mutex만으로 제한하지 않는다.
- 포메이션 쓰기·편 배정 PATCH는 같은 경기 부모 행 잠금을 공유한다. 경기 → 포메이션(필요할 때) → 참가 기록 순으로 잠그고 여러 참가 기록은 ID순으로 처리한다. 경기가 취소되는 동시 변경도 저장 시 최신 상태로 검증한다.
- 생성 시 version=1, PUT 성공 시 +1. PUT/DELETE의 버전 비교와 변경은 원자적으로 처리한다. 같은 버전의 동시 수정 둘 중 하나만 성공해야 한다.
- 참가 기록·편·팀원 존재를 저장 트랜잭션에서 최신 상태로 검증한다. 검증부터 저장까지 해당 기록의 동시 변경을 잠금 등으로 제어한다. 편 변경보다 먼저 저장한 포메이션은 이후 자격 상실로 표시하고, 편 변경 후 옛 편 선수로 저장하면 거절한다. 이후 발생한 투표 변경도 조회 시 자격 상실로 표시한다.
- 타 경기 포메이션 ID를 경로에 끼워 넣어도 조회·수정·삭제되지 않아야 한다. `formation.matchId == path.matchId`를 매 요청 확인한다.
- title/name은 일반 텍스트로 취급하고 HTML로 렌더링하지 않는다. 업로드·외부 이미지 URL·외부 요청 기능을 추가하지 않는다.
- 일반 팀원의 변조된 POST/PUT/DELETE 요청은 404다. 역할·가입 상태는 클라이언트 값이나 캐시된 permissions만으로 검증하지 않는다.

## 인수 기준·검증 계획

| ID | Given / When / Then |
| --- | --- |
| BE-01 | 홈 6개·어웨이 4개가 있으면 11번째 생성은 409이고 데이터가 늘지 않는다. 삭제 후에는 생성 가능하다. |
| BE-02 | 9개인 경기에서 두 운영진이 동시에 생성하면 하나만 성공하고 총 10개다. 생성과 삭제가 겹쳐도 10개를 넘지 않는다. |
| BE-03 | 같은 편의 미삭제 선수에 대해 AVAILABLE/UNAVAILABLE/PENDING/INVITED와 실제 출석 true/false를 조합하면 AVAILABLE만 배치 가능하고 실제 출석값은 결과에 영향을 주지 않는다. |
| BE-04 | 계정 없는 팀원·용병의 유효 참석 기록이면 배치 가능하다. 다른 경기·팀 선수 또는 제거된 참가자를 제출하면 전체 저장을 거절한다. |
| BE-05 | 같은 슬롯 두 번, 같은 선수 두 번, 존재하지 않는 슬롯·프리셋·side, 12명 배치, 빈/51자 제목은 400이고 변경되지 않는다. |
| BE-06 | 빈 배치·부분 배치·11명 배치를 저장할 수 있다. 후보는 해당 시점 자격 있는 같은 편의 미배치 선수이며 다른 포메이션의 선택에 영향을 받지 않는다. |
| BE-07 | 저장 후 참석 투표가 불참으로 바뀌면 GET에서 기존 배치는 남되 eligible=false이며 후보·유효 인원에 포함되지 않는다. 재저장 시 정리가 필요하다. |
| BE-08 | 활성 일반 팀원은 본인의 경기 참석 여부와 무관하게 GET 가능하지만 쓰기는 404다. 운영진 전원은 작성자와 무관하게 쓰기 가능하다. |
| BE-09 | 비활성 가입 상태·다른 팀·상대 팀 사용자와 다른 경기의 formationId 접근은 공통 404이며 리소스 내용이 유출되지 않는다. 비로그인 API는 인증 갱신용 401을 유지한다. |
| BE-10 | 같은 version의 동시 PUT 또는 PUT/DELETE 중 하나만 성공하고 다른 요청은 409 또는 먼저 삭제된 경우 404다. |
| BE-11 | SCHEDULED/COMPLETED 및 훈련 경기는 정상 편집 가능하다. CANCELED 생성·수정은 409, 권한 있는 조회·삭제는 가능하다. |
| BE-12 | 포메이션 CRUD 전후 참석 투표·실제 출석·골/어시스트·통계가 달라지지 않으며 기존 API 계약을 유지한다. |
| BE-13 | 자체 경기에서 운영진이 참석자를 홈·어웨이·미배정으로 저장하면 팀원 조회에 반영되고 각 포메이션의 배치 대상·후보는 같은 편으로 제한된다. 12명 이상 편 배정도 가능하다. |
| BE-14 | 반대편·미배정 선수를 포메이션에 제출하면 400이다. 기존 배치 선수의 편을 변경/해제하면 모든 관련 포메이션에서 SIDE_MISMATCH/SIDE_UNASSIGNED로 표시되고 자동 이동·삭제되지 않는다. |
| BE-15 | 편 변경 목록에 불참·다른 팀·제거된 선수나 중복 ID가 하나라도 있으면 전체 변경이 실패한다. 생략한 선수와 참석 투표·출석·경기 기록은 바뀌지 않는다. |
| BE-16 | 편 배정 동시 수정은 하나만 성공한다. 포메이션 저장과 편 변경이 겹쳐도 잠금 순서에 따라 최신 자격 검증 또는 저장 후 제외 표시가 일관된다. |
| BE-17 | 신규·이전 경기·최초 참석의 새 자체 경기 참가자는 미배정이고 외부 경기는 홈이다. 기존 값·명단 복원·투표 재참석 시 편은 보존된다. 기존 DB 업그레이드가 기존 편 값을 초기화하지 않는다. |
| BE-18 | 일반 팀원은 편 배정 GET만 가능하고 PATCH는 404다. 외부 경기 편 배정 API는 404, 취소 자체 경기 PATCH는 409다. |

권한·자격·한도·버전은 서비스 테스트로, 개수/버전 동시성은 실제 트랜잭션을 사용하는 저장소 통합 테스트로 검증한다. 에러 응답·인증 갱신·소속 불일치는 API 경계에서 확인한다. 전송 필드와 유효하지 않은 배치 응답도 검증한다. **현재는 계획이며 테스트 실행 결과가 아니다.**

## 미해결 사항

- 제품 스펙 D-01은 사용자 확인 완료이며 참가자 편 배정을 포함하도록 반영했다. 현재 미해결 사용자 질문은 없다.
- 나머지는 제품 스펙의 제안 기본값을 따른다. 세부 계약 변경 시 FE 요구사항을 함께 수정한다.
