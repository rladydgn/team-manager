# 구현 내용

- `GET /users/me`은 MVC 인터셉터가 설정한 사용자 ID로 현재 사용자를 조회한다.
- `getServerCurrentUser`는 액세스 쿠키만 백엔드로 전달하며 `cache: "no-store"`를 사용한다.
- Root Layout은 조회 결과를 `AuthSessionProvider`의 `initialUser`로 전달한다.
- 액세스 토큰과 리프레시 토큰은 모두 HttpOnly 쿠키에 유지한다.
