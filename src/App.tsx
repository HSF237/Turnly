import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import TabBar from './components/TabBar';
import Splash from './components/Splash';
import ScrollProgress from './components/ScrollProgress';
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
import Plan from './pages/Plan';
import MyTokens from './pages/MyTokens';
import NotFound from './pages/NotFound';

export default function App() {
  const location = useLocation();
  const bare = location.pathname.startsWith('/tv/') || location.pathname.endsWith('/poster');
  const fullHeight = location.pathname === '/explore';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-dvh">
      <Splash />
      {!bare && <ScrollProgress />}
      {!bare && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          className={bare || fullHeight ? '' : 'pb-24 md:pb-0'}
        >
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/me" element={<MyTokens />} />
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
      {!bare && <TabBar />}
    </div>
  );
}
