import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Sparkles,
  Video,
  MessageSquare,
  ListChecks,
  ShieldCheck,
  Check,
  Mic,
  ScreenShare,
  CircleDot,
  Star,
  Zap,
  Users2,
  Globe2,
  BarChart3,
  Lock,
  Quote,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const Index = () => {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" aria-hidden />
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-primary/20 blur-3xl animate-blob" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-brand/20 blur-3xl animate-blob" aria-hidden />

      {/* Nav */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition hover:text-foreground">{t("landing.nav.features")}</a>
          <a href="#pricing" className="transition hover:text-foreground">{t("landing.nav.pricing")}</a>
          <a href="#testimonials" className="transition hover:text-foreground">{t("landing.nav.customers")}</a>
          <a href="#" className="transition hover:text-foreground">{t("landing.nav.security")}</a>
        </nav>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">{t("landing.nav.login")}</Link>
          </Button>
          <Button asChild size="sm" variant="hero">
            <Link to="/register">{t("landing.nav.trial")}</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-12 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center animate-slide-up">
          <Badge variant="outline" className="mb-6 gap-2 rounded-full border-primary/30 bg-primary/5 py-1.5 pl-1.5 pr-3 text-primary">
            <span className="rounded-full bg-gradient-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              {t("landing.hero.badgeNew")}
            </span>
            {t("landing.hero.badge")}
          </Badge>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {t("landing.hero.title1")}
            <br />
            <span className="text-gradient">{t("landing.hero.title2")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t("landing.hero.subtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl" variant="hero">
              <Link to="/meeting">
                {t("landing.hero.cta1")}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link to="/dashboard">{t("landing.hero.cta2")}</Link>
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">{t("landing.hero.ctaNote")}</p>
        </div>

        <ProductMockup />
      </section>

      <SocialProofSection />
      <FeaturesSection />
      <BigDemoSection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
};

/* ---------- Product mockup (hero visual) ---------- */
function ProductMockup() {
  const { t } = useTranslation();
  return (
    <div className="relative mx-auto mt-20 max-w-6xl animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <div className="absolute -inset-x-12 -inset-y-6 rounded-[40px] bg-gradient-accent opacity-20 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-elev-lg">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 hidden text-xs text-muted-foreground sm:block">intellmeet.app/r/q2-sync</span>
          <span className="ml-auto flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
            </span>
            REC · 12:34
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
          <div className="relative bg-gradient-mesh p-4">
            <div className="grid h-[260px] grid-cols-3 gap-3 sm:h-[360px]">
              {[
                { c: "221 83% 53%", n: "Lea", speak: true },
                { c: "330 75% 55%", n: "Sofia" },
                { c: "152 70% 45%", n: "You" },
                { c: "38 92% 55%", n: "Marc" },
                { c: "190 80% 45%", n: "Amira" },
                { c: "265 70% 60%", n: "Kenji" },
              ].map((p, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-xl border border-border/60 ${p.speak ? "ring-2 ring-primary shadow-glow col-span-2 row-span-2" : ""}`}
                  style={{ background: `radial-gradient(120% 80% at 30% 20%, hsl(${p.c} / 0.55), hsl(${p.c} / 0.15) 60%, hsl(222 47% 8%) 100%)` }}
                >
                  <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white">
                    {p.n}
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-6 flex justify-center">
              <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-card/95 p-1.5 shadow-elev-lg backdrop-blur-xl">
                {[Mic, Video, ScreenShare, CircleDot, MessageSquare].map((Icn, i) => (
                  <span key={i} className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground hover:bg-accent">
                    <Icn className="h-4 w-4" />
                  </span>
                ))}
                <span className="flex h-9 items-center justify-center rounded-xl bg-gradient-accent px-3 text-xs font-semibold text-primary-foreground shadow-glow">
                  <Sparkles className="mr-1 h-3.5 w-3.5" /> AI
                </span>
              </div>
            </div>
          </div>

          <aside className="hidden border-l border-border bg-card p-5 lg:block">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> IntellMeet AI · Live
            </div>
            <h4 className="mt-3 font-display text-sm font-semibold text-foreground">{t("landing.demo.summary")}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground/90">
              {(t("landing.demo.summaryBody").split(". ").filter(Boolean) as string[]).slice(0, 3).map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{t("meeting.actionItems")} · 4</p>
              {["Finalize Stripe", "Push mockups", "Write API doc"].map((a, i) => (
                <div key={i} className="mt-2 flex items-center gap-2 text-xs">
                  <Check className="h-3 w-3 text-success" />
                  <span className="text-foreground/90">{a}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ---------- Social proof ---------- */
function SocialProofSection() {
  const { t } = useTranslation();
  const logos = ["Lumen", "Northwind", "Acme.io", "Stratus", "Helix", "Orbital"];
  return (
    <section className="relative z-10 border-y border-border bg-card/40 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t("landing.social")}
        </p>
        <div className="mt-8 grid grid-cols-3 items-center justify-items-center gap-6 sm:grid-cols-6">
          {logos.map((l) => (
            <span key={l} className="font-display text-xl font-bold tracking-tight text-foreground/40 transition hover:text-foreground/70">
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Features ---------- */
function FeaturesSection() {
  const { t } = useTranslation();
  const features = [
    { icon: Video,         k: "video",      color: "221 83% 53%" },
    { icon: Sparkles,      k: "ai",         color: "265 70% 60%" },
    { icon: MessageSquare, k: "chat",       color: "330 75% 55%" },
    { icon: ListChecks,    k: "tasks",      color: "152 70% 45%" },
    { icon: Mic,           k: "transcript", color: "38 92% 55%" },
    { icon: BarChart3,     k: "analytics",  color: "190 80% 45%" },
  ] as const;
  return (
    <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="rounded-full bg-primary/5 text-primary">{t("landing.features.badge")}</Badge>
        <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("landing.features.title1")} <span className="text-gradient">{t("landing.features.title2")}</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">{t("landing.features.subtitle")}</p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Card key={i} className="group relative overflow-hidden border-border bg-card/80 p-7 shadow-elev-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-elev-md">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm transition group-hover:scale-110"
              style={{ backgroundColor: `hsl(${f.color})` }}
            >
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{t(`landing.features.items.${f.k}.t`)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`landing.features.items.${f.k}.d`)}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------- Big demo ---------- */
function BigDemoSection() {
  const { t } = useTranslation();
  const bullets = [
    { icon: Zap,         t: t("landing.features.items.ai.t"),         d: t("landing.features.items.ai.d") },
    { icon: ListChecks,  t: t("landing.features.items.tasks.t"),      d: t("landing.features.items.tasks.d") },
    { icon: Globe2,      t: t("landing.features.items.transcript.t"), d: t("landing.features.items.transcript.d") },
  ];
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Badge variant="outline" className="rounded-full bg-primary/5 text-primary">{t("landing.demo.badge")}</Badge>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t("landing.demo.title1")} <span className="text-gradient">{t("landing.demo.title2")}</span>{t("landing.demo.title3")}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t("landing.demo.subtitle")}</p>
          <ul className="mt-8 space-y-4">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">{b.t}</p>
                  <p className="text-sm text-muted-foreground">{b.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button asChild variant="hero" size="lg" className="mt-8 gap-2">
            <Link to="/meetings">{t("landing.demo.cta")} <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-accent opacity-20 blur-3xl" />
          <Card className="relative overflow-hidden border-border p-6 shadow-elev-lg">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {t("landing.demo.summary")}
            </div>
            <h4 className="mt-3 font-display text-xl font-semibold text-foreground">{t("landing.demo.summaryTitle")}</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("landing.demo.summaryBody")}</p>
            <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("meeting.actionItems")} · 4</p>
              <ul className="mt-3 space-y-2.5">
                {[
                  { t: "Finalize Stripe integration", a: "Marc", c: "38 92% 55%" },
                  { t: "Push onboarding mockups",     a: "Sofia", c: "330 75% 55%" },
                  { t: "Write partner API docs",      a: "Amira", c: "190 80% 45%" },
                  { t: "Schedule internal review",    a: "Lea",   c: "221 83% 53%" },
                ].map((a, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span className="flex-1 text-foreground">{a.t}</span>
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ backgroundColor: `hsl(${a.c})` }}
                    >
                      {a.a[0]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ---------- Stats ---------- */
function StatsSection() {
  const { t } = useTranslation();
  const stats = [
    { v: "2,800+",   l: t("landing.stats.teams") },
    { v: "14h / wk", l: t("landing.stats.saved") },
    { v: "98%",      l: t("landing.stats.satisfaction") },
    { v: "<200ms",   l: t("landing.stats.latency") },
  ];
  return (
    <section className="relative z-10 border-y border-border bg-card/30 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-16 sm:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="text-center animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <p className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              <span className="text-gradient">{s.v}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Testimonials ---------- */
function TestimonialsSection() {
  const { t } = useTranslation();
  const testimonials = [
    { q: t("auth.quote"), a: t("auth.quoteAuthor"), r: t("auth.quoteRole"), c: "221 83% 53%", i: "LM" },
    { q: "We replaced Zoom + Notion + Asana with one platform. Immediate ROI.", a: "Marc Dubois",  r: "Head of Product @ Northwind", c: "38 92% 55%",  i: "MD" },
    { q: "The AI captures decisions nobody would have written down. A game-changer for remote teams.", a: "Sofia Rinaldi", r: "VP Design @ Acme.io", c: "330 75% 55%", i: "SR" },
  ];
  return (
    <section id="testimonials" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="rounded-full bg-primary/5 text-primary">{t("landing.testimonials.badge")}</Badge>
        <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("landing.testimonials.title")}
        </h2>
      </div>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {testimonials.map((tm, i) => (
          <Card key={i} className="relative overflow-hidden border-border bg-card/80 p-7 shadow-elev-sm backdrop-blur transition hover:shadow-elev-md">
            <Quote className="absolute right-5 top-5 h-8 w-8 text-primary/15" />
            <div className="flex gap-0.5 text-warning">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-4 text-base leading-relaxed text-foreground">"{tm.q}"</p>
            <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: `hsl(${tm.c})` }}
              >
                {tm.i}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{tm.a}</p>
                <p className="text-xs text-muted-foreground">{tm.r}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */
function PricingSection() {
  const { t } = useTranslation();
  const plans = [
    {
      name: t("landing.pricing.starter.name"), price: "0", period: t("landing.pricing.month"),
      desc: t("landing.pricing.starter.desc"),
      features: ["Up to 5 users", "Unlimited 40-min meetings", "Chat & collab notes", "5 AI summaries / month"],
      cta: t("landing.pricing.cta"), variant: "outline" as const,
    },
    {
      name: t("landing.pricing.pro.name"), price: "12", period: `${t("landing.pricing.month")} · ${t("landing.pricing.perUser")}`,
      desc: t("landing.pricing.pro.desc"),
      features: ["Unlimited users", "Unlimited meeting length", "Unlimited IntellMeet AI", "Tasks, kanban & analytics", "Slack, Notion, Linear integrations"],
      cta: t("landing.pricing.ctaPro"), variant: "hero" as const, highlight: true,
    },
    {
      name: t("landing.pricing.enterprise.name"), price: "—", period: "",
      desc: t("landing.pricing.enterprise.desc"),
      features: ["SSO SAML & SCIM", "SOC 2 & HIPAA compliance", "Dedicated region hosting", "99.99% SLA & 24/7 support", "Dedicated account manager"],
      cta: t("landing.pricing.ctaEnterprise"), variant: "outline" as const,
    },
  ];
  return (
    <section id="pricing" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="rounded-full bg-primary/5 text-primary">{t("landing.pricing.badge")}</Badge>
        <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("landing.pricing.title")}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">{t("landing.pricing.subtitle")}</p>
      </div>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={`relative overflow-hidden border-border p-7 shadow-elev-sm transition hover:shadow-elev-md ${p.highlight ? "border-primary/40 bg-card shadow-glow" : "bg-card/80"}`}>
            {p.highlight && (
              <div className="absolute right-5 top-5 rounded-full bg-gradient-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                {t("landing.pricing.popular")}
              </div>
            )}
            <h3 className="font-display text-lg font-semibold text-foreground">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-5 flex items-baseline gap-1">
              {p.price === "—" ? (
                <span className="font-display text-4xl font-bold text-foreground">{t("landing.pricing.ctaEnterprise")}</span>
              ) : (
                <>
                  <span className="font-display text-5xl font-bold tracking-tight text-foreground">${p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </>
              )}
            </div>
            <Button asChild variant={p.variant} size="lg" className="mt-6 w-full">
              <Link to="/register">{p.cta}</Link>
            </Button>
            <ul className="mt-6 space-y-3 border-t border-border pt-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------- Final CTA ---------- */
function FinalCTA() {
  const { t } = useTranslation();
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-brand p-10 text-brand-foreground sm:p-16">
        <div className="absolute inset-0 bg-gradient-brand opacity-90" />
        <div className="absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-primary/40 blur-3xl animate-blob" />
        <div className="absolute -bottom-20 left-0 h-[400px] w-[400px] rounded-full bg-primary-glow/30 blur-3xl animate-blob" />

        <div className="relative mx-auto max-w-3xl text-center">
          <Sparkles className="mx-auto h-8 w-8" />
          <h2 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t("landing.finalCta.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
            {t("landing.finalCta.subtitle")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl" className="bg-white text-brand hover:bg-white/90">
              <Link to="/register">{t("landing.finalCta.cta")} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="xl" variant="ghost" className="text-white hover:bg-white/10">
              <Link to="/meeting">{t("landing.hero.cta1")}</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-5 text-xs text-white/70">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> SOC 2</span>
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> GDPR</span>
            <span className="flex items-center gap-1.5"><Users2 className="h-3.5 w-3.5" /> 2,800+ teams</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  const { t } = useTranslation();
  const cols = [
    { title: t("landing.nav.features"), links: ["Meetings", "AI", "Chat", "Projects", t("landing.nav.pricing")] },
    { title: "Company",                 links: ["About", t("landing.nav.customers"), "Careers", "Press"] },
    { title: "Resources",               links: ["Blog", "Docs", t("landing.nav.security"), "API"] },
    { title: "Legal",                   links: ["Privacy", "Terms", "DPA", "Status"] },
  ];
  return (
    <footer className="relative z-10 border-t border-border bg-card/40 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[2fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The intelligent meeting platform for teams that want fewer meetings and more impact.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="font-display text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="transition hover:text-foreground">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© 2026 IntellMeet — Designed for teams that ship.</span>
          <span>v1.0 · Made with care</span>
        </div>
      </div>
    </footer>
  );
}

export default Index;
