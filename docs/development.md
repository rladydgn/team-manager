# 개발 및 작업 인수인계 안내

갱신일: 2026-10-28. 저장소 설정을 정리한 문서입니다. 아래 절차의 실제 기동·신규 DB 설치·기존 DB 갱신을 검증했다는 뜻은 아닙니다. 배포 관련 변경은 현재 요청에서 제외합니다.

## 실행 환경

- BE: Java 25, 저장소의 Gradle Wrapper. 버전은 [`build.gradle.kts`](../be/build.gradle.kts)를 기준으로 합니다.
- FE: Node.js와 npm. 기본 테스트의 `--experimental-strip-types`를 지원해야 합니다. `fe/`에서 `npm.cmd ci`로 설치합니다.
- DB: 별도 개발용 MySQL. H2 테스트 통과는 MySQL 스키마·잠금 검증을 대신하지 않습니다.
- 기본 포트: FE 3000, BE 8080.

## 백엔드 실행

현재 로컬 프로필에는 원격 접속 설정이 있으므로 개발용 접속값과 JWT 비밀 값을 **실행할 터미널에서 덮어씁니다**. 아래 `<...>`는 개발 환경 값으로 바꾸며 실제 비밀 값을 커밋하지 않습니다.

```powershell
# be/ — 같은 PowerShell 터미널에서 설정 후 실행
$env:SPRING_PROFILES_ACTIVE = 'local'
$env:SPRING_DATASOURCE_URL = 'jdbc:mysql://127.0.0.1:3306/team_manager_dev?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8'
$env:SPRING_DATASOURCE_USERNAME = '<개발 DB 사용자>'
$env:SPRING_DATASOURCE_PASSWORD = '<개발 DB 비밀번호>'
$env:APP_JWT_SECRET = '<개발 전용 32바이트 이상의 무작위 비밀 값>'
$env:TEAM_LOGO_STORAGE_PATH = './uploads/team-logos'
./gradlew.bat bootRun
```

기본 YAML은 `JWT_SECRET`을 참조하지만 프로필의 `app.jwt.secret`은 이를 덮어쓸 수 있습니다. 위 예시는 Spring 속성 환경변수 `APP_JWT_SECRET`으로 프로필보다 우선하도록 했습니다. 실행 전 접속 대상이 개발 DB인지 확인합니다.

| 환경변수 | 용도·기본값 |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | 개발 예시에서는 `local` |
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | 격리된 개발 DB 접속값 |
| `JWT_SECRET` / `APP_JWT_SECRET` | 기본 YAML 참조 / 프로필까지 덮어쓸 Spring 속성 |
| `TEAM_LOGO_STORAGE_PATH` | 기본 `./uploads/team-logos`(BE 실행 위치 기준) |
| `JWT_REFRESH_COOKIE_SECURE` | 기본 `false`, 로컬 HTTP 기준 |
| `JWT_COOKIE_SAME_SITE` | 기본 `Lax` |
| `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` | 기본 YAML 참조. 프로필 덮어쓰기는 `APP_KAKAO_CLIENT_ID`, `APP_KAKAO_CLIENT_SECRET` 사용 |
| `KAKAO_REDIRECT_URI` | 기본 `http://localhost:3000/api/oauth/kakao/callback` |
| `FRONTEND_URL` | 기본 `http://localhost:3000` |

카카오 로그인 검증에는 개발 앱의 등록된 redirect URI와 자격 정보를 사용합니다. 일반 로그인과 OAuth 검증 결과를 구분합니다. 인증은 HttpOnly access·refresh 쿠키를 사용합니다.

## 프런트엔드 실행

```powershell
# fe/
npm.cmd ci
npm.cmd run dev
```

| 환경변수 | 용도·기본값 |
| --- | --- |
| `BACKEND_API_URL` | 서버 사용자·팀 목록 조회, 기본 `http://localhost:8080`. 서버 전용 |
| `NEXT_PUBLIC_API_BASE_URL` | 브라우저 API, 기본 `/api`. 공개 값이므로 비밀 값을 넣지 않음 |

`/api/:path*` 전달 대상은 [`next.config.ts`](../fe/next.config.ts)의 `http://localhost:8080/:path*`입니다. `BACKEND_API_URL`만 바꿔도 전달 대상이 함께 변경되지는 않습니다. 기본 개발에서는 BE 8080을 사용합니다. 공개 환경변수는 클라이언트 빌드 시 반영됩니다.

## DB 파일과 적용 경로

| 파일 | 역할·주의점 |
| --- | --- |
| [`schema.sql`](../be/src/main/resources/schema.sql) | 빈 개발 DB의 신규 구조 기준. 기존 테이블이 있는 DB에 재실행하지 않음 |
| [`change_schema.sql`](../be/src/main/resources/change_schema.sql) | 기존 DB 누적 변경. 미적용한 필요한 블록만 확인해 한 번씩 적용 |
| [`migrations/20260718_add_users_birth_date.sql`](../be/src/main/resources/migrations/20260718_add_users_birth_date.sql) | 과거 별도 변경. 현재 구조·적용 이력과 대조해 중복 실행 방지 |
| [`schema-migrations/20260720_align_updated_ddl.sql`](../be/src/main/resources/schema-migrations/20260720_align_updated_ddl.sql) | 과거 정렬용 변경. 누적 SQL과의 중복·현재 컬럼 상태부터 확인 |

새 빈 개발 DB는 `schema.sql`을 기준으로 준비하고 누적 SQL을 이어서 전부 실행하지 않습니다. 기존 DB는 현재 테이블·컬럼·인덱스와 적용 이력을 대조한 뒤 누락 블록만 선택합니다. 자동 migration 도구가 이 파일들을 순서대로 적용한다고 가정하지 않습니다.

DB 변경 세션은 다음 기록을 남깁니다.

1. 대상 DB와 기준 코드 버전, 현재 구조, 적용 이력을 확인합니다.
2. 적용 파일·블록·순서·기존 데이터 영향·복구 방법을 기록합니다. 새 기존 DB DDL은 `change_schema.sql` 끝에 추가합니다.
3. 격리 DB에서 신규 설치와 기존 DB 갱신을 각각 실행하고 ORM과의 차이를 기록합니다.
4. 적용 날짜·대상·블록·결과를 남깁니다. 미적용 블록까지 완료로 표시하지 않습니다.

이번 문서 정리는 적용 이력 확보·전체 ORM 대조·MySQL 설치 검증을 포함하지 않습니다. 미사용 추정 `match_records`와 기존 UNIQUE 제약을 임의로 삭제하지 않습니다. 운영 DB·백업·복구는 D-T04 결정과 별도 작업 범위 확인이 필요합니다.

## 검증 범위

```powershell
# be/
./gradlew.bat test --console=plain
# 변경 관련 클래스만 실행할 때
./gradlew.bat test --tests '*HistoricalMatchRecordPreservationTest' --console=plain

# fe/
npm.cmd test
node --experimental-strip-types --test src/features/match/model/notes.test.mjs
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build

# 저장소 루트
git diff --check
```

FE 기본 테스트는 `tests/*.test.mjs`만 실행하므로 메모 테스트는 별도입니다. BE는 테스트별 H2 직접 연결·Spring 설정 사용 여부를 확인합니다. 화면 변경은 375px·1440px에서 핵심 흐름을 확인하고, 모의 API인지 실제 BE·JWT 연결인지 기록합니다. 미실행 검증은 이유와 재실행 방법을 적습니다.

## 다음 세션의 시작 순서

1. `git status --short`로 기존 변경을 확인하고 사용자 작업을 덮어쓰지 않습니다.
2. [루트 지침](../AGENTS.md), 수정 대상의 [BE](../be/AGENTS.md)·[FE 지침](../fe/AGENTS.md)을 읽습니다.
3. [작업 계획](project-improvement-work-plan.md)의 3절 진행표, 5절 결정표, 7절 마지막 기록을 읽습니다. 과거 기록의 ‘다음 작업’보다 최신 상태·결정을 우선합니다.
4. 해당 [개선 제안](project-review-and-roadmap.md)과 코드를 확인합니다. 필요한 미확정 결정만 1~3개 질문하며 무응답을 승인으로 해석하지 않습니다.
5. 확정 답변·날짜·범위, 변경 동작, 데이터 영향, 검증 결과·한계, 남은 질문과 다음 실행 단위를 같은 계획에 기록합니다.

현재 배포 관련 변경 금지와 CI 구축 제외를 유지합니다. T04-a 문서 일부 수정이 T04 전체 완료나 운영 복원 검증 완료를 뜻하지 않습니다.
