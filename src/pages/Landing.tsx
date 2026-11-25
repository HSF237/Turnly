import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Building2,
  GraduationCap,
  MapPinned,
  QrCode,
  Ticket,
  Timer,
} from 'lucide-react';
import Aurora from '../components/Aurora';
import BentoFeatures from '../components/BentoFeatures';
import CityPulse from '../components/CityPulse';
import Footer from '../components/Footer';
import Magnetic from '../components/Magnetic';
import CountUp from '../components/CountUp';
import LiveQueueDemo from '../components/LiveQueueDemo';
import ScrollStory from '../components/ScrollStory';
import SpotCard from '../components/SpotCard';
import { usePlaces } from '../lib/hooks';
import { todayKey } from '../lib/time';
import { useTitle } from '../lib/useTitle';

const fade = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
  }),
};

const HEADLINE = ['No', 'one', 'should', 'ever'];


const PLACES = ['🏦 Banks', '💈 Barbers', '💊 Pharmacies', '🏛️ Passport offices', '🎓 School PTMs', '🩺 Clinics', '🛠️ Service centres', '☕ Cafés', '🎟️ Fest counters', '🛍️ Shops'];

export default function Landing() {
  useTitle('How Turnly works');
  const { places } = usePlaces();
  const today = todayKey();
  const waitingNow = places.reduce((s, p) => s + (p.dayKey === today ? p.waiting : 0), 0);
  const servedToday = places.reduce((s, p) => s + (p.dayKey === today ? p.servedToday : 0), 0);

  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative isolate">
        <Aurora />
        <div className="container-x grid items-center gap-6 pb-10 pt-12 md:grid-cols-[1.05fr_.95fr] md:pb-20 md:pt-16">
          <div>
            <motion.span variants={fade} initial="hidden" animate="show" className="chip bg-white/80 text-brand-700 ring-brand-200 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              Google Maps for waiting
            </motion.span>
            <h1 className="mt-5 text-[2.25rem] font-extrabold leading-[1.04] tracking-tight text-slate-900 sm:text-[3.6rem] xl:text-[4rem]">
              {HEADLINE.map((w, i) => (
                <motion.span key={w} variants={fade} initial="hidden" animate="show" custom={i + 1} className="mr-[0.25em] inline-block">
                  {w}
                </motion.span>
              ))}
              <br />
              <motion.span variants={fade} initial="hidden" animate="show" custom={5} className="relative inline-block">
                <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 bg-clip-text text-transparent">wait in line</span>
                <motion.svg
                  viewBox="0 0 300 20"
                  className="absolute -bottom-2 left-0 w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <motion.path
                    d="M4 14 C 80 4, 200 4, 296 12"
                    stroke="#fbab30"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                    pathLength={1}
                    strokeDasharray="1"
                    initial={{ strokeDashoffset: 1 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ delay: 1, duration: 0.8, ease: 'easeInOut' }}
                  />
                </motion.svg>
              </motion.span>{' '}
              <motion.span variants={fade} initial="hidden" animate="show" custom={6} className="inline-block">
                again.
              </motion.span>
            </h1>
            <motion.p variants={fade} initial="hidden" animate="show" custom={7} className="mt-6 max-w-xl text-lg text-slate-600">
              See how long the line is at any bank, shop, office or school counter. Join from anywhere, and Turnly calls you when it's your
              turn. The line comes to your phone.
            </motion.p>
            <motion.div variants={fade} initial="hidden" animate="show" custom={8} className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <Link to="/explore" className="btn-primary group px-5 py-3.5 text-base shadow-[0_12px_30px_-10px_rgba(10,133,118,.7)]">
                  <MapPinned size={18} /> Find a queue near me
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </Link>
              </Magnetic>
              <Magnetic>
                <Link to="/business" className="btn-ghost px-5 py-3.5 text-base">
                  Set up my business, free
                </Link>
              </Magnetic>
            </motion.div>
            {(servedToday > 0 || waitingNow > 0) && (
            <motion.div variants={fade} initial="hidden" animate="show" custom={9} className="mt-10 flex flex-wrap gap-8">
              {servedToday > 0 && (
              <div>
                <p className="text-3xl font-extrabold text-slate-900">
                  <CountUp value={servedToday} />
                </p>
                <p className="text-sm text-slate-500">served today without standing</p>
              </div>
              )}
              {servedToday > 0 && waitingNow > 0 && <div className="hidden h-12 w-px bg-slate-200 sm:block" />}
              {waitingNow > 0 && (
              <div>
                <p className="text-3xl font-extrabold text-slate-900">
                  <CountUp value={waitingNow} />
                </p>
                <p className="text-sm text-slate-500">waiting from anywhere right now</p>
              </div>
              )}
            </motion.div>
            )}
          </div>
          <div className="-mx-4 h-[455px] overflow-hidden sm:mx-0 sm:h-auto sm:overflow-visible">
            <div className="origin-top scale-[0.86] sm:scale-100">
              <LiveQueueDemo />
            </div>
          </div>
        </div>

        {/* Marquee of places */}
        <div className="relative border-y border-slate-200/70 bg-white/60 py-4 backdrop-blur [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap text-sm font-bold text-slate-500">
            {[...PLACES, ...PLACES].map((p, i) => (
              <span key={i}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-x py-20">
        <motion.h2
          variants={fade}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center text-3xl font-extrabold tracking-tight sm:text-5xl"
        >
          Three taps. Zero standing.
        </motion.h2>
        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-[44px] hidden h-0.5 bg-[repeating-linear-gradient(90deg,#94ecd9_0_10px,transparent_10px_20px)] md:block" />
          {[
            { icon: QrCode, title: 'Scan or tap', text: 'Scan the QR at the door, or join from the map before you even leave home.' },
            { icon: Ticket, title: 'Get your token', text: 'See your place, the people ahead of you and a live estimate of your turn.' },
            { icon: Bell, title: 'Get called', text: 'Your phone buzzes when you are two away, and again when it is your turn.' },
          ].map((s, i) => (
            <motion.div key={s.title} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
              <SpotCard className="p-6 text-center">
                <motion.span
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_10px_24px_-8px_rgba(10,133,118,.7)]"
                >
                  <s.icon size={26} />
                </motion.span>
                <p className="mt-4 text-xs font-bold tracking-widest text-slate-400">STEP {i + 1}</p>
                <h3 className="mt-1 text-xl font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{s.text}</p>
              </SpotCard>
            </motion.div>
          ))}
        </div>
      </section>

      <ScrollStory />

      {/* City pulse */}
      <section className="container-x py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">City pulse</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">The whole city's waiting, in one view.</h2>
            <p className="mt-4 text-lg text-slate-600">
              Every place glows by how busy it is. Places that never signed up still show a live estimate, because the people standing in
              line report it, the way Waze works for traffic.
            </p>
            <Link to="/explore" className="btn-dark group mt-6">
              Open the live map <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <CityPulse className="aspect-[4/3] shadow-lift" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container-x pb-20">
        <motion.h2 variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
          Built for the way people <span className="text-brand-600">really</span> wait.
        </motion.h2>
        <motion.p variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} className="mt-3 max-w-2xl text-lg text-slate-600">
          Eight small ideas that add up to never standing in a line again.
        </motion.p>
        <div className="mt-10">
          <BentoFeatures />
        </div>
      </section>

      {/* Modes */}
      <section className="container-x pb-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Building2, title: 'City', text: 'Banks, barbers, pharmacies, shops and government offices.', tint: 'from-brand-100' },
            { icon: GraduationCap, title: 'School', text: 'Parent-teacher meetings with a planned route through every teacher.', tint: 'from-sun-100' },
            { icon: Timer, title: 'Events', text: 'Fests, registration desks and ticket counters.', tint: 'from-sky-100' },
          ].map((m, i) => (
            <motion.div
              key={m.title}
              variants={fade}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              whileHover={{ y: -6 }}
              className={`rounded-3xl bg-gradient-to-b ${m.tint} to-white p-7 ring-1 ring-slate-200/70`}
            >
              <m.icon className="text-slate-800" size={28} />
              <h3 className="mt-4 text-2xl font-extrabold">{m.title} mode</h3>
              <p className="mt-1 text-slate-600">{m.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Business CTA */}
      <section className="container-x pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-white sm:px-14"
        >
          <Aurora dark />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Run your queue in two minutes.</h2>
              <p className="mt-4 max-w-lg text-lg text-slate-300">
                Name your place, print the QR code, tap “Next”. Turnly handles the line, the TV board, the announcements and the numbers
                behind your busiest hours.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Magnetic strength={0.35}>
                <Link to="/business/new" className="btn group bg-white px-6 py-4 text-base text-slate-900 hover:bg-slate-100">
                  Create my queue <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </Link>
              </Magnetic>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
