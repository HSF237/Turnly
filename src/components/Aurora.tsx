/** Slow-moving blurred colour fields behind a section. Pure CSS, GPU friendly. */
export default function Aurora({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden>
      <div
        className={`absolute -left-[10%] -top-[20%] h-[38rem] w-[38rem] rounded-full blur-[110px] animate-aurora ${dark ? 'bg-brand-600/35' : 'bg-brand-200/70'}`}
      />
      <div
        className={`absolute right-[-12%] top-[5%] h-[30rem] w-[30rem] rounded-full blur-[110px] animate-aurora2 ${dark ? 'bg-sun-500/15' : 'bg-sun-100/90'}`}
      />
      <div
        className={`absolute bottom-[-25%] left-[30%] h-[28rem] w-[28rem] rounded-full blur-[120px] animate-aurora3 ${dark ? 'bg-sky-500/15' : 'bg-sky-100/70'}`}
      />
      <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(15,23,42,.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
    </div>
  );
}
