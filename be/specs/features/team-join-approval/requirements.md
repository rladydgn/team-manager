# 기능 요구사항

## 기능 이름

팀 가입 신청 승인

## 목표

팀 가입은 즉시 활성화하지 않고 운영진의 승인 후 활성 팀원으로 전환한다.

## 인수 기준

- 가입 요청은 팀원 상태를 `PENDING`으로 생성한다.
- OWNER와 SUB_MANAGER만 대기 중인 가입 신청을 조회, 승인 또는 거부할 수 있다.
- 승인된 신청자는 `ACTIVE` 팀원으로 전환되고 가입 시각이 기록된다.
- 거부된 신청자는 `REJECTED` 상태로 남으며 같은 사용자는 다시 신청할 수 있다.
- 활성 팀원 목록에는 `PENDING`, `REJECTED` 상태를 포함하지 않는다.

## API 계약

| Endpoint | Method | 권한 | 응답 |
| --- | --- | --- | --- |
| `/teams/{teamId}/members` | POST | 로그인 사용자 | 생성 또는 재신청된 `PENDING` 팀원 |
| `/teams/{teamId}/join-requests` | GET | OWNER, SUB_MANAGER | 대기 중인 신청 목록 |
| `/teams/{teamId}/join-requests/{memberId}/approve` | POST | OWNER, SUB_MANAGER | 승인된 `ACTIVE` 팀원 |
| `/teams/{teamId}/join-requests/{memberId}/reject` | POST | OWNER, SUB_MANAGER | 거부된 `REJECTED` 팀원 |
