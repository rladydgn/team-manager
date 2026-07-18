# 구현 계획

1. 회원가입 DTO의 출생 정보를 `LocalDate birthDate`로 변경한다.
2. 서비스에서 연도 범위와 1월 1일 고정 규칙을 검증한다.
3. Exposed 사용자 모델과 SQL 스키마의 출생 정보를 `birth_date DATE`로 변경한다.
4. 사용자 생성 시 검증된 날짜를 저장한다.
