import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BellRing, Clock, Footprints, MapPin, Minus, Plus, Ticket, Timer, User, Users } from 'lucide-react';
import Aurora from '../components/Aurora';
import CategoryArt from '../components/CategoryArt';
import WaitBadge from '../components/WaitBadge';
import PrintTicket from '../components/PrintTicket';
import BestTime from '../components/BestTime';
import SampleNote from '../components/SampleNote';
import { isOnTime, onTimeRate } from '../lib/speed';
import { Empty, ErrorNote, Spinner } from '../components/States';
import { ensureGuest } from '../lib/firebase';
import { usePlace } from '../lib/hooks';
import { formatMinutes, placeWaitMinutes } from '../lib/predict';
import { joinQueue, rememberedTicket, rememberTicket } from '../lib/queue';
import { clock, todayKey } from '../lib/time';
import { CATEGORY_META } from '../lib/types';
import { useTitle } from '../lib/useTitle';
import { isSim } from '../lib/sim';

const NAME_KEY = 'turnly:name';

export default function Join() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const { place, loading, error } = usePlace(placeId);
  useTitle(place ? place.name : null);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '');
  const [party, setParty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [printed, setPrinted] = useState<{ id: string; number: number } | null>(null);

  // Already holding a ticket here today? Go straight to it.
  useEffect(() => {
    if (!placeId) return;
    const existing = rememberedTicket(placeId);
    if (existing) navigate(`/t/${placeId}/${existing}`, { replace: true });
  }, [placeId, navigate]);

  if (loading) return <Spinner />;
  if (error) return <div className="container-x py-10"><ErrorNote message={error} /></div>;
  if (!place) return <Empty title="This queue doesn't exist">The QR code or link may be old.</Empty>;

  const minutes = placeWaitMinutes(place);
  const waiting = place.dayKey === todayKey() ? place.waiting : 0;

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setJoinError(null);
    try {
      // Sample queues work even if sign-in is unavailable (offline, blocked cookies).
      const uid = isSim(place.id) ? await ensureGuest().then((u) => u.uid).catch(() => 'guest') : (await ensureGuest()).uid;
      localStorage.setItem(NAME_KEY, name);
      const t = await joinQueue(place.id, { name: name || 'Guest', partySize: party, uid });
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      setPrinted(t);
      setTimeout(() => {
        rememberTicket(place.id, t.id);
        navigate(`/t/${place.id}/${t.id}`, { replace: true });
      }, 2600);
    } catch (err) {
      setJoinError((err as Error).message);
      setBusy(false);
    }
  };

  const tokenNext = (place.dayKey === todayKey() ? place.lastTicket : 0) + 1;
  const calledAround = minutes === null ? null : clock(Date.now() + minutes * 60000);

  return (
    <div className="relative isolate mx-auto max-w-md px-4 py-8 lg:max-w-6xl lg:px-8 lg:py-10">
      <Aurora />
      {printed && <PrintTicket number={printed.number} placeName={place.name} name={name || 'Guest'} />}
      <SampleNote placeId={place.id} mode="join" />
      {/* Phones: one card (place on top, form below). Laptops: place on the left, form on the right. */}
      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-x-8 lg:gap-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative isolate overflow-hidden rounded-t-3xl bg-slate-900 p-6 pt-28 text-white shadow-soft lg:col-start-1 lg:row-start-1 lg:rounded-[2rem] lg:p-10 lg:pt-56"
        >
          <div className="absolute inset-0 -z-10">
            <CategoryArt category={place.category} className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/60 to-slate-950/95" />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-white/15 text-white ring-white/20 backdrop-blur">
              {CATEGORY_META[place.category].emoji} {CATEGORY_META[place.category].label}
            </span>
            {isOnTime(place) && (
              <span className="chip bg-brand-500/90 text-white ring-brand-300/40" title="Serves people within the time Turnly predicts">
                ✓ On time {onTimeRate(place)}%
              </span>
            )}
            <span className="chip hidden bg-white/15 text-white ring-white/20 backdrop-blur lg:inline-flex">
              {place.counters} {place.counters === 1 ? 'counter' : 'counters'} open
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight lg:mt-4 lg:text-6xl lg:tracking-tight">{place.name}</h1>
          {place.address && (
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-300 lg:mt-2 lg:text-base">
              <MapPin size={14} /> {place.address}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3 lg:mt-8 lg:grid-cols-3 lg:gap-4">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur lg:p-5">
              <p className="flex items-center gap-1 text-xs text-slate-300 lg:text-sm"><Users size={12} /> In line now</p>
              <p className="whitespace-nowrap text-3xl font-extrabold lg:text-4xl 2xl:text-5xl">{waiting}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur lg:p-5">
              <p className="flex items-center gap-1 text-xs text-slate-300 lg:text-sm"><Clock size={12} /> Your wait</p>
              <p className="whitespace-nowrap text-3xl font-extrabold lg:text-4xl 2xl:text-5xl">{minutes === null ? '—' : formatMinutes(minutes)}</p>
            </div>
            <div className="hidden rounded-2xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur lg:block">
              <p className="flex items-center gap-1 text-sm text-slate-300"><Timer size={12} /> Each person</p>
              <p className="whitespace-nowrap text-4xl font-extrabold 2xl:text-5xl">~{Math.max(1, Math.round(place.avgServiceSec / 60))} min</p>
            </div>
          </div>
          {/* The line, visualised */}
          <div className="mt-4 flex items-center gap-1.5 lg:mt-6 lg:gap-2">
            {Array.from({ length: Math.min(waiting, 12) }, (_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className={`h-7 w-7 place-items-center rounded-full bg-white/15 lg:h-10 lg:w-10 ${i >= 9 ? 'hidden lg:grid' : 'grid'}`}
              >
                <User size={14} />
              </motion.span>
            ))}
            {waiting > 9 && <span className="text-xs font-bold text-slate-300 lg:hidden">+{waiting - 9}</span>}
            {waiting > 12 && <span className="hidden text-sm font-bold text-slate-300 lg:inline">+{waiting - 12}</span>}
            <motion.span
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: [1, 1.15, 1] }}
              transition={{ delay: 0.9, scale: { repeat: Infinity, duration: 1.6 } }}
              className="grid h-7 w-7 place-items-center rounded-full bg-sun-400 text-[10px] font-extrabold text-slate-900 lg:h-10 lg:w-10 lg:text-xs"
            >
              You
            </motion.span>
          </div>
        </motion.div>

        {/* Join form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="overflow-hidden rounded-b-3xl bg-white shadow-soft ring-1 ring-slate-200/70 lg:sticky lg:top-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:rounded-[2rem]"
        >
          <div className="hidden border-b border-slate-100 px-8 pb-6 pt-8 lg:block">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Get your token</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">Skip the line here</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">You'll be token</p>
                <p className="text-3xl font-extrabold tabular-nums">{tokenNext}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Called around</p>
                <p className="text-3xl font-extrabold tabular-nums">{place.isOpen ? (calledAround ?? '—') : '—'}</p>
              </div>
            </div>
          </div>
          {place.isOpen ? (
            <form onSubmit={join} className="space-y-4 p-6 lg:p-8">
              <div>
                <label className="label" htmlFor="name">Your name</label>
                <input id="name" className="input py-3 text-base" placeholder="So staff can greet you" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div>
                <span className="label">How many of you?</span>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2">
                  <button type="button" className="btn-ghost h-11 w-11 p-0" onClick={() => setParty(Math.max(1, party - 1))}>
                    <Minus size={18} />
                  </button>
                  <span className="text-lg font-bold">
                    {party} {party === 1 ? 'person' : 'people'}
                    {party > 1 && <span className="ml-2 text-xs font-semibold text-sun-600">family token</span>}
                  </span>
                  <button type="button" className="btn-ghost h-11 w-11 p-0" onClick={() => setParty(Math.min(12, party + 1))}>
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              {joinError && <ErrorNote message={joinError} />}
              <button className="btn-primary w-full py-4 text-lg" disabled={busy}>
                {busy ? 'Getting your token…' : 'Join the queue'}
              </button>
              <p className="text-center text-xs text-slate-400">No app or account needed. Leave any time.</p>
            </form>
          ) : (
            <div className="p-6 text-center lg:p-8">
              <WaitBadge minutes={null} size="lg" />
              <p className="mt-3 text-sm text-slate-500">This queue is closed right now. Check back later.</p>
              <Link to="/explore" className="btn-ghost mt-4">Find another place</Link>
            </div>
          )}
        </motion.div>

        <div className="mt-4 space-y-6 lg:col-start-1 lg:row-start-2 lg:mt-0">
          <BestTime place={place} />
          {/* How it works, for anyone joining from a laptop */}
          <div className="hidden grid-cols-3 gap-4 lg:grid">
            {[
              { icon: Ticket, t: 'Join in seconds', d: 'Your token is saved on this device. No app, no account.' },
              { icon: Footprints, t: 'Go anywhere', d: 'Watch your place count down live while you get on with your day.' },
              { icon: BellRing, t: "We'll call you", d: 'An alert and a sound when it is your turn, with your counter number.' },
            ].map(({ icon: Icon, t, d }, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-slate-200/70"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon size={18} />
                </span>
                <p className="mt-3 font-extrabold">{t}</p>
                <p className="mt-1 text-sm text-slate-500">{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
