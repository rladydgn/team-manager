import assert from "node:assert/strict";
import test from "node:test";
import { validateSignUp, validateSignUpField } from "../src/features/auth/model/sign-up-validation.ts";

const values = { name: "홍길동", birthYear: "1998", username: "user_01", password: "Example1!", passwordConfirmation: "Example1!", email: "team@example.com" };

test("비밀번호 확인은 필수이며 원래 비밀번호 변경 후에도 일치해야 한다", () => {
  assert.deepEqual(validateSignUp(values), {});
  for (const changed of [{ passwordConfirmation: "" }, { passwordConfirmation: "Different1!" }, { password: "Changed1!" }]) {
    assert.ok(validateSignUp({ ...values, ...changed }).passwordConfirmation);
  }
});

test("일반 이메일과 하위 도메인·플러스 주소는 허용한다", () => {
  for (const email of ["team@example.com", " player+team@sub.example.co.kr ", "first.last@example.com"]) {
    assert.equal(validateSignUpField("email", email), undefined);
  }
});

test("이메일 구분자·도메인·공백·길이가 잘못되면 가입을 막는다", () => {
  for (const email of ["", "team", "team@example", "team@@example.com", "team @example.com", ".team@example.com", "team..name@example.com", "team@-example.com", "team@example..com", `${"a".repeat(65)}@example.com`]) {
    assert.ok(validateSignUp({ ...values, email }).email, email);
  }
});
