import assert from "node:assert/strict";
import test from "node:test";
import { changeActualParticipation, hasAttendanceConflict, toPlayerStatistics } from "../src/features/match/model/record-statistics.ts";

test("저장된 출석과 기록을 그대로 표시하고 기존 모순을 감지한다", () => {
  const absent = toPlayerStatistics();
  assert.equal(hasAttendanceConflict(absent), false);
  for (const field of ["late", "goalCount", "assistCount", "cleanSheetCount"]) {
    const saved = { ...absent, [field]: field === "late" ? true : 1 };
    assert.deepEqual(toPlayerStatistics(saved), saved);
    assert.equal(hasAttendanceConflict(toPlayerStatistics(saved)), true, field);
    assert.equal(hasAttendanceConflict({ ...saved, actualParticipated: true }), false, field);
  }
});

test("출석 해제는 지각과 개인 기록을 보존하며 직접 정정해야 불참 저장이 가능하다", () => {
  const saved = { actualParticipated: true, late: true, goalCount: 2, assistCount: 1, cleanSheetCount: 1 };
  const changed = changeActualParticipation(saved, false);
  assert.deepEqual(changed, { ...saved, actualParticipated: false });
  assert.equal(hasAttendanceConflict(changed), true);
  assert.equal(hasAttendanceConflict({ ...changed, late: false, goalCount: 0, assistCount: 0, cleanSheetCount: 0 }), false);
  assert.deepEqual(changeActualParticipation(changed, true), saved);
  assert.deepEqual(changeActualParticipation(undefined, false), toPlayerStatistics());
});
