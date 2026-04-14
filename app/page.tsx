"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useInView,
} from "framer-motion";
import {
  HeartIcon,
  ArrowRightIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  Bars3Icon,
  XMarkIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  MapPinIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
  LightBulbIcon,
  BoltIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

/* ─────────────────────────────────────────────
   Animation variants
───────────────────────────────────────────── */
const ease = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = {
  hidden:   { opacity: 0, y: 48 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

const fadeIn = {
  hidden:   { opacity: 0 },
  visible:  { opacity: 1, transition: { duration: 0.6, ease } },
};

const staggerContainer = {
  hidden:   {},
  visible:  { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const slideRight = {
  hidden:   { opacity: 0, x: 60 },
  visible:  { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 mb-4">
      <span className="h-px w-6 bg-emerald-500 inline-block" />
      {children}
    </span>
  );
}

function AnimatedCount({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const inView = useInView(ref, { once: true, margin: "-20%" });

  useEffect(() => {
    if (!inView || started.current || target === 0) return;
    started.current = true;
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return <span ref={ref}>{count}</span>;
}

/* ─────────────────────────────────────────────
   Navbar
───────────────────────────────────────────── */
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  const navLinks = [
    { label: "Who We Are",    id: "who-we-are"   },
    { label: "Mission",       id: "mission"       },
    { label: "Vision",        id: "vision"        },
    { label: "How It Works",  id: "how-it-works"  },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-gray-100/80 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className={`text-sm font-bold tracking-tight transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
              Hope Link
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer font-medium ${
                  scrolled
                    ? "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/user/login"
              className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
                scrolled
                  ? "text-violet-600 border-violet-200 hover:bg-violet-50"
                  : "text-white border-white/30 hover:bg-white/10"
              }`}
            >
              Volunteer Login
            </Link>
            <Link
              href="/charity/login"
              className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              Charity Login
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className={`md:hidden p-2 rounded-lg cursor-pointer ${scrolled ? "text-gray-700" : "text-white"}`}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        </nav>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100">
                <span className="font-bold text-gray-900">Menu</span>
                <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 px-4 py-6 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-4 py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
              <div className="px-4 pb-8 space-y-3">
                <Link href="/user/login" onClick={() => setMenuOpen(false)}
                  className="block text-sm font-semibold text-center text-violet-600 border border-violet-200 hover:bg-violet-50 px-4 py-3 rounded-xl transition-colors">
                  Volunteer Login
                </Link>
                <Link href="/charity/login" onClick={() => setMenuOpen(false)}
                  className="block text-sm font-semibold text-center text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-3 rounded-xl transition-colors">
                  Charity Login
                </Link>
                <Link href="/charity/register" onClick={() => setMenuOpen(false)}
                  className="block text-sm font-semibold text-center text-gray-600 hover:text-gray-900 px-4 py-3 rounded-xl transition-colors border border-gray-200">
                  Register NGO
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────────────────────────
   Hero
───────────────────────────────────────────── */
function Hero({ stats }: { stats: { volunteers: number; charities: number; opportunities: number } | null }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950">
      {/* Static background  no JS animation, GPU-composited via CSS only */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#064e3b33_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#4c1d9533_0%,_transparent_60%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div variants={fadeIn}>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-4 py-1.5 rounded-full mb-8">
              <SparklesIcon className="h-3 w-3" />
              Lebanon&apos;s Volunteering Platform
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight text-white"
          >
            Where{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-violet-400 to-violet-300 bg-clip-text text-transparent">
                Volunteers
              </span>
            </span>
            <br />
            Meet Their{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Cause
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-7 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed"
          >
            Hope Link is Lebanon&apos;s dedicated platform connecting passionate
            volunteers with NGOs creating real, lasting social impact  matching
            skills, locations, and schedules with opportunities that matter.
          </motion.p>

          {/* Live stats */}
          {stats && (
            <motion.div
              variants={fadeUp}
              className="mt-16 grid grid-cols-3 gap-6 md:gap-12"
            >
              {[
                { value: stats.volunteers,   label: "Active Volunteers", suffix: "+"  },
                { value: stats.charities,    label: "NGOs on Platform",  suffix: "+"  },
                { value: stats.opportunities,label: "Open Opportunities",suffix: ""   },
              ].map(({ value, label, suffix }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl md:text-4xl font-black text-white">
                    <AnimatedCount target={value} />
                    <span className="text-emerald-400">{suffix}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Who We Are
───────────────────────────────────────────── */
function WhoWeAre() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  const pillars = [
    { icon: MapPinIcon,      color: "text-emerald-600 bg-emerald-50 border-emerald-100", label: "Rooted in Lebanon", desc: "Built specifically for the Lebanese context  our cities, our NGOs, our communities." },
    { icon: ShieldCheckIcon, color: "text-blue-600 bg-blue-50 border-blue-100",          label: "Verified Network",  desc: "Every NGO on the platform is reviewed and approved by our admin team before going live." },
    { icon: BoltIcon,        color: "text-violet-600 bg-violet-50 border-violet-100",    label: "Smart Matching",    desc: "Our algorithm ranks opportunities by how well they fit your skills, city, and availability." },
  ];

  return (
    <section id="who-we-are" className="py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <motion.div variants={fadeIn}>
              <SectionLabel>Who We Are</SectionLabel>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-black leading-tight text-gray-900"
            >
              Lebanon&apos;s First
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">
                Coordinated
              </span>{" "}
              Volunteering
              <br />
              Ecosystem
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-6 text-gray-500 leading-relaxed text-lg">
              Hope Link was built from a simple observation: Lebanon has no shortage of
              willing volunteers or worthy causes  it lacked the infrastructure to
              bring them together systematically.
            </motion.p>
            <motion.p variants={fadeUp} className="mt-4 text-gray-500 leading-relaxed">
              We are a digital platform that manages the full volunteering lifecycle:
              from registration and profile building, to opportunity discovery,
              application review, volunteer coordination, and verified certificates 
              all in one place, for both individuals and organizations.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-10 flex gap-4">
              <Link
                href="/charity/register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-5 py-2.5 rounded-xl transition-colors"
              >
                Join as an NGO <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/user/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-5 py-2.5 rounded-xl transition-colors"
              >
                Start Volunteering <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right  pillar cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-4"
          >
            {pillars.map(({ icon: Icon, color, label, desc }) => (
              <motion.div
                key={label}
                variants={slideRight}
                className="flex items-start gap-5 bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md rounded-2xl p-6 transition-all duration-300"
              >
                <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{label}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}

            {/* Quote */}
            <motion.div
              variants={slideRight}
              className="bg-slate-900 rounded-2xl p-6 text-white"
            >
              <p className="text-sm leading-relaxed text-slate-300 italic">
                &ldquo;We believe a well-connected civil society is a resilient one 
                and that technology can close the gap between intention and action
                across every Lebanese community.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-xs text-slate-400 font-medium">The Hope Link Team</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Mission
───────────────────────────────────────────── */
function Mission() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  const items = [
    "Connect volunteers with NGOs through personalized opportunity matching",
    "Reduce the administrative burden on non-profit organizations",
    "Build a verified, searchable volunteer network across Lebanon",
    "Create accountability through transparent application and rating systems",
    "Issue and preserve digital volunteering certificates for every contribution",
  ];

  return (
    <section id="mission" className="py-32 px-6 bg-slate-950 overflow-hidden">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Section number */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1 }}
          className="text-[120px] md:text-[180px] font-black text-white/[0.03] leading-none select-none mb-[-40px] md:mb-[-60px]"
        >
          01
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12 items-start relative z-10">
          {/* Left */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="lg:col-span-2"
          >
            <motion.div variants={fadeIn}>
              <SectionLabel>Our Mission</SectionLabel>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-black text-white leading-tight"
            >
              Making
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Volunteering
              </span>
              <br />
              Accessible
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-6 text-slate-400 leading-relaxed">
              Our mission is to empower Lebanese civil society by making
              volunteering structured, accessible, and impactful  creating a
              reliable bridge between individuals who want to give their time
              and organizations that need it.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-8 inline-flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold px-5 py-3 rounded-2xl"
            >
              <GlobeAltIcon className="h-5 w-5" />
              Serving Communities Across Lebanon
            </motion.div>
          </motion.div>

          {/* Right */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="lg:col-span-3 space-y-3"
          >
            {items.map((item, i) => (
              <motion.div
                key={i}
                variants={slideRight}
                className="flex items-start gap-4 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-2xl px-6 py-4 transition-colors"
              >
                <span className="text-emerald-500 font-black text-sm mt-0.5 shrink-0 w-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-slate-300 text-sm leading-relaxed">{item}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Vision
───────────────────────────────────────────── */
function Vision() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  const pillars = [
    {
      icon: UserGroupIcon,
      title: "Every Volunteer Finds Their Cause",
      desc: "A platform where any Lebanese resident  regardless of location, profession, or background  can find a volunteering opportunity that genuinely matches who they are.",
    },
    {
      icon: TrophyIcon,
      title: "Every NGO Reaches Its Potential",
      desc: "NGOs focus on their mission, not on logistics. Hope Link handles recruitment, coordination, communication, and recognition on their behalf.",
    },
    {
      icon: RocketLaunchIcon,
      title: "Civil Society That Scales",
      desc: "A future where the Lebanese civil sector operates with the efficiency and reach of a modern organization  powered by a connected, motivated volunteer workforce.",
    },
  ];

  return (
    <section id="vision" className="py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1 }}
          className="text-[120px] md:text-[180px] font-black text-gray-900/[0.03] leading-none select-none mb-[-40px] md:mb-[-60px]"
        >
          02
        </motion.div>

        <div className="relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="max-w-3xl"
          >
            <motion.div variants={fadeIn}>
              <SectionLabel>Our Vision</SectionLabel>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-black text-gray-900 leading-tight"
            >
              A Lebanon Where
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent">
                Goodwill Becomes
              </span>
              <br />
              Action
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-6 text-gray-500 text-lg leading-relaxed"
            >
              We envision a Lebanon where the gap between wanting to help and
              actually helping is measured in minutes, not months  where every
              NGO has the people-power to fulfil its mission, and every volunteer
              has a cause worth their time.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid md:grid-cols-3 gap-6 mt-16"
          >
            {pillars.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group relative bg-gray-50 hover:bg-white border border-gray-100 hover:border-violet-100 hover:shadow-xl hover:shadow-violet-50 rounded-3xl p-8 transition-all duration-500 cursor-default"
              >
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center mb-6 shadow-lg shadow-violet-200 group-hover:shadow-violet-300 transition-shadow">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">{title}</h3>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">{desc}</p>
                <div className="absolute bottom-6 right-6 text-4xl font-black text-gray-900/[0.04] leading-none select-none">
                  {String(i + 1).padStart(2, "0")}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Goals
───────────────────────────────────────────── */
function Goals() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  const goals = [
    { icon: MapPinIcon,      title: "National Coverage",    color: "emerald", desc: "Reach all 15 Lebanese cities and districts, ensuring volunteering opportunities exist for communities across the country." },
    { icon: BuildingOfficeIcon, title: "100 NGOs by 2026",  color: "blue",    desc: "Onboard 100 verified non-profits and civil society organizations representing every sector  health, education, environment, welfare, and more." },
    { icon: UserGroupIcon,   title: "10,000 Volunteers",    color: "violet",  desc: "Build a verified, active volunteer roster of 10,000 individuals with complete profiles, skills, and availability data." },
    { icon: CheckBadgeIcon,  title: "Verified Impact",      color: "amber",   desc: "Establish a trusted certification system so every volunteer's contributions are recognized, portable, and verifiable by future employers or institutions." },
  ];

  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-200",
    blue:    "from-blue-500 to-cyan-600 shadow-blue-200",
    violet:  "from-violet-500 to-purple-700 shadow-violet-200",
    amber:   "from-amber-500 to-orange-600 shadow-amber-200",
  };

  return (
    <section id="goals" className="py-32 px-6 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1 }}
          className="text-[120px] md:text-[180px] font-black text-slate-900/[0.035] leading-none select-none mb-[-40px] md:mb-[-60px]"
        >
          03
        </motion.div>

        <div className="relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14"
          >
            <div>
              <motion.div variants={fadeIn}>
                <SectionLabel>Our Goals</SectionLabel>
              </motion.div>
              <motion.h2
                variants={fadeUp}
                className="text-4xl md:text-5xl font-black text-gray-900 leading-tight"
              >
                Building Toward
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Lasting Impact
                </span>
              </motion.h2>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {goals.map(({ icon: Icon, title, color, desc }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm hover:shadow-lg transition-shadow duration-500"
              >
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center mb-5 shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 leading-snug">{title}</h3>
                <p className="mt-2.5 text-xs text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   How It Works
───────────────────────────────────────────── */
function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  const steps = [
    {
      n: "01",
      icon: CheckBadgeIcon,
      color: "emerald",
      title: "Register",
      forLabel: "Volunteers & NGOs",
      desc: "Create a free volunteer profile with your skills, city, and availability  or submit an NGO registration request. Our team reviews and activates your account within days.",
    },
    {
      n: "02",
      icon: MagnifyingGlassIcon,
      color: "blue",
      title: "Browse Opportunities",
      forLabel: "Volunteers",
      desc: "Discover volunteering opportunities ranked by how closely they match your unique profile. Every listing shows a personalized fit score so you apply with confidence.",
    },
    {
      n: "03",
      icon: HeartIcon,
      color: "violet",
      title: "Volunteer",
      forLabel: "Make a Difference",
      desc: "Apply, get approved by the NGO, coordinate via the built-in chat room, and make a real difference. Earn a verified digital certificate for every completed opportunity.",
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; badge: string; line: string }> = {
    emerald: { bg: "from-emerald-500 to-teal-600", text: "text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-100", line: "bg-emerald-200" },
    blue:    { bg: "from-blue-500 to-cyan-600",    text: "text-blue-600",    badge: "bg-blue-50 text-blue-700 border-blue-100",          line: "bg-blue-200"   },
    violet:  { bg: "from-violet-500 to-purple-700",text: "text-violet-600",  badge: "bg-violet-50 text-violet-700 border-violet-100",    line: "bg-violet-200" },
  };

  return (
    <section id="how-it-works" className="py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-20"
        >
          <motion.div variants={fadeIn}>
            <SectionLabel>How It Works</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mt-1"
          >
            Three Steps to
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">
              Making a Difference
            </span>
          </motion.h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-14 left-[calc(16.666%+24px)] right-[calc(16.666%+24px)] h-px bg-gradient-to-r from-emerald-200 via-blue-200 to-violet-200" />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid md:grid-cols-3 gap-8"
          >
            {steps.map(({ n, icon: Icon, color, title, forLabel, desc }) => (
              <motion.div key={n} variants={fadeUp} className="relative flex flex-col items-start">
                <div className="relative mb-7">
                  {/* Step number circle */}
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${colorMap[color].bg} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`absolute -top-2 -right-3 text-[10px] font-black ${colorMap[color].text} opacity-60`}>
                    {n}
                  </span>
                </div>

                <span className={`inline-flex text-[10px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-full mb-3 ${colorMap[color].badge}`}>
                  {forLabel}
                </span>
                <h3 className="text-xl font-black text-gray-900">{title}</h3>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA
───────────────────────────────────────────── */
function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section className="py-8 px-6 bg-white">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.7, ease }}
        className="max-w-6xl mx-auto bg-slate-950 rounded-3xl px-8 py-20 text-center relative overflow-hidden"
      >
        {/* Background glows */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-4 py-1.5 rounded-full mb-6">
            <LightBulbIcon className="h-3 w-3" />
            Ready to Get Started?
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Your Impact Starts
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent">
              Today
            </span>
          </h2>
          <p className="mt-5 text-slate-400 max-w-lg mx-auto leading-relaxed">
            Whether you have a few hours or want to make volunteering a lifestyle 
            whether you run a small community group or a national NGO  Hope Link
            meets you where you are.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/user/login"
              className="group inline-flex items-center gap-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-violet-900/50 hover:-translate-y-0.5 text-sm"
            >
              <UserGroupIcon className="h-4 w-4" />
              Volunteer Portal
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/charity/login"
              className="group inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-900/50 hover:-translate-y-0.5 text-sm"
            >
              <BuildingOfficeIcon className="h-4 w-4" />
              Charity Portal
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/charity/register"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white font-medium text-sm border border-white/10 hover:border-white/30 px-6 py-3.5 rounded-2xl transition-all"
            >
              Register an NGO
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Footer
───────────────────────────────────────────── */
function Footer() {
  const columns = [
    {
      title: "Platform",
      links: [
        { label: "Volunteer Login",    href: "/user/login"        },
        { label: "Charity Login",      href: "/charity/login"     },
        { label: "Register an NGO",    href: "/charity/register"  },
      ],
    },
    {
      title: "Discover",
      links: [
        { label: "Who We Are",   href: "#who-we-are"  },
        { label: "Our Mission",  href: "#mission"     },
        { label: "Our Vision",   href: "#vision"      },
        { label: "How It Works", href: "#how-it-works"},
      ],
    },
  ];

  return (
    <footer className="bg-gray-950 pt-16 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/[0.06]">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <span className="text-base font-bold text-white">Hope Link</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Lebanon&apos;s dedicated platform connecting passionate volunteers
              with NGOs creating real, lasting social impact.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <Link href="/user/login"
                className="text-xs font-semibold text-violet-400 border border-violet-400/20 hover:bg-violet-400/10 px-3.5 py-2 rounded-xl transition-colors">
                Volunteer Portal
              </Link>
              <Link href="/charity/login"
                className="text-xs font-semibold text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/10 px-3.5 py-2 rounded-xl transition-colors">
                Charity Portal
              </Link>
            </div>
          </div>

          {/* Links */}
          {columns.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-5">{title}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Hope Link. All rights reserved.
          </p>
          <p className="text-xs text-gray-700">
            Connecting volunteers with NGOs across Lebanon.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
interface Stats {
  volunteers: number;
  charities: number;
  opportunities: number;
}

export default function LandingPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/stats`)
      .then((r) => r.json())
      .then((json) => setStats(json.data ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <Navbar />
      <Hero stats={stats} />
      <WhoWeAre />
      <Mission />
      <Vision />
      <Goals />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}
