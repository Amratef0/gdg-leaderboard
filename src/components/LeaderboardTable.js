"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import TrackDot from "@/components/TrackDot";
import RankArrow from "@/components/RankArrow";
import CountUpNumber from "@/components/CountUpNumber";
import { medalFor } from "@/lib/helpers";

const TOP3_GLOW = {
  2: "border-gray-300/50 shadow-[0_0_20px_rgba(192,192,192,0.3)]",
  3: "border-orange-400/40 shadow-[0_0_20px_rgba(205,127,50,0.3)]",
};

// rows: [{ id, full_name, total_points, track }] — already sorted & sliced
// rankDirections: { [studentId]: 'up' | 'down' | null }
export default function LeaderboardTable({ rows, showTrack, rankDirections = {}, linkable = true }) {
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {rows.map((s, idx) => {
          const rank = s.rank || idx + 1;
          const medal = medalFor(rank);
          const isChampion = rank === 1;
          const isTop3 = rank <= 3;
          const RowTag = linkable ? Link : "div";
          const rowProps = linkable ? { href: `/student/${s.id}` } : {};

          return (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <RowTag
                {...rowProps}
                className={`group flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-5 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gdg-blue/30 hover:shadow-lg dark:border-gray-800 dark:bg-surface-darkAlt ${
                  isChampion ? "border-gdg-yellow/50 animate-[glowPulse_2s_ease-in-out_infinite]" : isTop3 ? `border ${TOP3_GLOW[rank]}` : ""
                } ${linkable ? "cursor-pointer" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`flex w-9 flex-shrink-0 items-center justify-center font-bold ${isTop3 ? "text-2xl" : "text-sm text-gray-400"}`}>
                    {medal || rank}
                  </span>
                  <RankArrow direction={rankDirections[s.id]} />
                  <div>
                    <p className="font-medium transition-colors group-hover:text-gdg-blue">{s.full_name}</p>
                    {showTrack && s.track && (
                      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <TrackDot color={s.track.color} name={s.track.name} />
                      </div>
                    )}
                  </div>
                </div>
                <CountUpNumber value={s.total_points} className="flex-shrink-0 text-lg font-bold text-gdg-blue tabular-nums" />
              </RowTag>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {rows.length === 0 && <p className="card p-8 text-center text-sm text-gray-400">No students yet.</p>}
    </div>
  );
}
