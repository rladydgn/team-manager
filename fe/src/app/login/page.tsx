"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getKakaoAuthorizeUrl, signIn } from "@/features/auth/api/auth";
import { useAuthSession } from "@/features/auth/model/auth-session";

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, startSession } = useAuthSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let oauthErrorTimer: number | undefined;

    if (new URLSearchParams(window.location.search).get("oauthError") === "kakao") {
      oauthErrorTimer = window.setTimeout(() => {
        setErrorMessage("카카오 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }, 0);
    }

    if (currentUser) {
      router.replace("/team");
    }

    return () => {
      if (oauthErrorTimer !== undefined) {
        window.clearTimeout(oauthErrorTimer);
      }
    };
  }, [currentUser, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await signIn({ username, password });

      if (!response.data) {
        setErrorMessage("로그인 정보를 확인하지 못했습니다.");
        return;
      }

      startSession({
        user: {
          id: response.data.id,
          name: response.data.name,
          username: response.data.username,
          email: response.data.email,
        },
      });
      router.replace("/team");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "로그인에 실패했습니다."
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
                  로그인
                </h1>
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-sm leading-6 text-muted">
                  내 팀의 일정과 소식을 확인하세요.
                </p>

                <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
                  <label className="grid gap-2 text-sm font-semibold">
                    아이디
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand-ring"
                      placeholder="user_01"
                      autoComplete="username"
                      required
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    비밀번호
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand-ring"
                      placeholder="비밀번호"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
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
                    {isSubmitting ? "로그인 중..." : "로그인"}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-xs font-medium text-placeholder">또는</span>
                  <span className="h-px flex-1 bg-line" />
                </div>

                <a
                  href={getKakaoAuthorizeUrl()}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-5 text-base font-semibold text-[rgba(0,0,0,0.85)] transition-colors hover:bg-[#f5dc00]"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5 fill-current"
                  >
                    <path d="M12 3C6.48 3 2 6.48 2 10.78c0 2.77 1.86 5.2 4.66 6.58l-1.18 4.3a.43.43 0 0 0 .66.46l5.17-3.43c.23.02.46.02.69.02 5.52 0 10-3.48 10-7.93S17.52 3 12 3Z" />
                  </svg>
                  카카오로 로그인
                </a>

                <p className="mt-6 text-center text-sm text-muted">
                  아직 계정이 없나요?{" "}
                  <Link
                    href="/sign-up"
                    className="font-semibold text-brand-ink"
                  >
                    회원가입
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
