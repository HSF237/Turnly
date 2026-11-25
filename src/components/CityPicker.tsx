import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { CITIES, getCity, samplesOn, setCity, setSamplesOn, type CityId } from '../lib/sim';
import { useSim } from '../lib/hooks';

/** Pick which sample city fills the map, or switch sample places off. */
export default function CityPicker({
  compact = false,
  dark = false,
  align = 'right',
  drop = 'down',
}: {
  compact?: boolean;
  dark?: boolean;
  align?: 'left' | 'right';
  drop?: 'up' | 'down';
}) {
  useSim();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const city = CITIES[getCity()];
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-full items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-sm font-bold ring-1 transition ${
          dark ? 'bg-white/10 text-white ring-white/15 hover:bg-white/15' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
        } ${compact ? 'py-2' : 'py-2.5'}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe2 size={15} className={dark ? 'text-brand-300' : 'text-brand-600'} />
        {compact ? (city.id === 'kl' ? 'KL' : city.name) : city.name}
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: drop === 'up' ? 6 : -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: drop === 'up' ? 6 : -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className={`absolute z-50 w-60 overflow-hidden rounded-2xl bg-white p-1.5 text-slate-800 shadow-lift ring-1 ring-slate-200 ${drop === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Sample city</p>
            {(Object.keys(CITIES) as CityId[]).map((id) => (
              <button
                key={id}
                role="menuitemradio"
                aria-checked={city.id === id}
                onClick={() => {
                  setCity(id);
                  if (!samplesOn()) setSamplesOn(true);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-slate-50"
              >
                <span>
                  {CITIES[id].name}
                  <span className="ml-1.5 font-normal text-slate-400">{CITIES[id].country}</span>
                </span>
                {city.id === id && samplesOn() && <Check size={16} className="text-brand-600" />}
              </button>
            ))}
            <div className="my-1 h-px bg-slate-100" />
            <button
              role="menuitemcheckbox"
              aria-checked={samplesOn()}
              onClick={() => setSamplesOn(!samplesOn())}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-slate-50"
            >
              Show sample places
              <span className={`relative h-5 w-9 rounded-full transition ${samplesOn() ? 'bg-brand-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${samplesOn() ? 'left-[1.125rem]' : 'left-0.5'}`} />
              </span>
            </button>
            <p className="px-3 pb-2 pt-1 text-xs leading-relaxed text-slate-400">Sample places are simulated so Turnly is easy to try anywhere. Real places always show.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
