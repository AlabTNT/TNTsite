"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit3, X } from "lucide-react";
import Link from "next/link";

interface SpyActivity {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  timestamp: string;
  status: string;
  type: string;
}

export default function SpyAdminPage() {
  const [activities, setActivities] = useState<SpyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    timestamp: "",
    status: "upcoming",
    type: "event",
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    setLoading(true);
    try {
      const res = await fetch("/api/spy");
      const data = await res.json();
      setActivities(data);
    } catch (e) {
      console.error("Failed to fetch activities", e);
    }
    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await fetch(`/api/spy/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/spy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      resetForm();
      fetchActivities();
    } catch (e) {
      console.error("Failed to save activity", e);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this activity?")) return;
    try {
      await fetch(`/api/spy/${id}`, { method: "DELETE" });
      fetchActivities();
    } catch (e) {
      console.error("Failed to delete activity", e);
    }
  }

  function startEdit(activity: SpyActivity) {
    setEditingId(activity.id);
    setForm({
      title: activity.title,
      description: activity.description || "",
      location: activity.location || "",
      timestamp: activity.timestamp,
      status: activity.status,
      type: activity.type,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      location: "",
      timestamp: "",
      status: "upcoming",
      type: "event",
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white/90">
              Spy Admin
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Manage spy activities</p>
          </div>
          <Link
            href="/trip/spy"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            View Spy Page
          </Link>
        </div>

        {/* Form */}
        <motion.form
          layout
          onSubmit={handleSubmit}
          className="mb-12 p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            {editingId ? (
              <><Edit3 className="w-4 h-4" /> Edit Activity</>
            ) : (
              <><Plus className="w-4 h-4" /> New Activity</>
            )}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors"
            />
            <input
              type="text"
              placeholder="Location"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors"
            />
            <input
              type="text"
              placeholder="Timestamp (e.g. 2026-07-26)"
              value={form.timestamp}
              onChange={e => setForm({ ...form, timestamp: e.target.value })}
              required
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors"
            />
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#C23D1A]/50 transition-colors"
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="past">Past</option>
            </select>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#C23D1A]/50 transition-colors"
            >
              <option value="event">Event</option>
              <option value="travel">Travel</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors resize-none"
          />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#C23D1A] hover:bg-[#C23D1A]/80 text-white text-sm font-medium transition-colors"
            >
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white text-sm transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        </motion.form>

        {/* Activity List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            All Activities ({activities.length})
          </h2>

          {loading && (
            <p className="text-zinc-600 text-sm py-8 text-center">Loading...</p>
          )}

          {!loading && activities.length === 0 && (
            <p className="text-zinc-600 text-sm py-8 text-center">
              No activities yet. Create your first one above.
            </p>
          )}

          {activities.map(activity => (
            <motion.div
              key={activity.id}
              layout
              className={`p-4 rounded-xl border transition-colors ${
                activity.status === "active"
                  ? "border-[#C23D1A]/20 bg-[#C23D1A]/5"
                  : activity.status === "past"
                  ? "border-white/5 bg-white/[0.02] opacity-60"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-zinc-200 truncate">
                      {activity.title}
                    </h3>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                        activity.status === "active"
                          ? "bg-[#C23D1A]/20 text-[#C23D1A]"
                          : activity.status === "past"
                          ? "bg-zinc-800 text-zinc-500"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-zinc-500 line-clamp-1">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-zinc-600">{activity.timestamp}</span>
                    {activity.location && (
                      <span className="text-[11px] text-zinc-600">{activity.location}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(activity)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
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
