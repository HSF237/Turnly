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
