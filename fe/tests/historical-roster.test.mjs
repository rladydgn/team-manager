import assert from "node:assert/strict";
import test from "node:test";
import { buildHistoricalRoster, selectHistoricalMembers } from "../src/features/match/model/historical-roster.ts";

const activeMembers = [2, 3, 4, 5].map((id) => ({ id, name: `선수 ${id}`, role: "MEMBER" }));
const participants = ["AVAILABLE", "PENDING", "INVITED", "UNAVAILABLE"].map((voteStatus, index) => ({
  teamMemberId: index + 1, name: `선수 ${index + 1}`, role: "MEMBER", voteStatus,
}));

test("탈퇴한 기존 참가자와 원래 투표를 보존하고 신규 팀원은 별도로 표시한다", () => {
  const roster = buildHistoricalRoster(activeMembers, participants);
  assert.deepEqual(roster.map(({ id }) => id), [1, 2, 3, 4, 5]);
  assert.equal(roster[0].isActive, false);
  assert.equal(roster[4].originalVoteStatus, undefined);
  assert.deepEqual(selectHistoricalMembers(roster.filter((member) => member.originalVoteStatus !== undefined)), {
    1: "AVAILABLE", 2: "PENDING", 3: "INVITED", 4: "UNAVAILABLE",
  });
});

test("전체 선택과 재선택은 기존 투표를 유지하고 신규 팀원만 참여를 기본값으로 쓴다", () => {
  const roster = buildHistoricalRoster(activeMembers, participants);
  assert.deepEqual(selectHistoricalMembers(roster, { 1: "UNAVAILABLE", 2: "AVAILABLE" }), {
    1: "UNAVAILABLE", 2: "AVAILABLE", 3: "INVITED", 4: "UNAVAILABLE", 5: "AVAILABLE",
  });
  assert.equal(selectHistoricalMembers([roster[1]])[2], "PENDING");
});
