"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  completeKakaoSignUp,
  isUsernameAvailable,
} from "@/features/auth/api/auth";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { validateSignUpField } from "@/features/auth/model/sign-up-validation";
import { ApiRequestError } from "@/shared/api/http";

export default function KakaoSignUpPage() {
  const router = useRouter();
  const { currentUser, startSession } = useAuthSession();
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      router.replace("/team");
    }
  }, [currentUser, router]);

  function validateUsername(value: string) {
    const error = validateSignUpField("username", value) ?? "";
    setUsernameError(error);
    return error.length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!validateUsername(username)) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (!(await isUsernameAvailable(username))) {
        setUsernameError("이미 사용 중인 아이디입니다.");
        return;
      }

      const response = await completeKakaoSignUp({ username });
      if (!response.data) {
        setErrorMessage("가입한 사용자 정보를 확인하지 못했습니다.");
        return;
      }

      startSession({ user: response.data });
      router.replace("/team");
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "DUPLICATED_USERNAME") {
        setUsernameError(error.message);
        return;
      }

      if (error instanceof ApiRequestError && error.code === "KAKAO_LOGIN_FAILED") {
        setErrorMessage("카카오 인증이 만료되었습니다. 로그인부터 다시 진행해 주세요.");
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "카카오 회원가입에 실패했습니다."
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
            로그인으로 돌아가기
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-10 lg:py-16">
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-[#dbe4f0] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="border-b border-[#e5eaf3] bg-[#f8fafc] px-6 py-5 sm:px-8">
              <p className="text-sm font-semibold text-[#4f6f9f]">카카오 로그인</p>
              <h1 className="mt-2 text-3xl font-bold tracking-normal">아이디 설정</h1>
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-sm leading-6 text-[#64748b]">
                Team Manager에서 사용할 아이디를 설정해 주세요. 아이디를 저장해야 회원가입이 완료됩니다.
              </p>

              <form className="mt-8 grid gap-5" noValidate onSubmit={handleSubmit}>
                <label className="grid gap-2 text-sm font-semibold">
                  아이디
                  <input
                    value={username}
                    onBlur={() => validateUsername(username)}
                    onChange={(event) => {
                      const value = event.target.value;
                      setUsername(value);
                      if (usernameError) {
                        validateUsername(value);
                      }
                    }}
                    aria-describedby={usernameError ? "username-error" : "username-help"}
                    aria-invalid={Boolean(usernameError)}
                    className={`h-12 rounded-md border bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] disabled:cursor-not-allowed disabled:bg-[#f8fafc] ${
                      usernameError
                        ? "border-[#dc2626] focus:border-[#dc2626] focus:ring-4 focus:ring-[#fee2e2]"
                        : "border-[#cbd5e1] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                    }`}
                    placeholder="user_01"
                    autoComplete="username"
                    required
                    disabled={isSubmitting}
                  />
                  {usernameError ? (
                    <span id="username-error" className="text-xs font-normal leading-5 text-[#dc2626]">
                      {usernameError}
                    </span>
                  ) : (
                    <span id="username-help" className="text-xs font-normal leading-5 text-[#64748b]">
                      영문 소문자, 숫자, -, _ 조합 5~20자
                    </span>
                  )}
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
                  {isSubmitting ? "저장 중..." : "아이디 저장하고 시작하기"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
