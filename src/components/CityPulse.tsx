import { motion } from 'framer-motion';

/**
 * The "city pulse" illustration: a stylised city where every place glows
 * by how busy it is. Deterministic positions so it renders the same every time.
 */
const SPOTS = Array.from({ length: 34 }, (_, i) => {
  const x = ((i * 73) % 100) * 0.92 + 4;
  const y = ((i * 41 + 17) % 100) * 0.84 + 8;
  const lvl = i % 7 === 0 ? 'packed' : i % 3 === 0 ? 'busy' : 'quiet';
  return { x, y, lvl, delay: (i % 9) * 0.35 };
});

const COLORS: Record<string, string> = { quiet: '#0ea58f', busy: '#fbab30', packed: '#ef4444' };

export default function CityPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-slate-900 ${className}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-30">
        {[12, 30, 52, 74, 90].map((y) => (
          <line key={`h${y}`} x1="0" x2="100" y1={y} y2={y + (y % 3)} stroke="#334155" strokeWidth="0.6" />
        ))}
        {[10, 28, 47, 66, 84].map((x) => (
          <line key={`v${x}`} y1="0" y2="100" x1={x} x2={x + (x % 4)} stroke="#334155" strokeWidth="0.6" />
        ))}
        <path d="M0 64 C 25 58, 40 80, 62 70 S 90 50, 100 56" stroke="#1e3a8a" strokeWidth="3" fill="none" opacity=".6" />
      </svg>
      {SPOTS.map((s, i) => (
        <span key={i} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
          <span
            className="absolute -left-3 -top-3 h-6 w-6 rounded-full animate-pulseRing"
            style={{ background: COLORS[s.lvl], animationDelay: `${s.delay}s`, opacity: 0.5 }}
          />
          <motion.span
            className="absolute -left-1.5 -top-1.5 block h-3 w-3 rounded-full ring-2 ring-slate-900"
            style={{ background: COLORS[s.lvl] }}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: s.delay }}
          />
        </span>
      ))}
      <div className="absolute bottom-4 left-4 flex gap-3 rounded-full bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-200 ring-1 ring-white/10 backdrop-blur">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-brand-500" /> Quiet</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-sun-400" /> Busy</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-500" /> Packed</span>
      </div>
    </div>
  );
}
