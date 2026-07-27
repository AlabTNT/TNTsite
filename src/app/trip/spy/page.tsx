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
  const paths: Record<string, { path: string; viewBox: string }> = {
    flight: {
      viewBox: "0 0 64 64",
      path: "M32 4L16 48h12l4-16 4 16h12L32 4zm-8 44l4 12h4l4-12H24zm8-40v12",
    },
    train: {
      viewBox: "0 0 80 64",
      path: "M8 32V12h64v20H8zm0 4h64v4H8v-4zM16 4h48l12 8H4l12-8zm8 32v8h4v-8m20 0v8h4v-8M20 44a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm40 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    },
    exam: {
      viewBox: "0 0 64 64",
      path: "M8 8h48v40H8V8zm8 8h12m-12 8h32m-12 8h12M16 32v16m16-16v16M8 48l8 8 12-12m28 8L44 40",
    },
    sleep: {
      viewBox: "0 0 80 80",
      path: "M40 8a32 32 0 1 0 32 32c0-15-10.5-27.5-24.5-31v12.5a19 19 0 0 1 0 37c-7.5 0-14-4.5-17-13A32 32 0 0 0 40 8zm-4 20l-2 4-4 2 4 2 2 4 2-4 4-2-4-2-2-4z",
    },
    daily: {
      viewBox: "0 0 64 64",
      path: "M8 12h48v44H8V12zm4 8v4h40v-4H12zm0 8v4h40v-4H12zm0 8v4h28v-4H12zm28-20v-8m-8 8V4m-8 8V8m24 0v4",
    },
    trigger_event: {
      viewBox: "0 0 64 64",
      path: "M32 8L20 44h8l4-16 4 16h8L32 8zM20 48v8h24v-8H20zm4-16h16",
    },
    lasting_event: {
      viewBox: "0 0 64 64",
      path: "M16 8v48M32 12v40M48 8v48M12 20h8m-8 12h8m-8 12h8m36-24h8m-8 12h8m-8 12h8M32 8v-4m0 56v-4",
    },
    default: {
      viewBox: "0 0 64 64",
      path: "M32 4v56M4 32h56M20 20l24 24m0-24L20 44",
    },
  };

  const { path: d, viewBox } = paths[type] || paths.default;

  return (
    <div className="absolute right-0 bottom-0 w-48 h-48 md:w-64 md:h-64 pointer-events-none select-none z-0">
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`s-g-${type}`} cx="85%" cy="85%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.12" />
            <stop offset="40%" stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id={`s-m-${type}`}>
            <rect width="100%" height="100%" fill={`url(#s-g-${type})`} />
          </mask>
        </defs>
        <path
          d={d}
          stroke="white"
          strokeWidth="1"
          strokeOpacity="0.15"
          fill="none"
          mask={`url(#s-m-${type})`}
        />
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
