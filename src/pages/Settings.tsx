import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/app/AppShell";
import { AppTopbar } from "@/components/app/AppTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/components/ThemeProvider";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useAuthStore, useUser } from "@/store/auth";
import { Bell, Lock, Palette, CreditCard, SlidersHorizontal, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const logout = useAuthStore(s => s.logout);
  const changePassword = useAuthStore(s => s.changePassword);
  const user = useUser();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({ email: true, push: true, mentions: true, ai: true });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const save = () => toast.success(t("settings.saved"));
  const submitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Mot de passe mis à jour");
      setPasswordOpen(false);
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de changer le mot de passe");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppShell>
      <AppTopbar title={t("settings.title")} description={t("settings.subtitle")} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          <Tabs defaultValue="general">
            <TabsList className="bg-muted/40">
              <TabsTrigger value="general"><SlidersHorizontal className="mr-2 h-4 w-4" />{t("settings.tabs.general")}</TabsTrigger>
              <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" />{t("settings.tabs.appearance")}</TabsTrigger>
              <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />{t("settings.tabs.notifications")}</TabsTrigger>
              <TabsTrigger value="security"><Lock className="mr-2 h-4 w-4" />{t("settings.tabs.security")}</TabsTrigger>
              <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4" />{t("settings.tabs.billing")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6 space-y-4">
              <Card className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <Label className="text-sm font-semibold">{t("settings.general.language")}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">{t("settings.general.languageDesc")}</p>
                  </div>
                  <Select value={(i18n.resolvedLanguage ?? "fr").slice(0,2)} onValueChange={(v) => void i18n.changeLanguage(v)}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map(l => (
                        <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <Label className="text-sm font-semibold">{t("settings.general.timezone")}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">{t("settings.general.timezoneDesc")}</p>
                  </div>
                  <Select defaultValue="europe-paris">
                    <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe-paris">Europe/Paris (UTC+1)</SelectItem>
                      <SelectItem value="europe-london">Europe/London (UTC+0)</SelectItem>
                      <SelectItem value="america-new_york">America/New_York (UTC-5)</SelectItem>
                      <SelectItem value="asia-tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="mt-6 space-y-4">
              <Card className="p-6">
                <Label className="text-sm font-semibold">{t("settings.appearance.theme")}</Label>
                <p className="mt-1 text-xs text-muted-foreground">{t("settings.appearance.themeDesc")}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { v: "light", l: t("settings.appearance.themeLight") },
                    { v: "dark", l: t("settings.appearance.themeDark") },
                  ].map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setTheme(opt.v as "light" | "dark")}
                      className={`rounded-xl border p-4 text-left transition ${theme === opt.v ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
                    >
                      <div className={`mb-3 h-16 rounded-md border ${opt.v === "dark" ? "bg-[hsl(222_47%_5%)]" : "bg-[hsl(220_33%_99%)]"}`} />
                      <p className="text-sm font-medium text-foreground">{opt.l}</p>
                    </button>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-6 space-y-3">
              {([
                { k: "email", icon: Bell },
                { k: "push", icon: Bell },
                { k: "mentions", icon: Bell },
                { k: "ai", icon: Bell },
              ] as const).map(({ k }) => (
                <Card key={k} className="flex items-center justify-between p-5">
                  <div>
                    <Label className="text-sm font-semibold">{t(`settings.notifications.${k}`)}</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t(`settings.notifications.${k}Desc`)}</p>
                  </div>
                  <Switch checked={prefs[k]} onCheckedChange={(v) => { setPrefs(p => ({ ...p, [k]: v })); save(); }} />
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="security" className="mt-6 space-y-3">
              <Card className="flex items-center justify-between p-5">
                <div>
                  <Label className="text-sm font-semibold">{t("settings.security.password")}</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">••••••••</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>{t("settings.security.changePassword")}</Button>
              </Card>
              <Card className="flex items-center justify-between p-5">
                <div>
                  <Label className="text-sm font-semibold">{t("settings.security.twoFactor")}</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.security.twoFactorDesc")}</p>
                </div>
                <Switch />
              </Card>
              <Card className="flex items-center justify-between p-5">
                <div>
                  <Label className="text-sm font-semibold">{t("settings.security.sessions")}</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">2 {t("settings.security.sessions").toLowerCase()}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={async () => { await logout(); toast.success(t("settings.logoutAllSuccess")); navigate("/login"); }}>
                  <LogOut className="h-4 w-4" />{t("settings.security.logoutAll")}
                </Button>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="mt-6 space-y-3">
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Label className="text-sm font-semibold">{t("settings.billing.currentPlan")}</Label>
                    <p className="mt-1 font-display text-2xl font-bold text-foreground">{user?.role === "admin" ? "Admin" : "Workspace"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Plan local synchronisé avec ton rôle backend</p>
                  </div>
                  <Button variant="hero" disabled>{t("settings.billing.upgrade")}</Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.security.changePassword")}</DialogTitle>
            <DialogDescription>Cette action appelle directement l'API sécurisée du backend.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitPassword} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input id="currentPassword" name="currentPassword" type="password" minLength={8} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input id="newPassword" name="newPassword" type="password" minLength={8} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={passwordLoading}>{passwordLoading ? "Mise à jour..." : "Mettre à jour"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Settings;
