"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { signIn } from "@/features/auth/api/auth";
import { useAuthSession } from "@/features/auth/model/auth-session";

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, startSession } = useAuthSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      router.replace("/teams");
    }
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
      router.replace("/teams");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "로그인에 실패했습니다."
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
            href="/sign-up"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]"
          >
            회원가입
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-10 lg:py-16">
          <div className="w-full max-w-md">
            <div className="overflow-hidden rounded-lg border border-[#dbe4f0] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="border-b border-[#e5eaf3] bg-[#f8fafc] px-6 py-5 sm:px-8">
                <p className="text-sm font-semibold text-[#4f6f9f]">
                  다시 오셨네요
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-normal">
                  로그인
                </h1>
              </div>

              <div className="p-6 sm:p-8">
                <p className="mt-3 text-sm leading-6 text-[#64748b]">
                  팀 운영 현황을 확인하려면 아이디와 비밀번호를 입력하세요.
                </p>

                <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
                  <label className="grid gap-2 text-sm font-semibold">
                    아이디
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
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
                      className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                      placeholder="비밀번호"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
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
                    {isSubmitting ? "로그인 중..." : "로그인"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#64748b]">
                  아직 계정이 없나요?{" "}
                  <Link
                    href="/sign-up"
                    className="font-semibold text-[#3d5b86]"
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
