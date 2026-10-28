# Team Manager

축구팀의 팀원·경기 일정·참석 투표·포메이션·경기 기록·회비를 관리하는 서비스입니다. 계정이 없는 선수와 용병도 팀원으로 관리합니다.

## 프로젝트 구성

| 경로 | 역할 | 주요 기술 |
| --- | --- | --- |
| [`be/`](be/) | 인증·권한·팀 운영 API | Kotlin 2.3.21, Spring Boot 4.1.0, Exposed 1.3.1, MySQL |
| [`fe/`](fe/) | 모바일·데스크톱 운영 화면 | Next.js 16.2.10, React 19.2.4, TypeScript, Tailwind CSS 4 |
| [`docs/`](docs/) | 기능 기준·개선 계획·인수인계 | 결정 사항, 검증 결과, 남은 작업 |

## 로컬 개발 시작

Java 25, Node.js와 npm, 별도의 개발용 MySQL이 필요합니다. FE 테스트는 `--experimental-strip-types`를 지원하는 Node.js가 필요합니다. 의존성은 각 프로젝트의 빌드 파일과 lockfile을 기준으로 합니다.

1. [개발 안내](docs/development.md)를 따라 개발 DB와 환경변수를 준비합니다.
2. `be/`에서 `./gradlew.bat bootRun`으로 API를 실행합니다(기본 8080).
3. 다른 터미널의 `fe/`에서 `npm.cmd ci`, `npm.cmd run dev`를 실행합니다(기본 3000).
4. 브라우저에서 [로컬 서비스](http://localhost:3000)를 엽니다.

기본 브라우저 API 경로는 `/api`이며 FE가 `localhost:8080`으로 전달합니다. **현재 `local` 프로필은 원격 DB를 가리키므로 개발 안내의 접속값 덮어쓰기를 먼저 확인하세요.**

## 검증

```powershell
# 저장소 루트
git diff --check

# be/ — Java 25 필요
./gradlew.bat test --console=plain

# fe/
npm.cmd test
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

`npm test`는 `fe/tests/*.test.mjs`만 실행합니다. 별도 메모 테스트 명령과 검증 한계는 [개발 안내](docs/development.md#검증-범위)를 참고하세요. 명령 목록은 통과 이력이 아니며, 실제 결과는 작업 계획에 실행 단위별로 기록합니다.

## 문서 안내

| 문서 | 읽을 때 |
| --- | --- |
| [개선 작업 계획](docs/project-improvement-work-plan.md) | 다음 작업 선택, 확정·미확정 결정, 실행 결과 확인 |
| [프로젝트 점검과 개선 제안](docs/project-review-and-roadmap.md) | 문제 근거, 범위, 우선순위 확인 |
| [개발 안내](docs/development.md) | 실행·환경변수·DB 적용 경로·검증·세션 인수인계 |
| [접근 제어 기준](docs/access-control.md) | 역할·페이지·API 접근 기준 확인 |
| [디자인 가이드](docs/design-system.md) | 화면 변경·반응형·한국어 문구 작성 |
| [경기 포메이션](docs/match-formations.md) | 프리셋·편 배정·후보·버전 충돌 규칙 확인 |
| [팀 로고](docs/team-logos.md) · [문의](docs/inquiries.md) | 해당 기능의 동작·제한 확인 |

## 작업을 이어갈 때

먼저 [루트 작업 지침](AGENTS.md)과 수정 대상의 [BE 지침](be/AGENTS.md) 또는 [FE 지침](fe/AGENTS.md)을 읽습니다. 이어서 개선 작업 계획의 진행표·결정표·마지막 작업 기록을 확인합니다. 미확정 `D-...`는 코드 조사 후 사용자에게 질문하고, 답변 전에는 그 결정에 의존하는 구현을 진행하지 않습니다.

완료 범위, 사용자 결정과 날짜, 변경한 API·화면·데이터, 실행한 검증, 미실행 검증과 이유, 다음 시작점을 같은 작업 계획에 남깁니다. 기능 변경 요청만으로 SDD 문서를 추가하지 않습니다.

현재 요청 범위에서는 **배포 관련 변경을 진행하지 않으며**, CI 구축·PR 자동 검증 구성도 제외합니다. 로컬 테스트 결과로 운영 적용·복원 검증을 완료했다고 기록하지 않습니다.
