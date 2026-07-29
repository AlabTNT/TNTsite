"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit3, X, Plane, Train, BookOpen, Calendar, Repeat, Clock } from "lucide-react";
import Link from "next/link";
import { computeStatus, SpyType, SpyActivity } from "@/lib/types/trip";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

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
  const [auth, setAuth] = useState({ authenticated: false, hasRegisteredCredentials: false });
  const [authLoading, setAuthLoading] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    msgStatus: "none",
  });

  const handleTypeChange = (newType: SpyType) => {
    let newMsgStatus = form.msgStatus;
    if (newType === "flight" || newType === "exam") {
      newMsgStatus = "must";
    } else if (newType === "train") {
      newMsgStatus = "maybe";
    }
    setForm({ ...form, type: newType, msgStatus: newMsgStatus });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (auth.authenticated) {
      fetchActivities();
    }
  }, [auth.authenticated]);

  async function checkAuth() {
    try {
      const res = await fetch("/api/spy/auth/check");
      const data = await res.json();
      setAuth({
        authenticated: data.authenticated,
        hasRegisteredCredentials: data.hasRegisteredCredentials
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister() {
    setError("");
    setSubmitting(true);
    try {
      const optRes = await fetch("/api/spy/auth/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const options = await optRes.json();
      if (options.error) throw new Error(options.error);

      const regResp = await startRegistration({ optionsJSON: options });

      const verRes = await fetch("/api/spy/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationResponse: regResp }),
      });
      const verData = await verRes.json();
      if (verData.error) throw new Error(verData.error);

      setAuth({ authenticated: true, hasRegisteredCredentials: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed. Please check passcode.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin() {
    setError("");
    setSubmitting(true);
    try {
      const optRes = await fetch("/api/spy/auth/login/options", {
        method: "POST",
      });
      const options = await optRes.json();
      if (options.error) throw new Error(options.error);

      const authResp = await startAuthentication({ optionsJSON: options });

      const verRes = await fetch("/api/spy/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authenticationResponse: authResp }),
      });
      const verData = await verRes.json();
      if (verData.error) throw new Error(verData.error);

      setAuth({ authenticated: true, hasRegisteredCredentials: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  }

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
      let title = form.title;
      let location: string | null = form.location;

      if (form.type === "flight") {
        title = form.flightNumber || "Flight";
        location = form.departure && form.arrival ? `${form.departure}-${form.arrival}` : null;
      }
      if (form.type === "train") {
        title = form.trainNumber || "Train";
        location = form.departure && form.arrival ? `${form.departure}-${form.arrival}` : null;
      }

      const payload: Record<string, unknown> = { title, description: form.description || null, location, timestamp: form.timestamp, type: form.type, msgStatus: form.msgStatus };

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
      msgStatus: activity.msgStatus || "none",
    } as any);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ title: "", description: "", location: "", timestamp: "", timestamp2: "", type: "trigger_event", flightNumber: "", trainNumber: "", departure: "", arrival: "", recurrence: "", manualPast: false, msgStatus: "none" } as any);
  }

  const withStatus = activities.map(a => ({ ...a, computedStatus: computeStatus(a) }));

  const needsTimestamp2 = ["lasting_event", "flight", "train", "exam"].includes(form.type);
  const isTransport = ["flight", "train"].includes(form.type);
  const isDaily = form.type === "daily";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-zinc-500 text-sm tracking-wide">Securing connection...</div>
      </div>
    );
  }

  if (!auth.authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full p-8 rounded-2xl bg-white/[0.02] border border-white/5 shadow-2xl backdrop-blur-xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-[#C23D1A]/10 border border-[#C23D1A]/20 text-[#C23D1A] mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {auth.hasRegisteredCredentials ? "Admin Verification" : "Setup Passkey"}
            </h2>
            <p className="text-zinc-500 text-sm">
              {auth.hasRegisteredCredentials 
                ? "Use your Apple device's Touch ID, Face ID, or passcode to log in."
                : "Register your Apple device as the primary passkey for this spy board."}
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {!auth.hasRegisteredCredentials ? (
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter Setup Passcode"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors font-mono"
              />
              <button
                onClick={handleRegister}
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-[#C23D1A] hover:bg-[#C23D1A]/90 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? "Registering..." : "Create Apple Passkey"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-[#C23D1A] hover:bg-[#C23D1A]/90 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? "Verifying..." : "Verify Apple Passkey"}
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white/90">Spy Admin</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage spy activities</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/trip/spy" className="text-sm text-zinc-400 hover:text-white transition-colors">View Spy Page</Link>
            <button
              onClick={async () => {
                await fetch("/api/spy/auth/logout", { method: "POST" });
                checkAuth();
              }}
              className="text-sm text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
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
                onClick={() => handleTypeChange(t.value)}
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
            {isTransport ? (
              <>
                <div className="px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-zinc-500 text-sm flex items-center gap-2">
                  <span className="text-zinc-600 text-xs">Title:</span>
                  <span className="text-zinc-300 font-mono">{form.type === "flight" ? (form.flightNumber || "—") : (form.trainNumber || "—")}</span>
                </div>
                <div className="px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-zinc-500 text-sm flex items-center gap-2">
                  <span className="text-zinc-600 text-xs">Location:</span>
                  <span className="text-zinc-300 font-mono">{form.departure && form.arrival ? `${form.departure}-${form.arrival}` : "—"}</span>
                </div>
              </>
            ) : (
              <>
                <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                  className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors" />
                <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#C23D1A]/50 transition-colors" />
              </>
            )}
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

          {/* Message Reply Status Selector */}
          <div className="space-y-2 py-2">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Message Status Badge
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "none", label: "None (Normal / 正常回复)" },
                { value: "maybe", label: "Maybe (Replies may be delayed / 延迟回复)" },
                { value: "must", label: "Must (Cannot check / 无法看消息)" }
              ].map(opt => {
                const isLocked = ["flight", "exam", "train"].includes(form.type);
                const isSelected = form.msgStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setForm({ ...form, msgStatus: opt.value })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? "bg-[#C23D1A]/20 border-[#C23D1A]/30 text-[#C23D1A]"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {opt.label} {isLocked && isSelected && "🔒"}
                  </button>
                );
              })}
            </div>
            {["flight", "exam"].includes(form.type) && (
              <p className="text-[11px] text-[#C23D1A]/70">Locked to MUST (Cannot check messages) for Flight and Exam events.</p>
            )}
            {form.type === "train" && (
              <p className="text-[11px] text-yellow-500/70">Locked to MAYBE (Replies may be delayed) for Train events.</p>
            )}
          </div>

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
                    {activity.msgStatus === "maybe" && (
                      <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded font-mono">maybe-reply</span>
                    )}
                    {activity.msgStatus === "must" && (
                      <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-mono">no-reply</span>
                    )}
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
