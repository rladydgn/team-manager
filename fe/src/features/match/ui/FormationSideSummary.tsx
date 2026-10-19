import { PlayerProfileBadges } from "@/features/team/ui/PlayerProfileBadges";
import Link from "next/link";
import { FormationPlayer, sideLabels } from "../api/formations";

export function FormationSideSummary({ matchId, players, canManage }: { matchId: number; players: FormationPlayer[]; canManage: boolean }) {
  return <section className="surface-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold">편 배정</h2><p className="mt-2 text-sm text-muted">
        {(["UNASSIGNED", "HOME", "AWAY"] as const).map((side) => `${sideLabels[side]} ${players.filter((player) => player.side === side).length}명`).join(" · ")}
      </p></div>
      {canManage && <Link href={`/match/${matchId}/formations/sides`} className="btn-secondary">편 배정 관리</Link>}
    </div>
    <details className="mt-3"><summary className="min-h-11 py-3 text-sm text-brand-ink">참석 명단 보기</summary>
      {!players.length ? <p className="text-sm text-muted">참석 투표한 선수가 없어요.</p> : <ul className="grid gap-x-5 divide-y divide-line sm:grid-cols-2">
        {players.map((player) => <li key={player.teamMemberId} className="flex min-w-0 items-center justify-between gap-3 py-3 text-sm">
          <span className="min-w-0 break-words">{player.name} <PlayerProfileBadges {...player} /></span><span className="shrink-0 status-badge">{sideLabels[player.side]}</span>
        </li>)}
      </ul>}
    </details>
  </section>;
}
