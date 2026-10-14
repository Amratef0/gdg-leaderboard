"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PageShell from "@/components/PageShell";
import StatCard from "@/components/StatCard";
import QrCodeCard from "@/components/QrCodeCard";
import TrackComparison from "@/components/TrackComparison";
import { startOfWeek, downloadCsv, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/helpers";
import { GitBranch, Users, Trophy, Camera, Download, TrendingUp, UserX, PieChart, Zap } from "lucide-react";

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [trackCount, setTrackCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [topStudent, setTopStudent] = useState(null);
  const [totalPointsAwarded, setTotalPointsAwarded] = useState(0);
  const [pointsThisWeek, setPointsThisWeek] = useState(0);
  const [topGainerWeek, setTopGainerWeek] = useState(null);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [snapshotting, setSnapshotting] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState("");
  const [exportingAll, setExportingAll] = useState(false);

  async function loadStats() {
    setLoading(true);
    const [{ count: tCount }, { count: sCount }, { data: top }, { data: allStudents }] = await Promise.all([
      supabase.from("tracks").select("id", { count: "exact", head: true }),
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("students").select("full_name, total_points").order("total_points", { ascending: false }).limit(1),
      supabase.from("students").select("id, total_points"),
    ]);
    setTrackCount(tCount || 0);
    setStudentCount(sCount || 0);
    setTopStudent(top?.[0] || null);
    setTotalPointsAwarded((allStudents || []).reduce((sum, s) => sum + (s.total_points || 0), 0));

    // --- Insights from the public-safe activity feed ---
    const { data: feed } = await supabase.from("activity_feed").select("*");
    const weekStart = startOfWeek();

    const catTotals = {};
    (feed || []).forEach((f) => {
      catTotals[f.category] = (catTotals[f.category] || 0) + f.points;
    });
    setCategoryTotals(catTotals);

    const thisWeekEntries = (feed || []).filter((f) => new Date(f.created_at) >= weekStart);
    setPointsThisWeek(thisWeekEntries.reduce((sum, f) => sum + f.points, 0));

    const gainerTotals = {};
    thisWeekEntries.forEach((f) => {
      if (!f.student_id) return;
      gainerTotals[f.student_id] = gainerTotals[f.student_id] || { name: f.student_name, points: 0 };
      gainerTotals[f.student_id].points += f.points;
    });
    const gainerList = Object.values(gainerTotals).sort((a, b) => b.points - a.points);
    setTopGainerWeek(gainerList[0] || null);

    // Inactive: last activity more than 14 days ago (or never)
    const lastActiveByStudent = {};
    (feed || []).forEach((f) => {
      if (!f.student_id) return;
      const t = new Date(f.created_at).getTime();
      if (!lastActiveByStudent[f.student_id] || t > lastActiveByStudent[f.student_id]) {
        lastActiveByStudent[f.student_id] = t;
      }
    });
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const inactive = (allStudents || []).filter((s) => !lastActiveByStudent[s.id] || lastActiveByStudent[s.id] < cutoff);
    setInactiveCount(inactive.length);

    setLoading(false);
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleSaveSnapshot() {
    setSnapshotting(true);
    setSnapshotMsg("");
    const weekStart = startOfWeek().toISOString().slice(0, 10);

    const { data: tracks } = await supabase.from("tracks").select("*");
    const { data: allStudents } = await supabase.from("students").select("*, track:track_id(id, name)").order("total_points", { ascending: false });

    const rows = [];
    (allStudents || []).forEach((s, idx) => {
      rows.push({
        week_start: weekStart,
        scope: "global",
        rank: idx + 1,
        student_name: s.full_name,
        track_name: s.track?.name || null,
        total_points: s.total_points,
      });
    });
    (tracks || []).forEach((t) => {
      const trackStudents = (allStudents || []).filter((s) => s.track_id === t.id);
      trackStudents.forEach((s, idx) => {
        rows.push({
          week_start: weekStart,
          scope: t.id,
          rank: idx + 1,
          student_name: s.full_name,
          track_name: t.name,
          total_points: s.total_points,
        });
      });
    });

    // clear any existing snapshot for this week before saving a fresh one
    await supabase.from("weekly_snapshots").delete().eq("week_start", weekStart);
    const { error } = await supabase.from("weekly_snapshots").insert(rows);
    setSnapshotMsg(error ? `Failed: ${error.message}` : `Saved standings for week of ${weekStart}.`);
    setSnapshotting(false);
  }

  async function handleExportAllPoints() {
    setExportingAll(true);
    const { data } = await supabase
      .from("point_transactions")
      .select("category, points, note, created_at, student:student_id(full_name, email, track:track_id(name))")
      .order("created_at", { ascending: false });

    downloadCsv(
      "GDG_leaderboard_all_points.csv",
      [
        ["Student", "student_name"],
        ["Email", "email"],
        ["Track", "track_name"],
        ["Category", "category"],
        ["Points", "points"],
        ["Note", "note"],
        ["Date", "created_at"],
      ],
      (data || []).map((r) => ({
        student_name: r.student?.full_name || "Deleted student",
        email: r.student?.email || "",
        track_name: r.student?.track?.name || "",
        category: r.category,
        points: r.points,
        note: r.note || "",
        created_at: r.created_at,
      }))
    );
    setExportingAll(false);
  }

  return (
    <PageShell title="Overview" subtitle="Quick snapshot of the leaderboard.">
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard label="Tracks" value={trackCount} icon={GitBranch} colorClass="bg-gdg-blue/10 text-gdg-blue" />
            <StatCard label="Students" value={studentCount} icon={Users} colorClass="bg-gdg-green/10 text-gdg-green" />
            <StatCard
              label="Current #1"
              value={topStudent ? `${topStudent.full_name} (${topStudent.total_points})` : "-"}
              icon={Trophy}
              colorClass="bg-gdg-yellow/10 text-yellow-700 dark:text-yellow-400"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard label="Total Points Awarded" value={totalPointsAwarded} icon={Zap} colorClass="bg-gdg-blue/10 text-gdg-blue" />
            <StatCard label="Points This Week" value={pointsThisWeek} icon={TrendingUp} colorClass="bg-gdg-green/10 text-gdg-green" />
            <StatCard
              label="Top Gainer This Week"
              value={topGainerWeek ? `${topGainerWeek.name} (+${topGainerWeek.points})` : "-"}
              icon={Trophy}
              colorClass="bg-gdg-yellow/10 text-yellow-700 dark:text-yellow-400"
            />
            <StatCard
              label="Inactive 14+ Days"
              value={inactiveCount}
              icon={UserX}
              colorClass={inactiveCount > 0 ? "bg-gdg-red/10 text-gdg-red" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}
            />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <TrackComparison />

            <div className="card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-500">
                <PieChart size={16} /> Points by Category (All-Time)
              </h2>
              <div className="space-y-3">
                {Object.keys(CATEGORY_LABELS).map((cat) => {
                  const total = categoryTotals[cat] || 0;
                  const max = Math.max(1, ...Object.values(categoryTotals));
                  return (
                    <div key={cat}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className={`badge ${CATEGORY_COLORS[cat]}`}>{CATEGORY_LABELS[cat]}</span>
                        <span className="font-semibold">{total}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-full rounded-full bg-gdg-blue transition-all duration-700" style={{ width: `${(total / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <QrCodeCard />
          </div>

          <div className="mb-6 card p-5">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Download size={16} /> Full Export
            </h2>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Download the complete points ledger for the whole season — every award, every category, every note.
            </p>
            <button onClick={handleExportAllPoints} disabled={exportingAll} className="btn-secondary">
              {exportingAll ? "Exporting..." : "Export All Points (CSV)"}
            </button>
          </div>

          <div className="card p-5">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Camera size={16} /> Weekly Snapshot
            </h2>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Save this week's standings for the record — useful for answering "who was #1 mid-season" later. See saved snapshots on the History page.
            </p>
            <button onClick={handleSaveSnapshot} disabled={snapshotting} className="btn-primary">
              {snapshotting ? "Saving..." : "Save This Week's Snapshot"}
            </button>
            {snapshotMsg && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{snapshotMsg}</p>}
          </div>
        </>
      )}
    </PageShell>
  );
}
