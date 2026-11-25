import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CornerDownLeft, Globe2, Map, Route, Search, Store, Ticket, Users } from 'lucide-react';
import { useCommunity, usePlaces } from '../lib/hooks';
import { communityEstimate } from '../lib/community';
import { formatMinutes, LEVEL_STYLE, placeWaitMinutes, waitLevel } from '../lib/predict';
import { CITIES, getCity, isSim, sampleBranchId, setCity, type CityId } from '../lib/sim';
import { CATEGORY_META } from '../lib/types';

/** Open from anywhere: window.dispatchEvent(new Event('turnly:search')). */
export const openSearch = () => window.dispatchEvent(new Event('turnly:search'));

interface Row {
  id: string;
  group: string;
  title: string;
  sub?: string;
  emoji?: string;
  icon?: typeof Map;
  badge?: { text: string; color: string };
  run: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('turnly:search', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('turnly:search', onOpen);
    };
  }, []);
  return <AnimatePresence>{open && <Palette onClose={() => setOpen(false)} />}</AnimatePresence>;
}

function Palette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { places } = usePlaces();
  const { places: community } = useCommunity();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const go = (to: string) => () => {
    onClose();
    navigate(to);
  };
  const other: CityId = getCity() === 'kl' ? 'kannur' : 'kl';
  const actions: Row[] = [
    { id: 'a-map', group: 'Jump to', title: 'Live map', sub: 'Every wait in the city, colour-coded', icon: Map, run: go('/explore') },
    { id: 'a-plan', group: 'Jump to', title: 'Plan my errands', sub: 'The fastest order for several stops', icon: Route, run: go('/plan') },
    { id: 'a-me', group: 'Jump to', title: 'My tokens', sub: 'Every line you are in', icon: Ticket, run: go('/me') },
    { id: 'a-biz', group: 'Jump to', title: 'Run a sample branch', sub: 'Staff console with live customers', icon: Store, run: go(`/business/${sampleBranchId()}`) },
    {
      id: 'a-city',
      group: 'Jump to',
      title: `Switch sample city to ${CITIES[other].name}`,
      sub: CITIES[other].country,
      icon: Globe2,
      run: () => {
        setCity(other);
        onClose();
      },
    },
  ];

  const rows = useMemo<Row[]>(() => {
    const term = q.trim().toLowerCase();
    const hit = (...s: (string | undefined)[]) => !term || s.some((x) => x?.toLowerCase().includes(term));
    const placeRows: Row[] = places
      .filter((p) => hit(p.name, p.address, CATEGORY_META[p.category].label))
      .map((p) => {
        const min = placeWaitMinutes(p);
        return {
          id: p.id,
          group: term ? 'Places' : 'Shortest waits now',
          title: p.name,
          sub: `${CATEGORY_META[p.category].label}${isSim(p.id) ? ' · sample' : ''}${p.address ? ` · ${p.address}` : ''}`,
          emoji: CATEGORY_META[p.category].emoji,
          badge: { text: p.isOpen ? formatMinutes(min) : 'Closed', color: LEVEL_STYLE[waitLevel(min)].hex },
          run: go(`/q/${p.id}`),
          _min: min ?? 9999,
        } as Row & { _min: number };
      })
      .sort((a, b) => (a as Row & { _min: number })._min - (b as Row & { _min: number })._min)
      .slice(0, term ? 8 : 4);
    const crowd: Row[] = term
      ? community
          .filter((c) => hit(c.name, c.address, CATEGORY_META[c.category].label))
          .slice(0, 4)
          .map((c) => {
            const est = communityEstimate(c.reports ?? []);
            return {
              id: c.id,
              group: 'Reported by people',
              title: c.name,
              sub: `${CATEGORY_META[c.category].label} · crowd reports`,
              emoji: CATEGORY_META[c.category].emoji,
              badge: est ? { text: `~${formatMinutes(est.minutes)}`, color: LEVEL_STYLE[waitLevel(est.minutes)].hex } : undefined,
              run: go(`/explore?c=${c.id}`),
            };
          })
      : [];
    const acts = actions.filter((a) => hit(a.title, a.sub));
    return term ? [...placeRows, ...crowd, ...acts] : [...acts, ...placeRows];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, places, community]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(rows.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      rows[active]?.run();
    }
  };

  let lastGroup = '';
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/40 px-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:pt-[12vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-label="Search Turnly"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="flex max-h-[80dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200"
        onKeyDown={onKey}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search places, or jump to…"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
            aria-activedescendant={rows[active] ? `cmd-${rows[active].id}` : undefined}
          />
          <button onClick={onClose} className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
            Esc
          </button>
        </div>
        <div ref={list} className="min-h-0 flex-1 overflow-y-auto p-2" role="listbox">
          {rows.length === 0 && (
            <div className="grid place-items-center gap-2 py-12 text-center text-sm text-slate-500">
              <Users size={22} className="text-slate-300" />
              Nothing called “{q}” yet. Try a category, like “bank”.
            </div>
          )}
          {rows.map((r, i) => {
            const header = r.group !== lastGroup ? ((lastGroup = r.group), r.group) : null;
            const Icon = r.icon;
            return (
              <div key={r.id}>
                {header && <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">{header}</p>}
                <button
                  id={`cmd-${r.id}`}
                  data-i={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={r.run}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${i === active ? 'bg-brand-50' : ''}`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${i === active ? 'bg-white shadow-soft' : 'bg-slate-100'}`}>
                    {Icon ? <Icon size={18} className="text-brand-700" /> : r.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-slate-900">{r.title}</span>
                    {r.sub && <span className="block truncate text-xs text-slate-500">{r.sub}</span>}
                  </span>
                  {r.badge && (
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold" style={{ background: `${r.badge.color}1f`, color: r.badge.color }}>
                      {r.badge.text}
                    </span>
                  )}
                  {i === active && !r.badge && <ArrowRight size={16} className="shrink-0 text-brand-600" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="hidden items-center gap-4 border-t border-slate-100 px-4 py-2.5 text-[11px] font-semibold text-slate-400 sm:flex">
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-slate-100 px-1.5 py-0.5">↑</kbd>
            <kbd className="rounded bg-slate-100 px-1.5 py-0.5">↓</kbd> to move
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-slate-100 px-1.5 py-0.5">
              <CornerDownLeft size={10} />
            </kbd>{' '}
            to open
          </span>
          <span className="ml-auto">Turnly search</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
