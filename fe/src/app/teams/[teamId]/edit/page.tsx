"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/features/auth/model/auth-session";
import {
  getTeam,
  Team,
  TeamDetail,
  TeamUpdateRequest,
  updateTeam,
} from "@/features/team/api/team";

type TeamForm = {
  name: string;
  shortName: string;
  logoUrl: string;
  description: string;
  region: string;
  homeStadium: string;
  foundedAt: string;
  teamColor: string;
};

const emptyTeamForm: TeamForm = {
  name: "",
  shortName: "",
  logoUrl: "",
  description: "",
  region: "",
  homeStadium: "",
  foundedAt: "",
  teamColor: "",
};

function toTeamForm(team: Team): TeamForm {
  return {
    name: team.name,
    shortName: team.shortName ?? "",
    logoUrl: team.logoUrl ?? "",
    description: team.description ?? "",
    region: team.region ?? "",
    homeStadium: team.homeStadium ?? "",
    foundedAt: team.foundedAt ?? "",
    teamColor: team.teamColor ?? "",
  };
}

function cleanOptionalValue(value: string) {
  return value.trim() || undefined;
}

export default function EditTeamPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teamId = Number(params.teamId);
  const currentUser = useCurrentUser();
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [form, setForm] = useState<TeamForm>(emptyTeamForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadTeam = useCallback(async () => {
    if (!Number.isInteger(teamId) || teamId <= 0) {
      setErrorMessage("올바르지 않은 팀 주소입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getTeam(teamId);

      if (!response.data) {
        throw new Error("팀 정보를 찾을 수 없습니다.");
      }

      setTeamDetail(response.data);
      setForm(toTeamForm(response.data.team));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "팀 정보를 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadTeam();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadTeam]);

  const currentMember = useMemo(
    () =>
      teamDetail?.members.find((member) => member.userId === currentUser?.id),
    [currentUser?.id, teamDetail?.members]
  );
  const canEditTeam =
    currentMember?.role === "OWNER" || currentMember?.role === "SUB_MANAGER";

  function updateFormField<Key extends keyof TeamForm>(
    key: Key,
    value: TeamForm[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!teamDetail || !canEditTeam) {
      setErrorMessage("팀 수정 권한이 없습니다.");
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage("팀 이름을 입력해 주세요.");
      return;
    }

    const request: TeamUpdateRequest = {
      name: form.name.trim(),
      shortName: cleanOptionalValue(form.shortName),
      logoUrl: cleanOptionalValue(form.logoUrl),
      description: cleanOptionalValue(form.description),
      region: cleanOptionalValue(form.region),
      homeStadium: cleanOptionalValue(form.homeStadium),
      foundedAt: form.foundedAt || undefined,
      teamColor: cleanOptionalValue(form.teamColor),
    };

    setIsSaving(true);

    try {
      const response = await updateTeam(teamDetail.team.id, request);

      if (!response.data) {
        throw new Error("수정된 팀 정보를 받지 못했습니다.");
      }

      router.replace(`/teams/${response.data.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "팀 정보를 수정하지 못했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const detailPath = Number.isInteger(teamId) && teamId > 0 ? `/teams/${teamId}` : "/teams";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header data-legacy-page-header className="border-b border-[#dbe4f0] bg-white/90">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-sm font-bold text-white">
              TM
            </span>
            <span className="truncate text-base font-semibold">Team Manager</span>
          </Link>
          <Link
            href={detailPath}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]"
          >
            팀 상세
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href={detailPath}
          className="inline-flex w-fit text-sm font-semibold text-[#3d5b86] transition-colors hover:text-[#283f62]"
        >
          팀 상세로 돌아가기
        </Link>

        {isLoading ? (
          <section className="flex min-h-80 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
            <p className="text-sm font-semibold text-[#64748b]">팀 정보를 불러오는 중입니다.</p>
          </section>
        ) : errorMessage && !teamDetail ? (
          <section className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">팀 수정 화면을 열 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadTeam()}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]"
            >
              다시 시도
            </button>
          </section>
        ) : !currentUser ? (
          <section className="rounded-lg border border-[#dbe4f0] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">로그인이 필요합니다.</h1>
            <p className="mt-3 text-sm leading-6 text-[#64748b]">팀 수정은 운영진만 할 수 있습니다.</p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]"
            >
              로그인
            </Link>
          </section>
        ) : !canEditTeam ? (
          <section className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <p className="text-sm font-semibold text-[#b91c1c]">팀 수정 권한이 없습니다.</p>
            <p className="mt-3 text-sm leading-6 text-[#64748b]">OWNER와 SUB_MANAGER만 팀 정보를 수정할 수 있습니다.</p>
          </section>
        ) : teamDetail ? (
          <section className="overflow-hidden rounded-lg border border-[#dbe4f0] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="border-b border-[#e5eaf3] bg-[#f8fafc] px-5 py-5 sm:px-7">
              <p className="text-sm font-semibold text-[#4f6f9f]">팀 운영 설정</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <h1 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">팀 정보 수정</h1>
                <span className="text-sm font-semibold text-[#64748b]">{teamDetail.team.name}</span>
              </div>
            </div>

            <form className="grid gap-7 p-5 sm:p-7" noValidate onSubmit={handleSubmit}>
              <section className="grid gap-5">
                <div>
                  <h2 className="text-base font-bold text-[#0f172a]">기본 정보</h2>
                  <p className="mt-1 text-sm leading-6 text-[#64748b]">팀을 식별하고 소개하는 정보를 관리합니다.</p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold">
                    팀 이름
                    <input
                      value={form.name}
                      onChange={(event) => updateFormField("name", event.target.value)}
                      className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                      maxLength={100}
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    짧은 이름
                    <input
                      value={form.shortName}
                      onChange={(event) => updateFormField("shortName", event.target.value)}
                      className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                      placeholder="WFC"
                      maxLength={30}
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-semibold">
                  팀 소개
                  <textarea
                    value={form.description}
                    onChange={(event) => updateFormField("description", event.target.value)}
                    className="min-h-32 resize-y rounded-md border border-[#cbd5e1] bg-white px-4 py-3 text-base font-normal leading-7 outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                    placeholder="팀의 성격과 활동을 간단히 소개해 주세요."
                  />
                </label>
              </section>

              <section className="grid gap-5 border-t border-[#e5eaf3] pt-7">
                <div>
                  <h2 className="text-base font-bold text-[#0f172a]">활동 정보</h2>
                  <p className="mt-1 text-sm leading-6 text-[#64748b]">팀원과 상대 팀이 참고할 운영 정보를 입력합니다.</p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold">
                    활동 지역
                    <input
                      value={form.region}
                      onChange={(event) => updateFormField("region", event.target.value)}
                      className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                      placeholder="서울"
                      maxLength={100}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    홈 구장
                    <input
                      value={form.homeStadium}
                      onChange={(event) => updateFormField("homeStadium", event.target.value)}
                      className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                      placeholder="월드컵 보조경기장"
                      maxLength={100}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    창단일
                    <input
                      value={form.foundedAt}
                      onChange={(event) => updateFormField("foundedAt", event.target.value)}
                      className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                      type="date"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    로고 URL
                    <input
                      value={form.logoUrl}
                      onChange={(event) => updateFormField("logoUrl", event.target.value)}
                      className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                      placeholder="https://example.com/team-logo.png"
                      maxLength={500}
                    />
                  </label>
                </div>
              </section>

              <section className="grid gap-5 border-t border-[#e5eaf3] pt-7">
                <div>
                  <h2 className="text-base font-bold text-[#0f172a]">팀 색상</h2>
                  <p className="mt-1 text-sm leading-6 text-[#64748b]">팀을 구분하는 대표 색상을 선택할 수 있습니다.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    aria-label="팀 대표 색상"
                    value={form.teamColor || "#4f6f9f"}
                    onChange={(event) => updateFormField("teamColor", event.target.value)}
                    className="size-12 cursor-pointer rounded-md border border-[#cbd5e1] bg-white p-1"
                    type="color"
                  />
                  <span className="text-sm font-semibold text-[#52627b]">{form.teamColor || "색상 미지정"}</span>
                  {form.teamColor ? (
                    <button
                      type="button"
                      onClick={() => updateFormField("teamColor", "")}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]"
                    >
                      색상 제거
                    </button>
                  ) : null}
                </div>
              </section>

              {errorMessage ? (
                <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-[#e5eaf3] pt-6 sm:flex-row sm:justify-end">
                <Link
                  href={detailPath}
                  className="inline-flex h-12 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-5 text-base font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]"
                >
                  취소
                </Link>
                <button
                  className="inline-flex h-12 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-base font-semibold text-white transition-colors hover:bg-[#435f88] disabled:cursor-not-allowed disabled:bg-[#a9b9d3]"
                  type="submit"
                  disabled={isSaving || !form.name.trim()}
                >
                  {isSaving ? "저장 중..." : "변경 사항 저장"}
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}
