"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Activity, Radio, Plane, Train, BookOpen, Moon, Calendar, Repeat } from "lucide-react";
import Link from "next/link";
import { computeStatus, SpyType, SpyActivity, parseTimestamp } from "@/lib/types/trip";

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
  const IconComponent = {
    flight: Plane,
    train: Train,
    exam: BookOpen,
    sleep: Moon,
    daily: Repeat,
  }[type] || Radio;

  return (
    <div 
      className="absolute -right-3 -bottom-7 w-24 h-24 md:w-36 md:h-36 pointer-events-none select-none z-0 text-zinc-400 opacity-[0.25]"
      style={{
        WebkitMaskImage: "linear-gradient(135deg, black 30%, transparent 90%)",
        maskImage: "linear-gradient(135deg, black 30%, transparent 90%)",
      }}
    >
      <IconComponent className="w-full h-full stroke-[1.1]" />
    </div>
  );
}

export default function SpyPage() {
  const currentRef = useRef<HTMLDivElement>(null);
  const [activities, setActivities] = useState<SpyActivity[]>([]);
  const [sleepState, setSleepState] = useState<SpySleepState>({ isSleeping: false, startedAt: null });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [visibleFutureCount, setVisibleFutureCount] = useState(5);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const activeActivities = withStatus.filter(a => a.computedStatus === "active");

  // Build timeline points with Start/End split for lasting events
  interface TimelinePoint {
    id: string;
    time: Date;
    label: string;
    activity: SpyActivity;
    isStart: boolean;
    isEnd: boolean;
    isNow: boolean;
  }

  const getStartLabel = (activity: SpyActivity) => {
    if (activity.type === 'flight') return `${activity.title} (Takeoff)`;
    if (activity.type === 'train') return `${activity.title} (Departure)`;
    return `${activity.title} (Start)`;
  };

  const getEndLabel = (activity: SpyActivity) => {
    if (activity.type === 'flight') return `${activity.title} (Landing)`;
    if (activity.type === 'train') return `${activity.title} (Arrival)`;
    return `${activity.title} (End)`;
  };

  const timelinePoints: TimelinePoint[] = [];

  activities.forEach(activity => {
    const isLasting = ['flight', 'train', 'exam', 'lasting_event'].includes(activity.type);
    const t1 = parseTimestamp(activity.timestamp);
    
    if (isLasting && activity.timestamp2) {
      const t2 = parseTimestamp(activity.timestamp2);
      timelinePoints.push({
        id: `${activity.id}-start`,
        time: t1,
        label: getStartLabel(activity),
        activity,
        isStart: true,
        isEnd: false,
        isNow: false
      });
      timelinePoints.push({
        id: `${activity.id}-end`,
        time: t2,
        label: getEndLabel(activity),
        activity,
        isStart: false,
        isEnd: true,
        isNow: false
      });
    } else {
      timelinePoints.push({
        id: activity.id,
        time: t1,
        label: activity.title,
        activity,
        isStart: false,
        isEnd: false,
        isNow: false
      });
    }
  });

  // Calculate highlit boundaries and slice points
  let visiblePoints: TimelinePoint[] = [];
  let futurePoints: TimelinePoint[] = [];
  let earliestStart: Date | null = null;
  let latestEnd: Date | null = null;

  if (mounted && activities.length > 0) {
    const nowTime = new Date();
    
    // Add Now Node
    timelinePoints.push({
      id: "now-node",
      time: nowTime,
      label: "CURRENT TIME",
      activity: {
        id: "now",
        title: "NOW",
        type: "trigger_event",
      } as any,
      isStart: false,
      isEnd: false,
      isNow: true
    });

    // Sort chronologically
    timelinePoints.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Compute active lasting events at nowTime
    const activeLastingEvents = activities.filter(a => {
      const isLasting = ['flight', 'train', 'exam', 'lasting_event'].includes(a.type);
      if (!isLasting || !a.timestamp2) return false;
      const t1 = parseTimestamp(a.timestamp);
      const t2 = parseTimestamp(a.timestamp2);
      return t1 <= nowTime && nowTime <= t2;
    });

    if (activeLastingEvents.length > 0) {
      const starts = activeLastingEvents.map(a => parseTimestamp(a.timestamp).getTime());
      const ends = activeLastingEvents.map(a => parseTimestamp(a.timestamp2!).getTime());
      earliestStart = new Date(Math.min(...starts));
      latestEnd = new Date(Math.max(...ends));
    }

    // Slice timeline: 2 past, NOW, visibleFutureCount upcoming
    const nowIndex = timelinePoints.findIndex(p => p.isNow);
    if (nowIndex !== -1) {
      const pastPoints = timelinePoints.slice(0, nowIndex).slice(-2);
      futurePoints = timelinePoints.slice(nowIndex + 1);
      const slicedFuturePoints = futurePoints.slice(0, visibleFutureCount);
      visiblePoints = [...pastPoints, timelinePoints[nowIndex], ...slicedFuturePoints];
    }
  } else if (!loading) {
    timelinePoints.sort((a, b) => a.time.getTime() - b.time.getTime());
    visiblePoints = timelinePoints;
  }

  useEffect(() => {
    if (currentRef.current && mounted) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [mounted, loading]);

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
                  maybe: { border: 'border-yellow-500/20', bg: 'from-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500' },
                  must: { border: 'border-red-500/20', bg: 'from-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
                  default: { border: 'border-[#C23D1A]/20', bg: 'from-[#C23D1A]/10', text: 'text-[#C23D1A]', dot: 'bg-[#C23D1A]' },
                };
                let c = colorMap[activity.type];
                if (!c && activity.msgStatus && activity.msgStatus !== "none") {
                  c = colorMap[activity.msgStatus];
                }
                if (!c) {
                  c = colorMap.default;
                }
                const isSpecial = ['flight', 'train', 'exam'].includes(activity.type);
                let statusMessage = "";
                if (isSpecial) {
                  statusMessage = TYPE_MESSAGES[activity.type];
                } else if (activity.msgStatus === "maybe") {
                  statusMessage = "AlabTNT replies may be delayed. (Replies may be delayed / 可能无法及时回复)";
                } else if (activity.msgStatus === "must") {
                  statusMessage = "AlabTNT cannot check messages right now. (Cannot check messages / 暂时无法查看消息)";
                }

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
                    {statusMessage && <p className="text-zinc-300 text-lg leading-relaxed max-w-2xl ml-9 mb-3">{statusMessage}</p>}
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

              <div className="relative">
                {visiblePoints.map((point, index) => {
                  const isLast = index === visiblePoints.length - 1;
                  
                  let isHighlightedLine = false;
                  if (!isLast && earliestStart && latestEnd) {
                    const nextPoint = visiblePoints[index + 1];
                    isHighlightedLine = point.time >= earliestStart && nextPoint.time <= latestEnd;
                  }

                  const isHighlightedNode = earliestStart && latestEnd
                    ? (point.time >= earliestStart && point.time <= latestEnd)
                    : false;

                  return (
                    <TimelineNode 
                      key={point.id} 
                      point={point} 
                      isLast={isLast}
                      isHighlightedLine={isHighlightedLine}
                      isHighlightedNode={isHighlightedNode}
                      currentRef={point.isNow ? currentRef : undefined}
                    />
                  );
                })}

                {visiblePoints.length === 0 && (
                  <div className="py-8 text-center text-zinc-600 text-sm">No timeline entries yet.</div>
                )}

                {mounted && activities.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    {visibleFutureCount < futurePoints.length ? (
                      <button
                        onClick={() => setVisibleFutureCount(prev => prev + 5)}
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors py-2 px-4 rounded bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer"
                      >
                        Load More
                      </button>
                    ) : (
                      <div className="text-zinc-600 tracking-widest text-xs select-none">
                        -----·-----
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function RadarNode() {
  return (
    <div className="relative w-4 h-4 flex items-center justify-center">
      <style>{`
        @keyframes radar-pulse-1 {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          100% {
            transform: scale(3.5);
            opacity: 0;
          }
        }
        @keyframes radar-pulse-2 {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 0.25;
          }
          100% {
            transform: scale(4.8);
            opacity: 0;
          }
        }
        .radar-ring-1 {
          animation: radar-pulse-1 3.6s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .radar-ring-2 {
          animation: radar-pulse-2 3.6s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          animation-delay: 1.2s;
        }
      `}</style>
      {/* Outer pulsing ring 1 */}
      <div className="absolute w-full h-full rounded-full bg-blue-500 radar-ring-1" />
      {/* Outer pulsing ring 2 */}
      <div className="absolute w-full h-full rounded-full bg-blue-500 radar-ring-2" />
      {/* Center core dot */}
      <div className="w-2.5 h-2.5 rounded-full bg-blue-400 z-10 shadow-lg shadow-blue-400/50" />
    </div>
  );
}

function TimelineNode({ 
  point, 
  isLast, 
  isHighlightedLine,
  isHighlightedNode, 
  currentRef 
}: { 
  point: any; 
  isLast: boolean; 
  isHighlightedLine: boolean;
  isHighlightedNode: boolean; 
  currentRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const { activity, isStart, isEnd, isNow, label, time } = point;

  const formatTime = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <motion.div 
      ref={currentRef as any}
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="relative pb-10 last:pb-0 pl-8 md:pl-10"
    >
      {/* Line Segment to Next Node */}
      {!isLast && (
        <div 
          className={`absolute top-[18px] bottom-0 w-0.5 transition-colors duration-500 left-[11px] ${
            isHighlightedLine ? "bg-[#C23D1A]" : "bg-white/10"
          }`}
        />
      )}

      {/* Indicator Dot */}
      <div 
        className="absolute left-[5px] top-[-1px] z-10 flex items-center justify-center"
        style={{ width: '14px', height: '14px' }}
      >
        {isNow ? (
          <RadarNode />
        ) : (
          <div 
            className={`w-3.5 h-3.5 rounded-full border-2 bg-[#0a0a0a] transition-all duration-500 ${
              isHighlightedNode ? "border-[#C23D1A] bg-[#C23D1A]" : "border-zinc-600"
            }`}
          >
            {isHighlightedNode && (
              <span className="absolute inset-0 rounded-full bg-[#C23D1A] animate-ping opacity-30" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={isHighlightedNode || isNow ? "opacity-100" : "opacity-60"}>
        <span className="text-[11px] font-medium text-zinc-600 mb-1 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {formatTime(time)}
        </span>
        
        <h3 className={`text-sm font-semibold flex items-center gap-1.5 ${
          isNow ? "text-blue-400" : (isHighlightedNode ? "text-white" : "text-zinc-400")
        }`}>
          {!isNow && <span className="text-zinc-500">{TYPE_ICONS[activity.type]}</span>}
          {label}
        </h3>

        {!isNow && (
          <>
            {activity.description && !isEnd && (
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{activity.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-1">
              {activity.location && (
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
                  <MapPin className="w-3 h-3" />
                  {activity.location}
                </span>
              )}
              
              {activity.type === 'flight' && (
                <>
                  {activity.flightNumber && (
                    <span className="text-[10px] font-mono text-pink-400/80 bg-pink-500/5 px-1.5 py-0.5 rounded">
                      {activity.flightNumber}
                    </span>
                  )}
                  {isStart && activity.departure && (
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Departing from {activity.departure}
                    </span>
                  )}
                  {isEnd && activity.arrival && (
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Arriving at {activity.arrival}
                    </span>
                  )}
                </>
              )}

              {activity.type === 'train' && (
                <>
                  {activity.trainNumber && (
                    <span className="text-[10px] font-mono text-yellow-400/80 bg-yellow-500/5 px-1.5 py-0.5 rounded">
                      {activity.trainNumber}
                    </span>
                  )}
                  {isStart && activity.departure && (
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Departing from {activity.departure}
                    </span>
                  )}
                  {isEnd && activity.arrival && (
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Arriving at {activity.arrival}
                    </span>
                  )}
                </>
              )}
              {activity.msgStatus === "maybe" && (
                <span className="text-[10px] font-medium text-yellow-400/90 bg-yellow-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                  ⚠️ 可能无法及时回复
                </span>
              )}
              {activity.msgStatus === "must" && (
                <span className="text-[10px] font-medium text-red-400/90 bg-red-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                  🚫 暂时无法看消息
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

