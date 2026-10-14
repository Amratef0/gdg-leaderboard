"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import RankArrow from "@/components/RankArrow";
import CountUpNumber from "@/components/CountUpNumber";
import PodiumTop3 from "@/components/PodiumTop3";
import { medalFor } from "@/lib/helpers";
import { fireTop3Confetti, fireChampionConfetti } from "@/lib/confetti";
import { Trophy, Settings } from "lucide-react";

const LIMIT = 15; // fits nicely on a projector without scrolling for most tracks
const CYCLE_MS = 20000;
const PREF_KEY = "gdg-display-view-pref";

export default function DisplayPage() {
  return (
    <Suspense fallback={null}>
      <DisplayPageInner />
    </Suspense>
  );
}

function DisplayPageInner() {
  const params = useSearchParams();
  const urlView = params.get("view"); // optional one-off override via link

  const [tracks, setTracks] = useState([]);
  const [viewPref, setViewPref] = useState("auto"); // 'auto' | 'global' | trackId
  const [cycleIndex, setCycleIndex] = useState(0);
  const [rows, setRows] = useState([]);
  const [rankDirections, setRankDirections] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const previousRanksRef = useRef({});
  const scrollRef = useRef(null);

  // In-memory (not localStorage) celebration tracking — resets every time
  // the display is (re)opened, so it always celebrates the current
  // standings fresh, and only re-fires on genuine changes afterwards.
  const celebratedRef = useRef({});
  const championRef = useRef({});

  useEffect(() => {
    supabase.from("tracks").select("*").order("name").then(({ data }) => setTracks(data || []));
    const stored = localStorage.getItem(PREF_KEY);
    setViewPref(urlView || stored || "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePrefChange(value) {
    setViewPref(value);
    localStorage.setItem(PREF_KEY, value);
    setShowPicker(false);
  }

  const cycleViews = ["global", ...tracks.map((t) => t.id)];
  const currentView = viewPref === "auto" ? cycleViews[cycleIndex % cycleViews.length] || "global" : viewPref;
  const currentTrack = tracks.find((t) => t.id === currentView);

  const fetchData = useCallback(async () => {
    let newRows = [];
    if (currentView === "global") {
      const { data } = await supabase
        .from("students")
        .select("id, full_name, total_points, track:track_id(id, name, color)")
        .order("total_points", { ascending: false })
        .limit(LIMIT);
      newRows = data || [];
    } else {
      const { data } = await supabase
        .from("students")
        .select("id, full_name, total_points, track:track_id(id, name, color)")
        .eq("track_id", currentView)
        .order("total_points", { ascending: false })
        .limit(LIMIT);
      newRows = data || [];
    }

    const prevRanks = previousRanksRef.current[currentView] || {};
    const newRanks = {};
    const directions = {};
    newRows.forEach((s, idx) => {
      const rank = idx + 1;
      newRanks[s.id] = rank;
      const prevRank = prevRanks[s.id];
      if (prevRank !== undefined && prevRank !== rank) {
        directions[s.id] = rank < prevRank ? "up" : "down";
      }
    });
    previousRanksRef.current[currentView] = newRanks;
    setRankDirections(directions);

    // --- Confetti (silent) — fires fresh every time this screen opens,
    // and again whenever the actual Top 3 / #1 genuinely changes ---
    if (!celebratedRef.current[currentView]) celebratedRef.current[currentView] = new Set();
    const celebratedSet = celebratedRef.current[currentView];
    newRows.slice(0, 3).forEach((s) => {
      if (!celebratedSet.has(s.id)) {
        celebratedSet.add(s.id);
        fireTop3Confetti();
      }
    });
    if (newRows[0]) {
      const prevChampion = championRef.current[currentView];
      championRef.current[currentView] = newRows[0].id;
      if (prevChampion !== undefined && prevChampion !== newRows[0].id) {
        fireChampionConfetti();
      }
    }

    setRows(newRows);
  }, [currentView]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Cycle between views only in "auto" mode
  useEffect(() => {
    if (viewPref !== "auto") return;
    const interval = setInterval(() => setCycleIndex((i) => i + 1), CYCLE_MS);
    return () => clearInterval(interval);
  }, [viewPref]);

  // Slow auto-scroll if the rest-of-list overflows the screen
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame;
    let dir = 1;
    function step() {
      if (el.scrollHeight > el.clientHeight + 10) {
        el.scrollTop += dir * 0.4;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) dir = -1;
        if (el.scrollTop <= 0) dir = 1;
      }
      frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [rows]);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0d1117] px-10 py-8 text-white">
      <div className="mb-4 flex items-center justify-between">
        <Image src="/logo-dark.png" alt="GDG on Campus CIC" width={220} height={45} priority />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-2xl font-bold text-gdg-yellow">
            <Trophy size={32} />
            {currentView === "global" ? "All Tracks — Top 15" : `${currentTrack?.name || ""} — Top 15`}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="rounded-full border border-white/15 p-2 text-white/60 hover:bg-white/10 hover:text-white"
              title="Choose what to show"
            >
              <Settings size={18} />
            </button>
            {showPicker && (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-white/10 bg-[#161b22] p-2 shadow-xl">
                <button
                  onClick={() => handlePrefChange("auto")}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${viewPref === "auto" ? "bg-gdg-blue/20 text-gdg-blue" : "text-white/80 hover:bg-white/5"}`}
                >
                  🔄 Auto-cycle all tracks
                </button>
                <button
                  onClick={() => handlePrefChange("global")}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${viewPref === "global" ? "bg-gdg-blue/20 text-gdg-blue" : "text-white/80 hover:bg-white/5"}`}
                >
                  🌍 All Tracks
                </button>
                {tracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handlePrefChange(t.id)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${viewPref === t.id ? "bg-gdg-blue/20 text-gdg-blue" : "text-white/80 hover:bg-white/5"}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <PodiumTop3 top3={top3} />

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-hidden">
        {rest.map((s, i) => {
          const rank = i + 4;
          return (
            <div key={s.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 transition-all">
              <div className="flex items-center gap-5">
                <span className="flex w-14 justify-center text-2xl font-extrabold text-gray-500">{medalFor(rank) || rank}</span>
                <RankArrow direction={rankDirections[s.id]} />
                <span className="text-2xl font-semibold">{s.full_name}</span>
              </div>
              <CountUpNumber value={s.total_points} className="text-3xl font-extrabold text-gdg-blue tabular-nums" />
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-center text-gray-500">No students yet.</p>}
      </div>
    </div>
  );
}
