"use client";

import { motion } from "framer-motion";
import CountUpNumber from "@/components/CountUpNumber";

const ORDER = [1, 0, 2]; // display order: 2nd, 1st, 3rd (podium shape)
const HEIGHTS = { 0: "h-56", 1: "h-40", 2: "h-32" }; // by original rank index
const MEDALS = { 0: "🥇", 1: "🥈", 2: "🥉" };
const RING = {
  0: "border-gdg-yellow shadow-[0_0_40px_rgba(251,188,5,0.55)] animate-[glowPulse_2s_ease-in-out_infinite]",
  1: "border-gray-300 shadow-[0_0_24px_rgba(192,192,192,0.35)]",
  2: "border-orange-400 shadow-[0_0_24px_rgba(205,127,50,0.35)]",
};

// top3: array of exactly 3 students (already sorted), each { id, full_name, total_points }
export default function PodiumTop3({ top3 }) {
  if (!top3 || top3.length === 0) return null;

  return (
    <div className="mb-8 flex items-end justify-center gap-6">
      {ORDER.map((idx) => {
        const s = top3[idx];
        if (!s) return <div key={idx} className="w-56" />;
        return (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22, delay: idx * 0.08 }}
            className="flex w-56 flex-col items-center"
          >
            <div className={`mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 bg-white/5 text-4xl ${RING[idx]}`}>
              {MEDALS[idx]}
            </div>
            <p className="mb-1 text-center text-xl font-bold text-white">{s.full_name}</p>
            <CountUpNumber value={s.total_points} className="mb-3 text-2xl font-extrabold text-gdg-blue" />
            <div className={`w-full rounded-t-2xl bg-gradient-to-b from-white/10 to-white/[0.03] ${HEIGHTS[idx]}`} />
          </motion.div>
        );
      })}
    </div>
  );
}
