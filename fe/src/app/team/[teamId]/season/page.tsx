"use client";

import Link from "next/link";
import { DragEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { getTeamSeasons, reorderTeamSeasons, setDefaultTeamSeason, type TeamSeason } from "@/features/team/api/season";
import { getTeam, type Team } from "@/features/team/api/team";

export default function TeamSeasonSettingsPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const { currentUser, isSessionReady } = useAuthSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [seasons, setSeasons] = useState<TeamSeason[]>([]);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    if (!isSessionReady || !currentUser) return;
    try {
      const [teamResponse, seasonResponse] = await Promise.all([getTeam(teamId), getTeamSeasons(teamId)]);
      const member = teamResponse.data?.members.find((item) => item.userId === currentUser.id);
      if (member?.role !== "OWNER" && member?.role !== "SUB_MANAGER") {
        setErrorMessage("팀장과 부관리자만 시즌 설정을 변경할 수 있습니다.");
        return;
      }
      setTeam(teamResponse.data?.team ?? null);
      setSeasons(seasonResponse.data ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "시즌 정보를 불러오지 못했습니다.");
    }
  }, [currentUser, isSessionReady, teamId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timerId);
  }, [load]);

  async function saveOrder(next: TeamSeason[]) {
    const previous = seasons;
    setSeasons(next);
    setIsSaving(true);
    setErrorMessage("");
    try {
      const response = await reorderTeamSeasons(teamId, next.map((season) => season.id));
      setSeasons(response.data ?? next);
    } catch (error) {
      setSeasons(previous);
      setErrorMessage(error instanceof Error ? error.message : "시즌 순서를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function moveSeason(seasonId: number, direction: -1 | 1) {
    const defaultSeason = seasons.find((season) => season.isDefault);
    const movable = seasons.filter((season) => !season.isDefault);
    const index = movable.findIndex((season) => season.id === seasonId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= movable.length) return;
    const nextMovable = [...movable];
    [nextMovable[index], nextMovable[target]] = [nextMovable[target], nextMovable[index]];
    void saveOrder(defaultSeason ? [defaultSeason, ...nextMovable] : nextMovable);
  }

  function dropOn(event: DragEvent<HTMLLIElement>, targetId: number) {
    event.preventDefault();
    if (draggedId === null || draggedId === targetId || isSaving) return;
    const defaultSeason = seasons.find((season) => season.isDefault);
    const movable = seasons.filter((season) => !season.isDefault);
    const from = movable.findIndex((season) => season.id === draggedId);
    const to = movable.findIndex((season) => season.id === targetId);
    if (from < 0 || to < 0) return;
    const nextMovable = [...movable];
    const [moved] = nextMovable.splice(from, 1);
    nextMovable.splice(to, 0, moved);
    setDraggedId(null);
    void saveOrder(defaultSeason ? [defaultSeason, ...nextMovable] : nextMovable);
  }

  async function makeDefault(seasonId: number) {
    setIsSaving(true);
    setErrorMessage("");
    try {
      const response = await setDefaultTeamSeason(teamId, seasonId);
      setSeasons(response.data ?? seasons);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "기본 시즌을 변경하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8 text-[#111827] sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-4 border-b border-[#dbe4f0] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold text-[#4f6f9f]">SEASON SETTINGS</p><h1 className="mt-2 text-3xl font-bold text-[#0f172a]">{team?.name ?? "팀"} 시즌 설정</h1><p className="mt-3 text-sm text-[#64748b]">기본 시즌은 항상 첫 번째로 보입니다. 나머지는 끌어서 순서를 바꿀 수 있습니다.</p></div>
          {team ? <Link href={`/team/${teamId}/season/new`} className="inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white">새 시즌 만들기</Link> : null}
        </div>
        {errorMessage ? <p className="mt-5 rounded-md border border-[#fecaca] bg-white px-4 py-3 text-sm text-[#b91c1c]">{errorMessage}</p> : null}
        {team && seasons.length === 0 ? <div className="mt-6 rounded-lg border border-dashed border-[#c8d4e6] bg-white px-5 py-14 text-center text-sm text-[#64748b]">아직 등록된 시즌이 없습니다.</div> : null}
        <ol className="mt-6 grid gap-3">
          {seasons.map((season, index) => {
            const movableIndex = seasons.filter((item) => !item.isDefault).findIndex((item) => item.id === season.id);
            const movableCount = seasons.filter((item) => !item.isDefault).length;
            return (
              <li key={season.id} draggable={!season.isDefault && !isSaving} onDragStart={() => setDraggedId(season.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOn(event, season.id)} className={`rounded-lg border bg-white p-4 ${season.isDefault ? "border-[#9eb5d3] ring-1 ring-[#d6e2f1]" : "border-[#dbe4f0] cursor-grab"}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-[#94a3b8]">{index + 1}</span><h2 className="truncate font-bold text-[#1e293b]">{season.name}</h2>{season.isDefault ? <span className="rounded-full bg-[#e7eef8] px-2 py-1 text-xs font-bold text-[#3d5b86]">기본</span> : null}</div><p className="mt-2 text-sm text-[#64748b]">{season.startDate} ~ {season.endDate}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {!season.isDefault ? <><button type="button" aria-label={`${season.name} 위로 이동`} disabled={isSaving || movableIndex === 0} onClick={() => moveSeason(season.id, -1)} className="h-9 rounded-md border border-[#c8d4e6] px-3 text-sm font-semibold text-[#475569] disabled:opacity-40">↑</button><button type="button" aria-label={`${season.name} 아래로 이동`} disabled={isSaving || movableIndex === movableCount - 1} onClick={() => moveSeason(season.id, 1)} className="h-9 rounded-md border border-[#c8d4e6] px-3 text-sm font-semibold text-[#475569] disabled:opacity-40">↓</button><button type="button" disabled={isSaving} onClick={() => void makeDefault(season.id)} className="h-9 rounded-md border border-[#9eb5d3] px-3 text-sm font-semibold text-[#3d5b86]">기본으로 설정</button></> : <span className="text-xs font-semibold text-[#64748b]">위치 고정</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-[#3d5b86]"><Link href={`/team/${teamId}/statistics`}>통계로 돌아가기</Link><Link href={`/team/${teamId}/ranking`}>순위로 돌아가기</Link></div>
      </div>
    </main>
  );
}
