"use client";

import { useRef, useState } from "react";
import { type PlayerPosition, type PlayerProfile, type TeamMember, updateTeamMemberPlayerProfile } from "../api/team";
import { PlayerProfileBadges, positionColors } from "./PlayerProfileBadges";
import { playerPositions } from "./PlayerProfileFields";

export function PlayerProfileCells({ teamId, member, canEdit, onSaved }: {
  teamId: number; member: TeamMember; canEdit: boolean; onSaved: (member: TeamMember) => void;
}) {
  const [position, setPosition] = useState<PlayerPosition | "">(member.mainPosition ?? "");
  const [number, setNumber] = useState(member.jerseyNumber?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const [failure, setFailure] = useState<{ field: "position" | "number"; message: string; profile?: PlayerProfile } | null>(null);
  const [status, setStatus] = useState("");

  async function save(profile: PlayerProfile, field: "position" | "number") {
    if (pending.current || !canEdit) return;
    pending.current = true;
    setSaving(true);
    setFailure(null);
    setStatus("저장 중…");
    try {
      const response = await updateTeamMemberPlayerProfile(teamId, member.id, profile);
      if (!response.data) throw new Error("선수 정보를 받지 못했습니다.");
      setPosition(response.data.mainPosition ?? "");
      setNumber(response.data.jerseyNumber?.toString() ?? "");
      onSaved(response.data);
      setStatus("저장됨");
    } catch (error) {
      setFailure({ field, profile, message: error instanceof Error ? error.message : "저장하지 못했습니다." });
      setStatus("");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  function saveNumber(input: HTMLInputElement) {
    if (!input.validity.valid) {
      setFailure({ field: "number", message: "0~99 정수를 입력해주세요." });
      input.reportValidity();
      return;
    }
    const jerseyNumber = number === "" ? null : Number(number);
    if (jerseyNumber === member.jerseyNumber && !failure) return;
    void save({ mainPosition: member.mainPosition, jerseyNumber }, "number");
  }

  function feedback(field: "position" | "number") {
    return failure?.field === field ? <div className="mt-1 text-xs text-danger" role="alert">
      <p>{failure.message}</p>
      {failure.profile && <button type="button" disabled={saving} className="min-h-9 underline" onClick={() => void save(failure.profile!, field)}>다시 저장</button>}
    </div> : null;
  }

  return <>
    <td className="block min-w-0 px-2 py-2 align-top lg:table-cell lg:w-28 lg:py-4">
      {canEdit ? <select aria-label={`${member.name ?? "팀원"} 주포지션`} disabled={saving}
        className={`min-h-11 w-full rounded-lg border px-1 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-ring disabled:opacity-60 ${position ? positionColors[position] : "border-line-strong bg-white text-muted"}`}
        value={position} onChange={(event) => {
          const value = event.target.value as PlayerPosition | "";
          setPosition(value);
          void save({ mainPosition: value || null, jerseyNumber: member.jerseyNumber }, "position");
        }}>
        <option value="" className="bg-white text-ink">미설정</option>
        {playerPositions.map((value) => <option key={value} value={value} className="bg-white text-ink">{value}</option>)}
      </select> : member.mainPosition ? <PlayerProfileBadges mainPosition={member.mainPosition} /> : <span className="text-muted" aria-label="주포지션 미설정">—</span>}
      {feedback("position")}
      <span className="sr-only" role="status">{member.name} {status}</span>
    </td>
    <td className="block min-w-0 px-2 py-2 align-top lg:table-cell lg:w-24 lg:py-4">
      {canEdit ? <input aria-label={`${member.name ?? "팀원"} 등번호`} type="number" inputMode="numeric" min={0} max={99} step={1}
        disabled={saving} value={number} placeholder="미설정"
        className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:opacity-60"
        onChange={(event) => { setNumber(event.target.value); setFailure(null); setStatus(""); }}
        onBlur={(event) => saveNumber(event.currentTarget)}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }} />
        : member.jerseyNumber != null ? <PlayerProfileBadges jerseyNumber={member.jerseyNumber} /> : <span className="text-muted" aria-label="등번호 미설정">—</span>}
      {feedback("number")}
    </td>
  </>;
}
