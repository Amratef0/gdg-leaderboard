"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORY_LABELS } from "@/lib/helpers";
import { Zap } from "lucide-react";

export default function ActivityFeed() {
  const [items, setItems] = useState([]);

  async function fetchFeed() {
    const { data } = await supabase
      .from("activity_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15);
    setItems(data || []);
  }

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 15000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white/60 backdrop-blur dark:border-gray-800 dark:bg-surface-darkAlt/60">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800">
        <Zap size={13} className="text-gdg-yellow" /> Live Activity
      </div>
      <div className="flex gap-6 overflow-x-auto whitespace-nowrap px-4 py-2.5 text-sm">
        {items.map((item) => (
          <span key={item.id} className="flex-shrink-0 text-gray-600 dark:text-gray-300">
            <strong>{item.student_name}</strong> earned{" "}
            <span className="font-semibold text-gdg-green">+{item.points}</span>{" "}
            <span className="text-xs text-gray-400">({CATEGORY_LABELS[item.category]})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
