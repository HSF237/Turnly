export type Category =
  | 'bank'
  | 'barber'
  | 'pharmacy'
  | 'government'
  | 'clinic'
  | 'shop'
  | 'restaurant'
  | 'school'
  | 'service'
  | 'other';

export interface Place {
  id: string;
  name: string;
  category: Category;
  address: string;
  lat: number;
  lng: number;
  ownerUid: string;
  /** Number of counters / staff serving at once. */
  counters: number;
  /** Rolling average serving time per customer, in seconds. */
  avgServiceSec: number;
  /** Last token number handed out today. */
  lastTicket: number;
  /** People currently waiting (not yet called). */
  waiting: number;
  servedToday: number;
  /** YYYY-MM-DD the counters above belong to; they reset each day. */
  dayKey: string;
  isOpen: boolean;
  /** Languages the TV announces tokens in. */
  languages: string[];
  /** Check-in radius in metres; 0 = no location check. */
  checkInRadius: number;
  createdAt: number;
  updatedAt: number;
  /** Hidden places (e.g. teachers in a school event) don't appear on the public map. */
  hidden?: boolean;
  /** Set when this queue belongs to a school event (one queue per teacher). */
  eventId?: string | null;
  teacher?: { name: string; subject: string; room: string } | null;
  /** Learned arrivals: "weekday-hour" → number of people who joined (weekday 0 = Sunday). */
  arrivals?: Record<string, number>;
  /** Speed badge stats: how many calls were measured, and how many came within the promised time. */
  speed?: { n: number; onTime: number };
}

export interface SchoolEvent {
  id: string;
  name: string;
  schoolName: string;
  date: string;
  ownerUid: string;
  slotMinutes: number;
  lat: number;
  lng: number;
  teacherIds: string[];
  isOpen: boolean;
  createdAt: number;
}

/** One crowd report: "it's about m minutes here". v = reporter was confirmed on site. */
export interface CommunityReport {
  m: number;
  at: number;
  v: boolean;
}

/** A place that isn't on Turnly yet, kept live by people standing in its line. */
export interface CommunityPlace {
  id: string;
  name: string;
  category: Category;
  address: string;
  lat: number;
  lng: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  reports: CommunityReport[];
}

export interface SwapRequest {
  fromTicketId: string;
  fromNumber: number;
  fromName: string;
  at: number;
}

export type TicketStatus = 'waiting' | 'called' | 'done' | 'skipped' | 'left';

export interface Ticket {
  id: string;
  number: number;
  name: string;
  partySize: number;
  uid: string;
  status: TicketStatus;
  dayKey: string;
  createdAt: number;
  calledAt: number | null;
  /** Changes on call and on recall; the TV announces whenever it changes. */
  announceAt: number | null;
  doneAt: number | null;
  counter: number | null;
  walkIn: boolean;
  /** Set when the customer confirms they've arrived (fair check-in). */
  checkedInAt?: number | null;
  /** Someone behind has asked to swap places with this ticket. */
  swapRequest?: SwapRequest | null;
  swappedAt?: number | null;
  /** Busy elsewhere (e.g. with another teacher): staff skip this ticket until then. */
  deferUntil?: number | null;
  /** The wait Turnly predicted when this person joined (minutes), to check ourselves later. */
  promisedMin?: number | null;
}

export const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  bank: { label: 'Bank', emoji: '🏦' },
  barber: { label: 'Barber & salon', emoji: '💈' },
  pharmacy: { label: 'Pharmacy', emoji: '💊' },
  government: { label: 'Government office', emoji: '🏛️' },
  clinic: { label: 'Clinic', emoji: '🩺' },
  shop: { label: 'Shop', emoji: '🛍️' },
  restaurant: { label: 'Restaurant & café', emoji: '☕' },
  school: { label: 'School counter', emoji: '🎓' },
  service: { label: 'Service centre', emoji: '🛠️' },
  other: { label: 'Other', emoji: '📍' },
};
