import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarClock,
  Footprints,
  GraduationCap,
  Languages,
  MapPinned,
  Monitor,
  QrCode,
  Repeat2,
  Route,
  Ticket,
  Timer,
  Users,
} from 'lucide-react';
import CityPulse from '../components/CityPulse';
import CountUp from '../components/CountUp';
import Logo from '../components/Logo';
import { usePlaces } from '../lib/hooks';
import { todayKey } from '../lib/time';

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' } }),
};

function PhoneMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 4 }}
      animate={{ opacity: 1, y: 0, rotate: 2 }}
      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
      className="relative mx-auto w-[270px] animate-floaty rounded-[2.4rem] bg-slate-900 p-2.5 shadow-lift"
    >
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-b from-brand-600 to-brand-800 p-5 text-white">
        <div className="mx-auto mb-5 h-5 w-24 rounded-full bg-black/30" />
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-100">Federal Bank · Kannur</p>
        <p className="mt-6 text-sm text-brand-100">Your token</p>
        <p className="text-7xl font-extrabold leading-none">A27</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-[11px] text-brand-100">Ahead of you</p>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-[11px] text-brand-100">Your turn in</p>
            <p className="whitespace-nowrap text-2xl font-bold">9 min</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-full rounded-full bg-sun-400"
            initial={{ width: '30%' }}
            animate={{ width: ['30%', '78%', '30%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="mt-5 rounded-2xl bg-white p-3 text-slate-900">
          <p className="flex items-center gap-2 text-xs font-bold text-brand-700">
            <Footprints size={14} /> Leave home in 4 min
          </p>
          <p className="mt-1 text-[11px] text-slate-500">You'll walk in right as your turn comes.</p>
        </div>
      </div>
    </motion.div>
  );
}

const FEATURES = [
  { icon: MapPinned, title: 'Live wait map', text: 'See the real wait at every bank, barber, office and shop near you, right now.' },
  { icon: Footprints, title: 'Leave home now', text: 'Turnly matches your travel time to the queue speed and tells you exactly when to go.' },
  { icon: Route, title: 'Plan my errands', text: 'Bank, barber and passport office? Get the order with the least total waiting.' },
  { icon: Repeat2, title: 'Swap my spot', text: "In a hurry? Ask to swap. Help someone and earn kindness points for later." },
  { icon: Monitor, title: 'TV mode', text: 'Any screen becomes a live token board that announces calls out loud.' },
  { icon: Languages, title: 'Speaks your language', text: 'Calls in English, Malay, Malayalam, Tamil, Hindi and Arabic.' },
  { icon: Users, title: 'Family token', text: 'The whole family joins as one token, not five.' },
  { icon: CalendarClock, title: 'Best time to come', text: "Every place shows when it's usually quiet, built from its own history." },
];

export default function Landing() {
  const { places } = usePlaces();
  const today = todayKey();
  const waitingNow = places.reduce((s, p) => s + (p.dayKey === today ? p.waiting : 0), 0);
  const servedToday = places.reduce((s, p) => s + (p.dayKey === today ? p.servedToday : 0), 0);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_80%_-10%,#c9f6ec,transparent),radial-gradient(40rem_20rem_at_0%_20%,#feeac7,transparent)]" />
        <div className="container-x grid items-center gap-12 py-14 md:grid-cols-[1.1fr_.9fr] md:py-24">
          <div>
            <motion.span variants={fade} initial="hidden" animate="show" className="chip bg-white text-brand-700 ring-brand-200">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Google Maps for waiting
            </motion.span>
            <motion.h1
              variants={fade}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl"
            >
              No one should ever <span className="text-brand-600">wait in line</span> again.
            </motion.h1>
            <motion.p variants={fade} initial="hidden" animate="show" custom={2} className="mt-5 max-w-xl text-lg text-slate-600">
              See how long the line is at any bank, shop, office or school counter. Join from anywhere, and Turnly calls you when it's
              your turn. The line comes to your phone.
            </motion.p>
            <motion.div variants={fade} initial="hidden" animate="show" custom={3} className="mt-8 flex flex-wrap gap-3">
              <Link to="/explore" className="btn-primary px-5 py-3 text-base">
                <MapPinned size={18} /> Find a queue near me
              </Link>
              <Link to="/business" className="btn-ghost px-5 py-3 text-base">
                Set up my business, free <ArrowRight size={18} />
              </Link>
            </motion.div>
            <motion.div variants={fade} initial="hidden" animate="show" custom={4} className="mt-10 flex flex-wrap gap-8">
              <div>
                <p className="text-3xl font-extrabold text-slate-900">
                  <CountUp value={servedToday} />
                </p>
                <p className="text-sm text-slate-500">people served today without standing in line</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900">
                  <CountUp value={waitingNow} />
                </p>
                <p className="text-sm text-slate-500">waiting from anywhere right now</p>
              </div>
            </motion.div>
          </div>
          <PhoneMock />
        </div>
      </section>

      {/* How it works */}
      <section className="container-x py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Three taps. Zero standing.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { icon: QrCode, title: 'Scan or tap', text: 'Scan the QR at the door, or join from the map before you even leave home.' },
            { icon: Ticket, title: 'Get your token', text: 'See your place, the people ahead of you and a live estimate of your turn.' },
            { icon: Bell, title: 'Get called', text: 'Your phone buzzes when you are two away, and again when it is your turn.' },
          ].map((s, i) => (
            <motion.div
              key={s.title}
              variants={fade}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              className="card p-6"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <s.icon size={22} />
              </span>
              <p className="mt-4 text-xs font-bold text-slate-400">STEP {i + 1}</p>
              <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* City pulse */}
      <section className="container-x py-12">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">City pulse</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">The whole city's waiting, in one view.</h2>
            <p className="mt-4 text-slate-600">
              Every place glows by how busy it is. Places that never signed up still show a live estimate, because the people standing in
              line report it, the way Waze works for traffic.
            </p>
            <Link to="/explore" className="btn-dark mt-6">
              Open the live map <ArrowRight size={16} />
            </Link>
          </div>
          <CityPulse className="aspect-[4/3]" />
        </div>
      </section>

      {/* Features */}
      <section className="container-x py-16">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Built for the way people really wait.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fade}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i % 4}
              className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <f.icon className="text-brand-600 transition group-hover:scale-110" size={22} />
              <h3 className="mt-3 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modes */}
      <section className="container-x py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Building2, title: 'City', text: 'Banks, barbers, pharmacies, shops and government offices.', tint: 'from-brand-50' },
            { icon: GraduationCap, title: 'School', text: 'Parent-teacher meetings with a planned route through every teacher.', tint: 'from-sun-50' },
            { icon: Timer, title: 'Events', text: 'Fests, registration desks and ticket counters.', tint: 'from-slate-100' },
          ].map((m) => (
            <div key={m.title} className={`rounded-2xl bg-gradient-to-b ${m.tint} to-white p-6 ring-1 ring-slate-200/70`}>
              <m.icon className="text-slate-800" size={26} />
              <h3 className="mt-3 text-xl font-extrabold">{m.title} mode</h3>
              <p className="mt-1 text-sm text-slate-600">{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business CTA */}
      <section className="container-x py-16">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-white sm:px-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Run your queue in two minutes.</h2>
              <p className="mt-3 max-w-lg text-slate-300">
                Name your place, print the QR code, tap “Next”. Turnly handles the line, the TV board, the announcements and the numbers
                behind your busiest hours.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link to="/business/new" className="btn bg-white px-5 py-3 text-base text-slate-900 hover:bg-slate-100">
                Create my queue <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-8 text-sm text-slate-500 sm:flex-row">
          <Logo size={26} />
          <p>Built by Muhammad Hasan · International Digital Fest 2027</p>
        </div>
      </footer>
    </div>
  );
}
