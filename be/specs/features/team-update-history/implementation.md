# 구현 기록

## 구현 상태

- 상태: 구현 완료

## 변경 사항

- `PUT`과 `DELETE /teams/{teamId}`를 추가했다.
- 수정은 OWNER·SUB_MANAGER, 삭제는 OWNER만 실행하도록 서비스에서 검사한다.
- 삭제 전 활성 멤버가 요청자 한 명뿐인지 검사한다.
- `team_histories`에 `UPDATE` 또는 `DELETE` 액션과 스냅샷을 저장한다.
- 삭제는 `TeamStatus.INACTIVE`와 `deleted_at`을 갱신하는 soft delete로 처리한다.
