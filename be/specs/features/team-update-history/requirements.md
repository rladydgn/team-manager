# 기능 요구사항

## 기능 이름

팀 수정, 삭제 및 변경 이력

## 목표

운영진이 팀 정보를 안전하게 수정하고, OWNER가 본인만 남은 팀을 soft delete하며 모든 변경을 감사 이력으로 남긴다.

## 인수 기준

- `PUT /teams/{teamId}`는 OWNER와 SUB_MANAGER만 실행할 수 있다.
- `DELETE /teams/{teamId}`는 OWNER만 실행할 수 있다.
- 삭제 시 활성 팀 멤버는 삭제 요청자 한 명뿐이어야 한다.
- 삭제는 `soccer_teams.deleted_at`과 `status`를 갱신하는 soft delete다.
- 수정 성공 시 `team_histories`에 `UPDATE`와 전후 JSON 스냅샷을 저장한다.
- 삭제 성공 시 `team_histories`에 `DELETE`와 삭제 전 JSON 스냅샷을 저장한다.

## API 계약

| 항목 | 내용 |
| --- | --- |
| Endpoint | `/teams/{teamId}` |
| Method | `PUT`, `DELETE` |
| 인증 | JWT 필요 |
| 오류 | `TEAM_NOT_FOUND`, `TEAM_UPDATE_FORBIDDEN`, `TEAM_DELETE_FORBIDDEN`, `TEAM_DELETE_REQUIRES_SOLE_MEMBER` |
