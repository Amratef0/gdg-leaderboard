"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PageShell from "@/components/PageShell";
import Modal from "@/components/Modal";
import TrackDot from "@/components/TrackDot";
import { Plus, Pencil, Trash2 } from "lucide-react";

const EMPTY_FORM = { name: "", color: "#4285F4" };

export default function TracksPage() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchTracks() {
    setLoading(true);
    const { data } = await supabase.from("tracks").select("*, students:students(count)").order("name");
    setTracks(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTracks();
  }, []);

  function openCreateModal() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(track) {
    setEditing(track);
    setForm({ name: track.name, color: track.color || "#4285F4" });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("tracks").update({ name: form.name.trim(), color: form.color }).eq("id", editing.id);
      if (error) setError(error.message);
      else {
        setModalOpen(false);
        fetchTracks();
      }
    } else {
      const { error } = await supabase.from("tracks").insert({ name: form.name.trim(), color: form.color });
      if (error) setError(error.message.includes("duplicate") ? "A track with this name already exists." : error.message);
      else {
        setModalOpen(false);
        fetchTracks();
      }
    }
    setSaving(false);
  }

  async function handleDelete(track) {
    if (!confirm(`Delete track "${track.name}"? All its students and points will be deleted too.`)) return;
    const { error } = await supabase.from("tracks").delete().eq("id", track.id);
    if (!error) fetchTracks();
  }

  return (
    <PageShell
      title="Tracks"
      subtitle="Create the tracks students belong to."
      actions={
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={16} /> New Track
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {tracks.map((track) => (
            <div key={track.id} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <TrackDot color={track.color} name={<span className="font-medium">{track.name}</span>} />
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(track)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gdg-blue dark:hover:bg-gray-800">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(track)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-gdg-red dark:hover:bg-red-950/40">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400">{track.students?.[0]?.count ?? 0} students</p>
            </div>
          ))}
          {tracks.length === 0 && <p className="text-sm text-gray-400">No tracks yet.</p>}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Track" : "New Track"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Track Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Color</label>
            <input type="color" className="h-10 w-20 rounded-lg border border-gray-200 dark:border-gray-700" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          {error && <p className="text-sm text-gdg-red">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Track"}
          </button>
        </form>
      </Modal>
    </PageShell>
  );
}
