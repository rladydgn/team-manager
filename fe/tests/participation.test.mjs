import assert from "node:assert/strict";
import test from "node:test";
import { sortMembersByParticipation } from "../src/features/match/model/participation.ts";

test("참여 투표한 팀원을 먼저 표시하고 각 그룹은 이름순으로 정렬한다", () => {
  const members = [
    { id: 1, name: "최선수", userId: null },
    { id: 2, name: "박선수", userId: 2 },
    { id: 3, name: "김선수", userId: 3 },
    { id: 4, name: "이선수", userId: 4 },
    { id: 5, name: "강선수", userId: 5 },
    { id: 6, name: "김선수", userId: null },
  ];
  const votes = [
    { teamMemberId: 1, voteStatus: "AVAILABLE", actualParticipated: false },
    { teamMemberId: 2, voteStatus: "UNAVAILABLE", actualParticipated: true },
    { teamMemberId: 3, voteStatus: "AVAILABLE", actualParticipated: false },
    { teamMemberId: 4, voteStatus: "PENDING", actualParticipated: true },
    { teamMemberId: 5, voteStatus: "INVITED", actualParticipated: false },
    { teamMemberId: 6, voteStatus: "AVAILABLE", actualParticipated: false },
  ];
  assert.deepEqual(sortMembersByParticipation(members, votes).map((member) => member.id), [3, 6, 1, 5, 2, 4]);
  assert.deepEqual(members.map((member) => member.id), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(sortMembersByParticipation(members, votes.map((vote) => vote.teamMemberId === 2 ? { ...vote, voteStatus: "AVAILABLE" } : vote)).map((member) => member.id), [3, 6, 2, 1, 5, 4]);
});
