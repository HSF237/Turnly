import { useState } from 'react';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import CategoryArt from '../components/CategoryArt';
import type { Category } from '../lib/types';

const COLLAGE: Category[] = ['bank', 'barber', 'clinic', 'shop', 'government', 'restaurant'];
import { ErrorNote, Spinner } from '../components/States';
import { sampleBranchId } from '../lib/sim';
import { signInWithGoogle } from '../lib/firebase';
import { useAuth } from '../lib/hooks';
import { useTitle } from '../lib/useTitle';

export default function Login() {
  useTitle('Sign in');
  const { isMember, loading } = useAuth();
  const [params] = useSearchParams();
  const next = params.get('next') || '/business';
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (isMember) return <Navigate to={next} replace />;

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8 xl:min-h-dvh">
      <div className="grid w-full max-w-4xl items-center gap-10 md:grid-cols-2">
      <div className="relative mx-auto grid w-full max-w-sm grid-cols-3 gap-3 md:max-w-none">
        {COLLAGE.map((c, i) => (
          <motion.div
            key={c}
            initial={{ opacity: 0, y: 30, rotate: i % 2 ? 4 : -4 }}
            animate={{ opacity: 1, y: i % 2 ? 18 : 0, rotate: i % 2 ? 2 : -2 }}
            transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 140, damping: 16 }}
            className="overflow-hidden rounded-2xl shadow-soft ring-1 ring-black/5"
          >
            <CategoryArt category={c} className="block aspect-[4/5] h-full w-full" />
          </motion.div>
        ))}
        <div className="absolute -bottom-4 left-0 right-0 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className="whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-lift"
          >
            Every queue in town, in one app
          </motion.div>
        </div>
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto w-full max-w-sm p-8 text-center">
        <Logo size={44} withText={false} />
        <h1 className="mt-4 text-2xl font-extrabold">Welcome to Turnly</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to run queues for your business. Joining a queue never needs an account.</p>
        <button
          className="btn-ghost mt-6 w-full py-3"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await signInWithGoogle();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          {busy ? 'Signing in…' : 'Continue with Google'}
        </button>
        <Link
          to={`/business/${sampleBranchId()}`}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"
        >
          Just looking? Run a sample branch <ArrowRight size={15} />
        </Link>
        {error && (
          <div className="mt-4 text-left">
            <ErrorNote message={error} />
          </div>
        )}
      </motion.div>
      </div>
    </div>
  );
}
