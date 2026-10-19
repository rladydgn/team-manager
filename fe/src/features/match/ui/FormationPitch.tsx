"use client";

import { PlayerProfileBadges } from "@/features/team/ui/PlayerProfileBadges";
import { useEffect, useRef, useState } from "react";
import type { FormationPlayer, FormationTemplate, Placement } from "../api/formations";
import { ineligibleLabels } from "../model/formations";

type Props = {
  template: FormationTemplate; placements: Placement[]; players: FormationPlayer[]; bench: FormationPlayer[];
  onPlace?: (slotId: string, memberId: number) => void; onRemove?: (slotId: string) => void;
};

export function FormationPitch({ template, placements, players, bench, onPlace, onRemove }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const slot = template.slots.find((item) => item.id === selectedSlot);
  const placement = placements.find((item) => item.slotId === selectedSlot);
  const editable = Boolean(onPlace);
  useEffect(() => {
    if (selectedSlot) dialog.current?.showModal();
    else dialog.current?.close();
  }, [selectedSlot]);
  const close = () => { setSelectedSlot(null); opener.current?.focus(); };
  const open = (id: string, target: HTMLElement) => { opener.current = target; setSelectedSlot(id); };
  const drag = (event: React.DragEvent, memberId: number) => {
    event.dataTransfer.setData("application/x-formation-player", String(memberId));
    event.dataTransfer.effectAllowed = "move";
  };

  return <>
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-w-0">
        <p className="mb-3 text-center text-xs font-medium text-muted">↑ 공격 방향</p>
        <div className="relative mx-auto aspect-[3/4] w-full max-w-xl rounded-xl border border-line-strong bg-brand-soft" aria-label={`${template.label} 포메이션 경기장`}>
          <svg viewBox="0 0 300 400" className="pointer-events-none absolute inset-0 h-full w-full text-brand/40" fill="none" stroke="currentColor" aria-hidden="true">
            <rect x="8" y="8" width="284" height="384" rx="2" />
            <path d="M8 200h284M85 8v58h130V8M115 8v22h70V8M85 392v-58h130v58M115 392v-22h70v22" />
            <circle cx="150" cy="200" r="34" /><circle cx="150" cy="200" r="2" fill="currentColor" />
          </svg>
          {template.slots.map((slot) => {
            const player = placements.find((item) => item.slotId === slot.id);
            const contents = <>
              <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold sm:h-11 sm:w-11 ${player ? player.eligible ? "border-brand bg-brand text-white" : "border-danger bg-danger-soft text-danger" : "border-line-strong bg-white text-muted"}`}>
                {player ? player.eligible ? player.jerseyNumber ?? (slot.id === "GK" ? "GK" : "●") : "!" : editable ? "+" : "—"}
              </span>
              <span className="mt-1 block truncate rounded bg-white/95 px-0.5 py-0.5 text-[10px] font-medium text-ink sm:text-xs">{player?.name ?? slot.label}</span>
              {player && !player.eligible && <span className="block text-[10px] font-semibold text-danger">배치 제외</span>}
            </>;
            const className = "absolute w-[17%] max-w-24 -translate-x-1/2 -translate-y-1/2 rounded-lg p-0.5";
            const style = { left: `${slot.x * 100}%`, top: `${slot.y * 100}%` };
            return editable || player ? <button key={slot.id} type="button" className={`${className} min-h-11 hover:bg-white/50`} style={style}
              aria-label={`${slot.label}, ${player?.name ?? "빈 자리"}${player && !player.eligible ? ", 배치 제외" : ""}, ${editable ? "선수 변경" : "선수 정보"}`}
              onClick={(event) => open(slot.id, event.currentTarget)} draggable={editable && Boolean(player?.eligible)}
              onDragStart={(event) => player && drag(event, player.teamMemberId)}
              onDragOver={(event) => { if (editable) event.preventDefault(); }}
              onDrop={(event) => {
                event.preventDefault();
                const id = Number(event.dataTransfer.getData("application/x-formation-player"));
                if (players.some((player) => player.teamMemberId === id)) onPlace?.(slot.id, id);
              }}>{contents}</button> : <div key={slot.id} className={className} style={style}>{contents}</div>;
          })}
        </div>
        {editable && <p className="mt-3 text-xs leading-5 text-muted">위치를 눌러 선수를 선택하세요. PC에서는 선수를 끌어서 배치하거나 위치를 바꿀 수 있어요.</p>}
      </div>
      <aside className="min-w-0 rounded-xl border border-line bg-white p-4 lg:self-start">
        <h3 className="font-semibold">후보 <span className="ml-1 text-brand-ink">{bench.length}명</span></h3>
        {!bench.length ? <p className="mt-4 text-sm text-muted">후보 선수가 없어요.</p> : <>
          <div aria-hidden="true" className="mt-4 grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem] gap-2 border-b border-line pb-2 text-xs font-medium text-muted">
            <span>선수</span><span className="text-center">주포지션</span><span className="text-center">등번호</span>
          </div>
          <ul className="divide-y divide-line">
            {bench.map((player) => <li key={player.teamMemberId} draggable={editable} onDragStart={(event) => drag(event, player.teamMemberId)}
              className={`grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem] items-center gap-2 py-3 text-sm ${editable ? "cursor-grab" : ""}`}>
              <span className="min-w-0 break-words font-medium">{player.name}</span>
              <span className="text-center">
                {player.mainPosition ? <PlayerProfileBadges mainPosition={player.mainPosition} /> : <span className="text-muted" aria-label="주포지션 미설정">—</span>}
              </span>
              <span className="text-center">
                {player.jerseyNumber != null ? <PlayerProfileBadges jerseyNumber={player.jerseyNumber} /> : <span className="text-muted" aria-label="등번호 미설정">—</span>}
              </span>
            </li>)}
          </ul>
        </>}
      </aside>
    </div>
    <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); close(); }} onClose={close}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-line bg-white p-5 text-ink shadow-popover backdrop:bg-ink/40" aria-labelledby="formation-player-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="formation-player-title" className="text-lg font-semibold">{slot?.label} · {editable ? "선수 선택" : "선수 정보"}</h2>
        <button type="button" className="btn-quiet" onClick={close}>닫기</button>
      </div>
      {placement && <p className="mt-3 break-words text-sm leading-6">{placement.name} <PlayerProfileBadges {...placement} />
        {!placement.eligible && <span className="block text-danger">배치 제외 · {ineligibleLabels[placement.ineligibleReason!]}</span>}
      </p>}
      {editable && <>
        {placement && <button type="button" className="btn-secondary mt-4 w-full" onClick={() => { onRemove?.(selectedSlot!); close(); }}>배치 해제</button>}
        {!players.length && <p className="mt-5 text-sm text-muted">배치할 수 있는 참석 선수가 없어요.</p>}
        <ul className="mt-4 divide-y divide-line">{players.map((player) => {
          const current = placements.find((item) => item.teamMemberId === player.teamMemberId);
          return <li key={player.teamMemberId}><button type="button" className="min-h-11 w-full rounded-lg px-2 py-3 text-left hover:bg-brand-soft"
            onClick={() => { onPlace?.(selectedSlot!, player.teamMemberId); close(); }}>
            <span className="block break-words text-sm font-medium">{player.name}</span>
            <PlayerProfileBadges {...player} />
            {players.filter((item) => item.name === player.name).length > 1 && <span className="mr-2 text-xs text-muted">팀원 #{player.teamMemberId}</span>}
            <span className="text-xs text-muted">{current ? template.slots.find((slot) => slot.id === current.slotId)?.label : "후보"}</span>
          </button></li>;
        })}</ul>
      </>}
    </dialog>
  </>;
}
