"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORY_LABELS } from "@/lib/helpers";
import Modal from "@/components/Modal";

const PRESETS = [1, 2, 5, 10];

// student: { id, full_name }, category: preselected category key
export default function PointAwardModal({ student, category, onClose, onSaved }) {
  const [points, setPoints] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("point_transactions")
      .insert({
        student_id: student.id,
        category,
        points: Number(points),
        note: note || null,
        created_by: user?.id || null,
      })
      .select()
      .single();
    if (!error) {
      onSaved(data.id, data.points);
      setPoints(5);
      setNote("");
      onClose();
    }
    setSaving(false);
  }

  if (!student) return null;

  return (
    <Modal open={!!student} onClose={onClose} title={`${CATEGORY_LABELS[category]} — ${student.full_name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Points</label>
          <div className="mb-2 flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPoints(p)}
                className={points === p ? "btn-primary px-3 py-1.5 text-xs" : "btn-secondary px-3 py-1.5 text-xs"}
              >
                +{p}
              </button>
            ))}
          </div>
          <input
            type="number"
            required
            className="input"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="Custom amount (use a negative number to correct a mistake)"
          />
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input className="input" placeholder="e.g. Quiz 3 - full mark" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Saving..." : "Award Points"}
        </button>
      </form>
    </Modal>
  );
}
