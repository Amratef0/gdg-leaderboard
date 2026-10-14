"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORY_LABELS, CATEGORY_COLORS, formatDateTime } from "@/lib/helpers";
import Modal from "@/components/Modal";
import { Trash2 } from "lucide-react";

export default function StudentHistoryModal({ student, onClose, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchHistory() {
    if (!student) return;
    setLoading(true);
    const { data } = await supabase
      .from("point_transactions")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student]);

  async function handleDelete(row) {
    if (!confirm("Remove this point entry? The student's total will update automatically.")) return;
    const { error } = await supabase.from("point_transactions").delete().eq("id", row.id);
    if (!error) {
      fetchHistory();
      onChanged();
    }
  }

  if (!student) return null;

  return (
    <Modal open={!!student} onClose={onClose} title={`History — ${student.full_name}`} wide>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400">No points recorded yet.</p>
      ) : (
        <div className="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className={`badge ${CATEGORY_COLORS[r.category]}`}>{CATEGORY_LABELS[r.category]}</span>
                  <span className={`text-sm font-semibold ${r.points < 0 ? "text-gdg-red" : "text-gdg-green"}`}>
                    {r.points > 0 ? `+${r.points}` : r.points}
                  </span>
                </div>
                {r.note && <p className="text-xs text-gray-500 dark:text-gray-400">{r.note}</p>}
                <p className="text-xs text-gray-400">{formatDateTime(r.created_at)}</p>
              </div>
              <button onClick={() => handleDelete(r)} className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-gdg-red dark:hover:bg-red-950/40">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
