export default function MilestoneProgress({ currentPoints, targetPoints, targetLabel }) {
  if (!targetPoints || targetPoints <= currentPoints) {
    return (
      <div className="rounded-lg bg-gdg-green/10 px-4 py-3 text-sm text-gdg-green">
        🎉 You're leading — no one's ahead of you here!
      </div>
    );
  }
  const remaining = targetPoints - currentPoints;
  const pct = Math.min(100, Math.round((currentPoints / targetPoints) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{remaining} points to {targetLabel}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gdg-blue to-gdg-green transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
