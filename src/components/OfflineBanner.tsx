import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

/** Tells you when the connection drops, and when it's back. Your token is never lost. */
export default function OfflineBanner() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [back, setBack] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const up = () => {
      setOnline(true);
      setBack(true);
      clearTimeout(t);
      t = setTimeout(() => setBack(false), 2500);
    };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      clearTimeout(t);
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  const show = !online || back;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[80] flex justify-center px-4"
        >
          <span
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-lift ${online ? 'bg-brand-600 text-white' : 'bg-slate-900 text-white'}`}
          >
            {online ? <Wifi size={15} /> : <WifiOff size={15} />}
            {online ? 'Back online' : "You're offline. Your token is saved, we'll catch up."}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
