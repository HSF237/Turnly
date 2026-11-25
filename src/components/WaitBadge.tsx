import { formatMinutes, LEVEL_STYLE, waitLevel } from '../lib/predict';

export default function WaitBadge({ minutes, size = 'sm' }: { minutes: number | null; size?: 'sm' | 'lg' }) {
  const lvl = waitLevel(minutes);
  const s = LEVEL_STYLE[lvl];
  return (
    <span className={`chip whitespace-nowrap ${s.chip} ${size === 'lg' ? 'px-3 py-1.5 text-sm' : ''}`}>
      <span className="relative flex h-2 w-2">
        {lvl !== 'closed' && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${s.dot}`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      {formatMinutes(minutes)}
    </span>
  );
}
