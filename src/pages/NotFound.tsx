import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Map } from 'lucide-react';
import CategoryArt from '../components/CategoryArt';
import { useTitle } from '../lib/useTitle';

export default function NotFound() {
  useTitle('Page not found');
  return (
    <div className="grid min-h-[75vh] place-items-center px-4 py-10">
      <div className="max-w-sm text-center">
        <motion.div
          initial={{ opacity: 0, y: 20, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          className="relative mx-auto w-64 overflow-hidden rounded-3xl shadow-lift"
        >
          <CategoryArt category="other" className="block h-40 w-full" />
          <motion.span
            className="absolute right-6 top-4 text-4xl font-extrabold text-white"
            animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ?
          </motion.span>
        </motion.div>
        <p className="mt-8 text-sm font-bold uppercase tracking-widest text-brand-600">404</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">This page took a wrong turn</h1>
        <p className="mt-2 text-slate-500">The link may be old or mistyped. Let's get you back in line.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/" className="btn-primary">
            <Home size={16} /> Home
          </Link>
          <Link to="/explore" className="btn-ghost">
            <Map size={16} /> Live map
          </Link>
        </div>
      </div>
    </div>
  );
}
