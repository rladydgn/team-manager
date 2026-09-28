"use client";

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
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas px-5 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-6xl flex-col">

        <section className="flex flex-1 items-center justify-center py-10 lg:py-16">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-white shadow-card">
            <div className="px-6 pt-7 sm:px-8">
              <p className="text-sm font-semibold text-brand">카카오 로그인</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">아이디 설정</h1>
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-sm leading-6 text-muted">
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
                    className={`h-12 rounded-lg border bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-placeholder disabled:cursor-not-allowed disabled:bg-subtle ${
                      usernameError
                        ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger-soft"
                        : "border-line-strong focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    }`}
                    placeholder="user_01"
                    autoComplete="username"
                    required
                    disabled={isSubmitting}
                  />
                  {usernameError ? (
                    <span id="username-error" className="text-xs font-normal leading-5 text-danger">
                      {usernameError}
                    </span>
                  ) : (
                    <span id="username-help" className="text-xs font-normal leading-5 text-muted">
                      영문 소문자, 숫자, -, _ 조합 5~20자
                    </span>
                  )}
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
