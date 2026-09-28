import assert from "node:assert/strict";
import test from "node:test";
import { getPageAccess, canAccessTeam } from "../src/features/auth/model/page-access.ts";
import { captureAccessFailureReporter, subscribeToAccessFailures } from "../src/shared/api/access-failures.ts";

test("팀 홈은 공개하고 팀원·운영진 페이지를 구분한다", () => {
  for (const [path, permission] of [["", "public"], ["/member", "member"], ["/match", "member"], ["/ranking", "member"], ["/statistics", "member"], ["/fee-payment", "manager"], ["/edit", "manager"], ["/join-request", "manager"], ["/season", "manager"], ["/season/new", "manager"], ["/match/new", "manager"], ["/match/history", "manager"]]) {
    assert.equal(getPageAccess(`/team/7${path}`).permission, permission);
  }
  assert.equal(getPageAccess("/match/7/record").permission, "manager");
  assert.equal(getPageAccess("/profile").kind, "authenticated");
  assert.equal(getPageAccess("/inquiries/7").kind, "inquiry");
});

test("활성 팀원만 접근하며 운영진 권한을 별도로 확인한다", () => {
  const member = { userId: 7, role: "MEMBER", status: "ACTIVE" };
  assert.equal(canAccessTeam([member], 7, "member"), true);
  assert.equal(canAccessTeam([member], 7, "manager"), false);
  assert.equal(canAccessTeam([member], 8, "member"), false);
  for (const role of ["OWNER", "SUB_MANAGER"]) assert.equal(canAccessTeam([{ ...member, role }], 7, "manager"), true);
  for (const status of ["PENDING", "REJECTED", "LEFT", "BANNED"]) assert.equal(canAccessTeam([{ ...member, status }], 7, "member"), false);
});

test("이전 페이지 요청의 응답은 현재 페이지를 404로 바꾸지 않는다", () => {
  let calls = 0;
  const stopOld = subscribeToAccessFailures(() => calls++);
  const reportOld = captureAccessFailureReporter("/matches/7");
  stopOld();
  const stopNew = subscribeToAccessFailures(() => calls++);
  reportOld();
  assert.equal(calls, 0);
  captureAccessFailureReporter("/inquiries?page=1")();
  assert.equal(calls, 1);
  stopNew();
});
