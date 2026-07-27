# 구현 기록

## 구현 상태

- 상태: 완료
- 완료일: 2026-07-27

## 구현 결정

- 기존 `Match` 응답의 점수와 경기 시각만 사용한다.
- 결과는 우리 팀 점수와 상대 점수를 비교해 계산하며, 종료 전·취소·미저장 매치는 제외한다.

## 변경 파일

- `src/features/match/model/result.ts`
- `src/app/team/[teamId]/matches/page.tsx`
- `src/app/matches/[matchId]/page.tsx`

## 남은 작업

- 없음
