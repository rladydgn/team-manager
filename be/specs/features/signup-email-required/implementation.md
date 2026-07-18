# 구현 기록

## 구현 상태

- 상태: 구현 완료

## 변경 사항

- `schema.sql`에 `uk_users_username`, `uk_users_email` 고유 키를 추가했다.
- Exposed 사용자 테이블에도 동일한 이름의 고유 인덱스를 지정했다.
- 가입 서비스에서 아이디와 이메일 중복을 모두 확인한다.
- 이메일 중복 오류 코드와 `/users/email/check` API를 추가했다.
