import { useEffect, useState } from 'react';
import { Crosshair, MapPin } from 'lucide-react';
import Sheet from './Sheet';
import { PRESETS } from './ReportSheet';
import { ErrorNote } from '../States';
import { ensureGuest } from '../../lib/firebase';
import { useGeolocation } from '../../lib/hooks';
import { createCommunityPlace } from '../../lib/community';
import { CATEGORY_META, type Category } from '../../lib/types';

/** Put a place that isn't on Turnly on the map, so everyone can see and share its wait. */
export default function AddPlaceSheet({
  picked,
  onPickOnMap,
  onClose,
  onCreated,
}: {
  picked: { lat: number; lng: number } | null;
  onPickOnMap: () => void;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const geo = useGeolocation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('government');
  const [address, setAddress] = useState('');
  const [wait, setWait] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!picked) geo.request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = picked ?? geo.pos;

  const submit = async () => {
    if (!name.trim()) return setError('What is this place called?');
    if (!pos) return setError('Set the location: use yours, or pick it on the map.');
    setBusy(true);
    setError(null);
    try {
      const user = await ensureGuest();
      const id = await createCommunityPlace(user.uid, {
        name,
        category,
        address,
        lat: pos.lat,
        lng: pos.lng,
        firstReport: wait === null ? undefined : { m: wait, v: !picked && !!geo.pos },
      });
      onCreated(id);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Sheet title="Add a place to the map" onClose={onClose}>
      <p className="mt-1 text-sm text-slate-500">Not on Turnly yet? Add it, and everyone in its line can share the wait.</p>
      <div className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="cname">Place name</label>
          <input id="cname" className="input py-3" placeholder="e.g. Passport Seva Kendra, Kannur" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <span className="label">Type</span>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`chip shrink-0 py-1.5 ${category === c ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200'}`}
              >
                {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="caddr">Area (optional)</label>
          <input id="caddr" className="input" placeholder="Street or area" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${pos ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-500'}`}>
            <MapPin size={16} /> {picked ? 'Picked on the map ✓' : geo.pos ? 'Using your location ✓' : geo.error ? 'Location is off' : 'Finding you…'}
          </span>
          <button className="btn-ghost py-2.5" onClick={onPickOnMap}>
            <Crosshair size={16} /> Pick on map
          </button>
        </div>
        <div>
          <span className="label">How long is the wait right now? (optional)</span>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => setWait(wait === m ? null : m)}
                className={`chip shrink-0 py-1.5 ${wait === m ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200'}`}
              >
                {m === 0 ? 'No wait' : m === 90 ? '90+ min' : `${m} min`}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <div className="mt-4"><ErrorNote message={error} /></div>}
      <button className="btn-primary mt-6 w-full py-3.5 text-base" disabled={busy} onClick={submit}>
        {busy ? 'Adding…' : 'Add to the map'}
      </button>
    </Sheet>
  );
}
