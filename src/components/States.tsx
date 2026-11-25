import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
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
