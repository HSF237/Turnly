import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownUp, Bell, CalendarClock, Footprints, Languages, MapPinned, Monitor, Route, User, Users } from 'lucide-react';
import SplitFlap from './SplitFlap';

function useCycle(n: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => clearInterval(id);
  }, [n, ms]);
  return i;
}

function Tile({
  icon: Icon,
  title,
  text,
  children,
  className = '',
  dark = false,
  delay = 0,
}: {
  icon: typeof MapPinned;
  title: string;
  text: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ y: -6 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
      }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl p-6 ring-1 transition-shadow hover:shadow-lift ${
        dark ? 'bg-slate-950 text-white ring-white/10' : 'bg-white ring-slate-200/70 shadow-soft'
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 [background:radial-gradient(420px_circle_at_var(--x)_var(--y),rgba(14,165,143,.16),transparent_45%)]" />
      <div className="relative mb-5 min-h-[7.5rem] flex-1">{children}</div>
      <div className="relative">
        <span className={`inline-grid h-9 w-9 place-items-center rounded-xl ${dark ? 'bg-white/10 text-brand-300' : 'bg-brand-50 text-brand-600'}`}>
          <Icon size={18} />
        </span>
        <h3 className="mt-3 text-lg font-extrabold">{title}</h3>
        <p className={`mt-1 text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{text}</p>
      </div>
    </motion.div>
  );
}

/* ── Mini illustrations ── */

const PINS = [
  { x: 18, y: 30, m: 4, c: '#0ea58f' },
  { x: 62, y: 22, m: 18, c: '#fbab30' },
  { x: 40, y: 58, m: 7, c: '#0ea58f' },
  { x: 78, y: 62, m: 42, c: '#ef4444' },
  { x: 26, y: 76, m: 12, c: '#fbab30' },
  { x: 86, y: 34, m: 3, c: '#0ea58f' },
  { x: 54, y: 84, m: 9, c: '#0ea58f' },
  { x: 10, y: 52, m: 26, c: '#fbab30' },
];

function MapMini() {
  const tick = useCycle(1000, 2600);
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[#e8f3ef]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d="M0 40 C 30 35, 50 60, 100 48" stroke="white" strokeWidth="4" fill="none" />
        <path d="M30 0 C 35 40, 25 70, 40 100" stroke="white" strokeWidth="3" fill="none" />
        <path d="M70 0 L 66 100" stroke="white" strokeWidth="2.5" fill="none" />
        <path d="M0 80 C 40 70, 60 90, 100 78" stroke="#bfe3f5" strokeWidth="6" fill="none" />
      </svg>
      {PINS.map((p, i) => (
        <motion.div
          key={`${i}-${tick}`}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          initial={{ y: -40, opacity: 0, scale: 0.6 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.18, type: 'spring', stiffness: 320, damping: 14 }}
        >
          <div className="-translate-x-1/2 -translate-y-full">
            <div className="whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold shadow-soft" style={{ border: `2px solid ${p.c}` }}>
              {p.m} min
            </div>
            <div className="mx-auto h-2 w-0.5" style={{ background: p.c }} />
          </div>
        </motion.div>
      ))}
      <span className="absolute left-[48%] top-[42%] h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-500/25" />
    </div>
  );
}

function LeaveMini() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <svg viewBox="0 0 220 90" className="w-full max-w-[260px]">
        <path id="walk" d="M10 70 C 60 70, 70 20, 120 30 S 190 60, 205 30" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="5 6" fill="none" />
        <rect x="196" y="12" width="20" height="24" rx="4" fill="#0a8576" />
        <circle cx="200" cy="25" r="1.6" fill="white" />
        <circle r="7" fill="#fbab30" stroke="white" strokeWidth="3">
          <animateMotion dur="3.4s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear" path="M10 70 C 60 70, 70 20, 120 30 S 190 60, 205 30" />
        </circle>
      </svg>
      <span className="absolute left-2 top-1 rounded-full bg-sun-50 px-2.5 py-1 text-[11px] font-extrabold text-sun-600 ring-1 ring-sun-100">Leave in 4 min</span>
    </div>
  );
}

function RouteMini() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <svg viewBox="0 0 200 100" className="w-full max-w-[240px]">
        <motion.path
          d="M20 80 C 50 20, 90 90, 110 45 S 170 20, 180 30"
          stroke="#0a8576"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          pathLength={1}
          strokeDasharray="1"
          initial={{ strokeDashoffset: 1 }}
          whileInView={{ strokeDashoffset: [1, 0, 0] }}
          transition={{ duration: 3, repeat: Infinity, times: [0, 0.6, 1] }}
        />
        {[
          [20, 80, '1'],
          [110, 45, '2'],
          [180, 30, '3'],
        ].map(([x, y, n], i) => (
          <motion.g key={i} animate={{ scale: [1, 1.25, 1] }} transition={{ delay: i * 0.6, duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx={x} cy={y} r="11" fill={i === 2 ? '#fbab30' : '#0f172a'} />
            <text x={x as number} y={(y as number) + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="white">
              {n}
            </text>
          </motion.g>
        ))}
      </svg>
      <span className="absolute bottom-0 right-0 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-extrabold text-white">5,040 routes tested</span>
    </div>
  );
}

function SwapMini() {
  const flip = useCycle(2, 1800) === 1;
  const items = flip ? [24, 31] : [31, 24];
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex items-center gap-4">
        {items.map((n) => (
          <motion.div
            key={n}
            layout
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className={`grid h-16 w-16 place-items-center rounded-2xl text-2xl font-extrabold ${n === 31 ? 'bg-sun-400 text-slate-900' : 'bg-slate-100 text-slate-700'}`}
          >
            {n}
          </motion.div>
        ))}
      </div>
      <motion.span animate={{ rotate: flip ? 180 : 0 }} className="absolute grid h-8 w-8 place-items-center rounded-full bg-white text-brand-600 shadow-soft ring-1 ring-slate-200">
        <ArrowDownUp size={14} />
      </motion.span>
    </div>
  );
}

function TvMini() {
  const n = useCycle(1000, 2200) + 41;
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="rounded-2xl bg-slate-900 p-4 text-center ring-1 ring-white/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Counter 2</p>
        <SplitFlap value={n % 100} digits={2} tone="dark" className="mt-1 text-5xl" />
        <motion.p key={n} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.8 }} className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold text-brand-300">
          <Bell size={11} /> “Token {n % 100}, counter 2”
        </motion.p>
      </div>
    </div>
  );
}

const SAYINGS = [
  'Token 42, please come to counter 2.',
  'Nombor 42, sila ke kaunter 2.',
  'ടോക്കൺ 42, കൗണ്ടർ 2-ലേക്ക് വരിക.',
  'டோக்கன் 42, கவுண்டர் 2-க்கு வாருங்கள்.',
  'टोकन 42, कृपया काउंटर 2 पर आइए।',
  'الرقم 42، يرجى التوجه إلى الشباك 2.',
];

function LangMini() {
  const i = useCycle(SAYINGS.length, 1700);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative w-full max-w-[260px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl rounded-bl-sm bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-soft"
          >
            {SAYINGS[i]}
          </motion.div>
        </AnimatePresence>
        <div className="mt-2 flex items-end gap-0.5 pl-1">
          {Array.from({ length: 18 }, (_, k) => (
            <motion.span key={k} className="w-1 rounded-full bg-brand-300" animate={{ height: [4, 6 + ((k * 7) % 16), 4] }} transition={{ duration: 0.8, repeat: Infinity, delay: k * 0.05 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FamilyMini() {
  const merged = useCycle(2, 1700) === 1;
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative h-20 w-48">
        {[0, 1, 2, 3].map((k) => (
          <motion.span
            key={k}
            className="absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-slate-500 ring-2 ring-white"
            animate={{ left: merged ? '38%' : `${k * 26}%`, opacity: merged ? 0 : 1, scale: merged ? 0.5 : 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            <User size={18} />
          </motion.span>
        ))}
        <motion.span
          className="absolute left-[30%] top-1/2 grid h-16 w-16 -translate-y-1/2 place-items-center rounded-2xl bg-sun-400 text-xl font-extrabold text-slate-900"
          animate={{ scale: merged ? 1 : 0, rotate: merged ? 0 : -30 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        >
          A7
        </motion.span>
      </div>
    </div>
  );
}

const BARS = [3, 5, 9, 14, 11, 6, 4, 7, 12, 15, 10, 5];
function BestTimeMini() {
  return (
    <div className="absolute inset-0 flex items-end gap-1.5 px-1 pb-4">
      {BARS.map((b, k) => (
        <motion.span
          key={k}
          className={`flex-1 rounded-t-md ${k === 5 ? 'bg-brand-500' : 'bg-brand-200'}`}
          initial={{ height: 0 }}
          whileInView={{ height: `${(b / 15) * 100}%` }}
          viewport={{ once: true }}
          transition={{ delay: k * 0.05, type: 'spring', stiffness: 120, damping: 14 }}
        />
      ))}
      <span className="absolute left-[38%] top-0 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">Quiet at 2 pm</span>
    </div>
  );
}

export default function BentoFeatures() {
  return (
    <div className="grid auto-rows-[minmax(17rem,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tile icon={MapPinned} title="Live wait map" text="Every bank, barber, office and shop near you, with the real wait right now." className="sm:col-span-2 lg:row-span-2" delay={0}>
        <MapMini />
      </Tile>
      <Tile icon={Footprints} title="Leave home now" text="Your travel time matched to the queue speed. Walk in right on time." delay={0.05}>
        <LeaveMini />
      </Tile>
      <Tile icon={Route} title="Plan my errands" text="Every possible order tested. Travel and waiting overlap." delay={0.1}>
        <RouteMini />
      </Tile>
      <Tile icon={ArrowDownUp} title="Swap my spot" text="In a hurry? Trade places. Kindness earns you a priority skip." delay={0.05}>
        <SwapMini />
      </Tile>
      <Tile icon={Monitor} title="TV mode" text="Any screen becomes a flip-board that announces calls out loud." dark delay={0.1}>
        <TvMini />
      </Tile>
      <Tile icon={Languages} title="Speaks your language" text="English, Malay, Malayalam, Tamil, Hindi and Arabic." className="sm:col-span-2" delay={0.05}>
        <LangMini />
      </Tile>
      <Tile icon={Users} title="Family token" text="The whole family joins as one token, not five." delay={0.1}>
        <FamilyMini />
      </Tile>
      <Tile icon={CalendarClock} title="Best time to come" text="Each place learns its quiet hours from its own history." delay={0.15}>
        <BestTimeMini />
      </Tile>
    </div>
  );
}
