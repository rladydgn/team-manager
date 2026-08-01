# 구현 기록

## 구현 상태

- 상태: 완료
- 완료일: 2026-07-27

## 구현 결정

- 기존 `match_participants`의 골·어시스트·클린시트만 합산한다.
- 출석의 분모·분자 규칙은 변경하지 않는다.

## 변경 파일

- `src/features/team/api/statistics.ts`
- `src/app/team/[teamId]/statistics/page.tsx`
- `be/src/main/kotlin/com/yonghoo/team_manager/match/service/MatchService.kt`
