import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { OnboardingDemo } from "@/components/landing/OnboardingDemo";
import { ChromeIcon } from "@/components/icons/ChromeIcon";
import { ExtensionComingSoonModal } from "@/components/ExtensionComingSoonModal";
import { useAuthStore } from "@/stores/authStore";
import { t } from "@/lib/i18n";
import {
  Sparkles,
  Zap,
  Columns3,
  Clock,
  BarChart3,
  Check,
  ChevronDown,
  ArrowRight,
  Heart,
  Menu,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Scroll-reveal hook
// ---------------------------------------------------------------------------
function useReveal(): [(el: HTMLElement | null) => void, string] {
  const [visible, setVisible] = useState(false);

  const callbackRef = useCallback((el: HTMLElement | null) => {
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
  }, []);

  return [
    callbackRef,
    visible ? "landing-reveal landing-visible" : "landing-reveal",
  ];
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
function LandingNavbar({ onAuth }: { onAuth: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { href: "#demo", label: t.landing.nav.tryIt },
    { href: "#features", label: t.landing.nav.features },
    { href: "#how", label: t.landing.nav.howItWorks },
    { href: "#faq", label: t.landing.nav.faq },
  ];

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 shadow-[0_1px_0_var(--border)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-[14px] font-extrabold tracking-tighter text-primary-foreground">
            JT
          </div>
          <span className="text-[16px] font-bold tracking-tight">
            JobTracker
          </span>
        </div>

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
          <Button size="sm" onClick={onAuth}>
            {t.landing.nav.cta}
          </Button>
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
        <div className="border-b bg-background px-6 pb-4 md:hidden">
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
          <Button className="mt-2 w-full" size="sm" onClick={onAuth}>
            {t.landing.nav.cta}
          </Button>
        </div>
      )}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
function Hero({ onAuth }: { onAuth: () => void }) {
  return (
    <section className="relative overflow-hidden pt-[120px] pb-[60px]">
      {/* Dotted background */}
      <div
        className="dotted-bg pointer-events-none absolute inset-0 opacity-40"
        style={{
          maskImage:
            "radial-gradient(ellipse at top, black 30%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at top, black 30%, transparent 70%)",
        }}
      />

      <div className="hero-grid relative mx-auto grid max-w-[1200px] items-center gap-14 px-6 max-[960px]:grid-cols-1 min-[961px]:grid-cols-2">
        {/* Left: Copy */}
        <div>
          {/* Eyebrow badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-[5px] text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            {t.landing.hero.eyebrow}
          </div>

          {/* H1 */}
          <h1
            className="text-[clamp(36px,5vw,56px)] font-extrabold leading-[1.05]"
            style={{ letterSpacing: "-0.035em" }}
          >
            {t.landing.hero.title}
            <span className="relative whitespace-nowrap">
              {t.landing.hero.titleHighlight}
              <svg
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                className="absolute bottom-[-6px] left-0 h-[10px] w-full"
              >
                <path
                  d="M2 8 Q 50 2, 100 6 T 198 5"
                  fill="none"
                  stroke="oklch(0.769 0.188 70.08)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-[480px] text-lg leading-relaxed text-muted-foreground">
            {t.landing.hero.subtitle}{" "}
            <b className="text-foreground">{t.landing.hero.subtitleBold}</b>
            {t.landing.hero.subtitleEnd}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#demo" className="no-underline">
              <Button size="lg" className="h-11 px-5">
                <Sparkles className="size-[18px]" fill="currentColor" />
                {t.landing.hero.ctaTry}
              </Button>
            </a>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-5"
              onClick={onAuth}
            >
              {t.landing.hero.ctaRegister}
            </Button>
          </div>

          {/* Trust signals */}
          <div className="mt-7 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {[
              t.landing.hero.trustFree,
              t.landing.hero.trustEncrypted,
              t.landing.hero.trustRgpd,
            ].map((text) => (
              <div key={text} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-success" strokeWidth={3} />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Demo */}
        <div id="demo">
          <OnboardingDemo onAccount={onAuth} />
          <p className="mt-3.5 text-center text-xs text-muted-foreground">
            {t.landing.hero.demoCaption}
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sources Banner
// ---------------------------------------------------------------------------
function SourcesBanner() {
  const [revealRef, revealClass] = useReveal();

  return (
    <section ref={revealRef} className={`border-y py-10 ${revealClass}`}>
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <p className="font-mono-jb text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          {t.landing.logos.title}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-12 opacity-70">
          <div className="flex items-center gap-2 text-lg font-bold">
            <LinkedInLogo size={22} /> LinkedIn
          </div>
          <div className="flex items-center gap-2 text-lg font-bold text-[#2164F3]">
            <IndeedLogo size={22} /> Indeed
          </div>
          {/* <div className="flex items-center gap-2 text-lg font-bold text-[#FF6600]">
            <span className="inline-flex size-[22px] items-center justify-center rounded-md bg-[#FF6600] text-xs font-extrabold text-white">
              H
            </span>
            HelloWork
          </div> */}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------
function HowItWorks() {
  const [revealRef, revealClass] = useReveal();

  const steps = [
    {
      n: 1,
      title: t.landing.howItWorks.step1.title,
      desc: t.landing.howItWorks.step1.description,
      icon: Sparkles,
    },
    {
      n: 2,
      title: t.landing.howItWorks.step2.title,
      desc: t.landing.howItWorks.step2.description,
      icon: Zap,
    },
    {
      n: 3,
      title: t.landing.howItWorks.step3.title,
      desc: t.landing.howItWorks.step3.description,
      icon: Columns3,
    },
  ];

  return (
    <section
      id="how"
      ref={revealRef}
      className={`bg-muted py-24 ${revealClass}`}
    >
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="mx-auto max-w-[600px] text-center">
          <SectionBadge>{t.landing.howItWorks.badge}</SectionBadge>
          <h2
            className="mt-4 text-[40px] font-extrabold tracking-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            {t.landing.howItWorks.title}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t.landing.howItWorks.subtitle}
          </p>
        </div>

        <div className="how-grid relative mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Connector line (desktop only) */}
          <svg
            className="pointer-events-none absolute top-9 left-[16%] hidden h-0.5 w-[68%] sm:block"
            preserveAspectRatio="none"
            viewBox="0 0 100 2"
          >
            <line
              x1="0"
              y1="1"
              x2="100"
              y2="1"
              stroke="var(--border)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          </svg>

          {steps.map((s) => (
            <div key={s.n} className="relative z-[1] text-center">
              <div className="relative mx-auto flex size-[72px] items-center justify-center rounded-full border-2 bg-card">
                <s.icon className="size-[26px]" />
                <div className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {s.n}
                </div>
              </div>
              <h3 className="mt-[18px] text-lg font-bold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </div>
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
  const [revealRef, revealClass] = useReveal();

  const features = [
    {
      icon: Columns3,
      title: t.landing.features.kanban.title,
      desc: t.landing.features.kanban.description,
      tone: "#3b82f6",
    },
    {
      icon: ChromeIcon,
      title: t.landing.features.extension.title,
      desc: t.landing.features.extension.description,
      tone: "#6366f1",
    },
    {
      icon: Clock,
      title: t.landing.features.timeline.title,
      desc: t.landing.features.timeline.description,
      tone: "#f59e0b",
    },
    {
      icon: BarChart3,
      title: t.landing.features.stats.title,
      desc: t.landing.features.stats.description,
      tone: "#22c55e",
    },
  ];

  return (
    <section id="features" ref={revealRef} className={`py-24 ${revealClass}`}>
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="mx-auto max-w-[600px] text-center">
          <SectionBadge>{t.landing.features.badge}</SectionBadge>
          <h2
            className="mt-4 text-[40px] font-extrabold tracking-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            {t.landing.features.title}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t.landing.features.subtitle}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((f, i) => (
            <div
              key={i}
              className="cursor-default rounded-xl border bg-card p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className="mb-4 flex size-11 items-center justify-center rounded-[10px]"
                style={{
                  background: `${f.tone}1a`,
                  color: f.tone,
                }}
              >
                <f.icon className="size-[22px]" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
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
    <div className="border-b">
      <button
        className="flex w-full items-center justify-between py-5 text-left text-[15px] font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        {question}
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? 200 : 0 }}
      >
        <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
          {answer}
        </p>
      </div>
    </div>
  );
}

function Faq() {
  const [revealRef, revealClass] = useReveal();

  return (
    <section
      id="faq"
      ref={revealRef}
      className={`bg-muted py-24 ${revealClass}`}
    >
      <div className="mx-auto max-w-[720px] px-6">
        <div className="text-center">
          <SectionBadge>{t.landing.faq.badge}</SectionBadge>
          <h2
            className="mt-4 text-[40px] font-extrabold tracking-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            {t.landing.faq.title}
          </h2>
        </div>
        <div className="mt-10">
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
function FinalCta({
  onAuth,
  onExtensionClick,
}: {
  onAuth: () => void;
  onExtensionClick: () => void;
}) {
  const [revealRef, revealClass] = useReveal();

  return (
    <section ref={revealRef} className={`py-24 ${revealClass}`}>
      <div className="mx-auto max-w-[1100px] px-6">
        <div
          className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground"
          style={{ borderRadius: "var(--radius-2xl)" }}
        >
          {/* Decorative dotted bg */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              maskImage:
                "radial-gradient(ellipse at center, black 30%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at center, black 30%, transparent 70%)",
            }}
          />

          <div className="relative">
            <h2
              className="text-[40px] font-extrabold"
              style={{ letterSpacing: "-0.03em" }}
            >
              {t.landing.finalCta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] text-[17px] opacity-80">
              {t.landing.finalCta.subtitle}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={onAuth}
                className="h-11 border-background bg-background px-5 text-foreground hover:bg-background/90"
              >
                {t.landing.finalCta.ctaRegister}{" "}
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onExtensionClick}
                className="h-11 border-primary-foreground/25 bg-transparent px-5 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ChromeIcon className="size-4" />
                {t.landing.finalCta.ctaExtension}
              </Button>
            </div>
            <p className="mt-5 text-xs opacity-60">
              {t.landing.finalCta.caption}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Landing Footer (custom for landing, wraps existing Footer)
// ---------------------------------------------------------------------------
function LandingFooter() {
  return (
    <footer className="border-t py-8 px-6">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4 text-[13px] text-muted-foreground">
        <div>
          &copy; {new Date().getFullYear()} JobTracker &middot; Fait avec{" "}
          <Heart
            className="inline size-[11px] align-middle text-[#ef4444]"
            fill="currentColor"
          />{" "}
          en France
        </div>
        <div className="flex gap-5">
          <Link
            to="/privacy"
            className="transition-colors hover:text-foreground"
          >
            {t.footer.privacy}
          </Link>
          <Link to="/legal" className="transition-colors hover:text-foreground">
            {t.footer.legal}
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------
function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
      {children}
    </span>
  );
}

function LinkedInLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function IndeedLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#2164F3">
      <circle cx="12" cy="4" r="2.5" />
      <path d="M9.5 8h5v14a2.5 2.5 0 0 1-5 0V8z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Landing Page (assembled)
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const handleAuth = () => openAuthModal("register");

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.landing.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "JobTracker",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    description: t.seo.landing.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    url: t.seo.siteUrl,
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Helmet>
        <title>{t.seo.landing.title}</title>
        <meta name="description" content={t.seo.landing.description} />
        <link rel="canonical" href={`${t.seo.siteUrl}/`} />
        <meta property="og:title" content={t.seo.landing.title} />
        <meta property="og:description" content={t.seo.landing.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${t.seo.siteUrl}/`} />
        <meta property="og:image" content={`${t.seo.siteUrl}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t.seo.landing.title} />
        <meta name="twitter:description" content={t.seo.landing.description} />
        <script type="application/ld+json">{JSON.stringify(appJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <LandingNavbar onAuth={handleAuth} />
      <Hero onAuth={handleAuth} />
      <SourcesBanner />
      <HowItWorks />
      <Features />
      <Faq />
      <FinalCta
        onAuth={handleAuth}
        onExtensionClick={() => setExtensionModalOpen(true)}
      />
      <LandingFooter />

      <ExtensionComingSoonModal
        open={extensionModalOpen}
        onClose={() => setExtensionModalOpen(false)}
      />
    </div>
  );
}
