
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PageShell from "@/components/PageShell";
import Modal from "@/components/Modal";
import PointAwardModal from "@/components/PointAwardModal";
import StudentHistoryModal from "@/components/StudentHistoryModal";
import BulkImportStudentsModal from "@/components/BulkImportStudentsModal";
import UndoToast from "@/components/UndoToast";
import { CATEGORY_LABELS, downloadCsv } from "@/lib/helpers";
import {
  Plus,
  Pencil,
  Trash2,
  History,
  FileText,
  ClipboardCheck,
  Sparkles,
  Search,
  Upload,
  Download,
  AlertTriangle,
} from "lucide-react";

const CATEGORY_BUTTONS = [
  {
    key: "assignment",
    label: "Assignment",
    icon: FileText,
    className:
      "bg-gdg-green/10 text-gdg-green hover:bg-gdg-green/20",
  },
  {
    key: "quiz",
    label: "Quiz",
    icon: ClipboardCheck,
    className:
      "bg-gdg-blue/10 text-gdg-blue hover:bg-gdg-blue/20",
  },
  {
    key: "attendance_bonus",
    label: "Attendance",
    icon: Sparkles,
    className:
      "bg-gdg-yellow/15 text-yellow-700 hover:bg-gdg-yellow/25 dark:text-yellow-400",
  },
  {
    key: "bonus",
    label: "Bonus",
    icon: Sparkles,
    className:
      "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 dark:text-purple-400",
  },
];

const AT_RISK_ZONE = 3;
const CUTOFF = 10;
const PAGE_SIZE = 30;

export default function AdminStudentsPage() {
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const [awardTarget, setAwardTarget] = useState(null);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [undoToast, setUndoToast] = useState(null);

  useEffect(() => {
    supabase
      .from("tracks")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setTracks(data || []);

        if (data && data.length > 0) {
          setSelectedTrack(data[0].id);
        } else {
          setLoading(false);
        }
      });
  }, []);

  async function fetchStudents(trackId) {
    if (!trackId) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("track_id", trackId)
      .order("total_points", { ascending: false });

    if (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } else {
      setStudents(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (selectedTrack) {
      fetchStudents(selectedTrack);
    }
  }, [selectedTrack]);

  // Reset pagination when changing track or search
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTrack, search]);

  function openCreateModal() {
    setEditing(null);
    setForm({
      full_name: "",
      email: "",
      phone: "",
    });
    setModalOpen(true);
  }

  function openEditModal(s) {
    setEditing(s);
    setForm({
      full_name: s.full_name,
      email: s.email || "",
      phone: s.phone || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("students")
        .update({
          full_name: form.full_name,
          email: form.email || null,
          phone: form.phone || null,
        })
        .eq("id", editing.id);

      if (!error) {
        setModalOpen(false);
        await fetchStudents(selectedTrack);
      } else {
        console.error("Error updating student:", error);
      }
    } else {
      const { error } = await supabase.from("students").insert({
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        track_id: selectedTrack,
      });

      if (!error) {
        setModalOpen(false);
        await fetchStudents(selectedTrack);
      } else {
        console.error("Error adding student:", error);
      }
    }

    setSaving(false);
  }

  async function handleDelete(s) {
    if (
      !confirm(
        `Remove student "${s.full_name}"? Their point history will be deleted too.`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", s.id);

    if (!error) {
      await fetchStudents(selectedTrack);
    } else {
      console.error("Error deleting student:", error);
    }
  }

  async function handlePointsAwarded(
    student,
    category,
    transactionId,
    points
  ) {
    await fetchStudents(selectedTrack);

    setUndoToast({
      message: `+${points} ${CATEGORY_LABELS[category]} awarded to ${student.full_name}`,
      transactionId,
    });
  }

  async function handleUndo() {
    if (!undoToast) return;

    const { error } = await supabase
      .from("point_transactions")
      .delete()
      .eq("id", undoToast.transactionId);

    if (error) {
      console.error("Error undoing transaction:", error);
      return;
    }

    setUndoToast(null);
    await fetchStudents(selectedTrack);
  }

  function handleExportCsv() {
    const trackName =
      tracks.find((t) => t.id === selectedTrack)?.name || "track";

    downloadCsv(
      `${trackName.replace(/\s+/g, "_")}_leaderboard.csv`,
      [
        ["Name", "full_name"],
        ["Email", "email"],
        ["Phone", "phone"],
        ["Total Points", "total_points"],
      ],
      filteredStudents
    );
  }

  const filteredStudents = students.filter(
    (s) =>
      !search.trim() ||
      s.full_name
        .toLowerCase()
        .includes(search.trim().toLowerCase())
  );

  const totalPages = Math.ceil(
    filteredStudents.length / PAGE_SIZE
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  function changePage(page) {
    setCurrentPage(
      Math.max(1, Math.min(page, totalPages))
    );
  }

  // Keep current page valid if students are removed
  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <PageShell
      title="Students & Points"
      subtitle="Pick a track, then award points with one click."
      actions={
        <>
          <button
            onClick={handleExportCsv}
            className="btn-secondary"
          >
            <Download size={16} /> Export CSV
          </button>

          <button
            onClick={() => setBulkImportOpen(true)}
            className="btn-secondary"
            disabled={!selectedTrack}
          >
            <Upload size={16} /> Bulk Import
          </button>

          <button
            onClick={openCreateModal}
            className="btn-primary"
            disabled={!selectedTrack}
          >
            <Plus size={16} /> Add Student
          </button>
        </>
      }
    >
      {/* Track selector and search */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select
          className="input max-w-xs"
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
        >
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            className="input max-w-[220px] pl-8"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="card p-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Create a track first from the Tracks page.
        </div>
      ) : loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedStudents.map((s) => {
              // Rank across all filtered students, not just this page
              const rank =
                filteredStudents.findIndex(
                  (student) => student.id === s.id
                ) + 1;

              const atRisk =
                rank > CUTOFF &&
                rank <= CUTOFF + AT_RISK_ZONE;

              return (
                <div
                  key={s.id}
                  className="card p-4 transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {s.full_name}
                        </p>

                        {atRisk && (
                          <span
                            className="flex items-center gap-1 rounded-full bg-gdg-red/10 px-2 py-0.5 text-[10px] font-medium text-gdg-red"
                            title={`Close to falling out of the Top ${CUTOFF}`}
                          >
                            <AlertTriangle size={10} /> At risk
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400">
                        Rank #{rank} · Total:{" "}
                        <span className="font-semibold text-gdg-blue">
                          {s.total_points}
                        </span>{" "}
                        points
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => setHistoryStudent(s)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gdg-blue dark:hover:bg-gray-800"
                        title="History"
                      >
                        <History size={16} />
                      </button>

                      <button
                        onClick={() => openEditModal(s)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gdg-blue dark:hover:bg-gray-800"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(s)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-gdg-red dark:hover:bg-red-950/40"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_BUTTONS.map((btn) => {
                      const Icon = btn.icon;

                      return (
                        <button
                          key={btn.key}
                          onClick={() =>
                            setAwardTarget({
                              student: s,
                              category: btn.key,
                            })
                          }
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 ${btn.className}`}
                        >
                          <Icon size={13} /> +
                          {CATEGORY_LABELS[btn.key]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <p className="text-sm text-gray-400">
                No students found.
              </p>
            )}
          </div>

          {/* Pagination: 30 students per page */}
          {filteredStudents.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {startIndex + 1}–
                {Math.min(
                  startIndex + PAGE_SIZE,
                  filteredStudents.length
                )}{" "}
                of {filteredStudents.length} students
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => changePage(page)}
                    aria-current={
                      currentPage === page ? "page" : undefined
                    }
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
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit student modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Student" : "Add Student"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              required
              className="input"
              value={form.full_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  full_name: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving
              ? "Saving..."
              : editing
                ? "Save Changes"
                : "Add Student"}
          </button>
        </form>
      </Modal>

      <PointAwardModal
        student={awardTarget?.student}
        category={awardTarget?.category}
        onClose={() => setAwardTarget(null)}
        onSaved={(transactionId, points) =>
          handlePointsAwarded(
            awardTarget.student,
            awardTarget.category,
            transactionId,
            points
          )
        }
      />

      <StudentHistoryModal
        student={historyStudent}
        onClose={() => setHistoryStudent(null)}
        onChanged={() => fetchStudents(selectedTrack)}
      />

      <BulkImportStudentsModal
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        trackId={selectedTrack}
        onImported={() => fetchStudents(selectedTrack)}
      />

      {undoToast && (
        <UndoToast
          message={undoToast.message}
          onUndo={handleUndo}
          onDismiss={() => setUndoToast(null)}
        />
      )}
    </PageShell>
  );
}
