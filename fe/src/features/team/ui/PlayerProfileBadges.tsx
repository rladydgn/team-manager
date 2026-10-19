import type { PlayerPosition, PlayerProfile } from "../api/team";

export const positionColors: Record<PlayerPosition, string> = {
  CB: "bg-brand-soft text-brand-ink border-brand-ring",
  WB: "bg-brand-soft text-brand-ink border-brand-ring",
  MF: "bg-success-soft text-success border-success-line",
  FW: "bg-danger-soft text-danger border-danger-line",
  WF: "bg-danger-soft text-danger border-danger-line",
};

export function PlayerProfileBadges({ mainPosition, jerseyNumber }: Partial<PlayerProfile>) {
  if (!mainPosition && jerseyNumber == null) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 align-middle text-xs font-medium">
      {jerseyNumber != null && <span className="rounded-md border border-line bg-subtle px-2 py-0.5 text-secondary" aria-label={`등번호 ${jerseyNumber}번`}>#{jerseyNumber}</span>}
      {mainPosition && <span className={`rounded-md border px-2 py-0.5 ${positionColors[mainPosition]}`} aria-label={`주포지션 ${mainPosition}`}>{mainPosition}</span>}
    </span>
  );
}
