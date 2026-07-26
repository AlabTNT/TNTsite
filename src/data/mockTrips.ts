import { Trip } from '@/lib/types/trip';

export const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    title: 'Kyoto Autumn Exploration',
    location: 'Kyoto, Japan',
    startDate: '2025-11-10',
    endDate: '2025-11-20',
    description: 'Exploring the autumn leaves and historic temples.',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
    status: 'past',
    events: [
      { id: 'e1', tripId: '1', timestamp: '2025-11-10 10:00', content: 'Arrived in Kyoto.', status: 'past' },
      { id: 'e2', tripId: '1', timestamp: '2025-11-15 14:00', content: 'Visited Kiyomizu-dera.', status: 'past' },
      { id: 'e3', tripId: '1', timestamp: '2025-11-20 09:00', content: 'Left Kyoto for home.', status: 'past' },
    ]
  },
  {
    id: '2',
    title: 'Swiss Alps Skiing',
    location: 'Zermatt, Switzerland',
    startDate: '2026-01-05',
    endDate: '2026-01-15',
    description: 'Winter sports and enjoying the Matterhorn view.',
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7785a6491754?q=80&w=800&auto=format&fit=crop',
    status: 'past',
    events: [
      { id: 'e1', tripId: '2', timestamp: '2026-01-05 12:00', content: 'Arrived at Zermatt.', status: 'past' },
      { id: 'e2', tripId: '2', timestamp: '2026-01-08 09:00', content: 'Skiing all day.', status: 'past' },
    ]
  },
  {
    id: '3',
    title: 'Summer in Santorini',
    location: 'Santorini, Greece',
    startDate: '2026-06-20',
    endDate: '2026-06-30',
    description: 'Relaxing by the Aegean sea and enjoying the sunsets.',
    imageUrl: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=1200&auto=format&fit=crop',
    status: 'current',
    events: [
      { id: 'e1', tripId: '3', timestamp: '2026-06-20 08:00', content: 'Arrived at the airport and checked in.', status: 'past' },
      { 
        id: 'e2', tripId: '3', timestamp: '2026-06-20 09:30', content: 'Flight to Athens', status: 'active',
        subNodes: [
          { id: 's1', tripId: '3', timestamp: '2026-06-20 09:35', content: 'Boarding started at Gate A12', status: 'past' },
          { id: 's2', tripId: '3', timestamp: '2026-06-20 10:00', content: 'Taxiing to runway', status: 'past' },
          { id: 's3', tripId: '3', timestamp: '2026-06-20 10:15', content: 'Taking off', status: 'past' },
          { id: 's4', tripId: '3', timestamp: '2026-06-20 10:45', content: 'Reached cruising altitude', status: 'active' }
        ]
      },
    ]
  },
  {
    id: '4',
    title: 'New York Tech Week',
    location: 'New York, USA',
    startDate: '2026-09-15',
    endDate: '2026-09-22',
    description: 'Attending conferences and networking in NYC.',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop',
    status: 'upcoming',
    events: []
  },
  {
    id: '5',
    title: 'Patagonia Hiking',
    location: 'Patagonia, Chile',
    startDate: '2026-12-01',
    endDate: '2026-12-14',
    description: 'Trekking through Torres del Paine.',
    status: 'upcoming',
    events: []
  }
];

export const MOCK_TRIP_DETAILS: Record<string, Trip> = MOCK_TRIPS.reduce((acc, trip) => {
  acc[trip.id] = trip;
  return acc;
}, {} as Record<string, Trip>);
