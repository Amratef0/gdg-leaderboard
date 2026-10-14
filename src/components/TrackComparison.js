"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import TrackDot from "@/components/TrackDot";
import { BarChart3 } from "lucide-react";

export default function TrackComparison() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: tracks } = await supabase.from("tracks").select("*").order("name");
      const { data: students } = await supabase.from("students").select("track_id, total_points");

      const grouped = {};
      (students || []).forEach((s) => {
        if (!s.track_id) return;
        if (!grouped[s.track_id]) grouped[s.track_id] = { sum: 0, count: 0 };
        grouped[s.track_id].sum += s.total_points || 0;
        grouped[s.track_id].count += 1;
      });

      const result = (tracks || []).map((t) => ({
        ...t,
        avg: grouped[t.id] ? Math.round(grouped[t.id].sum / grouped[t.id].count) : 0,
      }));
      setRows(result.sort((a, b) => b.avg - a.avg));
      setLoading(false);
    }
    load();
  }, []);

  const maxAvg = Math.max(1, ...rows.map((r) => r.avg));

  if (loading) return null;
  if (rows.length === 0) return null;

  return (
    <div className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-500">
        <BarChart3 size={16} /> Average Points by Track
      </h2>
      <div className="space-y-3">
        {rows.map((t) => (
          <div key={t.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <TrackDot color={t.color} name={t.name} />
              <span className="font-semibold">{t.avg} avg</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(t.avg / maxAvg) * 100}%`, backgroundColor: t.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
