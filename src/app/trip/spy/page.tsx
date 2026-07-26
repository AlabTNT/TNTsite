"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Activity, Radio } from "lucide-react";
import Link from "next/link";

interface SpyActivity {
  id: string;
  title: string;
  description?: string;
  location?: string;
  timestamp: string;
  status: "past" | "active" | "upcoming";
  type: string;
}

export default function SpyPage() {
  const currentRef = useRef<HTMLDivElement>(null);
  const [activities, setActivities] = useState<SpyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/spy")
      .then((r) => r.json())
      .then((data) => setActivities(Array.isArray(data) ? data : []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  const pastActivities = activities.filter(a => a.status === "past");
  const activeActivities = activities.filter(a => a.status === "active");
  const upcomingActivities = activities.filter(a => a.status === "upcoming");

  const visiblePast = pastActivities.slice(-2);
  const visibleUpcoming = upcomingActivities.slice(0, 3);

  useEffect(() => {
    if (currentRef.current) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  }, [activeActivities.length]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white/90">
              Trip Spy
            </h1>
            <p className="mt-2 text-zinc-500 text-sm flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              Where is AlabTNT right now?
            </p>
          </div>
          <Link
            href="/trip"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            All Trips
          </Link>
        </div>

        {/* Current Status Section */}
        <section className="mb-16">
          {activeActivities.length > 0 ? (
            activeActivities.map(activity => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-[#C23D1A]/20 bg-gradient-to-br from-[#C23D1A]/10 to-transparent p-6 md:p-10"
              >
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C23D1A] opacity-40" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C23D1A]" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#C23D1A]">
                    Active Now
                  </span>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <Activity className="w-6 h-6 text-[#C23D1A] mt-0.5 shrink-0" />
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {activity.title}
                  </h2>
                </div>

                {activity.description && (
                  <p className="text-zinc-300 text-lg leading-relaxed max-w-2xl ml-9">
                    {activity.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-4 ml-9">
                  {activity.location && (
                    <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                      <MapPin className="w-4 h-4" />
                      {activity.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                    <Clock className="w-4 h-4" />
                    {activity.timestamp}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]"
            >
              <Radio className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-lg font-light">No active activity detected.</p>
              <p className="text-zinc-600 text-sm mt-1">Waiting for the next adventure...</p>
            </motion.div>
          )}
        </section>

        {/* Timeline Section */}
        <section className="relative">
          <div className="flex items-center gap-2 mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Timeline
            </h2>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="relative pl-8 md:pl-10">
            {/* Vertical timeline line */}
            <div className="absolute left-[7px] md:left-[9px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

            {visiblePast.map(activity => (
              <TimelineNode key={activity.id} activity={activity} />
            ))}

            {activeActivities.map(activity => (
              <div key={activity.id} ref={currentRef}>
                <TimelineNode activity={activity} />
              </div>
            ))}

            {visibleUpcoming.map(activity => (
              <TimelineNode key={activity.id} activity={activity} />
            ))}

            {loading && (
              <div className="py-8 text-center text-zinc-600 text-sm">
                Loading timeline...
              </div>
            )}
            {!loading && activities.length === 0 && (
              <div className="py-8 text-center text-zinc-600 text-sm">
                No timeline entries yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TimelineNode({ activity }: { activity: SpyActivity }) {
  const isActive = activity.status === "active";
  const isPast = activity.status === "past";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative pb-10 last:pb-0"
    >
      <div
        className={`absolute -left-8 md:-left-10 w-3.5 h-3.5 rounded-full border-2 z-10 ${
          isActive
            ? "border-[#C23D1A] bg-[#C23D1A]"
            : isPast
            ? "border-zinc-600 bg-[#0a0a0a]"
            : "border-zinc-700 bg-[#0a0a0a]"
        }`}
        style={{ top: "4px" }}
      >
        {isActive && (
          <span className="absolute inset-0 rounded-full bg-[#C23D1A] animate-ping opacity-30" />
        )}
      </div>

      <div className={`${isActive ? "opacity-100" : "opacity-60"}`}>
        <span className="text-[11px] font-medium text-zinc-600 mb-1 block">
          {activity.timestamp}
        </span>
        <h3
          className={`text-sm font-semibold ${
            isActive ? "text-white" : "text-zinc-400"
          }`}
        >
          {activity.title}
        </h3>
        {activity.description && (
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            {activity.description}
          </p>
        )}
        {activity.location && (
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600 mt-1">
            <MapPin className="w-3 h-3" />
            {activity.location}
          </span>
        )}
      </div>
    </motion.div>
  );
}
