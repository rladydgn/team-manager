"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MatchTrainingBadge } from "@/features/match/ui/MatchTrainingBadge";
import { getTeamParticipationVotes, type TeamParticipationVotes as ParticipationVotes } from "@/features/team/api/statistics";

export function TeamParticipationVotes({ teamId, startDate, endDate }: {
  teamId: number;
  startDate: string;
  endDate: string;
}) {
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: ParticipationVotes;
    error?: string;
  } | null>(null);
  const requestKey = `${teamId}:${startDate}:${endDate}:${page}:${retry}`;

  useEffect(() => {
    let active = true;
    getTeamParticipationVotes(teamId, startDate, endDate, page)
      .then((response) => {
        if (!response.data) throw new Error("경기별 투표를 불러오지 못했습니다.");
        if (active) setResult({ key: requestKey, data: response.data });
      })
      .catch((error: unknown) => {
        if (active) setResult({
          key: requestKey,
          error: error instanceof Error ? error.message : "경기별 투표를 불러오지 못했습니다.",
        });
      });
    return () => { active = false; };
  }, [teamId, startDate, endDate, page, requestKey]);

  const current = result?.key === requestKey ? result : null;
  const data = current?.data;

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white" aria-labelledby="participation-votes-heading">
      <div className="space-y-2 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="participation-votes-heading" className="text-lg font-semibold">경기별 투표</h2>
          {data ? <span className="text-sm text-muted">총 {data.totalElements}명 · {data.matches.length}경기</span> : null}
        </div>
        <p className="text-sm text-muted">{startDate}부터 {endDate}까지</p>
        <p className="text-xs leading-6 text-muted">
          <span className="font-semibold text-brand-ink">O 참석 투표</span> · <span className="font-semibold text-danger">X 불참 투표</span> · 빈칸: 미투표·미정·참가 명단 없음
        </p>
        <p id="participation-votes-help" className="text-xs leading-5 text-muted">실제 출석이 아닌 투표 내역입니다. 훈련을 포함하고 취소 경기는 제외합니다. 표를 좌우로 스크롤하거나 경기 날짜를 눌러 상세 내용을 확인하세요.</p>
      </div>

      {!current ? (
        <p role="status" className="px-5 py-16 text-center text-sm text-muted">경기별 투표를 불러오는 중입니다.</p>
      ) : current.error ? (
        <div role="alert" className="space-y-4 px-5 py-12 text-center">
          <p className="text-sm text-danger">{current.error}</p>
          <button type="button" onClick={() => setRetry((value) => value + 1)} className="btn-secondary">다시 시도</button>
        </div>
      ) : data && data.matches.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-muted">선택한 기간에 집계할 경기가 없습니다.</p>
      ) : data && data.members.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-muted">표시할 팀원이 없습니다.</p>
      ) : data ? (
        <div role="region" aria-label="선수별 경기 투표 표" aria-describedby="participation-votes-help" tabIndex={0} className="isolate max-h-[65dvh] overflow-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <caption className="sr-only">{startDate}부터 {endDate}까지 선수별 경기 참여 투표. O는 참석, X는 불참, 빈칸은 미투표·미정·참가 명단 없음.</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 top-0 z-30 min-w-28 border-b border-r border-line bg-subtle px-4 py-3 text-left text-xs text-secondary sm:min-w-36">선수</th>
                {data.matches.map((match) => (
                  <th key={match.id} scope="col" className="sticky top-0 z-20 min-w-32 border-b border-r border-line bg-subtle px-2 py-3 text-center text-xs">
                    <Link href={`/match/${match.id}`} className="inline-flex min-h-11 flex-col justify-center gap-1 rounded px-2 text-brand-ink hover:underline" aria-label={`${match.matchAt.slice(0, 10)} ${match.matchAt.slice(11, 16)} 경기 상세`}>
                      <span className="whitespace-nowrap">{match.matchAt.slice(0, 10).replaceAll("-", ".")}</span>
                      <span className="font-normal text-muted">{match.matchAt.slice(11, 16)}</span>
                    </Link>
                    <p className="mx-auto max-w-32 truncate font-normal text-secondary" title={match.opponentTeamName ?? undefined}>
                      {match.matchType === "INTERNAL" ? "자체 경기" : match.opponentTeamName || "외부 경기"}
                    </p>
                    {match.isTraining ? <div className="mt-1"><MatchTrainingBadge isTraining={match.isTraining} /></div> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.members.map((member) => (
                <tr key={member.teamMemberId}>
                  <th scope="row" className="sticky left-0 z-10 border-b border-r border-line bg-white px-4 py-4 text-left font-semibold">
                    <span className="block w-20 break-words sm:w-28">{member.name}</span>
                  </th>
                  {data.matches.map((match) => {
                    const vote = member.votes[String(match.id)];
                    const label = vote === "AVAILABLE" ? "참석 투표" : vote === "UNAVAILABLE" ? "불참 투표" : vote === "PENDING" ? "미정" : vote === "INVITED" ? "미투표" : "참가 명단 없음";
                    return (
                      <td key={match.id} className="border-b border-r border-line px-3 py-4 text-center" title={label}>
                        <span className="sr-only">{label}</span>
                        <span aria-hidden="true" className={`text-base font-semibold ${vote === "UNAVAILABLE" ? "text-danger" : "text-brand-ink"}`}>
                          {vote === "AVAILABLE" ? "O" : vote === "UNAVAILABLE" ? "X" : ""}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-line px-5 py-4 sm:px-6">
          <button type="button" disabled={data.page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="btn-secondary">이전</button>
          <span className="text-sm text-muted">{data.page + 1} / {data.totalPages}</span>
          <button type="button" disabled={data.page >= data.totalPages - 1} onClick={() => setPage((value) => value + 1)} className="btn-secondary">다음</button>
        </div>
      ) : null}
    </section>
  );
}
