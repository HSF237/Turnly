import { createContext, useContext } from 'react';
import type { CommunityPlace, Place, SchoolEvent, Ticket } from './types';

/**
 * Sample-data preview. When a MockData provider wraps a screen, the data hooks
 * read from it instead of Firestore. Used only by design/QA harnesses, never by
 * the real routes, so production data is never touched.
 */
export interface MockData {
  user?: { uid: string; displayName: string; photoURL?: string | null };
  places?: Place[];
  tickets?: Record<string, Ticket[]>;
  community?: CommunityPlace[];
  events?: SchoolEvent[];
}

export const MockContext = createContext<MockData | null>(null);
export const useMock = () => useContext(MockContext);
