import { AnimatePresence, motion } from 'framer-motion';

/**
 * Airport-departure-board style digits. Each digit flips down when it changes.
 */
function Flap({ ch, tone }: { ch: string; tone: 'dark' | 'light' | 'brand' }) {
  const face =
    tone === 'dark'
      ? 'bg-slate-800 text-white ring-white/10'
      : tone === 'brand'
        ? 'bg-white/12 text-white ring-white/15'
        : 'bg-white text-slate-900 ring-slate-200';
  return (
    <span className={`relative inline-grid h-[1.25em] w-[0.78em] place-items-center overflow-hidden rounded-[0.12em] ring-1 ${face}`} style={{ perspective: 400 }}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={ch}
          initial={{ rotateX: 90, opacity: 0.2 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: -90, opacity: 0.2 }}
          transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformOrigin: '50% 50%', backfaceVisibility: 'hidden' }}
          className="leading-none"
        >
          {ch}
        </motion.span>
      </AnimatePresence>
      {/* The hinge line */}
      <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/25" />
    </span>
  );
}

export default function SplitFlap({
  value,
  digits = 2,
  tone = 'light',
  className = '',
}: {
  value: number | string;
  digits?: number;
  tone?: 'dark' | 'light' | 'brand';
  className?: string;
}) {
  const str = String(value).padStart(digits, ' ');
  return (
    <span className={`inline-flex gap-[0.06em] font-extrabold tabular-nums ${className}`} aria-label={String(value)}>
      {str.split('').map((ch, i) => (
        <Flap key={i} ch={ch === ' ' ? ' ' : ch} tone={tone} />
      ))}
    </span>
  );
}
