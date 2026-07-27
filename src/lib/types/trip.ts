export type TripStatus = 'past' | 'current' | 'upcoming';

export interface TripEvent {
  id: string;
  tripId: string;
  timestamp: string;
  content: string;
  status: 'past' | 'active';
  subNodes?: TripEvent[];
}

export interface Trip {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  description?: string;
  imageUrl?: string;
  status: TripStatus;
  events?: TripEvent[];
}

export type SpyType = 'trigger_event' | 'lasting_event' | 'daily' | 'flight' | 'train' | 'exam' | 'sleep';

export interface SpyActivity {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  timestamp: string;
  timestamp2: string | null;
  type: SpyType;
  flightNumber: string | null;
  trainNumber: string | null;
  departure: string | null;
  arrival: string | null;
  recurrence: string | null;
  manualPast: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpyActivityWithStatus extends SpyActivity {
  computedStatus: 'past' | 'active' | 'upcoming';
}

export interface SpySleepState {
  isSleeping: boolean;
  startedAt: string | null;
}

export function computeStatus(activity: SpyActivity): 'past' | 'active' | 'upcoming' {
  if (activity.manualPast) return 'past';

  const now = new Date();
  const t1 = parseTimestamp(activity.timestamp);
  const t2 = activity.timestamp2 ? parseTimestamp(activity.timestamp2) : null;

  if (activity.type === 'daily') {
    return computeDailyStatus(activity.timestamp, activity.recurrence);
  }

  if (t2) {
    if (now >= t2) return 'past';
    if (now >= t1) return 'active';
    return 'upcoming';
  }

  if (activity.type === 'trigger_event') {
    if (now >= t1) return 'active';
    return 'upcoming';
  }

  if (now >= t1) return 'active';
  return 'upcoming';
}

function parseTimestamp(ts: string): Date {
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d;
  const isoMatch = ts.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return new Date(ts + 'T00:00:00');
  return new Date();
}

function computeDailyStatus(timestamp: string, recurrence: string | null): 'past' | 'active' | 'upcoming' {
  const now = new Date();
  const baseTime = parseTimestamp(timestamp);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const baseDay = new Date(baseTime.getFullYear(), baseTime.getMonth(), baseTime.getDate());

  if (baseDay > today) return 'upcoming';

  const dayDiff = Math.floor((today.getTime() - baseDay.getTime()) / 86400000);

  if (recurrence === 'weekly') {
    if (dayDiff % 7 === 0) return 'active';
    return dayDiff < 7 ? 'upcoming' : 'past';
  }

  if (recurrence === 'monthly') {
    const monthsDiff = (today.getFullYear() - baseTime.getFullYear()) * 12 + (today.getMonth() - baseTime.getMonth());
    if (today.getDate() === baseTime.getDate() && monthsDiff >= 0) return 'active';
    return monthsDiff < 1 ? 'upcoming' : 'past';
  }

  if (dayDiff === 0) return 'active';
  return dayDiff < 0 ? 'upcoming' : 'past';
}
