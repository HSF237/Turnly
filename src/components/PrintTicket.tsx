import { motion } from 'framer-motion';
import Logo from './Logo';

/** The "ticket machine" moment: a token prints and slides out of a slot. */
export default function PrintTicket({ number, placeName, name }: { number: number; placeName: string; name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-6 backdrop-blur-md"
    >
      <div className="relative w-72">
        {/* The machine slot */}
        <div className="relative z-20 h-10 rounded-2xl bg-slate-800 shadow-lift ring-1 ring-white/10">
          <div className="absolute inset-x-6 bottom-2 h-1.5 rounded-full bg-black" />
          <motion.span
            className="absolute right-4 top-3 h-2 w-2 rounded-full bg-brand-400"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.4, repeat: 4 }}
          />
        </div>
        {/* The ticket */}
        <div className="relative z-10 -mt-3 overflow-hidden px-6">
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1.1, ease: [0.3, 0.7, 0.3, 1], delay: 0.2 }}
            className="relative rounded-b-2xl bg-white px-5 pb-5 pt-6 text-center shadow-lift"
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{placeName}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">Your token</p>
            <motion.p
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.15, type: 'spring', stiffness: 300, damping: 14 }}
              className="text-7xl font-extrabold leading-none text-slate-900"
            >
              {number}
            </motion.p>
            <p className="mt-2 truncate text-sm font-semibold text-slate-600">{name}</p>
            <div className="my-4 border-t-2 border-dashed border-slate-200" />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
              <Logo size={18} />
            </div>
          </motion.div>
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-8 text-center font-semibold text-white">
          You're in the line. Wait anywhere ✨
        </motion.p>
      </div>
    </motion.div>
  );
}
