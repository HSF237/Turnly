import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Map, Route, Store, Ticket } from 'lucide-react';

export const TABS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Map },
  { to: '/plan', label: 'Plan', icon: Route },
  { to: '/me', label: 'Tokens', icon: Ticket },
  { to: '/business', label: 'Business', icon: Store },
];

function isActive(path: string, to: string) {
  return to === '/' ? path === '/' : path.startsWith(to);
}

/** Phone-style floating bottom navigation with a raised centre button (mobile only). */
export default function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="relative flex items-end justify-between rounded-[1.75rem] bg-slate-950/90 px-2 pb-2 pt-2 shadow-[0_20px_50px_-12px_rgba(15,23,42,.55)] ring-1 ring-white/10 backdrop-blur-xl">
        {TABS.map(({ to, label, icon: Icon }, i) => {
          const active = isActive(pathname, to);
          if (i === 2) {
            return (
              <NavLink key={to} to={to} className="relative -mt-9 flex flex-1 flex-col items-center">
                <motion.span
                  whileTap={{ scale: 0.88 }}
                  animate={active ? { rotate: [0, -8, 8, 0] } : {}}
                  transition={{ duration: 0.5 }}
                  className="grid h-[3.6rem] w-[3.6rem] place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-[0_12px_30px_-6px_rgba(14,165,143,.8)] ring-[5px] ring-slate-50"
                >
                  <Icon size={24} strokeWidth={2.4} />
                </motion.span>
                <span className={`mt-1 text-[10px] font-bold ${active ? 'text-brand-300' : 'text-slate-400'}`}>{label}</span>
              </NavLink>
            );
          }
          return (
            <NavLink key={to} to={to} className="relative flex flex-1 flex-col items-center gap-1 py-1.5">
              <motion.span whileTap={{ scale: 0.82 }} className="relative">
                <Icon size={21} className={active ? 'text-white' : 'text-slate-400'} strokeWidth={active ? 2.4 : 2} />
              </motion.span>
              <span className={`text-[10px] font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{label}</span>
              {active && <motion.span layoutId="tab-dot" className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-brand-400" transition={{ type: 'spring', stiffness: 420, damping: 30 }} />}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
