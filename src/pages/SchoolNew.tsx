import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, Crosshair, GraduationCap, Minus, Plus, Trash2, UserPlus } from 'lucide-react';
import Aurora from '../components/Aurora';
import { DEFAULT_CENTER } from '../components/MapView';
import { ErrorNote, Spinner } from '../components/States';
import { useAuth, useGeolocation } from '../lib/hooks';
import { createSchoolEvent, parseTeacherList, type TeacherInput } from '../lib/school';
import { todayKey } from '../lib/time';

const blank = (): TeacherInput & { key: number } => ({ key: Math.random(), name: '', subject: '', room: '' });

export default function SchoolNew() {
  const { user, isMember, loading } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [name, setName] = useState('Parent-Teacher Meeting');
  const [schoolName, setSchoolName] = useState('');
  const [date, setDate] = useState(todayKey());
  const [slot, setSlot] = useState(5);
  const [rows, setRows] = useState([blank(), blank(), blank()]);
  const [paste, setPaste] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <Spinner />;
  if (!isMember) return <Navigate to="/login?next=/business/school/new" replace />;

  const teachers = rows.filter((r) => r.name.trim());
  const update = (key: number, patch: Partial<TeacherInput>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submit = async () => {
    if (!schoolName.trim()) return setError('Add the school name.');
    if (teachers.length < 1) return setError('Add at least one teacher.');
    setBusy(true);
    setError(null);
    try {
      const pos = geo.pos ?? DEFAULT_CENTER;
      const id = await createSchoolEvent(user!.uid, {
        name,
        schoolName,
        date,
        slotMinutes: slot,
        lat: pos.lat,
        lng: pos.lng,
        teachers,
      });
      navigate(`/business/school/${id}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="relative isolate">
      <Aurora />
      <div className="container-x max-w-4xl py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <span className="chip bg-sun-50 text-sun-600 ring-sun-100">
            <GraduationCap size={14} /> School mode
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Set up a parent-teacher meeting</h1>
          <p className="mt-2 max-w-2xl text-lg text-slate-600">
            Every teacher gets their own live queue. Parents hold a place in all of them at once, and Turnly sends them to whichever teacher is
            free next. No more corridors.
          </p>
        </motion.div>

        <div className="card mt-8 grid gap-5 p-6 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ev">Event name</label>
            <input id="ev" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="sc">School</label>
            <input id="sc" className="input" placeholder="e.g. TISK English Medium School" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="dt">Date</label>
            <input id="dt" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <span className="label">Minutes per parent</span>
            <div className="flex items-center gap-2">
              <button type="button" className="btn-ghost h-10 w-10 p-0" onClick={() => setSlot(Math.max(2, slot - 1))}>
                <Minus size={16} />
              </button>
              <span className="min-w-[4rem] text-center text-lg font-bold">{slot} min</span>
              <button type="button" className="btn-ghost h-10 w-10 p-0" onClick={() => setSlot(Math.min(30, slot + 1))}>
                <Plus size={16} />
              </button>
              <button type="button" className={`btn ml-auto ${geo.pos ? 'bg-brand-50 text-brand-700' : 'btn-ghost'}`} onClick={() => geo.request()}>
                <Crosshair size={16} /> {geo.pos ? 'At school ✓' : "I'm at school"}
              </button>
            </div>
          </div>
        </div>

        {/* Teachers */}
        <div className="card mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold">Teachers</h2>
              <p className="text-sm text-slate-500">{teachers.length} added. Each one gets a queue and a counter screen.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setShowPaste((v) => !v)}>
                <ClipboardList size={16} /> Paste a list
              </button>
              <button className="btn-soft" onClick={() => setRows((r) => [...r, blank()])}>
                <UserPlus size={16} /> Add teacher
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showPaste && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">One teacher per line: Name, Subject, Room</p>
                  <textarea
                    className="input mt-2 h-32 font-mono text-xs"
                    placeholder={'Anitha Teacher, Maths, 7B\nRahim Sir, Physics, Lab 2\nMs. Priya, English, 8A'}
                    value={paste}
                    onChange={(e) => setPaste(e.target.value)}
                  />
                  <button
                    className="btn-dark mt-2"
                    onClick={() => {
                      const list = parseTeacherList(paste).map((t) => ({ ...t, key: Math.random() }));
                      setRows((r) => [...r.filter((x) => x.name.trim()), ...list]);
                      setPaste('');
                      setShowPaste(false);
                    }}
                  >
                    Add {parseTeacherList(paste).length || ''} teachers
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 hidden grid-cols-[2fr_1.5fr_1fr_auto] gap-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400 sm:grid">
            <span>Name</span>
            <span>Subject</span>
            <span>Room</span>
            <span className="w-9" />
          </div>
          <ul className="mt-2 space-y-2">
            <AnimatePresence initial={false}>
              {rows.map((r, i) => (
                <motion.li
                  key={r.key}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30, height: 0 }}
                  className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50/60 p-2 sm:grid-cols-[2fr_1.5fr_1fr_auto] sm:bg-transparent sm:p-0"
                >
                  <input className="input col-span-2 sm:col-span-1" placeholder={`Teacher ${i + 1} name`} value={r.name} onChange={(e) => update(r.key, { name: e.target.value })} />
                  <input className="input" placeholder="Subject" value={r.subject} onChange={(e) => update(r.key, { subject: e.target.value })} />
                  <input className="input" placeholder="Room" value={r.room} onChange={(e) => update(r.key, { room: e.target.value })} />
                  <button
                    className="col-span-2 grid h-10 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 sm:col-span-1 sm:w-9"
                    onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        {error && <div className="mt-4"><ErrorNote message={error} /></div>}
        <motion.button whileTap={{ scale: 0.98 }} className="btn-primary mt-6 w-full py-4 text-lg" disabled={busy} onClick={submit}>
          {busy ? `Creating ${teachers.length} teacher queues…` : `Create event with ${teachers.length} teacher${teachers.length === 1 ? '' : 's'}`}
        </motion.button>
      </div>
    </div>
  );
}
