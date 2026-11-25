import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, LogOut, Search } from 'lucide-react';
import { openSearch } from './CommandPalette';
import Logo from './Logo';
import { TABS } from './TabBar';
import { useAuth } from '../lib/hooks';
import { logOut } from '../lib/firebase';

export default function Navbar() {
  const { user, isMember } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl backdrop-saturate-150" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="container-x flex h-16 items-center justify-between gap-3 xl:max-w-[1240px]">
        <Link to="/" aria-label="Turnly home" className="transition hover:opacity-80">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {[...TABS.slice(1), { to: '/about', label: 'About', icon: Info }].map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-brand-50"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon size={16} className="relative" />
                <span className="relative">{label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={openSearch}
            aria-label="Search"
            className="flex h-10 items-center gap-2 rounded-xl px-2.5 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-800 lg:w-44 lg:px-3"
          >
            <Search size={17} />
            <span className="hidden text-sm font-medium lg:inline">Search</span>
            <kbd className="ml-auto hidden rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 lg:inline">⌘K</kbd>
          </button>
          {isMember ? (
            <>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full ring-2 ring-white shadow-soft" referrerPolicy="no-referrer" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {(user?.displayName || user?.email || '?').slice(0, 1).toUpperCase()}
                </span>
              )}
              <button
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                title="Sign out"
                onClick={async () => {
                  await logOut();
                  navigate('/');
                }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-dark py-2">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
