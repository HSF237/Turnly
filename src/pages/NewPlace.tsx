import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Crosshair, Minus, Plus } from 'lucide-react';
import MapView, { DEFAULT_CENTER } from '../components/MapView';
import { ErrorNote, Spinner } from '../components/States';
import { useAuth, useGeolocation } from '../lib/hooks';
import { createPlace } from '../lib/queue';
import { LANGUAGES } from '../lib/speech';
import { CATEGORY_META, type Category } from '../lib/types';

function Stepper({ value, onChange, min = 1, max = 50, suffix }: { value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" className="btn-ghost h-10 w-10 p-0" onClick={() => onChange(Math.max(min, value - 1))}>
        <Minus size={16} />
      </button>
      <span className="min-w-[4.5rem] text-center text-lg font-bold">
        {value}
        {suffix && <span className="ml-1 text-sm font-semibold text-slate-500">{suffix}</span>}
      </span>
      <button type="button" className="btn-ghost h-10 w-10 p-0" onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus size={16} />
      </button>
    </div>
  );
}

export default function NewPlace() {
  const { user, isMember, loading } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('bank');
  const [address, setAddress] = useState('');
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [counters, setCounters] = useState(1);
  const [avgMinutes, setAvgMinutes] = useState(5);
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [checkIn, setCheckIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <Spinner />;
  if (!isMember) return <Navigate to="/login?next=/business/new" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Give your place a name.');
    if (!pos) return setError('Tap the map (or use your location) to set where your place is.');
    setBusy(true);
    setError(null);
    try {
      const id = await createPlace(user!.uid, {
        name,
        category,
        address,
        lat: pos.lat,
        lng: pos.lng,
        counters,
        avgMinutes,
        languages,
        checkInRadius: checkIn ? 300 : 0,
      });
      navigate(`/business/${id}`, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Create a queue</h1>
      <p className="mt-1 text-slate-500">Two minutes now saves your customers hours every week.</p>

      <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="card space-y-5 p-6">
          <div>
            <label className="label" htmlFor="name">Place name</label>
            <input id="name" className="input" placeholder="e.g. Federal Bank, Thavakkara branch" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <span className="label">Type of place</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-xl px-3 py-2.5 text-left text-sm font-semibold ring-1 transition ${
                    category === c ? 'bg-brand-50 text-brand-800 ring-brand-300' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="mr-1.5">{CATEGORY_META[c].emoji}</span>
                  {CATEGORY_META[c].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="address">Address</label>
            <input id="address" className="input" placeholder="Street, area, city" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className="label">Counters serving at once</span>
              <Stepper value={counters} onChange={setCounters} max={30} />
            </div>
            <div>
              <span className="label">Usual time per customer</span>
              <Stepper value={avgMinutes} onChange={setAvgMinutes} max={90} suffix="min" />
              <p className="mt-1 text-xs text-slate-500">A starting guess. Turnly learns the real number as you serve.</p>
            </div>
          </div>
          <div>
            <span className="label">TV announces tokens in</span>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => {
                const on = languages.includes(l.code);
                return (
                  <button
                    type="button"
                    key={l.code}
                    onClick={() => setLanguages(on ? languages.filter((x) => x !== l.code) : [...languages, l.code])}
                    className={`chip ${on ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200'}`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-brand-600" checked={checkIn} onChange={(e) => setCheckIn(e.target.checked)} />
            <span>
              <span className="block text-sm font-semibold">Fair check-in</span>
              <span className="text-xs text-slate-500">People must be within 300 m to confirm they've arrived, so nobody holds a spot from far away.</span>
            </span>
          </label>
          {error && <ErrorNote message={error} />}
          <button className="btn-primary w-full py-3 text-base" disabled={busy}>
            {busy ? 'Creating…' : 'Create queue'}
          </button>
        </div>

        <div className="card relative min-h-[420px] overflow-hidden">
          <MapView picked={pos} onPick={setPos} center={focus ?? DEFAULT_CENTER} zoom={14} />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-between gap-2">
            <span className="rounded-xl bg-white/95 px-3 py-2 text-sm font-semibold shadow-soft">
              {pos ? '📍 Location set. Tap again to move it.' : 'Tap the map where your place is'}
            </span>
            <button
              type="button"
              className="btn-ghost pointer-events-auto shadow-soft"
              onClick={async () => {
                const p = await geo.request();
                if (p) {
                  setPos(p);
                  setFocus(p);
                }
              }}
            >
              <Crosshair size={16} /> I'm here
            </button>
          </div>
          {geo.error && <p className="absolute bottom-3 left-3 rounded-lg bg-white px-3 py-2 text-xs text-red-600 shadow-soft">{geo.error}</p>}
        </div>
      </form>
    </div>
  );
}
