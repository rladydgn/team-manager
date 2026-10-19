import assert from "node:assert/strict";
import test from "node:test";
import { placePlayer, getBench, draftPlacements, titleError } from "../src/features/match/model/formations.ts";
import { getPageAccess } from "../src/features/auth/model/page-access.ts";

test("포메이션 조회만 팀원에게 공개하고 편집·편 배정은 운영진에게 제한한다", () => {
  assert.equal(getPageAccess("/match/7/formations").permission, "member");
  for (const suffix of ["new", "sides", "8/edit", "unknown"]) {
    assert.equal(getPageAccess(`/match/7/formations/${suffix}`).permission, "manager");
  }
  assert.equal(getPageAccess("/match/7/record").permission, "manager");
});

test("후보 교체·위치 교환·빈 자리 이동은 중복 선수를 만들지 않는다", () => {
  const original = [{ slotId: "GK", teamMemberId: 1 }, { slotId: "R1_1", teamMemberId: 2 }];
  assert.deepEqual(placePlayer(original, "GK", 3), [{ slotId: "R1_1", teamMemberId: 2 }, { slotId: "GK", teamMemberId: 3 }]);
  assert.deepEqual(placePlayer(original, "GK", 2), [{ slotId: "R1_1", teamMemberId: 1 }, { slotId: "GK", teamMemberId: 2 }]);
  assert.deepEqual(placePlayer(original, "R1_2", 1), [{ slotId: "R1_1", teamMemberId: 2 }, { slotId: "R1_2", teamMemberId: 1 }]);
  assert.equal(placePlayer(original, "GK", 1), original);
  assert.equal(original.length, 2);
});

test("후보는 같은 편의 참석자에서 유효 배치를 빼고 포메이션마다 계산한다", () => {
  const players = [{ teamMemberId: 1, name: "가", side: "HOME" }, { teamMemberId: 2, name: "나", side: "AWAY" }, { teamMemberId: 3, name: "다", side: "UNASSIGNED" }, { teamMemberId: 4, name: "라", side: "HOME" }];
  const draft = { title: "1쿼터", side: "HOME", templateId: "4-4-2", placements: [{ slotId: "GK", teamMemberId: 1 }, { slotId: "R1_1", teamMemberId: 2 }] };
  const placements = draftPlacements(draft, players);
  assert.equal(placements[1].ineligibleReason, "SIDE_MISMATCH");
  assert.deepEqual(getBench(players, placements, "HOME").map((player) => player.teamMemberId), [4]);
  assert.equal(getBench(players, [], "HOME").length, 2);
  assert.equal(draftPlacements(draft, [], placements)[0].eligible, false);
});

test("제목은 공백과 줄바꿈을 검사하고 UTF-16 기준으로 제한한다", () => {
  for (const title of [" ", "1\n쿼터", "가".repeat(51), "😀".repeat(26)]) assert.ok(titleError(title));
  for (const title of [" 1쿼터 ", "가".repeat(50), "😀".repeat(25)]) assert.equal(titleError(title), "");
});
