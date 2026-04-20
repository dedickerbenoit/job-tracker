import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/Footer';
import { t } from '@/lib/i18n';
import {
  Columns3,
  Clock,
  BarChart3,
  UserPlus,
  PlusCircle,
  GripVertical,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';

function ChromeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  );
}

const CHROME_STORE_URL = '#'; // TODO: replace with real Chrome Web Store URL

// ---------------------------------------------------------------------------
// Scroll-reveal hook
// ---------------------------------------------------------------------------
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, className: visible ? 'landing-reveal landing-visible' : 'landing-reveal' };
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { href: '#features', label: t.landing.nav.features },
    { href: '#how-it-works', label: t.landing.nav.howItWorks },
    { href: '#faq', label: t.landing.nav.faq },
  ];

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/80 shadow-sm backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-xl font-bold tracking-tight">
          JobTracker
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <Link to="/dashboard">
            <Button size="sm">{t.landing.nav.cta}</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-b bg-background px-4 pb-4 md:hidden">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <Link to="/dashboard" className="mt-2 block">
            <Button className="w-full" size="sm">
              {t.landing.nav.cta}
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden pt-16">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {t.landing.hero.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          {t.landing.hero.subtitle}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/dashboard">
            <Button size="lg" className="h-12 px-6 text-base">
              {t.landing.hero.ctaDashboard}
            </Button>
          </Link>
          <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="h-12 px-6 text-base">
              <ChromeIcon className="mr-2 size-5" />
              {t.landing.hero.ctaExtension}
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Logos banner
// ---------------------------------------------------------------------------
function LogosBanner() {
  const reveal = useReveal<HTMLDivElement>();

  const logos = [
    { name: 'LinkedIn', color: '#0A66C2' },
    { name: 'Indeed', color: '#2164F3' },
  ];

  return (
    <section {...reveal} ref={reveal.ref} className={`py-12 ${reveal.className}`}>
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {t.landing.logos.title}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {logos.map((logo) => (
            <span
              key={logo.name}
              className="text-lg font-bold tracking-tight text-muted-foreground/60 transition-colors hover:text-foreground"
              style={{ color: undefined }}
            >
              {logo.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------
function Features() {
  const reveal = useReveal<HTMLDivElement>();

  const features = [
    {
      icon: Columns3,
      title: t.landing.features.kanban.title,
      description: t.landing.features.kanban.description,
    },
    {
      icon: ChromeIcon,
      title: t.landing.features.extension.title,
      description: t.landing.features.extension.description,
    },
    {
      icon: Clock,
      title: t.landing.features.timeline.title,
      description: t.landing.features.timeline.description,
    },
    {
      icon: BarChart3,
      title: t.landing.features.stats.title,
      description: t.landing.features.stats.description,
    },
  ];

  return (
    <section id="features" {...reveal} ref={reveal.ref} className={`py-24 ${reveal.className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.landing.features.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{t.landing.features.subtitle}</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                <f.icon className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------
function HowItWorks() {
  const reveal = useReveal<HTMLDivElement>();

  const steps = [
    { icon: UserPlus, ...t.landing.howItWorks.step1 },
    { icon: PlusCircle, ...t.landing.howItWorks.step2 },
    { icon: GripVertical, ...t.landing.howItWorks.step3 },
  ];

  return (
    <section
      id="how-it-works"
      {...reveal}
      ref={reveal.ref}
      className={`bg-muted/40 py-24 ${reveal.className}`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.landing.howItWorks.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{t.landing.howItWorks.subtitle}</p>
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Screenshot / Demo
// ---------------------------------------------------------------------------
function Screenshot() {
  const reveal = useReveal<HTMLDivElement>();

  return (
    <section {...reveal} ref={reveal.ref} className={`py-24 ${reveal.className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.landing.screenshot.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{t.landing.screenshot.subtitle}</p>
        </div>

        {/* Mockup frame */}
        <div className="mt-12 overflow-hidden rounded-2xl border bg-card shadow-2xl">
          {/* Browser chrome bar */}
          <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
            <div className="size-3 rounded-full bg-destructive/40" />
            <div className="size-3 rounded-full bg-warning/40" />
            <div className="size-3 rounded-full bg-success/40" />
            <div className="ml-4 h-6 flex-1 rounded-md bg-muted text-center text-xs leading-6 text-muted-foreground">
              app.jobtracker.fr/dashboard/kanban
            </div>
          </div>
          {/* Kanban mockup */}
          <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
            {[
              { label: t.status.to_apply, count: 3, color: 'bg-blue-100 dark:bg-blue-900/30' },
              { label: t.status.applied, count: 5, color: 'bg-indigo-100 dark:bg-indigo-900/30' },
              { label: t.status.interview, count: 2, color: 'bg-amber-100 dark:bg-amber-900/30' },
              { label: t.status.offer, count: 1, color: 'bg-emerald-100 dark:bg-emerald-900/30' },
            ].map((col) => (
              <div key={col.label} className={`rounded-xl ${col.color} p-3`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold">{col.label}</span>
                  <span className="rounded-full bg-background px-1.5 text-[10px] font-medium">
                    {col.count}
                  </span>
                </div>
                {Array.from({ length: col.count }).map((_, j) => (
                  <div
                    key={j}
                    className="mb-2 rounded-lg bg-background p-2 shadow-sm last:mb-0"
                  >
                    <div className="h-2.5 w-3/4 rounded bg-muted" />
                    <div className="mt-1.5 h-2 w-1/2 rounded bg-muted/60" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-b-0">
      <button
        className="flex w-full items-center justify-between py-5 text-left text-sm font-medium transition-colors hover:text-primary"
        onClick={() => setOpen((v) => !v)}
      >
        {question}
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${
          open ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-muted-foreground">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function Faq() {
  const reveal = useReveal<HTMLDivElement>();

  return (
    <section
      id="faq"
      {...reveal}
      ref={reveal.ref}
      className={`bg-muted/40 py-24 ${reveal.className}`}
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          {t.landing.faq.title}
        </h2>
        <div className="mt-12">
          {t.landing.faq.items.map((item, i) => (
            <FaqItem key={i} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------
function FinalCta() {
  const reveal = useReveal<HTMLDivElement>();

  return (
    <section {...reveal} ref={reveal.ref} className={`py-24 ${reveal.className}`}>
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t.landing.finalCta.title}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">{t.landing.finalCta.subtitle}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/dashboard">
            <Button size="lg" className="h-12 px-6 text-base">
              {t.landing.finalCta.ctaDashboard}
            </Button>
          </Link>
          <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="h-12 px-6 text-base">
              <ChromeIcon className="mr-2 size-5" />
              {t.landing.finalCta.ctaExtension}
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Landing Page (assembled)
// ---------------------------------------------------------------------------
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />
      <Hero />
      <LogosBanner />
      <Features />
      <HowItWorks />
      <Screenshot />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}
