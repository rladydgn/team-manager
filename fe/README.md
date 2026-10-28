# Team Manager 프런트엔드

Next.js App Router 기반의 팀 운영 화면입니다. Next.js 16.2.10, React 19.2.4, TypeScript, Tailwind CSS 4를 사용합니다.

## 실행

```powershell
# fe/
npm.cmd ci
npm.cmd run dev
```

[로컬 서비스](http://localhost:3000)를 열기 전에 BE를 8080 포트에서 실행합니다. 브라우저 API는 기본 `/api` 경로를 통해 BE에 연결하며, 서버 조회는 `BACKEND_API_URL`(기본 `http://localhost:8080`)을 사용합니다. 브라우저 API 기본값은 `NEXT_PUBLIC_API_BASE_URL=/api`입니다.

환경변수·인증·DB 준비는 [개발 안내](../docs/development.md), 전체 구조는 [루트 README](../README.md)를 참고하세요.

## 검증

```powershell
npm.cmd test
node --experimental-strip-types --test src/features/match/model/notes.test.mjs
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

기본 테스트는 `tests/*.test.mjs`만 실행하므로 메모 테스트는 별도입니다. 화면을 변경하면 375px·1440px에서 핵심 흐름을 확인하고 실제 결과를 [작업 계획](../docs/project-improvement-work-plan.md)에 남깁니다.

## 수정 전 확인

- [FE 작업 지침](AGENTS.md)과 로컬 `node_modules/next/dist/docs/`의 관련 가이드
- [디자인 가이드](../docs/design-system.md)와 [접근 제어 기준](../docs/access-control.md)
- [개선 작업 계획](../docs/project-improvement-work-plan.md)의 결정·진행 상태

공유 API 설정은 `src/shared`, 기능별 API·모델·화면은 `src/features`, 라우트는 `src/app`에 있습니다. 인증 토큰은 HttpOnly 쿠키로만 관리하며 서버에서 권한을 검증합니다.
