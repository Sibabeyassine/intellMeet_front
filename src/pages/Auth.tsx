import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Github, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { toast } from "sonner";
import { useAuthStore, useIsAuthenticated } from "@/store/auth";
import { z } from "zod";
import authHero from "@/assets/auth-hero.jpg";

type Mode = "login" | "register";

const Auth = ({ mode = "login" as Mode }: { mode?: Mode }) => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<Mode>(mode);
  const isRegister = current === "register";
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(s => s.login);
  const register = useAuthStore(s => s.register);
  const loading = useAuthStore(s => s.loading);
  const isAuth = useIsAuthenticated();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const loginSchema = z.object({
    email: z.string().trim().email(t("auth.errors.email")).max(255),
    password: z.string().min(6, t("auth.errors.password")).max(120),
  });
  const registerSchema = loginSchema.extend({
    fullName: z.string().trim().min(2, t("auth.errors.name")).max(80),
  });

  useEffect(() => { setCurrent(mode); }, [mode]);
  useEffect(() => { if (isAuth) navigate(redirectTo, { replace: true }); }, [isAuth, navigate, redirectTo]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      fullName: String(fd.get("name") ?? ""),
    };
    try {
      if (isRegister) {
        const parsed = registerSchema.parse(data) as { email: string; password: string; fullName: string };
        await register(parsed);
        toast.success(t("auth.registerSuccess"));
      } else {
        const parsed = loginSchema.parse({ email: data.email, password: data.password }) as { email: string; password: string };
        await login(parsed);
        toast.success(t("auth.loginSuccess"));
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const map: Record<string, string> = {};
        err.errors.forEach(e => { map[e.path[0] as string] = e.message; });
        setErrors(map);
      } else {
        toast.error(err instanceof Error ? err.message : t("auth.errors.generic"));
      }
    }
  };

  const ssoDemo = async () => {
    try {
      await login({ email: "demo@intellmeet.app", password: "demo1234" });
      toast.success(t("auth.demoLoggedIn"));
      navigate(redirectTo, { replace: true });
    } catch { toast.error(t("auth.errors.generic")); }
  };

  return (
    <div className="relative grid min-h-screen w-full overflow-hidden bg-background lg:grid-cols-2">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-60 lg:hidden" />

      <div className="relative z-10 flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="IntellMeet"><Logo /></Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md py-12">
          <div className="animate-fade-in">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isRegister ? t("auth.registerSubtitle") : t("auth.loginSubtitle")}
            </p>
          </div>

          <div className="mt-8 grid gap-2 animate-fade-in">
            <Button type="button" onClick={ssoDemo} disabled={loading} variant="outline" size="lg" className="gap-2.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
                <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
              </svg>
              {t("auth.continueWithGoogle")}
            </Button>
            <Button type="button" onClick={ssoDemo} disabled={loading} variant="outline" size="lg" className="gap-2.5">
              <Github className="h-4 w-4" /> {t("auth.continueWithGithub")}
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("auth.orWithEmail")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4 animate-fade-in" noValidate>
            {isRegister && (
              <div className="grid gap-1.5">
                <Label htmlFor="name">{t("auth.fullName")}</Label>
                <Input id="name" name="name" placeholder={t("auth.fullNamePlaceholder")} required className="h-11 rounded-xl" aria-invalid={!!errors.fullName} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder={t("auth.emailPlaceholder")} required className="h-11 rounded-xl pl-9" aria-invalid={!!errors.email} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.password")}</Label>
                {!isRegister && (
                  <button type="button" onClick={() => toast(t("auth.resetSent"))} className="text-xs font-medium text-primary hover:underline">{t("auth.forgot")}</button>
                )}
              </div>
              <Input id="password" name="password" type="password" placeholder="••••••••" required className="h-11 rounded-xl" aria-invalid={!!errors.password} />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {isRegister ? (
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <Checkbox className="mt-0.5" defaultChecked /> {t("auth.acceptTerms")}
              </label>
            ) : (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox /> {t("auth.rememberMe")}
              </label>
            )}

            <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRegister ? t("auth.register") : t("auth.login"))}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
            <button
              type="button"
              onClick={() => navigate(isRegister ? "/login" : "/register")}
              className="font-semibold text-primary hover:underline"
            >
              {isRegister ? t("auth.login") : t("auth.register")}
            </button>
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> {t("auth.trust")}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© 2025 IntellMeet</p>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={authHero}
          alt="IntellMeet collaborative AI meeting"
          width={1024}
          height={1408}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> IntellMeet AI
            </div>
            <h2 className="mt-8 max-w-md font-display text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-lg">
              "{t("auth.quote")}"
            </h2>
          </div>

          <div>
            <div className="mb-12 max-w-md rounded-2xl border border-white/15 bg-black/30 p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/80">
                <Sparkles className="h-3.5 w-3.5" /> {t("landing.demo.summary")}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/90">
                {t("landing.demo.summaryBody")}
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3">
                <div className="flex -space-x-2">
                  {["LM","MD","SR","AH"].map((i, idx) => (
                    <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black/40 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: `hsl(${["221 83% 53%","38 92% 55%","330 75% 55%","190 80% 45%"][idx]})` }}>
                      {i}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-white/70">6 {t("common.participants")} · 32 {t("common.minutes")}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md font-display font-semibold">L</div>
              <div>
                <p className="font-semibold">{t("auth.quoteAuthor")}</p>
                <p className="text-sm text-white/70">{t("auth.quoteRole")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
