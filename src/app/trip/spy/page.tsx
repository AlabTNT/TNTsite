"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Activity, Radio, Plane, Train, BookOpen, Moon, Calendar, Repeat } from "lucide-react";
import Link from "next/link";
import { computeStatus, SpyType, SpyActivity } from "@/lib/types/trip";

interface SpyActivityWithStatus extends SpyActivity {
  computedStatus: string;
}

interface SpySleepState {
  isSleeping: boolean;
  startedAt: string | null;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  flight: <Plane className="w-5 h-5" />,
  train: <Train className="w-5 h-5" />,
  exam: <BookOpen className="w-5 h-5" />,
  daily: <Repeat className="w-5 h-5" />,
  sleep: <Moon className="w-5 h-5" />,
};

const TYPE_MESSAGES: Record<string, string> = {
  flight: "AlabTNT is currently in flight and cannot reply to messages.",
  train: "AlabTNT is on a high-speed train. Replies may be delayed.",
  exam: "AlabTNT is currently in an exam. Please do not disturb.",
  sleep: "AlabTNT is sleeping. Messages will be replied after waking up.",
};

function SpyDecoration({ type }: { type: string }) {
  const paths: Record<string, string> = {
    flight: "M22 2L11.5 16H3l4 3-4 3h8.5L22 22l2-10-2-10zm-4 10l2 4-2 4-2-4 2-4z",
    train: "M4 11V6h16v5H4zm0 2h16v2H4v-2zM6 3h12c1.1 0 2 .9 2 2v1H4V5c0-1.1 .9-2 2-2zM5 18v2h3v-2h8v2h3v-2M7 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    exam: "M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h16V5H4zm4 3h4M8 11h8M8 15h6",
    sleep: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
    daily: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM7 13h3M7 16h3",
    trigger_event: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    lasting_event: "M8 2v20M16 2v20M3 8h4M17 8h4M3 14h4M17 14h4M3 20h4M17 20h4",
    default: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  };

  const d = paths[type] || paths.default;

  return (
    <div className="absolute right-[3.5rem] bottom-[3rem] w-[63px] h-[63px] md:w-[81px] md:h-[81px] pointer-events-none select-none z-0">
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.2" opacity="0.35" xmlns="http://www.w3.org/2000/svg">
        <path d={d} />
      </svg>
    </div>
  );
}

export default function SpyPage() {
  const currentRef = useRef<HTMLDivElement>(null);
  const [activities, setActivities] = useState<SpyActivity[]>([]);
  const [sleepState, setSleepState] = useState<SpySleepState>({ isSleeping: false, startedAt: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/spy").then(r => r.json()),
      fetch("/api/spy/sleep").then(r => r.json()),
    ]).then(([data, sleep]) => {
      setActivities(Array.isArray(data) ? data : []);
      setSleepState(sleep);
    }).catch(() => {
      setActivities([]);
    }).finally(() => setLoading(false));
  }, []);

  const withStatus: SpyActivityWithStatus[] = activities.map(a => ({
    ...a,
    computedStatus: computeStatus(a),
  }));

  const pastActivities = withStatus.filter(a => a.computedStatus === "past");
  const activeActivities = withStatus.filter(a => a.computedStatus === "active");
  const upcomingActivities = withStatus.filter(a => a.computedStatus === "upcoming");

  const visiblePast = pastActivities.slice(-2);
  const visibleUpcoming = upcomingActivities.slice(0, 3);

  useEffect(() => {
    if (currentRef.current && activeActivities.length > 0) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [activeActivities.length, loading]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white/90">Trip Spy</h1>
            <p className="mt-2 text-zinc-500 text-sm flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />Where is AlabTNT right now?
            </p>
          </div>
          <Link href="/trip" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">All Trips</Link>
        </div>

        {loading && <div className="text-center py-16 text-zinc-500">Loading...</div>}

        {!loading && (
          <>
            <section className="mb-16">
              {sleepState.isSleeping && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-6 md:p-10 mb-6">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-40" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Sleeping</span>
                  </div>
                  <div className="flex items-start gap-3 mb-3">
                    <Moon className="w-6 h-6 text-purple-400 mt-0.5 shrink-0" />
                    <h2 className="text-2xl md:text-3xl font-bold text-white">AlabTNT is sleeping</h2>
                  </div>
                  <p className="text-zinc-300 text-lg leading-relaxed max-w-2xl ml-9">{TYPE_MESSAGES.sleep}</p>
                  {sleepState.startedAt && (
                    <div className="flex items-center gap-1.5 mt-4 ml-9 text-sm text-zinc-500">
                      <Clock className="w-4 h-4" />Since {new Date(sleepState.startedAt).toLocaleString()}
                    </div>
                  )}
                  <SpyDecoration type="sleep" />
                </motion.div>
              )}

              {activeActivities.map(activity => {
                const colorMap: Record<string, { border: string; bg: string; text: string; dot: string }> = {
                  flight: { border: 'border-pink-500/20', bg: 'from-pink-500/10', text: 'text-pink-400', dot: 'bg-pink-500' },
                  train: { border: 'border-yellow-500/20', bg: 'from-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500' },
                  exam: { border: 'border-red-500/20', bg: 'from-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
                  default: { border: 'border-[#C23D1A]/20', bg: 'from-[#C23D1A]/10', text: 'text-[#C23D1A]', dot: 'bg-[#C23D1A]' },
                };
                const c = colorMap[activity.type] || colorMap.default;
                const isSpecial = ['flight', 'train', 'exam'].includes(activity.type);

                return (
                  <motion.div key={activity.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} to-transparent p-6 md:p-10`}>
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.dot} opacity-40`} />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${c.dot}`} />
                      </span>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${c.text}`}>Active Now</span>
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                      {TYPE_ICONS[activity.type] || <Activity className={`w-6 h-6 ${c.text} mt-0.5 shrink-0`} />}
                      <h2 className="text-2xl md:text-3xl font-bold text-white">{activity.title}</h2>
                    </div>
                    {isSpecial && <p className="text-zinc-300 text-lg leading-relaxed max-w-2xl ml-9 mb-3">{TYPE_MESSAGES[activity.type]}</p>}
                    {activity.description && <p className="text-zinc-400 text-base leading-relaxed max-w-2xl ml-9">{activity.description}</p>}
                    <div className="flex flex-wrap items-center gap-4 mt-4 ml-9">
                      {activity.location && <span className="flex items-center gap-1.5 text-sm text-zinc-400"><MapPin className="w-4 h-4" />{activity.location}</span>}
                      {activity.flightNumber && <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 text-xs font-mono">{activity.flightNumber}</span>}
                      {activity.trainNumber && <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-xs font-mono">{activity.trainNumber}</span>}
                      {activity.departure && activity.arrival && <span className="text-sm text-zinc-400">{activity.departure} → {activity.arrival}</span>}
                      <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                        <Clock className="w-4 h-4" />{activity.timestamp}{activity.timestamp2 ? ` — ${activity.timestamp2}` : ''}
                      </span>
                      {activity.recurrence && <span className="flex items-center gap-1 text-sm text-zinc-500"><Repeat className="w-3.5 h-3.5" />{activity.recurrence}</span>}
                    </div>
                    <SpyDecoration type={activity.type} />
                  </motion.div>
                );
              })}

              {activeActivities.length === 0 && !sleepState.isSleeping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                  <Radio className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-lg font-light">No active activity</p>
                  <p className="text-zinc-600 text-sm mt-1">Nothing happening right now.</p>
                </motion.div>
              )}
            </section>

            <section className="relative">
              <div className="flex items-center gap-2 mb-10">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Timeline</h2>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="relative pl-8 md:pl-10">
                <div className="absolute left-[7px] md:left-[9px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                {visiblePast.map(activity => (<TimelineNode key={activity.id} activity={activity} />))}
                {activeActivities.map(activity => (
                  <div key={activity.id} ref={currentRef}><TimelineNode activity={activity} /></div>
                ))}
                {visibleUpcoming.map(activity => (<TimelineNode key={activity.id} activity={activity} />))}

                {activities.length === 0 && (
                  <div className="py-8 text-center text-zinc-600 text-sm">No timeline entries yet.</div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function TimelineNode({ activity }: { activity: SpyActivityWithStatus }) {
  const isActive = activity.computedStatus === "active";
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative pb-10 last:pb-0">
      <div className={`absolute -left-8 md:-left-10 w-3.5 h-3.5 rounded-full border-2 z-10 ${isActive ? "border-[#C23D1A] bg-[#C23D1A]" : "border-zinc-600 bg-[#0a0a0a]"}`} style={{ top: "4px" }}>
        {isActive && <span className="absolute inset-0 rounded-full bg-[#C23D1A] animate-ping opacity-30" />}
      </div>
      <div className={isActive ? "opacity-100" : "opacity-60"}>
        <span className="text-[11px] font-medium text-zinc-600 mb-1 flex items-center gap-1.5">
          {activity.timestamp}{activity.timestamp2 && <span>— {activity.timestamp2}</span>}
        </span>
        <h3 className={`text-sm font-semibold ${isActive ? "text-white" : "text-zinc-400"}`}>
          <span className="mr-1.5">{TYPE_ICONS[activity.type]}</span>{activity.title}
        </h3>
        {activity.description && <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{activity.description}</p>}
        {activity.location && <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600 mt-1"><MapPin className="w-3 h-3" />{activity.location}</span>}
        {activity.flightNumber && <span className="ml-2 text-[10px] font-mono text-pink-400">{activity.flightNumber}</span>}
        {activity.trainNumber && <span className="ml-2 text-[10px] font-mono text-yellow-400">{activity.trainNumber}</span>}
      </div>
    </motion.div>
  );
}
