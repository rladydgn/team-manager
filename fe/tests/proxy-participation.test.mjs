import assert from "node:assert/strict";
import test from "node:test";
import { canProxyUpdateParticipation, participationSourceLabel } from "../src/features/match/model/participation.ts";

test("대리 변경은 마감 후에도 시작 전까지만 가능하며 종료·취소·점수 기록은 차단한다", () => {
  const now = Date.parse("2026-10-28T12:00:00+09:00");
  const match = { matchAt: "2026-10-28T13:00:00+09:00", status: "SCHEDULED", teamScore: null, opponentScore: null };
  assert.equal(canProxyUpdateParticipation(match, now), true);
  assert.equal(canProxyUpdateParticipation(match, Date.parse(match.matchAt)), false);
  for (const change of [{ status: "COMPLETED" }, { status: "CANCELED" }, { teamScore: 0 }, { opponentScore: 0 }, { matchAt: "invalid" }]) {
    assert.equal(canProxyUpdateParticipation({ ...match, ...change }, now), false);
  }
});

test("본인·대리 출처를 구분하고 기존 응답을 본인으로 추정하지 않는다", () => {
  assert.equal(participationSourceLabel({ voteStatus: "AVAILABLE", participationSource: "SELF" }), "본인 응답");
  assert.equal(participationSourceLabel({ voteStatus: "UNAVAILABLE", participationSource: "PROXY" }), "대리 등록");
  assert.equal(participationSourceLabel({ voteStatus: "AVAILABLE", participationSource: null }), "기존 기록");
  assert.equal(participationSourceLabel({ voteStatus: "PENDING" }), "");
  assert.equal(participationSourceLabel(), "");
});
