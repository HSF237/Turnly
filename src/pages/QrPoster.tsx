import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import Logo from '../components/Logo';
import { Empty, Spinner } from '../components/States';
import { usePlace } from '../lib/hooks';
import { CATEGORY_META } from '../lib/types';

export default function QrPoster() {
  const { placeId } = useParams();
  const { place, loading } = usePlace(placeId);
  if (loading) return <Spinner />;
  if (!place) return <Empty title="Queue not found" />;
  const url = `${window.location.origin}/q/${place.id}`;

  return (
    <div className="min-h-dvh bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[640px] justify-end px-4">
        <button className="btn-dark" onClick={() => window.print()}>
          <Printer size={16} /> Print poster
        </button>
      </div>
      <div className="mx-auto flex max-w-[640px] flex-col items-center justify-between gap-8 bg-white p-6 text-center shadow-lift sm:aspect-[1/1.414] sm:rounded-3xl sm:p-10 print:aspect-[1/1.414] print:max-w-none print:rounded-none print:shadow-none">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-600">Skip the line</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">{place.name}</h1>
          <p className="mt-2 text-slate-500">
            {CATEGORY_META[place.category].emoji} {place.address}
          </p>
        </div>
        <div className="w-full max-w-[320px] rounded-3xl bg-white p-5 ring-8 ring-brand-600">
          <QRCodeSVG value={url} size={280} level="M" fgColor="#0f172a" className="h-auto w-full max-w-[280px]" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-slate-900">Scan to join the queue</p>
          <p className="mt-1 text-slate-500">No app needed. We'll ping you when it's your turn, so you can wait anywhere.</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            Powered by <Logo size={22} />
          </div>
        </div>
      </div>
    </div>
  );
}
