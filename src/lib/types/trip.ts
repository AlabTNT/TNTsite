export type TripStatus = 'past' | 'current' | 'upcoming';

export interface TripEvent {
  id: string;
  tripId: string;
  timestamp: string; // ISO string or human readable
  content: string;
  status: 'past' | 'active';
  subNodes?: TripEvent[]; // Optional sub-nodes for nested events (e.g. flight stages)
}

export interface Trip {
  id: string;
  title: string;
  location: string;
  startDate: string; // ISO string or simple date string
  endDate: string;
  description?: string;
  imageUrl?: string;
  status: TripStatus;
  events?: TripEvent[];
}
