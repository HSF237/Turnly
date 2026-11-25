import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Info, LogIn, LogOut, Map, Route, Search, Sparkles, Store, Ticket } from 'lucide-react';
import { useAuth, usePlace, usePlaces, useSim, useTickets } from '../lib/hooks';
import { allRememberedTickets } from '../lib/queue';
import { formatMinutes, ticketPosition } from '../lib/predict';
import { CITIES, getCity, sampleBranchId } from '../lib/sim';
import { distanceM, todayKey } from '../lib/time';
import { logOut } from '../lib/firebase';
import { openSearch } from './CommandPalette';
import CityPicker from './CityPicker';

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/explore', label: 'Live map', icon: Map },
  { to: '/plan', label: 'Plan my errands', icon: Route },
  { to: '/me', label: 'My tokens', icon: Ticket },
  { to: '/business', label: 'For business', icon: Store },
  { to: '/about', label: 'How it works', icon: Info },
];

/** One of my tokens, live, in a single compact row. */
function MiniToken({ placeId, ticketId }: { placeId: string; ticketId: string }) {
  const { place } = usePlace(placeId);
  const { tickets } = useTickets(placeId);
  const t = tickets.find((x) => x.id === ticketId);
  if (!place || !t || !['waiting', 'called'].includes(t.status)) return null;
  const pos = ticketPosition(t, tickets, place);
  const called = t.status === 'called';
  return (
    <Link
      to={`/t/${placeId}/${ticketId}`}
      className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 transition ${
        called ? 'bg-sun-400 text-slate-900 ring-sun-300' : 'bg-white/[0.06] text-white ring-white/10 hover:bg-white/10'
      }`}
    >
      <span className={`grid h-10 min-w-[2.75rem] place-items-center rounded-xl px-1.5 text-lg font-extrabold tabular-nums ${called ? 'bg-white/60' : 'bg-brand-600'}`}>
        {t.number}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{place.name}</span>
        <span className={`block truncate text-xs ${called ? 'font-bold' : 'text-slate-400'}`}>
          {called ? `Your turn! Counter ${t.counter}` : pos.ahead === 0 ? "You're next" : `${pos.ahead} ahead · ~${formatMinutes(pos.etaMin)}`}
        </span>
      </span>
      {called && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-900 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-slate-900" />
        </span>
      )}
    </Link>
  );
}

/** The desktop app shell: a dark left rail with navigation, your live tokens and the city pulse. */
export default function Sidebar() {
  useLocation(); // re-read remembered tokens after every navigation
  useSim();
  const { user, isMember } = useAuth();
  const { places } = usePlaces();
  const mine = allRememberedTickets();
  const city = CITIES[getCity()];
  const today = todayKey();
  const here = places.filter((p) => p.isOpen && distanceM(city.center, p) < 40000);
  const waiting = here.reduce((s, p) => s + (p.dayKey === today ? p.waiting : 0), 0);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] flex-col overflow-y-auto bg-slate-950 px-4 pb-4 pt-5 text-white xl:flex">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-600/25 blur-3xl" />
      <div className="relative flex items-center justify-between px-2">
        <Link to="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden="true">
            <rect width="64" height="64" rx="16" fill="#0a8576" />
            <path d="M20 22h24M32 22v24" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
            <circle cx="46" cy="44" r="6" fill="#fbab30" />
          </svg>
          <span className="text-2xl font-extrabold tracking-tight">Turnly</span>
        </Link>
        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-300 ring-1 ring-white/10">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" /> Live
        </span>
      </div>

      <button
        onClick={openSearch}
        className="relative mt-6 flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-3 py-2.5 text-sm text-slate-400 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
      >
        <Search size={16} />
        Search places
        <kbd className="ml-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">⌘K</kbd>
      </button>

      <nav className="relative mt-5 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="relative block">
            {({ isActive }) => (
              <span className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition ${isActive ? 'text-white' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`}>
                {isActive && (
                  <motion.span
                    layoutId="side-active"
                    className="absolute inset-0 rounded-xl bg-white/10 ring-1 ring-white/10"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                {isActive && <motion.span layoutId="side-bar" className="absolute -left-4 top-2 bottom-2 w-1 rounded-r-full bg-brand-400" />}
                <Icon size={18} className={`relative ${isActive ? 'text-brand-300' : ''}`} />
                <span className="relative">{label}</span>
                {to === '/me' && mine.length > 0 && (
                  <span className="relative ml-auto rounded-full bg-sun-400 px-2 py-0.5 text-[11px] font-extrabold text-slate-900">{mine.length}</span>
                )}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative mt-6">
        <p className="px-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Your tokens</p>
        <div className="mt-2 space-y-2">
          {mine.map((m) => (
            <MiniToken key={m.ticketId} placeId={m.placeId} ticketId={m.ticketId} />
          ))}
          {mine.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/10 px-3 py-3 text-xs leading-relaxed text-slate-500">
              Join a queue and your live token shows up here, on every page.
            </p>
          )}
        </div>
      </div>

      <div className="relative mt-auto space-y-3 pt-6">
        <div className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">City</p>
            <CityPicker compact dark align="right" drop="up" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="text-xl font-extrabold tabular-nums">{here.length}</p>
              <p className="text-[11px] font-semibold text-slate-500">places live</p>
            </div>
            <div>
              <p className="text-xl font-extrabold tabular-nums">{waiting}</p>
              <p className="text-[11px] font-semibold text-slate-500">people waiting</p>
            </div>
          </div>
        </div>
        <Link
          to={`/business/${sampleBranchId()}`}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Sparkles size={16} className="text-sun-300" /> Try the staff console
        </Link>
        {isMember && user ? (
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 ring-1 ring-white/10">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 font-bold">{(user.displayName ?? 'U').slice(0, 1)}</span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{user.displayName ?? 'Business'}</span>
              <span className="block text-xs text-slate-500">Business account</span>
            </span>
            <button onClick={() => logOut()} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-brand-50">
            <LogIn size={16} /> Sign in for business
          </Link>
        )}
      </div>
    </aside>
  );
}
