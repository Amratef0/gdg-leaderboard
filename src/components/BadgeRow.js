export default function BadgeRow({ badges }) {
  if (!badges || badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b.label}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm transition-transform hover:scale-105 dark:bg-gray-800 dark:text-gray-200"
          title={b.label}
        >
          <span>{b.icon}</span> {b.label}
        </span>
      ))}
    </div>
  );
}
