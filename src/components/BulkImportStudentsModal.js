"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Modal from "@/components/Modal";
import { Upload } from "lucide-react";

// Lines like:  Full Name, email@example.com, 01012345678
function parseLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",");
      return {
        full_name: (parts[0] || "").trim(),
        email: (parts[1] || "").trim(),
        phone: (parts[2] || "").trim(),
      };
    })
    .filter((row) => row.full_name);
}

export default function BulkImportStudentsModal({ open, onClose, trackId, onImported }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const preview = parseLines(text);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function handleImport() {
    setError("");
    if (preview.length === 0) {
      setError("Paste at least one student (Name, Email, Phone) or upload a CSV.");
      return;
    }
    setSaving(true);
    const rows = preview.map((r) => ({
      full_name: r.full_name,
      email: r.email || null,
      phone: r.phone || null,
      track_id: trackId,
    }));
    const { error: insertError } = await supabase.from("students").insert(rows);
    if (insertError) {
      setError(insertError.message);
    } else {
      setText("");
      onClose();
      onImported();
    }
    setSaving(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Bulk Import Students" wide>
      <div className="space-y-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Paste one student per line as <code>Full Name, Email, Phone</code> (email and phone optional) — or upload a CSV. They'll all be added to the currently selected track.
        </p>

        <label className="btn-secondary w-fit cursor-pointer">
          <Upload size={15} /> Upload CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        </label>

        <textarea
          className="input font-mono"
          rows={8}
          placeholder={"Malak Magdy Hassan, malak@example.com, 01012345678\nDoaa Mohamed, doaa@example.com, 01098765432"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {preview.length > 0 && <p className="text-xs text-gray-500 dark:text-gray-400">{preview.length} student(s) ready to import.</p>}
        {error && <p className="text-sm text-gdg-red">{error}</p>}

        <button onClick={handleImport} disabled={saving} className="btn-primary w-full">
          {saving ? "Importing..." : `Import ${preview.length || ""} Students`}
        </button>
      </div>
    </Modal>
  );
}
