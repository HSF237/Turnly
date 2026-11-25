import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

/** Branded loader: the logo breathes while a token ring orbits it. */
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <div className="flex flex-col items-center gap-4 text-slate-500">
        <div className="relative h-16 w-16">
          <span className="absolute inset-0 animate-spin rounded-full [animation-duration:1.4s] [background:conic-gradient(from_0deg,transparent_0deg,#27c1a8_120deg,#fbab30_200deg,transparent_240deg)] [mask:radial-gradient(farthest-side,transparent_calc(100%-4px),black_calc(100%-3px))]" />
          <svg viewBox="0 0 64 64" className="absolute inset-2.5 animate-pulse">
            <rect width="64" height="64" rx="16" fill="#0a8576" />
            <path d="M20 22h24M32 22v24" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
            <circle cx="46" cy="44" r="6" fill="#fbab30" />
          </svg>
        </div>
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-xl bg-[linear-gradient(90deg,#f1f5f9_0%,#e2e8f0_50%,#f1f5f9_100%)] bg-[length:200%_100%] ${className}`}
    />
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid min-h-[50vh] place-items-center px-4">
      <div className="max-w-sm text-center">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
        <div className="mt-5">{action ?? <Link to="/" className="btn-ghost">Go home</Link>}</div>
      </div>
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  const hint = /permission|insufficient/i.test(message)
    ? ' Check that Firestore rules from firestore.rules are published.'
    : /admin-restricted|operation-not-allowed/i.test(message)
      ? ' Turn on this sign-in method in Firebase → Authentication → Sign-in method.'
      : '';
  return (
    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
      {message}
      {hint}
    </div>
  );
}
