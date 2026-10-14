"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/context/ThemeContext";
import LeaderboardTable from "@/components/LeaderboardTable";
import RisingStar from "@/components/RisingStar";
import {
  fireTop3Confetti,
  fireChampionConfetti,
  shouldCelebrate,
  championChanged,
} from "@/lib/confetti";
import { startOfWeek } from "@/lib/helpers";
import { exportTop3Image } from "@/lib/exportImage";
import {
  Sun,
  Moon,
  RefreshCw,
  Trophy,
  TrendingUp,
  Tv,
  Camera,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";

const GLOBAL_LIMIT = 30;
const TRACK_LIMIT = 20;
const WEEK_LIMIT = 20;

export default function PublicLeaderboardPage() {
  const { theme, toggleTheme, ready } = useTheme();

  const [tracks, setTracks] = useState([]);
  const [selectedView, setSelectedView] = useState("global");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [rankDirections, setRankDirections] = useState({});

  const previousRanksRef = useRef({});

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const fetchTracks = useCallback(async () => {
    const { data } = await supabase
      .from("tracks")
      .select("*")
      .order("name");

    setTracks(data || []);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);

    let newRows = [];

    if (selectedView === "week") {
      const { data } = await supabase
        .from("activity_feed")
        .select("*")
        .gte("created_at", startOfWeek().toISOString());

      const totals = {};

      (data || []).forEach((row) => {
        if (!row.student_id) return;

        if (!totals[row.student_id]) {
          totals[row.student_id] = {
            id: row.student_id,
            full_name: row.student_name,
            total_points: 0,
            track_id: row.track_id,
          };
        }

        totals[row.student_id].total_points += row.points;
      });

      newRows = Object.values(totals)
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, WEEK_LIMIT)
        .map((student) => ({
          ...student,
          track: tracks.find((track) => track.id === student.track_id),
        }));
    } else if (selectedView === "global") {
      const { data } = await supabase
        .from("students")
        .select("id, full_name, total_points, track:track_id(id, name, color)")
        .order("total_points", { ascending: false })
        .limit(GLOBAL_LIMIT);

      newRows = data || [];
    } else {
      const { data } = await supabase
        .from("students")
        .select("id, full_name, total_points, track:track_id(id, name, color)")
        .eq("track_id", selectedView)
        .order("total_points", { ascending: false })
        .limit(TRACK_LIMIT);

      newRows = data || [];
    }

    // Rank change arrows
    const prevRanks = previousRanksRef.current[selectedView] || {};
    const newRanks = {};
    const directions = {};

    newRows.forEach((student, index) => {
      const rank = index + 1;

      newRanks[student.id] = rank;

      const prevRank = prevRanks[student.id];

      if (prevRank !== undefined) {
        if (rank < prevRank) {
          directions[student.id] = "up";
        } else if (rank > prevRank) {
          directions[student.id] = "down";
        }
      }
    });

    previousRanksRef.current[selectedView] = newRanks;
    setRankDirections(directions);

    // Confetti for top 3 and champion
    if (selectedView !== "week") {
      newRows.slice(0, 3).forEach((student) => {
        if (shouldCelebrate(student.id, selectedView)) {
          fireTop3Confetti();
        }
      });

      if (
        newRows[0] &&
        championChanged(newRows[0].id, selectedView)
      ) {
        fireChampionConfetti();
      }
    }

    setRows(newRows);
    setLastUpdated(new Date());
    setLoading(false);
  }, [selectedView, tracks]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  useEffect(() => {
    fetchLeaderboard();

    const interval = setInterval(fetchLeaderboard, 20000);

    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  // Search students
  useEffect(() => {
    const term = search.trim();

    if (!term) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);

      if (selectedView === "week") {
        const matches = rows.filter((student) =>
          student.full_name.toLowerCase().includes(term.toLowerCase())
        );

        setSearchResults(matches);
      } else {
        let query = supabase
          .from("students")
          .select("id, full_name, total_points, track:track_id(id, name, color)")
          .order("total_points", { ascending: false });

        if (selectedView !== "global") {
          query = query.eq("track_id", selectedView);
        }

        const { data } = await query;

        const all = data || [];

        const matches = all
          .map((student, index) => ({
            ...student,
            _rank: index + 1,
          }))
          .filter((student) =>
            student.full_name.toLowerCase().includes(term.toLowerCase())
          )
          .slice(0, 8);

        setSearchResults(matches);
      }

      setSearching(false);
    }, 350);

    return () => clearTimeout(timeout);
  }, [search, selectedView, rows]);

  const isSearching = searchResults !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-lightAlt to-white dark:from-surface-dark dark:to-surface-dark">
      <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-12 md:py-12">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Logo width={200} height={41} priority />

          <div className="flex items-center gap-2">
            <Link
              href="/display"
              target="_blank"
              className="rounded-full border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              title="Display mode"
            >
              <Tv size={18} />
            </Link>

            {ready && (
              <button
                onClick={toggleTheme}
                className="rounded-full border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-gdg-yellow">
            <Trophy
              size={32}
              className="drop-shadow-[0_0_8px_rgba(251,188,5,0.5)]"
            />
          </div>

          <h1 className="bg-gradient-to-r from-gdg-blue via-gdg-green to-gdg-yellow bg-clip-text text-3xl font-extrabold text-transparent">
            Leaderboard
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {selectedView === "week"
              ? `Top gainers since ${startOfWeek().toLocaleDateString("en-GB")}`
              : `Top ${selectedView === "global" ? GLOBAL_LIMIT : TRACK_LIMIT} students`}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-400"
          />

          <input
            className="input !pl-11 pr-9"
            placeholder="Find yourself..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Rising Star - Live Activity removed */}
        {!isSearching && selectedView !== "week" && <RisingStar />}

        {/* Track filters */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSelectedView("global")}
            className={
              selectedView === "global" ? "btn-primary" : "btn-secondary"
            }
          >
            All Tracks
          </button>

          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => setSelectedView(track.id)}
              className={
                selectedView === track.id ? "btn-primary" : "btn-secondary"
              }
            >
              {track.name}
            </button>
          ))}

          <button
            onClick={() => setSelectedView("week")}
            className={
              selectedView === "week" ? "btn-primary" : "btn-secondary"
            }
          >
            <TrendingUp size={14} /> This Week
          </button>
        </div>

        {/* Leaderboard */}
        {isSearching ? (
          searching ? (
            <p className="text-center text-sm text-gray-500">
              Searching...
            </p>
          ) : (
            <LeaderboardTable
              rows={(searchResults || []).map((student) => ({
                ...student,
                rank: student._rank,
              }))}
              showTrack={selectedView === "global"}
              linkable
            />
          )
        ) : loading ? (
          <p className="text-center text-sm text-gray-500">Loading...</p>
        ) : (
          <LeaderboardTable
            rows={rows}
            showTrack={
              selectedView === "global" || selectedView === "week"
            }
            rankDirections={rankDirections}
          />
        )}

        {/* Export Top 3 */}
        {!isSearching && !loading && rows.length >= 3 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() =>
                exportTop3Image(
                  rows,
                  selectedView === "week" ? "Top Gainers This Week" : "Top 3"
                )
              }
              className="btn-secondary"
            >
              <Camera size={14} /> Export Top 3 Image
            </button>
          </div>
        )}

        {/* Last updated */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <RefreshCw size={12} />
          {lastUpdated && (
            <span>
              Updated {lastUpdated.toLocaleTimeString("en-GB")} — refreshes
              automatically
            </span>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">
          GDG on Campus CIC — One Team. One Community.
        </p>
      </div>
    </div>
  );
}