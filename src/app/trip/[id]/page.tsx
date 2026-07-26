import { Trip, TripEvent } from '@/lib/types/trip';
import { TrajectoryTimeline } from '@/components/trip/TrajectoryTimeline';
import { MapPin, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MOCK_TRIP_DETAILS } from '@/data/mockTrips';

export default async function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = MOCK_TRIP_DETAILS[id];

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Trip not found</h1>
        <Link href="/trip" className="text-blue-500 hover:underline">
          Return to Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] w-full bg-gray-900">
        {trip.imageUrl && (
          <img 
            src={trip.imageUrl} 
            alt={trip.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-gray-950 via-transparent to-transparent" />
        
        <div className="absolute top-6 left-6 z-10">
          <Link href="/trip" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            {trip.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span className="font-medium">{trip.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span className="font-medium">{trip.startDate} - {trip.endDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Trajectory Timeline */}
      <main className="max-w-3xl mx-auto px-6 md:px-12 pt-12">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Live Trajectory</h2>
          
          {trip.events && trip.events.length > 0 ? (
            <TrajectoryTimeline events={trip.events} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              No events recorded yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
