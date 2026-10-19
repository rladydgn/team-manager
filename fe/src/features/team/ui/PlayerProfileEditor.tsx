"use client";

import { useState, type FormEvent } from "react";
import { type PlayerPosition, type TeamMember, updateTeamMemberPlayerProfile } from "../api/team";
import { PlayerProfileFields } from "./PlayerProfileFields";

export function PlayerProfileEditor({ teamId, member, onSaved, onCancel }: {
  teamId: number; member: TeamMember; onSaved: (member: TeamMember) => void; onCancel: () => void;
}) {
  const [position, setPosition] = useState<PlayerPosition | "">(member.mainPosition ?? "");
  const [number, setNumber] = useState(member.jerseyNumber?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await updateTeamMemberPlayerProfile(teamId, member.id, {
        mainPosition: position || null, jerseyNumber: number === "" ? null : Number(number),
      });
      if (!response.data) throw new Error("선수 정보를 받지 못했습니다.");
      onSaved(response.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "선수 정보를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={save} className="grid gap-4 rounded-lg border border-line bg-subtle p-4" aria-label={`${member.name ?? "팀원"} 선수 정보 수정`}>
    <h2 className="text-sm font-semibold">{member.name} · 선수 정보</h2>
    <fieldset disabled={saving}>
      <PlayerProfileFields mainPosition={position} jerseyNumber={number} onPositionChange={setPosition} onNumberChange={setNumber} />
    </fieldset>
    <p className="text-xs leading-5 text-muted">등번호는 0~99이며 중복을 허용합니다. 미설정으로 선택하거나 등번호를 비우면 기존 값이 삭제됩니다.</p>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="submit" disabled={saving} className="btn-primary">{saving ? "저장 중…" : "저장"}</button>
      <button type="button" disabled={saving} onClick={onCancel} className="btn-secondary">취소</button>
    </div>
  </form>;
}
