"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  isEmailAvailable,
  isUsernameAvailable,
  signUp,
} from "@/features/auth/api/auth";
import { useCurrentUser } from "@/features/auth/model/auth-session";
import {
  SignUpField,
  SignUpFieldErrors,
  validateSignUp,
  validateSignUpField,
} from "@/features/auth/model/sign-up-validation";
import { ApiRequestError } from "@/shared/api/http";

const formFields: SignUpField[] = ["name", "birthYear", "username", "password", "email"];
const currentYear = new Date().getFullYear();

export default function SignUpPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<SignUpField, boolean>>
  >({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const values = { name, birthYear, username, password, email };

  useEffect(() => {
    if (currentUser) {
      router.replace("/team");
    }
  }, [currentUser, router]);

  function updateField(field: SignUpField, value: string) {
    const setters = {
      name: setName,
      birthYear: setBirthYear,
      username: setUsername,
      password: setPassword,
      email: setEmail,
    };

    setters[field](value);

    if (touchedFields[field] || fieldErrors[field]) {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        [field]: validateSignUpField(field, value),
      }));
    }
  }

  function validateField(field: SignUpField) {
    setTouchedFields((currentTouchedFields) => ({
      ...currentTouchedFields,
      [field]: true,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: validateSignUpField(field, values[field]),
    }));
  }

  function inputClassName(field: SignUpField) {
    return `h-12 rounded-lg border bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-placeholder disabled:cursor-not-allowed disabled:bg-subtle ${
      fieldErrors[field]
        ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger-soft"
        : "border-line-strong focus:border-brand focus:ring-2 focus:ring-brand-ring"
    }`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateSignUp(values);

    setTouchedFields(
      Object.fromEntries(formFields.map((field) => [field, true]))
    );
    setFieldErrors(validationErrors);
    setErrorMessage("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const usernameAvailable = await isUsernameAvailable(username);

      if (!usernameAvailable) {
        setFieldErrors({ username: "이미 사용 중인 아이디입니다." });
        return;
      }

      const emailAvailable = await isEmailAvailable(email.trim());

      if (!emailAvailable) {
        setFieldErrors({ email: "이미 사용 중인 이메일입니다." });
        return;
      }

      await signUp({
        name: name.trim(),
        birthDate: `${birthYear}-01-01`,
        username,
        password,
        email: email.trim(),
      });

      router.replace("/login");
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "DUPLICATED_USERNAME") {
        setFieldErrors({ username: error.message });
        return;
      }

      if (error instanceof ApiRequestError && error.code === "DUPLICATED_EMAIL") {
        setFieldErrors({ email: error.message });
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "회원가입에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas px-5 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-6xl flex-col">

        <section className="flex flex-1 items-center justify-center py-10 lg:py-16">
          <div className="w-full max-w-md">
            <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
              <div className="px-6 pt-7 sm:px-8">
                <p className="text-sm font-semibold text-brand">
                  Team Manager
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  회원가입
                </h1>
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-sm leading-6 text-muted">
                  계정을 만들고 우리 팀과 함께 시작하세요.
                </p>

                <form className="mt-8 grid gap-5" noValidate onSubmit={handleSubmit}>
                  <label className="grid gap-2 text-sm font-semibold">
                    이름
                    <input
                      value={name}
                      onBlur={() => validateField("name")}
                      onChange={(event) => updateField("name", event.target.value)}
                      aria-describedby={fieldErrors.name ? "name-error" : undefined}
                      aria-invalid={Boolean(fieldErrors.name)}
                      className={inputClassName("name")}
                      placeholder="홍길동"
                      autoComplete="name"
                      required
                      disabled={isSubmitting}
                    />
                    {fieldErrors.name ? (
                      <span id="name-error" className="text-xs font-normal leading-5 text-danger">
                        {fieldErrors.name}
                      </span>
                    ) : null}
                    <span className="text-xs font-normal leading-5 text-muted">
                      팀원 목록과 경기 기록에 표시되는 이름입니다.
                    </span>
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    태어난 연도
                    <input
                      value={birthYear}
                      onBlur={() => validateField("birthYear")}
                      onChange={(event) => updateField("birthYear", event.target.value)}
                      aria-describedby={fieldErrors.birthYear ? "birth-year-error" : undefined}
                      aria-invalid={Boolean(fieldErrors.birthYear)}
                      className={inputClassName("birthYear")}
                      placeholder="1998"
                      type="number"
                      inputMode="numeric"
                      autoComplete="bday-year"
                      min="1900"
                      max={currentYear}
                      required
                      disabled={isSubmitting}
                    />
                    {fieldErrors.birthYear ? (
                      <span id="birth-year-error" className="text-xs font-normal leading-5 text-danger">
                        {fieldErrors.birthYear}
                      </span>
                    ) : null}
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    아이디
                    <input
                      value={username}
                      onBlur={() => validateField("username")}
                      onChange={(event) => updateField("username", event.target.value)}
                      aria-describedby={fieldErrors.username ? "username-error" : undefined}
                      aria-invalid={Boolean(fieldErrors.username)}
                      className={inputClassName("username")}
                      placeholder="user_01"
                      autoComplete="username"
                      required
                      disabled={isSubmitting}
                    />
                    {fieldErrors.username ? (
                      <span id="username-error" className="text-xs font-normal leading-5 text-danger">
                        {fieldErrors.username}
                      </span>
                    ) : null}
                    <span className="text-xs font-normal leading-5 text-muted">
                      영문 소문자, 숫자, -, _ 조합 5~20자
                    </span>
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    비밀번호
                    <input
                      value={password}
                      onBlur={() => validateField("password")}
                      onChange={(event) => updateField("password", event.target.value)}
                      aria-describedby={fieldErrors.password ? "password-error" : undefined}
                      aria-invalid={Boolean(fieldErrors.password)}
                      className={inputClassName("password")}
                      placeholder="Password1!"
                      type="password"
                      autoComplete="new-password"
                      required
                      disabled={isSubmitting}
                    />
                    {fieldErrors.password ? (
                      <span id="password-error" className="text-xs font-normal leading-5 text-danger">
                        {fieldErrors.password}
                      </span>
                    ) : null}
                    <span className="text-xs font-normal leading-5 text-muted">
                      영문, 숫자, 특수문자를 포함한 8~20자
                    </span>
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    이메일
                    <input
                      value={email}
                      onBlur={() => validateField("email")}
                      onChange={(event) => updateField("email", event.target.value)}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      aria-invalid={Boolean(fieldErrors.email)}
                      className={inputClassName("email")}
                      placeholder="team@example.com"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={isSubmitting}
                    />
                    {fieldErrors.email ? (
                      <span id="email-error" className="text-xs font-normal leading-5 text-danger">
                        {fieldErrors.email}
                      </span>
                    ) : null}
                  </label>

                  {errorMessage ? (
                    <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                      {errorMessage}
                    </p>
                  ) : null}

                  <button
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-brand px-5 text-base font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-brand-disabled"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "가입 중..." : "회원가입"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                  이미 계정이 있나요?{" "}
                  <Link href="/login" className="font-semibold text-brand-ink">
                    로그인
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
