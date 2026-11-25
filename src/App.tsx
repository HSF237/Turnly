import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import TabBar from './components/TabBar';
import Splash from './components/Splash';
import Onboarding from './components/Onboarding';
import ScrollProgress from './components/ScrollProgress';
import CommandPalette from './components/CommandPalette';
import OfflineBanner from './components/OfflineBanner';
import Landing from './pages/Landing';
import Home from './pages/Home';
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
import SchoolNew from './pages/SchoolNew';
import SchoolAdmin from './pages/SchoolAdmin';
import SchoolJoin from './pages/SchoolJoin';
import SchoolBoard from './pages/SchoolBoard';
import NotFound from './pages/NotFound';

export default function App() {
  const location = useLocation();
  const bare = location.pathname.startsWith('/tv/') || location.pathname.endsWith('/poster') || location.pathname.endsWith('/board');
  const fullHeight = location.pathname === '/explore';
  // Focused flows (joining, your ticket, a school meeting) hide the tab bar like a native app.
  const focused = /^\/(q|t|s)\//.test(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-dvh">
      <Splash />
      <Onboarding />
      <OfflineBanner />
      {!bare && <CommandPalette />}
      {!bare && <ScrollProgress />}
      {!bare && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          // No filter/transform left behind after the animation: they would trap position:fixed overlays.
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0, transitionEnd: { transform: 'none' } }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          className={bare || fullHeight || focused ? '' : 'pb-24 md:pb-0'}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<Landing />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/me" element={<MyTokens />} />
            <Route path="/login" element={<Login />} />
            <Route path="/business" element={<BusinessHome />} />
            <Route path="/business/new" element={<NewPlace />} />
            <Route path="/business/school/new" element={<SchoolNew />} />
            <Route path="/business/school/:eventId" element={<SchoolAdmin />} />
            <Route path="/s/:eventId" element={<SchoolJoin />} />
            <Route path="/s/:eventId/board" element={<SchoolBoard />} />
            <Route path="/business/:placeId" element={<Counter />} />
            <Route path="/business/:placeId/poster" element={<QrPoster />} />
            <Route path="/q/:placeId" element={<Join />} />
            <Route path="/t/:placeId/:ticketId" element={<TicketPage />} />
            <Route path="/tv/:placeId" element={<TV />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      {!bare && !focused && <TabBar />}
    </div>
    </MotionConfig>
  );
}
