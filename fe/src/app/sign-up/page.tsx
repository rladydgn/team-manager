"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signUp } from "@/features/auth/api/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signUp({
        username,
        password,
        email: email.trim() || undefined,
      });

      router.replace("/login");
    } catch (error) {
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
        <header className="flex items-center justify-between gap-4">
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
                  아이디와 비밀번호만으로 먼저 시작하고, 팀 정보는 로그인 후에
                  만들어도 됩니다.
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
                    <span className="text-xs font-normal leading-5 text-[#64748b]">
                      영문 소문자, 숫자, -, _ 조합 5~20자
                    </span>
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    비밀번호
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                      placeholder="Password1!"
                      type="password"
                      autoComplete="new-password"
                      required
                    />
                    <span className="text-xs font-normal leading-5 text-[#64748b]">
                      영문, 숫자, 특수문자를 포함한 8~20자
                    </span>
                  </label>

                  <label className="grid gap-2 text-sm font-semibold">
                    이메일
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                      placeholder="team@example.com"
                      type="email"
                      autoComplete="email"
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
