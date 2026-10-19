import type { PlayerPosition } from "../api/team";

export const playerPositions: PlayerPosition[] = ["CB", "WB", "MF", "FW", "WF"];

export function PlayerProfileFields({ mainPosition, jerseyNumber, onPositionChange, onNumberChange }: {
  mainPosition: PlayerPosition | "";
  jerseyNumber: string;
  onPositionChange: (value: PlayerPosition | "") => void;
  onNumberChange: (value: string) => void;
}) {
  return <div className="grid min-w-0 gap-3 sm:grid-cols-2">
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-secondary">
      주포지션 · 선택
      <select className="field" value={mainPosition} onChange={(event) => onPositionChange(event.target.value as PlayerPosition | "")}>
        <option value="">미설정</option>
        {playerPositions.map((position) => <option key={position} value={position}>{position}</option>)}
      </select>
    </label>
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-secondary">
      등번호 · 선택
      <input type="number" inputMode="numeric" min={0} max={99} step={1} className="field" value={jerseyNumber}
        placeholder="미설정" onChange={(event) => onNumberChange(event.target.value)} />
    </label>
  </div>;
}
