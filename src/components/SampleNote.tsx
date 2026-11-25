import { motion } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import { isSim, simSpeed } from '../lib/sim';
import { useSim } from '../lib/hooks';

/** A small, honest note on sample places: what's simulated and why it moves fast. */
export default function SampleNote({ placeId, mode }: { placeId: string; mode: 'join' | 'ticket' }) {
  useSim();
  if (!isSim(placeId)) return null;
  const speed = simSpeed(placeId);
  return (
    <motion.div
      data-sample
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 flex items-start gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-soft ring-1 ring-slate-200 backdrop-blur"
    >
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sun-100 text-sun-700">
        <FlaskConical size={15} />
      </span>
      {mode === 'join' ? (
        <p>
          <b className="text-slate-900">Sample place.</b> Its queue is simulated so you can try Turnly anywhere. Join and it speeds up, so your
          turn comes in a few minutes.
        </p>
      ) : (
        <p>
          <b className="text-slate-900">Sample queue{speed > 1 ? `, running ${speed}× faster` : ''}.</b> Keep this open and watch your token move.
          You'll get the same alerts as a real queue.
        </p>
      )}
    </motion.div>
  );
}
