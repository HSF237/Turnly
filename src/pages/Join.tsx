import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, Minus, Plus, User, Users } from 'lucide-react';
import Aurora from '../components/Aurora';
import CategoryArt from '../components/CategoryArt';
import WaitBadge from '../components/WaitBadge';
import PrintTicket from '../components/PrintTicket';
import { Empty, ErrorNote, Spinner } from '../components/States';
import { ensureGuest } from '../lib/firebase';
import { usePlace } from '../lib/hooks';
import { formatMinutes, placeWaitMinutes } from '../lib/predict';
import { joinQueue, rememberedTicket, rememberTicket } from '../lib/queue';
import { todayKey } from '../lib/time';
import { CATEGORY_META } from '../lib/types';

const NAME_KEY = 'turnly:name';

export default function Join() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const { place, loading, error } = usePlace(placeId);
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
      const user = await ensureGuest();
      localStorage.setItem(NAME_KEY, name);
      const t = await joinQueue(place.id, { name: name || 'Guest', partySize: party, uid: user.uid });
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

  return (
    <div className="relative isolate mx-auto max-w-md px-4 py-8">
      <Aurora />
      {printed && <PrintTicket number={printed.number} placeName={place.name} name={name || 'Guest'} />}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
        <div className="relative isolate overflow-hidden bg-slate-900 p-6 pt-28 text-white">
          <div className="absolute inset-0 -z-10">
            <CategoryArt category={place.category} className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/60 to-slate-950/95" />
          </div>
          <span className="chip bg-white/15 text-white ring-white/20 backdrop-blur">
            {CATEGORY_META[place.category].emoji} {CATEGORY_META[place.category].label}
          </span>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight">{place.name}</h1>
          {place.address && (
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-300">
              <MapPin size={14} /> {place.address}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur">
              <p className="flex items-center gap-1 text-xs text-slate-300"><Users size={12} /> In line now</p>
              <p className="text-3xl font-extrabold">{waiting}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur">
              <p className="flex items-center gap-1 text-xs text-slate-300"><Clock size={12} /> Your wait</p>
              <p className="text-3xl font-extrabold">{minutes === null ? '—' : formatMinutes(minutes)}</p>
            </div>
          </div>
          {/* The line, visualised */}
          <div className="mt-4 flex items-center gap-1.5">
            {Array.from({ length: Math.min(waiting, 9) }, (_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/15"
              >
                <User size={14} />
              </motion.span>
            ))}
            {waiting > 9 && <span className="text-xs font-bold text-slate-300">+{waiting - 9}</span>}
            <motion.span
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: [1, 1.15, 1] }}
              transition={{ delay: 0.9, scale: { repeat: Infinity, duration: 1.6 } }}
              className="grid h-7 w-7 place-items-center rounded-full bg-sun-400 text-[10px] font-extrabold text-slate-900"
            >
              You
            </motion.span>
          </div>
        </div>

        {place.isOpen ? (
          <form onSubmit={join} className="space-y-4 p-6">
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
          <div className="p-6 text-center">
            <WaitBadge minutes={null} size="lg" />
            <p className="mt-3 text-sm text-slate-500">This queue is closed right now. Check back later.</p>
            <Link to="/explore" className="btn-ghost mt-4">Find another place</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
