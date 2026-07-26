"use client";

import { useEffect, useRef, useState } from 'react';
import { TripEvent } from '@/lib/types/trip';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TrajectoryTimelineProps {
  events: TripEvent[];
}

export function TrajectoryTimeline({ events }: TrajectoryTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when the component mounts or events change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [events]);

  return (
    <div className="relative pl-6 md:pl-8 py-8">
      {/* The main vertical line */}
      <div className="absolute left-[11px] md:left-[15px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />

      <div className="space-y-12">
        {events.map((event, index) => (
          <MainNode key={event.id} event={event} index={index} />
        ))}
      </div>
      
      {/* Invisible element to scroll to */}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}

function MainNode({ event, index }: { event: TripEvent; index: number }) {
  const isActive = event.status === 'active';
  const hasSubNodes = event.subNodes && event.subNodes.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      {/* Dot Indicator for Main Node */}
      <div 
        className={clsx(
          "absolute -left-6 md:-left-8 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 bg-white dark:bg-gray-950 z-10",
          {
            "border-blue-500": isActive,
            "border-gray-300 dark:border-gray-600": !isActive,
          }
        )}
        style={{ top: '6px' }} 
      >
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
        )}
        {isActive && (
           <div className="absolute inset-[2px] rounded-full bg-blue-500" />
        )}
      </div>

      {/* Content Block */}
      <div className={clsx("flex flex-col mb-4", {
        "opacity-60": !isActive,
        "opacity-100": isActive, 
      })}>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {event.timestamp}
        </span>
        <p className={clsx("text-base leading-relaxed", {
          "text-gray-600 dark:text-gray-400": !isActive,
          "text-gray-900 dark:text-gray-100 font-bold": isActive, // Main nodes are bolder
        })}>
          {event.content}
        </p>
      </div>

      {/* Sub-nodes Section */}
      {hasSubNodes && (
        <div className="ml-4 md:ml-6 mt-4 relative border-l-2 border-gray-100 dark:border-gray-800/50 pl-4 space-y-6">
          <SubNodesList subNodes={event.subNodes!} />
        </div>
      )}
    </motion.div>
  );
}

function SubNodesList({ subNodes }: { subNodes: TripEvent[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const pastNodes = subNodes.filter(sn => sn.status === 'past');
  const activeNodes = subNodes.filter(sn => sn.status === 'active');

  // We want to show:
  // 1. If expanded: All past nodes + all active nodes.
  // 2. If collapsed: Only the LAST past node (if any) + all active nodes.
  
  let visiblePastNodes = pastNodes;
  const hiddenCount = pastNodes.length - 1;

  if (!isExpanded && pastNodes.length > 1) {
    visiblePastNodes = pastNodes.slice(-1); // Only the last one
  }

  return (
    <>
      {/* Expand/Collapse Button (If there are more than 1 past nodes) */}
      {!isExpanded && hiddenCount > 0 && (
        <div className="relative">
           <button 
             onClick={() => setIsExpanded(true)}
             className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-950 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800"
           >
             <ChevronDown size={14} />
             {hiddenCount} previous updates collapsed
           </button>
        </div>
      )}

      {/* Render Visible Past Nodes */}
      <AnimatePresence initial={false}>
        {visiblePastNodes.map((sn, idx) => (
          <SubNodeItem key={sn.id} subNode={sn} />
        ))}
      </AnimatePresence>

      {/* Render Active Nodes */}
      {activeNodes.map((sn) => (
        <SubNodeItem key={sn.id} subNode={sn} />
      ))}

      {/* Collapse Button */}
      {isExpanded && hiddenCount > 0 && (
        <div className="relative pt-2">
           <button 
             onClick={() => setIsExpanded(false)}
             className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-950 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800"
           >
             <ChevronUp size={14} />
             Show less
           </button>
        </div>
      )}
    </>
  );
}

function SubNodeItem({ subNode }: { subNode: TripEvent }) {
  const isActive = subNode.status === 'active';

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="relative flex flex-col"
    >
      {/* Small dot indicator for subnode */}
      <div 
        className={clsx(
          "absolute -left-[21px] w-2 h-2 rounded-full border bg-white dark:bg-gray-950 z-10",
          {
            "border-blue-500 bg-blue-500": isActive,
            "border-gray-300 dark:border-gray-600": !isActive,
          }
        )}
        style={{ top: '6px' }}
      >
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30" />
        )}
      </div>

      <div className={clsx({
        "opacity-60": !isActive,
        "opacity-100": isActive,
      })}>
        <span className="text-[11px] font-medium text-gray-400 mb-0.5 block">
          {subNode.timestamp}
        </span>
        <p className={clsx("text-sm", {
          "text-gray-500 dark:text-gray-400": !isActive,
          "text-gray-800 dark:text-gray-200 font-medium": isActive,
        })}>
          {subNode.content}
        </p>
      </div>
    </motion.div>
  );
}
