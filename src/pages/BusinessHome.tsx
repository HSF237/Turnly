import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Plus } from 'lucide-react';
import WaitBadge from '../components/WaitBadge';
import { Spinner } from '../components/States';
import { useAuth, useMyPlaces } from '../lib/hooks';
import { placeWaitMinutes } from '../lib/predict';
import { todayKey } from '../lib/time';
import { CATEGORY_META } from '../lib/types';

export default function BusinessHome() {
  const { user, isMember, loading } = useAuth();
  const { places, loading: loadingPlaces } = useMyPlaces(isMember ? user?.uid : undefined);
  const today = todayKey();

  if (loading) return <Spinner />;
  if (!isMember) return <Navigate to="/login?next=/business" replace />;

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-600">Hi {user?.displayName?.split(' ')[0] || 'there'} 👋</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Your queues</h1>
        </div>
        <Link to="/business/new" className="btn-primary">
          <Plus size={18} /> New queue
        </Link>
      </div>

      {loadingPlaces ? (
        <Spinner label="Loading your places…" />
      ) : places.length === 0 ? (
        <div className="card mt-8 grid place-items-center p-12 text-center">
          <span className="text-5xl">🎟️</span>
          <h2 className="mt-4 text-xl font-bold">Create your first queue</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            It takes two minutes. You'll get a QR code for the door, a counter screen for staff and a TV board.
          </p>
          <Link to="/business/new" className="btn-primary mt-6">
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/business/${p.id}`} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-xl">{CATEGORY_META[p.category].emoji}</span>
                  <WaitBadge minutes={placeWaitMinutes(p)} />
                </div>
                <h3 className="mt-4 text-lg font-bold">{p.name}</h3>
                <p className="truncate text-sm text-slate-500">{p.address}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 p-2">
                    <p className="text-xl font-extrabold">{p.dayKey === today ? p.waiting : 0}</p>
                    <p className="text-[11px] font-semibold text-slate-500">waiting</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    <p className="text-xl font-extrabold">{p.dayKey === today ? p.servedToday : 0}</p>
                    <p className="text-[11px] font-semibold text-slate-500">served today</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
