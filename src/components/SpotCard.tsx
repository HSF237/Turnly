import type { ReactNode } from 'react';

/** A card with a soft light that follows the cursor. */
export default function SpotCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`spot-card group relative overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift ${className}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 [background:radial-gradient(360px_circle_at_var(--x)_var(--y),rgba(14,165,143,.13),transparent_45%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}
