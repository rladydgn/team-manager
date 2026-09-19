import assert from "node:assert/strict";
import test from "node:test";
import { splitMatchNote } from "./notes.ts";

test("multiple video links preserve Korean text, line breaks and punctuation", () => {
  const content = "전반 영상 https://youtu.be/abc?t=30\n후반 (https://www.youtube.com/watch?v=def).\n특이사항: 없음";
  const parts = splitMatchNote(content);
  assert.equal(parts.map((part) => part.text).join(""), content);
  assert.deepEqual(parts.filter((part) => part.href).map((part) => part.href), [
    "https://youtu.be/abc?t=30",
    "https://www.youtube.com/watch?v=def",
  ]);
});

test("executable schemes, malformed URLs and embedded credentials never become links", () => {
  const content = '<script>alert(1)</script> javascript:alert(1) data:text/html,hello https:// https://user:password@example.com';
  const parts = splitMatchNote(content);
  assert.equal(parts.map((part) => part.text).join(""), content);
  assert.ok(parts.every((part) => !part.href));
});

test("empty notes and plain multiline notes preserve their contents", () => {
  assert.deepEqual(splitMatchNote(""), []);
  assert.deepEqual(splitMatchNote("부상 없음\n다음 경기 준비"), [{ text: "부상 없음\n다음 경기 준비" }]);
});

test("long video URLs remain intact including query strings", () => {
  const url = `https://www.youtube.com/watch?v=abc&list=${"a".repeat(2000)}&t=100`;
  assert.deepEqual(splitMatchNote(url), [{ text: url, href: url }]);
});
