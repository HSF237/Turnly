export default function Logo({ size = 32, withText = true, light = false }: { size?: number; withText?: boolean; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="16" fill="#0a8576" />
        <path d="M20 22h24M32 22v24" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        <circle cx="46" cy="44" r="6" fill="#fbab30" />
      </svg>
      {withText && (
        <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
          Turnly
        </span>
      )}
    </span>
  );
}
