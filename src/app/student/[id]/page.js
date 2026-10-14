"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Logo from "@/components/Logo";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/context/ThemeContext";
import TrackDot from "@/components/TrackDot";
import BadgeRow from "@/components/BadgeRow";
import MilestoneProgress from "@/components/MilestoneProgress";
import CountUpNumber from "@/components/CountUpNumber";
import CelebrationToast from "@/components/CelebrationToast";
import { fireTop3Confetti } from "@/lib/confetti";
import { CATEGORY_LABELS, CATEGORY_COLORS, computeStreak, computeBadges, medalFor } from "@/lib/helpers";
import { ArrowLeft, Sun, Moon, Flame } from "lucide-react";

const MILESTONES = [500, 100];

export default function StudentDetailPage() {
  const { id } = useParams();
  const { theme, toggleTheme, ready } = useTheme();
  const [student, setStudent] = useState(null);
  const [trackRank, setTrackRank] = useState(null);
  const [globalRank, setGlobalRank] = useState(null);
  const [trackTotal, setTrackTotal] = useState(0);
  const [nextUpTrack, setNextUpTrack] = useState(null);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: s, error } = await supabase.from("students").select("*, track:track_id(id, name, color)").eq("id", id).single();
      if (error || !s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setStudent(s);

      const [{ data: trackStudents }, { data: globalStudents }, { data: feed }] = await Promise.all([
        supabase.from("students").select("id, total_points").eq("track_id", s.track_id).order("total_points", { ascending: false }),
        supabase.from("students").select("id, total_points").order("total_points", { ascending: false }),
        supabase.from("activity_feed").select("category, points, created_at").eq("student_id", id),
      ]);

      const tRank = (trackStudents || []).findIndex((x) => x.id === id) + 1;
      const gRank = (globalStudents || []).findIndex((x) => x.id === id) + 1;
      setTrackRank(tRank || null);
      setGlobalRank(gRank || null);
      setTrackTotal((trackStudents || []).length);

      if (tRank > 1) {
        const above = trackStudents[tRank - 2];
        setNextUpTrack(above);
      }

      const totals = {};
      (feed || []).forEach((f) => {
        totals[f.category] = (totals[f.category] || 0) + f.points;
      });
      setCategoryTotals(totals);
      setStreak(computeStreak((feed || []).map((f) => f.created_at)));

      // --- "You moved up!" — compare this visit's track rank to the last one ---
      if (tRank) {
        const rankKey = `gdg-lb-lastrank:${id}`;
        const lastRank = localStorage.getItem(rankKey);
        if (lastRank !== null) {
          const diff = Number(lastRank) - tRank;
          if (diff > 0) {
            setToasts((t) => [...t, `🎉 You moved up ${diff} spot${diff > 1 ? "s" : ""} in your track!`]);
          }
        }
        localStorage.setItem(rankKey, String(tRank));
      }

      // --- Milestone celebration (100 / 500 points), shown once ever ---
      const newMilestone = MILESTONES.find((m) => s.total_points >= m && !localStorage.getItem(`gdg-lb-milestone-${m}:${id}`));
      if (newMilestone) {
        MILESTONES.filter((m) => s.total_points >= m).forEach((m) => localStorage.setItem(`gdg-lb-milestone-${m}:${id}`, "1"));
        setToasts((t) => [...t, `🎉 You just crossed ${newMilestone} points!`]);
        fireTop3Confetti();
      }

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-lightAlt dark:bg-surface-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gdg-blue border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-surface-lightAlt px-4 text-center dark:bg-surface-dark">
        <p className="text-lg font-medium">Student not found</p>
        <Link href="/" className="btn-primary">Back to Leaderboard</Link>
      </div>
    );
  }

  const badges = computeBadges({ totalPoints: student.total_points, categoryTotals, trackRank, globalRank, streak });

  return (
    <div className="min-h-screen bg-surface-lightAlt dark:bg-surface-dark">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gdg-blue">
            <ArrowLeft size={16} /> Leaderboard
          </Link>
          <div className="flex items-center gap-3">
            <Logo width={140} height={29} />
            {ready && (
              <button onClick={toggleTheme} className="rounded-full border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            )}
          </div>
        </div>

        <div className="card mb-6 p-6 text-center">
          <h1 className="mb-1 text-2xl font-bold">{student.full_name}</h1>
          {student.track && (
            <div className="mb-4 flex justify-center text-sm text-gray-500 dark:text-gray-400">
              <TrackDot color={student.track.color} name={student.track.name} />
            </div>
          )}
          <CountUpNumber value={student.total_points} className="text-5xl font-extrabold text-gdg-blue tabular-nums" />
          <p className="text-xs text-gray-400">total points</p>

          {streak >= 1 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-sm font-medium text-orange-600 dark:text-orange-400">
              <Flame size={14} /> {streak}-week streak
            </div>
          )}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold">{trackRank ? `${medalFor(trackRank) || `#${trackRank}`}` : "-"}</p>
            <p className="text-xs text-gray-400">Rank in {student.track?.name || "track"} ({trackTotal})</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold">{globalRank ? `${medalFor(globalRank) || `#${globalRank}`}` : "-"}</p>
            <p className="text-xs text-gray-400">Rank across GDG</p>
          </div>
        </div>

        {nextUpTrack && (
          <div className="card mb-6 p-5">
            <p className="mb-2 text-sm font-semibold text-gray-500">Next Milestone</p>
            <MilestoneProgress currentPoints={student.total_points} targetPoints={nextUpTrack.total_points} targetLabel={`rank #${trackRank - 1} in your track`} />
          </div>
        )}

        {badges.length > 0 && (
          <div className="card mb-6 p-5">
            <p className="mb-3 text-sm font-semibold text-gray-500">Badges</p>
            <BadgeRow badges={badges} />
          </div>
        )}

        <div className="card p-5">
          <p className="mb-3 text-sm font-semibold text-gray-500">Points Breakdown</p>
          <div className="space-y-2">
            {Object.keys(CATEGORY_LABELS).map((cat) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className={`badge ${CATEGORY_COLORS[cat]}`}>{CATEGORY_LABELS[cat]}</span>
                <span className="font-semibold">{categoryTotals[cat] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toasts.length > 0 && (
        <CelebrationToast
          message={toasts[0]}
          onDismiss={() => setToasts((t) => t.slice(1))}
        />
      )}
    </div>
  );
}
