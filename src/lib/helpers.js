export const CATEGORY_LABELS = {
  assignment: "Assignment",
  quiz: "Quiz",
  attendance_bonus: "Attendance Bonus",
  bonus: "Bonus",
};

export const CATEGORY_COLORS = {
  assignment: "bg-gdg-green/15 text-gdg-green",
  quiz: "bg-gdg-blue/15 text-gdg-blue",
  attendance_bonus: "bg-gdg-yellow/20 text-yellow-700 dark:text-yellow-400",
  bonus: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
};

export function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function medalFor(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

// Start (Sunday) of the current calendar week, as a Date at 00:00
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function isThisWeek(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) >= startOfWeek();
}

// Consecutive-week streak: counts how many weeks in a row (ending this
// week or last week) the student has at least one positive activity entry.
export function computeStreak(activityDates) {
  if (!activityDates || activityDates.length === 0) return 0;
  const weeksWithActivity = new Set(
    activityDates.map((d) => {
      const w = startOfWeek(new Date(d));
      return w.getTime();
    })
  );
  let streak = 0;
  let cursor = startOfWeek();
  // allow the streak to still "count" even if this current week has no
  // activity yet (session might just not have happened this week yet)
  if (!weeksWithActivity.has(cursor.getTime())) {
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 7);
  }
  while (weeksWithActivity.has(cursor.getTime())) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

// Badges derived purely from data already on hand — no extra tables needed.
export function computeBadges({ totalPoints, categoryTotals, trackRank, globalRank, streak }) {
  const badges = [];
  if ((categoryTotals?.assignment || 0) > 0) badges.push({ icon: "🎯", label: "First Assignment" });
  if (totalPoints >= 100) badges.push({ icon: "💯", label: "100 Points Club" });
  if (totalPoints >= 500) badges.push({ icon: "🚀", label: "500 Points Club" });
  if (trackRank && trackRank <= 3) badges.push({ icon: "🏅", label: "Track Top 3" });
  else if (trackRank && trackRank <= 10) badges.push({ icon: "⭐", label: "Track Top 10" });
  if (globalRank && globalRank <= 10) badges.push({ icon: "🌍", label: "GDG Top 10" });
  if (streak >= 3) badges.push({ icon: "🔥", label: `${streak}-Week Streak` });
  return badges;
}

// Downloads a CSV built from an array of objects
export function downloadCsv(filename, columns, rows) {
  const escape = (val) => {
    const s = val === null || val === undefined ? "" : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(([label]) => escape(label)).join(",");
  const lines = rows.map((row) => columns.map(([, key]) => escape(row[key])).join(","));
  const csv = [header, ...lines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
