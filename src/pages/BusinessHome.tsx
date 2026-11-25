import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, Monitor, Plus, Store, Users } from 'lucide-react';
import Aurora from '../components/Aurora';
import CountUp from '../components/CountUp';
import CategoryArt from '../components/CategoryArt';
import WaitBadge from '../components/WaitBadge';
import { Skeleton, Spinner } from '../components/States';
import { sampleBranchId } from '../lib/sim';
import { usePlace, useAuth, useMyPlaces, useMySchoolEvents } from '../lib/hooks';
import { placeWaitMinutes } from '../lib/predict';
import { todayKey } from '../lib/time';
import { CATEGORY_META } from '../lib/types';
import { useTitle } from '../lib/useTitle';

export default function BusinessHome() {
  useTitle('Your queues');
  const { user, isMember, loading } = useAuth();
  const { places, loading: loadingPlaces } = useMyPlaces(isMember ? user?.uid : undefined);
  const events = useMySchoolEvents(isMember ? user?.uid : undefined);
  const today = todayKey();

  if (loading) return <Spinner />;
  if (!isMember) return <Navigate to="/login?next=/business" replace />;

  const waiting = places.reduce((s, p) => s + (p.dayKey === today ? p.waiting : 0), 0);
  const served = places.reduce((s, p) => s + (p.dayKey === today ? p.servedToday : 0), 0);
  const open = places.filter((p) => p.isOpen).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="relative isolate">
      <Aurora />
      <div className="container-x py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-600">
              {greet}, {user?.displayName?.split(' ')[0] || 'there'} 👋
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight">Your queues</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/business/school/new" className="btn-ghost">
              <GraduationCap size={18} /> School event
            </Link>
            <Link to="/business/new" className="btn-primary">
              <Plus size={18} /> New queue
            </Link>
          </div>
        </motion.div>

        {/* Live totals */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Waiting right now', value: waiting, icon: Users, tone: 'from-brand-600 to-brand-800 text-white' },
            { label: 'Served today', value: served, icon: Store, tone: 'bg-white' },
            { label: 'Queues open', value: open, icon: Monitor, tone: 'bg-white' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`relative overflow-hidden rounded-3xl p-5 ring-1 ring-slate-200/70 shadow-soft ${i === 0 ? `bg-gradient-to-br ${s.tone}` : s.tone}`}
            >
              {i === 0 && <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />}
              <s.icon size={20} className={i === 0 ? 'text-brand-100' : 'text-brand-600'} />
              <p className={`mt-3 text-4xl font-extrabold ${i === 0 ? '' : 'text-slate-900'}`}>
                <CountUp value={s.value} />
              </p>
              <p className={`text-sm font-semibold ${i === 0 ? 'text-brand-100' : 'text-slate-500'}`}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Places */}
        {loadingPlaces ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : places.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card mt-8 grid place-items-center p-12 text-center">
            <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 2.4, repeat: Infinity }} className="text-6xl">
              🎟️
            </motion.span>
            <h2 className="mt-4 text-2xl font-extrabold">Create your first queue</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              It takes two minutes. You'll get a QR code for the door, a counter screen for staff and a TV board.
            </p>
            <Link to="/business/new" className="btn-primary mt-6">
              Get started <ArrowRight size={16} />
            </Link>
          </motion.div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p, i) => {
              const w = p.dayKey === today ? p.waiting : 0;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} whileHover={{ y: -6 }}>
                  <Link to={`/business/${p.id}`} className="card group block overflow-hidden transition-shadow hover:shadow-lift">
                    <div className="relative h-32 overflow-hidden">
                      <CategoryArt category={p.category} className="h-full w-full transition duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                      <span className="absolute -bottom-6 left-5 grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl shadow-soft transition group-hover:scale-110 group-hover:-rotate-6">
                        {CATEGORY_META[p.category].emoji}
                      </span>
                      <span className="absolute right-4 top-4">
                        <WaitBadge minutes={placeWaitMinutes(p)} />
                      </span>
                      {/* Live line of dots */}
                      <div className="absolute bottom-3 right-4 flex gap-1">
                        {Array.from({ length: Math.min(w, 8) }, (_, k) => (
                          <motion.span key={k} className="h-2 w-2 rounded-full bg-white/80" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: k * 0.12 }} />
                        ))}
                      </div>
                    </div>
                    <div className="p-5 pt-8">
                      <h3 className="text-lg font-bold">{p.name}</h3>
                      <p className="truncate text-sm text-slate-500">{p.address || CATEGORY_META[p.category].label}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-xl font-extrabold">{w}</p>
                          <p className="text-[11px] font-semibold text-slate-500">waiting</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-xl font-extrabold">{p.dayKey === today ? p.servedToday : 0}</p>
                          <p className="text-[11px] font-semibold text-slate-500">served today</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Sample branch to practise on */}
        <SampleBranchCard />

        {/* School events */}
        {events.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-extrabold">School events</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
                  <Link to={`/business/school/${e.id}`} className="card flex items-center gap-4 p-5 hover:shadow-lift">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sun-300 to-sun-500 text-white">
                      <GraduationCap size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{e.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {e.schoolName} · {e.teacherIds.length} teachers
                      </p>
                    </div>
                    <ArrowRight size={18} className="text-slate-300" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SampleBranchCard() {
  const { place } = usePlace(sampleBranchId());
  if (!place) return null;
  const w = place.dayKey === todayKey() ? place.waiting : 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
      <Link
        to={`/business/${place.id}`}
        className="group flex flex-wrap items-center gap-5 overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-lift ring-1 ring-white/10 sm:flex-nowrap"
      >
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl">
          <CategoryArt category={place.category} className="h-full w-full transition duration-700 group-hover:scale-110" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-sun-300">Practise on a sample branch</p>
          <p className="mt-1 truncate text-lg font-extrabold">{place.name}</p>
          <p className="text-sm text-slate-400">
            {w} waiting · {place.counters} counters · customers keep arriving. Try Call next, recall and the TV board.
          </p>
        </div>
        <span className="btn bg-white px-4 py-2.5 text-slate-900 group-hover:bg-brand-50">
          Open console <ArrowRight size={16} />
        </span>
      </Link>
    </motion.div>
  );
}
