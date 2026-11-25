import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowUpRight, Check, Copy, DoorOpen, GraduationCap, Monitor, Users } from 'lucide-react';
import Aurora from '../components/Aurora';
import { Empty, Spinner } from '../components/States';
import { useAuth, useEventTeachers, useMultiTickets, useSchoolEvent } from '../lib/hooks';
import { useTitle } from '../lib/useTitle';

export default function SchoolAdmin() {
  useTitle('School event');
  const { eventId } = useParams();
  const { user, isMember, loading: authLoading } = useAuth();
  const { event, loading } = useSchoolEvent(eventId);
  const { teachers } = useEventTeachers(eventId);
  const ticketMap = useMultiTickets(teachers.map((t) => t.id));
  const [copied, setCopied] = useState(false);

  if (authLoading || loading) return <Spinner />;
  if (!isMember) return <Navigate to={`/login?next=/business/school/${eventId}`} replace />;
  if (!event) return <Empty title="Event not found" />;
  if (event.ownerUid !== user!.uid) return <Empty title="This isn't your event" />;

  const parentUrl = `${window.location.origin}/s/${event.id}`;
  const all = Object.values(ticketMap).flat();
  const waiting = all.filter((t) => t.status === 'waiting').length;
  const met = all.filter((t) => t.status === 'done').length;
  const parents = new Set(all.map((t) => t.uid)).size;

  return (
    <div className="relative isolate">
      <Aurora />
      <div className="container-x py-8">
        <Link to="/business" className="text-sm font-semibold text-slate-500 hover:text-slate-800">← Business</Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="chip bg-sun-50 text-sun-600 ring-sun-100">
              <GraduationCap size={14} /> {event.schoolName}
            </span>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{event.name}</h1>
            <p className="text-slate-500">
              {new Date(event.date).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })} · {teachers.length} teachers ·{' '}
              {event.slotMinutes} min per parent
            </p>
          </div>
          <Link to={`/s/${event.id}/board`} target="_blank" className="btn-dark">
            <Monitor size={16} /> Open hall board
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Parents joined', value: parents },
                { label: 'Waiting now', value: waiting },
                { label: 'Meetings done', value: met },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
                  <p className="mt-1 text-3xl font-extrabold">{s.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {teachers.map((t, i) => {
                const list = ticketMap[t.id] ?? [];
                const w = list.filter((x) => x.status === 'waiting').length;
                const now = list.filter((x) => x.status === 'called').sort((a, b) => (b.calledAt ?? 0) - (a.calledAt ?? 0))[0];
                return (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link to={`/business/${t.id}`} className="card group block p-5 transition hover:-translate-y-1 hover:shadow-lift">
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sun-300 to-sun-500 text-lg font-extrabold text-white">
                          {t.name.slice(0, 1).toUpperCase()}
                        </span>
                        <ArrowUpRight size={18} className="text-slate-300 transition group-hover:text-brand-600" />
                      </div>
                      <p className="mt-3 text-lg font-bold">{t.name}</p>
                      <p className="flex items-center gap-1 text-sm text-slate-500">
                        <DoorOpen size={14} /> {t.address || 'No room set'}
                      </p>
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                        <span className="text-xs font-semibold text-slate-500">With</span>
                        <span className="font-extrabold">{now ? `#${now.number}` : '—'}</span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                          <Users size={12} /> {w} waiting
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Share with parents */}
          <motion.aside initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="card h-fit p-6 text-center lg:sticky lg:top-24">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">For parents</p>
            <p className="mt-1 text-lg font-extrabold">Scan to plan your meetings</p>
            <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 ring-4 ring-brand-600">
              <QRCodeSVG value={parentUrl} size={190} />
            </div>
            <button
              className="btn-ghost mt-4 w-full"
              onClick={async () => {
                await navigator.clipboard?.writeText(parentUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy link for WhatsApp'}
            </button>
            <a
              className="btn-primary mt-2 w-full"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`${event.name} at ${event.schoolName}: plan your meetings and skip the corridor queues → ${parentUrl}`)}`}
            >
              Share on WhatsApp
            </a>
            <p className="mt-3 text-xs text-slate-400">Each teacher opens their card on a phone to run their own queue.</p>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
