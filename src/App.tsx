import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Explore from './pages/Explore';
import Login from './pages/Login';
import BusinessHome from './pages/BusinessHome';
import NewPlace from './pages/NewPlace';
import Counter from './pages/Counter';
import QrPoster from './pages/QrPoster';
import Join from './pages/Join';
import TicketPage from './pages/TicketPage';
import TV from './pages/TV';
import NotFound from './pages/NotFound';

export default function App() {
  const location = useLocation();
  const bare = location.pathname.startsWith('/tv/') || location.pathname.endsWith('/poster');

  return (
    <div className="min-h-dvh">
      {!bare && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/login" element={<Login />} />
            <Route path="/business" element={<BusinessHome />} />
            <Route path="/business/new" element={<NewPlace />} />
            <Route path="/business/:placeId" element={<Counter />} />
            <Route path="/business/:placeId/poster" element={<QrPoster />} />
            <Route path="/q/:placeId" element={<Join />} />
            <Route path="/t/:placeId/:ticketId" element={<TicketPage />} />
            <Route path="/tv/:placeId" element={<TV />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
