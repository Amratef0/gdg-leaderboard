export default function StatCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClass || "bg-gdg-blue/10 text-gdg-blue"}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}
