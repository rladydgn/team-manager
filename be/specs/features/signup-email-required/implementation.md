# 구현 기록

## 구현 상태

- 상태: 구현 완료

## 변경 사항

- `UserRegisterRequest.email`을 필수 `String`으로 변경했다.
- 공백 이메일을 `INVALID_REGISTER_REQUEST`로 거부하도록 했다.
- 저장되는 이메일의 앞뒤 공백을 제거하도록 했다.
- `schema.sql`과 Exposed 테이블 정의의 이메일 컬럼을 non-null로 변경했다.
- 로그인 응답과 프론트 사용자 타입의 이메일도 non-null 계약으로 변경했다.
