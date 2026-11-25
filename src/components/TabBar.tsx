import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Map, Route, Store, Ticket } from 'lucide-react';

export const TABS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Map },
  { to: '/plan', label: 'Plan', icon: Route },
  { to: '/me', label: 'My tokens', icon: Ticket },
  { to: '/business', label: 'Business', icon: Store },
];

function isActive(path: string, to: string) {
  return to === '/' ? path === '/' : path.startsWith(to);
}

/** Phone-style bottom navigation (mobile only). */
export default function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-between rounded-2xl bg-white/85 p-1.5 shadow-lift ring-1 ring-slate-200/80 backdrop-blur-xl">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = isActive(pathname, to);
          return (
            <NavLink key={to} to={to} className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2">
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-xl bg-brand-50"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <motion.span whileTap={{ scale: 0.85 }} className="relative">
                <Icon size={20} className={active ? 'text-brand-700' : 'text-slate-500'} strokeWidth={active ? 2.4 : 2} />
              </motion.span>
              <span className={`relative text-[10px] font-bold ${active ? 'text-brand-700' : 'text-slate-500'}`}>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
