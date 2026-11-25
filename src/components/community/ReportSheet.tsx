import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin, Users } from 'lucide-react';
import Sheet from './Sheet';
import Confetti from '../Confetti';
import { ErrorNote } from '../States';
import { ensureGuest } from '../../lib/firebase';
import { useGeolocation } from '../../lib/hooks';
import { canReport, markReported, reportWait } from '../../lib/community';
import { distanceM } from '../../lib/time';
import type { CommunityPlace } from '../../lib/types';

export const PRESETS = [0, 5, 10, 15, 20, 30, 45, 60, 90];
const ON_SITE_M = 300;

/** "How long is the wait right now?" — one tap, location-checked. */
export default function ReportSheet({ place, onClose }: { place: CommunityPlace; onClose: () => void }) {
  const geo = useGeolocation();
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowed = canReport(place.id);

  useEffect(() => {
    geo.request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dist = geo.pos ? distanceM(geo.pos, place) : null;
  const onSite = dist !== null && dist <= ON_SITE_M;

  const send = async () => {
    if (pick === null) return;
    setBusy(true);
    setError(null);
    try {
      await ensureGuest();
      await reportWait(place.id, pick, onSite);
      markReported(place.id);
      setDone(true);
      setTimeout(onClose, 1800);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Sheet title={done ? 'Thank you! 💚' : 'How long is the wait right now?'} onClose={onClose}>
      {done ? (
        <div className="py-6 text-center">
          <Confetti count={30} />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-600 text-white">
            <Check size={30} />
          </motion.div>
          <p className="mt-4 font-bold">Your report is live on the map.</p>
          <p className="text-sm text-slate-500">You just saved someone a wasted trip.</p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-500">{place.name}</p>
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
              onSite ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-500'
            }`}
          >
            <MapPin size={16} />
            {geo.pos === null
              ? geo.error
                ? 'Location off. Your report still counts, just a little less.'
                : 'Checking you’re here…'
              : onSite
                ? 'You’re here ✓ Your report counts 1.5×'
                : `You're ${dist! < 1000 ? `${Math.round(dist!)} m` : `${(dist! / 1000).toFixed(1)} km`} away, so it counts a little less`}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {PRESETS.map((m) => (
              <motion.button
                key={m}
                whileTap={{ scale: 0.94 }}
                onClick={() => setPick(m)}
                className={`rounded-2xl py-4 text-center font-extrabold ring-1 transition ${
                  pick === m ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-800 ring-slate-200 hover:ring-slate-300'
                }`}
              >
                {m === 0 ? 'No wait' : m === 90 ? '90+ min' : `${m} min`}
              </motion.button>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Users size={12} /> Turnly blends recent reports with a weighted median, so one wrong guess can't skew it.
          </p>
          {!allowed && <p className="mt-2 text-xs font-semibold text-sun-600">You reported here a few minutes ago. Thanks! Try again in a bit.</p>}
          {error && <div className="mt-3"><ErrorNote message={error} /></div>}
          <button className="btn-primary mt-5 w-full py-3.5 text-base" disabled={pick === null || busy || !allowed} onClick={send}>
            {busy ? 'Sending…' : 'Share the wait'}
          </button>
        </>
      )}
    </Sheet>
  );
}
