export function MatchTrainingBadge({ isTraining }: { isTraining: boolean }) {
  if (!isTraining) return null;

  return <span className="status-badge bg-brand-soft text-brand-ink">훈련 진행</span>;
}
