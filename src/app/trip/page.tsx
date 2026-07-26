"use client";

import { useEffect, useRef } from 'react';
import { TripCard } from '@/components/trip/TripCard';
import { motion } from 'framer-motion';
import { MOCK_TRIPS } from '@/data/mockTrips';
import Link from 'next/link';
import { Radio } from 'lucide-react';

export default function TripPage() {
  const currentTripRef = useRef<HTMLDivElement>(null);
  
  const pastTrips = MOCK_TRIPS.filter(t => t.status === 'past');
  const currentTrip = MOCK_TRIPS.find(t => t.status === 'current');
  const upcomingTrips = MOCK_TRIPS.filter(t => t.status === 'upcoming');

  const hasCurrentTrip = !!currentTrip;

  useEffect(() => {
    if (currentTripRef.current) {
      // Small delay to let the page render and Framer Motion to settle before scrolling
      setTimeout(() => {
        currentTripRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [hasCurrentTrip]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight"
          >
            My Journeys
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-gray-600 dark:text-gray-400"
          >
            A timeline of places I&apos;ve been and where I&apos;m going next.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <Link
              href="/trip/spy"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#C23D1A]/10 border border-[#C23D1A]/20 text-[#C23D1A] text-sm font-medium hover:bg-[#C23D1A]/20 transition-colors"
            >
              <Radio className="w-4 h-4" />
              Where is AlabTNT now?
            </Link>
          </motion.div>
        </div>

        {/* Timeline Container */}
        <div className="relative flex flex-col items-center gap-8 md:gap-12">
          
          {/* Vertical Timeline Line (Hidden on very small screens for cleaner look) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-700 -translate-x-1/2 hidden md:block z-0" />

          {/* Past Trips */}
          <div className="flex flex-col items-center gap-6 w-full z-10">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2 bg-gray-50 dark:bg-gray-950 px-4">Past</h2>
            {pastTrips.map((trip, idx) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                // Enlarge the most recent past trip if there is no current trip
                isEnlarged={!hasCurrentTrip && idx === pastTrips.length - 1} 
              />
            ))}
          </div>

          {/* Current Trip Section */}
          <div ref={currentTripRef} className="flex flex-col items-center justify-center w-full my-8 z-10 min-h-[100px]">
             {currentTrip ? (
               <TripCard trip={currentTrip} />
             ) : (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-900 w-[90%] md:w-[450px]"
               >
                 <span className="text-gray-500 dark:text-gray-400 font-medium">No ongoing trips right now.</span>
                 <span className="text-sm text-gray-400 dark:text-gray-500 mt-1">Planning the next adventure...</span>
               </motion.div>
             )}
          </div>

          {/* Upcoming Trips */}
          <div className="flex flex-col items-center gap-6 w-full z-10">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2 bg-gray-50 dark:bg-gray-950 px-4">Upcoming</h2>
            {upcomingTrips.map((trip, idx) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                // Enlarge the nearest upcoming trip if there is no current trip
                isEnlarged={!hasCurrentTrip && idx === 0} 
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
