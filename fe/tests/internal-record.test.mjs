import assert from "node:assert/strict";
import test from "node:test";
import { calculateInternalScores, needsInternalRecordReview } from "../src/features/match/model/internal-record.ts";
import { getMatchResult, matchScoreText } from "../src/features/match/model/result.ts";

const player = (goalCount, assistCount = 0, cleanSheetCount = 0) => ({ actualParticipated: true, late: false, goalCount, assistCount, cleanSheetCount });
test("홈·어웨이 골과 미상 기록을 분리하고 도움을 편별 검증한다", () => {
  const scores = calculateInternalScores({ 1: player(2), 2: player(1) }, { 1: "HOME", 2: "AWAY" }, { homeGoals: 1, homeAssists: 2, awayGoals: 2, awayAssists: 3 });
  assert.deepEqual(scores, { homeGoals: 3, homeAssists: 2, awayGoals: 3, awayAssists: 3, unassignedRecordIds: [], invalidAssists: false });
  const invalid = calculateInternalScores({ 1: player(2), 2: player(0, 1), 3: player(0, 0, 1) }, { 1: "HOME", 2: "AWAY", 3: "UNASSIGNED" }, { homeGoals: 0, homeAssists: 0, awayGoals: 0, awayAssists: 0 });
  assert.equal(invalid.invalidAssists, true);
  assert.deepEqual(invalid.unassignedRecordIds, [3]);
  assert.deepEqual(calculateInternalScores({ 1: player(0) }, {}, { homeGoals: 0, homeAssists: 0, awayGoals: 0, awayAssists: 0 }).unassignedRecordIds, []);
});
test("과거 자체 점수는 원본과 확인 필요를 표시하고 자체 승무패를 표시하지 않는다", () => {
  const legacy = { matchType: "INTERNAL", status: "COMPLETED", teamScore: 7, opponentScore: 4, internalRecordConfirmed: false, matchAt: "2020-01-01T00:00:00" };
  assert.equal(needsInternalRecordReview(legacy), true);
  assert.equal(matchScoreText(legacy), "기존 점수 7 : 4 · 편별 기록 확인 필요");
  assert.equal(getMatchResult(legacy), null);
  const confirmed = { ...legacy, teamScore: 2, opponentScore: 1, internalRecordConfirmed: true };
  assert.equal(needsInternalRecordReview(confirmed), false);
  assert.equal(matchScoreText(confirmed), "홈 2 : 어웨이 1");
  assert.equal(getMatchResult(confirmed), null);
  assert.equal(getMatchResult({ ...legacy, matchType: "EXTERNAL" }), "WIN");
  assert.equal(needsInternalRecordReview({ ...legacy, status: "SCHEDULED", teamScore: null, opponentScore: null }), false);
});
