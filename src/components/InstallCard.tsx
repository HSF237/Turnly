import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Plus, Share, X } from 'lucide-react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KEY = 'turnly:install-dismissed';

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/** "Add Turnly to your home screen" card: native prompt on Android/desktop, steps on iPhone. */
export default function InstallCard() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(() => {
    try {
      return isStandalone() || localStorage.getItem(KEY) === '1';
    } catch {
      return true;
    }
  });
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (hidden || (!evt && !isIOS())) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-brand-900 p-4 pr-9 text-white shadow-lift"
      >
        <motion.img
          src="/apple-touch-icon.png"
          alt=""
          className="h-12 w-12 shrink-0 rounded-2xl shadow-lg"
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3 }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold">Get the Turnly app</p>
          <p className="text-xs text-slate-300 sm:text-sm">One tap from your home screen.</p>
        </div>
        <button
          className="btn shrink-0 bg-white px-3 py-2 text-slate-900 hover:bg-slate-100"
          onClick={async () => {
            if (evt) {
              await evt.prompt();
              const r = await evt.userChoice;
              if (r.outcome === 'accepted') dismiss();
            } else setSteps(true);
          }}
        >
          <Download size={16} /> Install
        </button>
        <button className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:text-white" onClick={dismiss} aria-label="Dismiss">
          <X size={14} />
        </button>
      </motion.div>

      <AnimatePresence>
        {steps && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 p-3 backdrop-blur-sm"
            onClick={() => setSteps(false)}
          >
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="mx-auto w-full max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <img src="/apple-touch-icon.png" alt="" className="mx-auto h-16 w-16 rounded-2xl shadow-lg" />
              <h3 className="mt-4 text-center text-xl font-extrabold">Add Turnly to your iPhone</h3>
              <ol className="mt-5 space-y-3">
                <li className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-500 shadow-soft">
                    <Share size={18} />
                  </span>
                  <span className="text-sm font-semibold">
                    Tap <b>Share</b> at the bottom of Safari
                  </span>
                </li>
                <li className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-700 shadow-soft">
                    <Plus size={18} />
                  </span>
                  <span className="text-sm font-semibold">
                    Choose <b>Add to Home Screen</b>
                  </span>
                </li>
              </ol>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="mt-4 text-center text-2xl">
                ↓
              </motion.div>
              <button className="btn-dark mt-2 w-full" onClick={() => setSteps(false)}>
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
