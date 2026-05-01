import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/app/AppShell";
import { AppTopbar } from "@/components/app/AppTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useUser } from "@/store/auth";
import { useFormatters } from "@/i18n/hooks";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { t } = useTranslation();
  const user = useUser();
  const updateProfile = useAuthStore(s => s.updateProfile);
  const { format } = useFormatters();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ fullName, avatarUrl: avatarUrl || undefined });
      toast.success(t("profile.saved"));
    } finally { setLoading(false); }
  };

  return (
    <AppShell>
      <AppTopbar title={t("profile.title")} description={t("profile.subtitle")} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-2xl space-y-6 p-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-semibold text-white"
                style={{ backgroundColor: `hsl(${user.color})` }}
              >
                {user.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-foreground">{user.fullName}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-1 flex gap-2">
                  <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  <Badge variant="secondary">{t("profile.memberSince")} {format(user.createdAt, "MMM yyyy")}</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="fullName">{t("profile.fullName")}</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">{t("profile.email")}</Label>
                <Input id="email" type="email" value={user.email} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="avatar">{t("profile.avatarUrl")}</Label>
                <Input id="avatar" placeholder="https://…" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="hero" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("profile.save")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default Profile;
