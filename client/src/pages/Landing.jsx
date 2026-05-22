import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion'
import {
  Users, Bell, Flame, Star, Calendar,
  MessageSquare, Search, Zap, ChevronRight,
  ArrowRight, Check, Sparkles, Network, ScanLine,
} from 'lucide-react'
import Logo from '../components/layout/Logo.jsx'

/* ─── animation variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
}
const stagger = (delayBase = 0) => ({
  hidden: {},
  show:   { transition: { staggerChildren: 0.12, delayChildren: delayBase } },
})
const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
}

/* ─── reusable section wrapper ───────────────────────────────────── */
function Section({ children, className = '' }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref}
      variants={stagger()}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  )
}

/* ─── feature card ───────────────────────────────────────────────── */
const features = [
  {
    icon: Zap,
    color: 'amber',
    title: 'Daily Touchbase',
    body: 'A priority algorithm scores every contact by overdue-ness and relationship strength, surfacing exactly who needs your attention today.',
  },
  {
    icon: Flame,
    color: 'orange',
    title: 'Streak System',
    body: 'Keep your networking habit alive. Hit 7, 14, 30, 60, and 90-day milestones with confetti celebrations that actually make you want to come back.',
  },
  {
    icon: MessageSquare,
    color: 'rose',
    title: 'Smart Templates',
    body: '10 human-sounding message templates with {name}, {company}, and {title} placeholders — auto-matched to each contact\'s category and relationship strength.',
  },
  {
    icon: ScanLine,
    color: 'violet',
    title: 'LinkedIn OCR',
    body: 'Upload any LinkedIn profile screenshot. Tesseract.js reads it client-side and auto-fills the contact form — no manual typing.',
  },
  {
    icon: Calendar,
    color: 'sky',
    title: 'Follow-up Calendar',
    body: 'Monthly calendar with colour-coded dots showing who\'s due, overdue, or on track. Never lose track of where you stand with someone.',
  },
  {
    icon: Search,
    color: 'emerald',
    title: 'Cmd+K Search',
    body: 'Global full-text search powered by PostgreSQL tsvector + GIN index. Find any contact in milliseconds across names, companies, tags, and notes.',
  },
]

const colorMap = {
  amber:   { bg: 'bg-amber-50  dark:bg-amber-900/20',  icon: 'text-amber-500',   ring: 'ring-amber-200 dark:ring-amber-700' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-500',  ring: 'ring-orange-200 dark:ring-orange-700' },
  rose:    { bg: 'bg-rose-50   dark:bg-rose-900/20',   icon: 'text-rose-500',    ring: 'ring-rose-200   dark:ring-rose-700' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-900/20', icon: 'text-violet-500',  ring: 'ring-violet-200 dark:ring-violet-700' },
  sky:     { bg: 'bg-sky-50    dark:bg-sky-900/20',    icon: 'text-sky-500',     ring: 'ring-sky-200    dark:ring-sky-700' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-700' },
}

function FeatureCard({ icon: Icon, color, title, body }) {
  const c = colorMap[color]
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800
                 p-6 shadow-sm hover:shadow-lg hover:shadow-gray-200/60 dark:hover:shadow-black/30
                 transition-shadow duration-300"
    >
      <div className={`inline-flex p-2.5 rounded-xl ${c.bg} ring-1 ${c.ring} mb-4`}>
        <Icon size={20} className={c.icon} />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{body}</p>
    </motion.div>
  )
}

/* ─── how-it-works step ──────────────────────────────────────────── */
const steps = [
  { n: '01', title: 'Add your contacts', body: 'Import from LinkedIn via OCR, paste a CSV, or add people manually. Tag them by relationship type and set a follow-up frequency.' },
  { n: '02', title: 'Get your daily pick', body: 'Every day Touchbase surfaces the one person you should reach out to. One contact, one focus — no decision fatigue.' },
  { n: '03', title: 'Send the message', body: 'Pick a template, personalise it in seconds, and send. Log the interaction and your streak ticks up. Simple.' },
]

/* ─── testimonials ────────────────────────────────────────────────── */
const testimonials = [
  { quote: 'Touchbase turned my chaotic contact list into actual relationships. My network feels alive again.', name: 'Sarah K.', role: 'Founder, Series A startup' },
  { quote: 'I always meant to stay in touch. Now I actually do — the daily pick is weirdly motivating.', name: 'James R.', role: 'Senior Engineer, FAANG' },
  { quote: 'The LinkedIn OCR alone saves me 20 minutes every time I meet someone at a conference.', name: 'Priya M.', role: 'VC Associate' },
]

/* ─── stats ───────────────────────────────────────────────────────── */
const stats = [
  { value: '2 min', label: 'avg. daily touchbase' },
  { value: '10×', label: 'more follow-ups than before' },
  { value: '90 days', label: 'longest streak milestone' },
]

/* ─── pricing / plan bullets ─────────────────────────────────────── */
const planFeatures = [
  'Unlimited contacts',
  'Daily priority picks',
  'Smart message templates',
  'LinkedIn OCR import',
  'Streak system & milestones',
  'Follow-up calendar',
  'Full-text search (Cmd+K)',
  'Dark mode + PWA',
  'Push notifications',
  'CSV import / export',
]

/* ════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const heroRef     = useRef(null)
  const { scrollY } = useScroll()
  const blobY       = useTransform(scrollY, [0, 600], [0, -80])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 h-16
                   bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900"
      >
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-amber-500 hover:bg-amber-600
                       text-white px-4 py-2 rounded-xl shadow-md shadow-amber-500/25 transition-all
                       active:scale-[0.97]"
          >
            Get started <ChevronRight size={14} />
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Decorative blobs */}
        <motion.div
          style={{ y: blobY }}
          className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px]
                     rounded-full bg-amber-400/20 dark:bg-amber-500/10 blur-[100px]"
        />
        <motion.div
          style={{ y: blobY }}
          className="pointer-events-none absolute -bottom-40 -left-40 w-[500px] h-[500px]
                     rounded-full bg-orange-400/15 dark:bg-orange-500/10 blur-[100px]"
        />

        <motion.div
          style={{ opacity: heroOpacity }}
          variants={stagger(0.1)}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-3xl mx-auto"
        >
          {/* Eyebrow badge */}
          <motion.div variants={fadeUp} className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider
                             text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30
                             border border-amber-200 dark:border-amber-700 px-3.5 py-1.5 rounded-full">
              <Sparkles size={11} /> Personal CRM for real humans
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
          >
            Stay genuinely
            <br />
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              in touch
            </span>
            <br />
            with people who matter.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Touchbase is the personal CRM that reminds you who to reach out to today —
            before silence turns into distance. One contact a day. That&apos;s it.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600
                         text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/30
                         transition-all active:scale-[0.97] text-base"
            >
              Get started
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              >
                <ArrowRight size={18} />
              </motion.span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300
                         hover:text-gray-900 dark:hover:text-white font-medium px-6 py-4
                         rounded-2xl border border-gray-200 dark:border-gray-700
                         hover:border-gray-300 dark:hover:border-gray-600 transition-all text-base
                         bg-white dark:bg-gray-900"
            >
              Sign in
            </Link>
          </motion.div>

          {/* Social proof line */}
          <motion.p
            variants={fadeUp}
            className="text-xs text-gray-400 dark:text-gray-600 mt-6"
          >
            Works as a PWA on iOS & Android
          </motion.p>
        </motion.div>

        {/* Hero mock card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ delay: 0.55, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 mt-16 max-w-sm mx-auto"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-gray-300/40 dark:shadow-black/60
                          border border-gray-100 dark:border-gray-800 p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Today&apos;s Touchbase</span>
              <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-semibold bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
                <Flame size={10} /> 14-day streak
              </span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                A
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Alex Chen</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Product Manager · Stripe</p>
              </div>
              <div className="ml-auto flex items-center gap-0.5">
                {[1,2,3,4].map(i => (
                  <Star key={i} size={12} fill="#F59E0B" className="text-amber-400" />
                ))}
                <Star size={12} className="text-gray-300 dark:text-gray-600" />
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-3">
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                💬 &quot;Hey Alex! It&apos;s been a while — hope things at Stripe are going well.
                I came across something you&apos;d love. Got 15 minutes this week?&quot;
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-amber-500 rounded-xl py-2 text-center text-xs font-semibold text-white shadow-sm shadow-amber-500/30">
                Send message
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Skip
              </div>
            </div>
          </div>
          {/* Floating notification badge */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg"
          >
            1 new pick
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <Section className="py-16 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {stats.map(s => (
            <motion.div key={s.label} variants={fadeUp}>
              <p className="text-3xl md:text-4xl font-black text-amber-500 mb-1">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Features ───────────────────────────────────────────── */}
      <Section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Everything you need</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Built for people, not spreadsheets.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Touchbase is a CRM that feels more like a habit than a tool — lightweight, opinionated,
              and ruthlessly focused on the one thing that matters: actually staying in touch.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </Section>

      {/* ── How it works ───────────────────────────────────────── */}
      <Section className="py-24 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Simple by design</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Three steps. That&apos;s literally it.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                className="relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(100%+16px)] w-8 text-gray-300 dark:text-gray-700">
                    <ArrowRight size={20} />
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <span className="text-4xl font-black text-amber-500/30 dark:text-amber-500/20 leading-none select-none">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{s.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <Section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Real people, real results</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Relationships that actually happen.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <motion.div
                key={t.name}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800
                           p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#F59E0B" className="text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-5">
                  &quot;{t.quote}&quot;
                </p>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Everything included ────────────────────────────────── */}
      <Section className="py-24 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-2xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">What's included</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Everything you need.</h2>
            <p className="text-gray-500 dark:text-gray-400">
              All features, no compromises.
            </p>
          </motion.div>

          <motion.div
            variants={scaleIn}
            className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800
                       shadow-xl shadow-gray-200/50 dark:shadow-black/40 p-8"
          >
            <ul className="grid sm:grid-cols-2 gap-3 mb-8">
              {planFeatures.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30
                                   flex items-center justify-center">
                    <Check size={11} className="text-amber-600 dark:text-amber-400" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to="/signup"
              className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-bold
                         py-4 rounded-2xl shadow-lg shadow-amber-500/30 transition-all
                         active:scale-[0.97] text-center"
            >
              Create your account
            </Link>
          </motion.div>
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <Section className="py-24 px-6">
        <motion.div
          variants={scaleIn}
          className="max-w-3xl mx-auto text-center relative"
        >
          {/* Glow */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-amber-400/10 blur-3xl -z-10" />

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-12 shadow-2xl shadow-amber-500/30">
            <Network size={40} className="text-white/60 mx-auto mb-5" />
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Your network won&apos;t grow itself.
            </h2>
            <p className="text-amber-100 mb-8 text-lg max-w-lg mx-auto">
              Start your first touchbase today. One message. One relationship. One day at a time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-white text-amber-600 font-bold
                           px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all
                           active:scale-[0.97] text-base"
              >
                Get started <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="text-amber-100 hover:text-white font-medium transition-colors text-sm"
              >
                Already have an account? Sign in →
              </Link>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-gray-900 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Touchbase — relationships that last.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/login"  className="text-sm text-gray-400 hover:text-amber-500 transition-colors">Sign in</Link>
            <Link to="/signup" className="text-sm text-gray-400 hover:text-amber-500 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
