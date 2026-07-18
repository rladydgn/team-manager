# 구현 기록

## 구현 상태

- 상태: 구현 완료

## 변경 사항

- `UserRegisterRequest.birthDate`를 `LocalDate`로 정의했다.
- `UserService`가 1900년부터 현재 연도까지의 1월 1일 값만 허용한다.
- `UsersTable`, 사용자 엔티티 및 레코드를 `birthDate`로 변경했다.
- `schema.sql`에서 `birth_date DATE NOT NULL`을 사용한다.
