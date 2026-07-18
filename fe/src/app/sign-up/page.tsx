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
      router.replace("/teams");
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
    return `h-12 rounded-md border bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] disabled:cursor-not-allowed disabled:bg-[#f8fafc] ${
      fieldErrors[field]
        ? "border-[#dc2626] focus:border-[#dc2626] focus:ring-4 focus:ring-[#fee2e2]"
        : "border-[#cbd5e1] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
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
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-6 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-6xl flex-col">
        <header data-legacy-page-header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-sm font-bold text-white">
              TM
            </span>
            <span className="truncate text-base font-semibold">Team Manager</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]"
          >
            로그인
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-10 lg:py-16">
          <div className="w-full max-w-md">
            <div className="overflow-hidden rounded-lg border border-[#dbe4f0] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="border-b border-[#e5eaf3] bg-[#f8fafc] px-6 py-5 sm:px-8">
                <p className="text-sm font-semibold text-[#4f6f9f]">
                  팀 운영 시작하기
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-normal">
                  회원가입
                </h1>
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-sm leading-6 text-[#64748b]">
                  이름과 계정 정보만 입력하면 바로 팀 운영을 시작할 수 있습니다.
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
                      <span id="name-error" className="text-xs font-normal leading-5 text-[#dc2626]">
                        {fieldErrors.name}
                      </span>
                    ) : null}
                    <span className="text-xs font-normal leading-5 text-[#64748b]">
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
                      <span id="birth-year-error" className="text-xs font-normal leading-5 text-[#dc2626]">
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
                      <span id="username-error" className="text-xs font-normal leading-5 text-[#dc2626]">
                        {fieldErrors.username}
                      </span>
                    ) : null}
                    <span className="text-xs font-normal leading-5 text-[#64748b]">
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
                      <span id="password-error" className="text-xs font-normal leading-5 text-[#dc2626]">
                        {fieldErrors.password}
                      </span>
                    ) : null}
                    <span className="text-xs font-normal leading-5 text-[#64748b]">
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
                      <span id="email-error" className="text-xs font-normal leading-5 text-[#dc2626]">
                        {fieldErrors.email}
                      </span>
                    ) : null}
                  </label>

                  {errorMessage ? (
                    <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
                      {errorMessage}
                    </p>
                  ) : null}

                  <button
                    className="inline-flex h-12 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-base font-semibold text-white transition-colors hover:bg-[#435f88] disabled:cursor-not-allowed disabled:bg-[#a9b9d3]"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "가입 중..." : "회원가입"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#64748b]">
                  이미 계정이 있나요?{" "}
                  <Link href="/login" className="font-semibold text-[#3d5b86]">
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
