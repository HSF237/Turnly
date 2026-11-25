import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, Minus, Plus, Users } from 'lucide-react';
import WaitBadge from '../components/WaitBadge';
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
      rememberTicket(place.id, t.id);
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      navigate(`/t/${place.id}/${t.id}`, { replace: true });
    } catch (err) {
      setJoinError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
          <p className="text-sm font-semibold text-brand-100">
            {CATEGORY_META[place.category].emoji} {CATEGORY_META[place.category].label}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">{place.name}</h1>
          {place.address && (
            <p className="mt-1 flex items-center gap-1 text-sm text-brand-100">
              <MapPin size={14} /> {place.address}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="flex items-center gap-1 text-xs text-brand-100"><Users size={12} /> In line now</p>
              <p className="text-3xl font-extrabold">{waiting}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="flex items-center gap-1 text-xs text-brand-100"><Clock size={12} /> Your wait</p>
              <p className="text-3xl font-extrabold">{minutes === null ? '—' : formatMinutes(minutes)}</p>
            </div>
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
