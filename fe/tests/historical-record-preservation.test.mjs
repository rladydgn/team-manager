import assert from "node:assert/strict";
import test from "node:test";
import { buildHistoricalRoster, selectHistoricalMembers } from "../src/features/match/model/historical-roster.ts";

test("탈퇴자와 출석·개인 기록 보유자는 전체 선택 해제 후에도 명단과 투표를 유지한다", () => {
  const active = [2, 3, 4, 5, 6, 7, 8].map((id) => ({ id, name: `선수 ${id}`, role: "MEMBER" }));
  const existing = [1, 2, 3, 4, 5, 6, 7].map((id) => ({
    teamMemberId: id, name: `선수 ${id}`, role: "MEMBER", voteStatus: id === 1 ? "PENDING" : "AVAILABLE",
    actualParticipated: id === 2, late: id === 3,
    goalCount: id === 4 ? 1 : 0, assistCount: id === 5 ? 1 : 0, cleanSheetCount: id === 6 ? 1 : 0,
  }));
  const roster = buildHistoricalRoster(active, existing);
  assert.deepEqual(roster.filter((member) => member.mustRetain).map(({ id }) => id), [1, 2, 3, 4, 5, 6]);
  const current = selectHistoricalMembers(roster);
  assert.deepEqual(selectHistoricalMembers(roster.filter((member) => member.mustRetain), current), {
    1: "PENDING", 2: "AVAILABLE", 3: "AVAILABLE", 4: "AVAILABLE", 5: "AVAILABLE", 6: "AVAILABLE",
  });
});
