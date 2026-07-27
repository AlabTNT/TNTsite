"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit3, X, Plane, Train, BookOpen, Calendar, Repeat, Clock } from "lucide-react";
import Link from "next/link";
import { computeStatus, SpyType, SpyActivity } from "@/lib/types/trip";

interface SpyActivityWithStatus extends SpyActivity {
  computedStatus: string;
}

const EVENT_TYPES: { value: SpyType; label: string; icon: React.ReactNode }[] = [
  { value: "trigger_event", label: "Trigger Event", icon: <Clock className="w-4 h-4" /> },
  { value: "lasting_event", label: "Lasting Event", icon: <Calendar className="w-4 h-4" /> },
  { value: "daily", label: "Daily", icon: <Repeat className="w-4 h-4" /> },
  { value: "flight", label: "Flight", icon: <Plane className="w-4 h-4" /> },
  { value: "train", label: "Train", icon: <Train className="w-4 h-4" /> },
  { value: "exam", label: "Exam", icon: <BookOpen className="w-4 h-4" /> },
];

const RECURRENCE_OPTIONS = [
  { value: "", label: "Once" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
];

export default function SpyAdminPage() {
  const [activities, setActivities] = useState<SpyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    timestamp: "",
    timestamp2: "",
    type: "trigger_event" as SpyType,
    flightNumber: "",
    trainNumber: "",
    departure: "",
    arrival: "",
    recurrence: "",
    manualPast: false,
  });

  useEffect(() => { fetchActivities(); }, []);

  async function fetchActivities() {
    setLoading(true);
    try {
      const res = await fetch("/api/spy");
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = { title: form.title, description: form.description || null, location: form.location || null, timestamp: form.timestamp, type: form.type };

      if (["lasting_event", "flight", "train", "exam"].includes(form.type)) {
        payload.timestamp2 = form.timestamp2 || null;
      }
      if (form.type === "flight") {
        payload.flightNumber = form.flightNumber || null;
        payload.departure = form.departure || null;
        payload.arrival = form.arrival || null;
      }
      if (form.type === "train") {
        payload.trainNumber = form.trainNumber || null;
        payload.departure = form.departure || null;
        payload.arrival = form.arrival || null;
      }
      if (form.type === "daily") {
        payload.recurrence = form.recurrence || null;
      }
      if (form.type === "trigger_event") {
        payload.manualPast = !!(form as any).manualPast || false;
      }

      if (editingId) {
        await fetch(`/api/spy/${editingId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/spy", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      }
      resetForm();
      fetchActivities();
    } catch (e) { console.error(e); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this activity?")) return;
    try { await fetch(`/api/spy/${id}`, { method: "DELETE" }); fetchActivities(); } catch (e) { console.error(e); }
  }

  function startEdit(activity: SpyActivity) {
    setEditingId(activity.id);
    setForm({
      title: activity.title,
      description: activity.description || "",
      location: activity.location || "",
      timestamp: activity.timestamp,
      timestamp2: activity.timestamp2 || "",
      type: activity.type,
      flightNumber: activity.flightNumber || "",
      trainNumber: activity.trainNumber || "",
      departure: activity.departure || "",
      arrival: activity.arrival || "",
      recurrence: activity.recurrence || "",
      manualPast: activity.manualPast || false,
    } as any);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ title: "", description: "", location: "", timestamp: "", timestamp2: "", type: "trigger_event", flightNumber: "", trainNumber: "", departure: "", arrival: "", recurrence: "", manualPast: false } as any);
  }

  const withStatus = activities.map(a => ({ ...a, computedStatus: computeStatus(a) }));

  const needsTimestamp2 = ["lasting_event", "flight", "train", "exam"].includes(form.type);
  const isTransport = ["flight", "train"].includes(form.type);
  const isDaily = form.type === "daily";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white/90">Spy Admin</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage spy activities</p>
          </div>
          <Link href="/trip/spy" className="text-sm text-zinc-400 hover:text-white transition-colors">View Spy Page</Link>
        </div>

        <motion.form layout onSubmit={handleSubmit} className="mb-12 p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            {editingId ? <><Edit3 className="w-4 h-4" /> Edit</> : <><Plus className="w-4 h-4" /> New</>}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EVENT_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, type: t.value })}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  form.type === t.value
                    ? "bg-[#C23D1A]/20 border border-[#C23D1A]/30 text-[#C23D1A]"
                    : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors" />
            <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors" />
            <input type="text" placeholder="Timestamp (e.g. 2026-07-27)" value={form.timestamp} onChange={e => setForm({ ...form, timestamp: e.target.value })} required
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors font-mono" />
            {needsTimestamp2 && (
              <input type="text" placeholder="End timestamp" value={form.timestamp2} onChange={e => setForm({ ...form, timestamp2: e.target.value })}
                className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors font-mono" />
            )}
          </div>

          {isTransport && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {form.type === "flight" ? (
                <input type="text" placeholder="Flight number (e.g. MU5101)" value={form.flightNumber} onChange={e => setForm({ ...form, flightNumber: e.target.value })}
                  className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors font-mono" />
              ) : (
                <input type="text" placeholder="Train number (e.g. G123)" value={form.trainNumber} onChange={e => setForm({ ...form, trainNumber: e.target.value })}
                  className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors font-mono" />
              )}
              <input type="text" placeholder="Departure" value={form.departure} onChange={e => setForm({ ...form, departure: e.target.value })}
                className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors" />
              <input type="text" placeholder="Arrival" value={form.arrival} onChange={e => setForm({ ...form, arrival: e.target.value })}
                className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors" />
            </div>
          )}

          {isDaily && (
            <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#C23D1A]/50 transition-colors w-48">
              {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}

          {editingId && form.type === "trigger_event" && (
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={(form as any).manualPast} onChange={e => setForm({ ...form, manualPast: e.target.checked } as any)}
                className="rounded bg-white/5 border border-white/10" />
              Mark as Past
            </label>
          )}

          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors resize-none" />

          <div className="flex items-center gap-3">
            <button type="submit" className="px-5 py-2 rounded-lg bg-[#C23D1A] hover:bg-[#C23D1A]/80 text-white text-sm font-medium transition-colors">
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white text-sm transition-colors flex items-center gap-1">
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        </motion.form>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            All Activities ({activities.length})
          </h2>

          {loading && <p className="text-zinc-600 text-sm py-8 text-center">Loading...</p>}
          {!loading && activities.length === 0 && <p className="text-zinc-600 text-sm py-8 text-center">No activities yet.</p>}

          {withStatus.map(activity => (
            <motion.div key={activity.id} layout
              className={`p-4 rounded-xl border transition-colors ${
                activity.computedStatus === "active"
                  ? "border-[#C23D1A]/20 bg-[#C23D1A]/5"
                  : activity.computedStatus === "past"
                  ? "border-white/5 bg-white/[0.02] opacity-60"
                  : "border-white/5 bg-white/[0.02]"
              }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-zinc-200 truncate">{activity.title}</h3>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                      activity.computedStatus === "active" ? "bg-[#C23D1A]/20 text-[#C23D1A]" :
                      activity.computedStatus === "past" ? "bg-zinc-800 text-zinc-500" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {activity.computedStatus}
                    </span>
                    <span className="text-[10px] text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">{activity.type}</span>
                  </div>
                  {activity.description && <p className="text-xs text-zinc-500 line-clamp-1">{activity.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-zinc-600">{activity.timestamp}{activity.timestamp2 ? ` → ${activity.timestamp2}` : ''}</span>
                    {activity.location && <span className="text-[11px] text-zinc-600">{activity.location}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(activity)} className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/10 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(activity.id)} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
