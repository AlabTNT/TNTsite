import { Trip } from '@/lib/types/trip';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';

interface TripCardProps {
  trip: Trip;
  isEnlarged?: boolean;
}

export function TripCard({ trip, isEnlarged = false }: TripCardProps) {
  const isPast = trip.status === 'past';
  const isCurrent = trip.status === 'current';
  const isUpcoming = trip.status === 'upcoming';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={clsx(
        'relative overflow-hidden rounded-2xl border transition-all duration-300 block',
        'hover:shadow-lg',
        {
          // Sizing
          'w-full md:w-[600px] h-[400px] md:h-[500px] shadow-xl border-blue-500/30': isCurrent,
          'w-[90%] md:w-[450px] h-[200px]': !isCurrent && isEnlarged,
          'w-[85%] md:w-[400px] h-[160px]': !isCurrent && !isEnlarged,

          // Styling
          'bg-gray-100/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 opacity-70 grayscale-[50%]': isPast,
          'bg-white dark:bg-gray-900': isCurrent,
          'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700': isUpcoming,
        }
      )}
    >
      <Link href={`/trip/${trip.id}`} className="absolute inset-0 z-20">
        <span className="sr-only">View trip {trip.title}</span>
      </Link>

      {/* Optional Background Image */}
      {trip.imageUrl && (
        <div className={clsx("absolute inset-0 z-0", { "opacity-40": isPast, "opacity-100": isCurrent || isUpcoming })}>
          <img src={trip.imageUrl} alt={trip.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className={clsx("relative z-10 flex flex-col justify-end h-full p-6", { "text-white": trip.imageUrl, "text-gray-900 dark:text-gray-100": !trip.imageUrl })}>
        
        {isCurrent && (
          <span className="absolute top-6 left-6 px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-blue-600 text-white rounded-full">
            Currently Here
          </span>
        )}

        <div className="space-y-2 pointer-events-none">
          <h3 className={clsx("font-bold tracking-tight", {
            "text-3xl md:text-4xl": isCurrent,
            "text-xl md:text-2xl": !isCurrent && isEnlarged,
            "text-lg md:text-xl": !isCurrent && !isEnlarged,
          })}>
            {trip.title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
            <div className="flex items-center gap-1.5">
              <MapPin size={16} />
              <span>{trip.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={16} />
              <span>{trip.startDate} - {trip.endDate}</span>
            </div>
          </div>

          {(isCurrent || isEnlarged) && trip.description && (
            <p className="mt-2 text-sm line-clamp-2 opacity-80">
              {trip.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
