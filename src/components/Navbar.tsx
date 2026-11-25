import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Map, Store } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../lib/hooks';
import { logOut } from '../lib/firebase';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
  }`;

export default function Navbar() {
  const { user, isMember } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <Link to="/" aria-label="Turnly home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/explore" className={linkCls}>
            <Map size={16} /> <span className="hidden sm:inline">Explore</span>
          </NavLink>
          <NavLink to="/business" className={linkCls}>
            <Store size={16} /> <span className="hidden sm:inline">For business</span>
          </NavLink>
          {isMember ? (
            <div className="ml-1 flex items-center gap-2">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full ring-2 ring-white" referrerPolicy="no-referrer" />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {(user?.displayName || user?.email || '?').slice(0, 1).toUpperCase()}
                </span>
              )}
              <button
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                title="Sign out"
                onClick={async () => {
                  await logOut();
                  navigate('/');
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-dark ml-1 py-2">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
