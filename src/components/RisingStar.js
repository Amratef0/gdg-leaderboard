"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import TrackDot from "@/components/TrackDot";
import { startOfWeek } from "@/lib/helpers";
import { Flame } from "lucide-react";

// Highlights whoever earned the most points this week among students
// who are NOT currently in their track's top 3 — a chance for anyone
// to feel seen, not just the usual leaders.
export default function RisingStar() {
  const [star, setStar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: feed }, { data: students }] = await Promise.all([
        supabase.from("activity_feed").select("*").gte("created_at", startOfWeek().toISOString()),
        supabase.from("students").select("id, track_id, total_points, track:track_id(id, name, color)"),
      ]);

      // figure out who's currently in the top 3 of their own track (to exclude)
      const byTrack = {};
      (students || []).forEach((s) => {
        if (!s.track_id) return;
        byTrack[s.track_id] = byTrack[s.track_id] || [];
        byTrack[s.track_id].push(s);
      });
      const inTop3 = new Set();
      Object.values(byTrack).forEach((list) => {
        list
          .sort((a, b) => b.total_points - a.total_points)
          .slice(0, 3)
          .forEach((s) => inTop3.add(s.id));
      });

      const gains = {};
      (feed || []).forEach((f) => {
        if (!f.student_id || inTop3.has(f.student_id)) return;
        gains[f.student_id] = gains[f.student_id] || { id: f.student_id, name: f.student_name, points: 0, track_id: f.track_id };
        gains[f.student_id].points += f.points;
      });

      const best = Object.values(gains).sort((a, b) => b.points - a.points)[0];
      if (best) {
        const track = (students || []).find((s) => s.id === best.id)?.track;
        setStar({ ...best, track });
      } else {
        setStar(null);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !star) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-transparent px-5 py-3.5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-500">
        <Flame size={20} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-orange-500">Rising Star of the Week</p>
        <p className="text-sm">
          <strong>{star.name}</strong> earned <span className="font-semibold text-gdg-green">+{star.points}</span> points this week
          {star.track && (
            <span className="ml-1 text-gray-500 dark:text-gray-400">
              · <TrackDot color={star.track.color} name={star.track.name} />
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
