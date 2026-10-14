
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PageShell from "@/components/PageShell";
import { medalFor } from "@/lib/helpers";

const PAGE_SIZE = 10;

export default function AdminHistoryPage() {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [scope, setScope] = useState("global");
  const [rows, setRows] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadWeeks() {
      const { data, error } = await supabase
        .from("weekly_snapshots")
        .select("week_start")
        .order("week_start", { ascending: false });

      if (error) {
        console.error("Error loading weeks:", error);
        setLoading(false);
        return;
      }

      const unique = [
        ...new Set((data || []).map((r) => r.week_start)),
      ];

      setWeeks(unique);

      if (unique.length > 0) {
        setSelectedWeek(unique[0]);
      } else {
        setLoading(false);
      }
    }

    loadWeeks();
  }, []);

  useEffect(() => {
    if (!selectedWeek) return;

    async function loadRows() {
      setLoading(true);

      const { data, error } = await supabase
        .from("weekly_snapshots")
        .select("*")
        .eq("week_start", selectedWeek)
        .order("rank", { ascending: true });

      if (error) {
        console.error("Error loading snapshots:", error);
        setRows([]);
        setScopes([]);
        setLoading(false);
        return;
      }

      const snapshotRows = data || [];

      setRows(snapshotRows);

      const uniqueScopes = [
        ...new Set(
          snapshotRows.map((r) =>
            r.scope === "global" ? "global" : r.track_name
          )
        ),
      ];

      setScopes(uniqueScopes);
      setCurrentPage(1);
      setLoading(false);
    }

    loadRows();
  }, [selectedWeek]);

  const filteredRows = rows.filter((r) =>
    scope === "global"
      ? r.scope === "global"
      : r.track_name === scope
  );

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);

  const visibleRows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <PageShell
      title="History"
      subtitle="Saved weekly snapshots of the standings."
    >
      {weeks.length === 0 && !loading ? (
        <div className="card p-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No snapshots saved yet — use "Save This Week's Snapshot" on the
          Overview page.
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <select
              className="input max-w-xs"
              value={selectedWeek}
              onChange={(e) => {
                setSelectedWeek(e.target.value);
                setCurrentPage(1);
              }}
            >
              {weeks.map((w) => (
                <option key={w} value={w}>
                  Week of {w}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setScope("global");
                  setCurrentPage(1);
                }}
                className={
                  scope === "global" ? "btn-primary" : "btn-secondary"
                }
              >
                All Tracks
              </button>

              {scopes
                .filter((s) => s !== "global")
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setScope(s);
                      setCurrentPage(1);
                    }}
                    className={
                      scope === s ? "btn-primary" : "btn-secondary"
                    }
                  >
                    {s}
                  </button>
                ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <>
              <div className="card divide-y divide-gray-100 dark:divide-gray-800">
                {visibleRows.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-8 text-center font-semibold">
                        {medalFor(r.rank) || `#${r.rank}`}
                      </span>
                      {r.student_name}
                    </span>

                    <span className="font-semibold text-gdg-blue">
                      {r.total_points}
                    </span>
                  </div>
                ))}

                {visibleRows.length === 0 && (
                  <p className="p-6 text-center text-sm text-gray-400">
                    No data for this selection.
                  </p>
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(
                      currentPage * PAGE_SIZE,
                      filteredRows.length
                    )}{" "}
                    of {filteredRows.length} students
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={
                          currentPage === page
                            ? "btn-primary"
                            : "btn-secondary"
                        }
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        )
                      }
                      disabled={currentPage === totalPages}
                      className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </PageShell>
  );
}