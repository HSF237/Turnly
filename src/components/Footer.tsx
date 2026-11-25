import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from './Logo';

const WORD = 'Turnly'.split('');

/** Big animated wordmark footer. */
export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 pb-28 pt-16 text-white md:pb-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
      <div className="container-x relative">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div className="max-w-sm">
            <Logo light />
            <p className="mt-3 text-slate-400">Google Maps for waiting. The line comes to your phone, so you can live your life while you wait.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-14 gap-y-2 text-sm">
            <p className="col-span-2 mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Product</p>
            <Link className="text-slate-300 transition hover:text-white" to="/explore">Live map</Link>
            <Link className="text-slate-300 transition hover:text-white" to="/plan">Plan my errands</Link>
            <Link className="text-slate-300 transition hover:text-white" to="/me">My tokens</Link>
            <Link className="text-slate-300 transition hover:text-white" to="/business">For business</Link>
          </div>
        </div>

        <div className="mt-14 flex select-none justify-center overflow-hidden ">
          {WORD.map((ch, i) => (
            <motion.span
              key={i}
              initial={{ y: '100%' }}
              whileInView={{ y: '0%' }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
              whileHover={{ y: '-12%', color: '#27c1a8' }}
              className="cursor-default bg-gradient-to-b from-white to-white/20 bg-clip-text pb-[0.14em] text-[22vw] font-extrabold leading-[0.85] tracking-tighter text-transparent md:text-[15rem]"
            >
              {ch}
            </motion.span>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>Built by Muhammad Hasan · Kannur, Kerala</p>
          <p>6th International Digital Fest 2027 · Asia Pacific University, Kuala Lumpur</p>
        </div>
      </div>
    </footer>
  );
}
