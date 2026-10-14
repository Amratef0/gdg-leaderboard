"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PageShell from "@/components/PageShell";
import { medalFor } from "@/lib/helpers";

export default function AdminHistoryPage() {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [scope, setScope] = useState("global");
  const [rows, setRows] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWeeks() {
      const { data } = await supabase.from("weekly_snapshots").select("week_start").order("week_start", { ascending: false });
      const unique = [...new Set((data || []).map((r) => r.week_start))];
      setWeeks(unique);
      if (unique.length > 0) setSelectedWeek(unique[0]);
      setLoading(false);
    }
    loadWeeks();
  }, []);

  useEffect(() => {
    if (!selectedWeek) return;
    async function loadRows() {
      setLoading(true);
      const { data } = await supabase
        .from("weekly_snapshots")
        .select("*")
        .eq("week_start", selectedWeek)
        .order("rank", { ascending: true });
      setRows(data || []);
      const uniqueScopes = [...new Set((data || []).map((r) => (r.scope === "global" ? "global" : r.track_name)))];
      setScopes(uniqueScopes);
      setLoading(false);
    }
    loadRows();
  }, [selectedWeek]);

  const visibleRows = rows.filter((r) => (scope === "global" ? r.scope === "global" : r.track_name === scope)).slice(0, 10);

  return (
    <PageShell title="History" subtitle="Saved weekly snapshots of the standings.">
      {weeks.length === 0 ? (
        <div className="card p-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No snapshots saved yet — use "Save This Week's Snapshot" on the Overview page.
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <select className="input max-w-xs" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
              {weeks.map((w) => (
                <option key={w} value={w}>Week of {w}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setScope("global")} className={scope === "global" ? "btn-primary" : "btn-secondary"}>All Tracks</button>
              {scopes.filter((s) => s !== "global").map((s) => (
                <button key={s} onClick={() => setScope(s)} className={scope === s ? "btn-primary" : "btn-secondary"}>{s}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <div className="card divide-y divide-gray-100 dark:divide-gray-800">
              {visibleRows.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="flex items-center gap-3">
                    <span className="w-8 text-center font-semibold">{medalFor(r.rank) || `#${r.rank}`}</span>
                    {r.student_name}
                  </span>
                  <span className="font-semibold text-gdg-blue">{r.total_points}</span>
                </div>
              ))}
              {visibleRows.length === 0 && <p className="p-6 text-center text-sm text-gray-400">No data for this selection.</p>}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
