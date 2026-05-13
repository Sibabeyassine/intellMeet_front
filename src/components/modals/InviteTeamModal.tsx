import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, Mail, UserPlus } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useProjectsStore } from "@/store/projects";
import { api } from "@/services";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const inviteLink = "https://intellmeet.app/invite/wkspc-7f3d2a";

export function InviteTeamModal() {
  const { t } = useTranslation();
  const open = useUIStore(s => s.modal === "invite");
  const close = useUIStore(s => s.close);
  const currentTeamId = useProjectsStore(s => s.currentTeamId);
  const teams = useProjectsStore(s => s.teams);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const emails = String(fd.get("emails") ?? "").split(/[,\s]+/).filter(Boolean);
    if (!emails.length) { toast.error(t("modals.newChannel.errorRequired")); return; }
    const teamId = currentTeamId ?? teams[0]?.id;
    if (!teamId) { toast.error("Cree un workspace avant d'inviter un membre"); return; }
    setLoading(true);
    try {
      await api.projects.inviteTeamMembers(teamId, emails);
      toast.success(t("modals.invite.sent"));
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation impossible");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => { navigator.clipboard?.writeText(inviteLink); toast.success(t("common.copied")); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> {t("modals.invite.title")}
          </DialogTitle>
          <DialogDescription>{t("modals.invite.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label>{t("modals.invite.linkLabel")}</Label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
              <span className="flex-1 truncate font-mono text-xs">{inviteLink}</span>
              <Button type="button" variant="ghost" size="icon-sm" onClick={copy}><Copy className="h-3.5 w-3.5" /></Button>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="emails" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {t("modals.invite.fieldEmails")}</Label>
              <Textarea id="emails" name="emails" rows={3} placeholder="lea@team.com, marc@team.com…" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>{t("common.cancel")}</Button>
              <Button type="submit" variant="hero" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("modals.invite.send")}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
