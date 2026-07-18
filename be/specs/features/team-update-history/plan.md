# 구현 계획

1. 팀 수정 요청 DTO와 `team_histories` 이력 모델을 추가한다.
2. OWNER·SUB_MANAGER 수정 권한과 수정 전후 스냅샷 저장을 구현한다.
3. OWNER 단독 멤버 조건의 삭제 권한을 구현한다.
4. `soccer_teams`를 soft delete하고 `DELETE` 이력을 저장한다.
5. 실행 검증은 사용자 요청에 따라 생략한다.
