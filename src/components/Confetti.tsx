import { motion } from 'framer-motion';

const COLORS = ['#0ea58f', '#27c1a8', '#fbab30', '#f58a0b', '#ffffff', '#94ecd9'];

/** A one-shot confetti burst. Mount it to fire; deterministic so it renders the same each time. */
export default function Confetti({ count = 42 }: { count?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 160 + ((i * 37) % 140);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist - 80;
        const size = 6 + (i % 4) * 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 block"
            style={{
              width: size,
              height: i % 3 === 0 ? size : size * 0.45,
              background: COLORS[i % COLORS.length],
              borderRadius: i % 3 === 0 ? 999 : 2,
            }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
            animate={{ x, y: [y, y + 320], opacity: [1, 1, 0], rotate: (i % 2 ? 1 : -1) * (180 + i * 12), scale: 1 }}
            transition={{ duration: 1.8, ease: [0.15, 0.6, 0.4, 1], times: [0, 0.7, 1] }}
          />
        );
      })}
    </div>
  );
}
