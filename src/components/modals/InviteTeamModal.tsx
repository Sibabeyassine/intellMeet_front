import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useProjectsStore } from "@/store/projects";
import { api } from "@/services";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function InviteTeamModal() {
  const { t } = useTranslation();
  const open = useUIStore(s => s.modal === "invite");
  const close = useUIStore(s => s.close);
  const currentTeamId = useProjectsStore(s => s.currentTeamId);
  const teams = useProjectsStore(s => s.teams);
  const fetchAll = useProjectsStore(s => s.fetchAll);
  const [loading, setLoading] = useState(false);
  const teamId = currentTeamId ?? teams[0]?.id;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const emails = String(fd.get("emails") ?? "").split(/[,\s]+/).filter(Boolean);
    if (!emails.length) { toast.error(t("modals.newChannel.errorRequired")); return; }
    if (!teamId) { toast.error("Cree un workspace avant d'inviter un membre"); return; }
    setLoading(true);
    try {
      await api.projects.inviteTeamMembers(teamId, emails);
      await fetchAll();
      toast.success(t("modals.invite.sent"));
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="w-[calc(100vw-2rem)] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> {t("modals.invite.title")}
          </DialogTitle>
          <DialogDescription>{t("modals.invite.description")}</DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4">
          <div className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p>
              Les invitations sont envoyées par email aux comptes IntellMeet déjà vérifiés. Le lien public a été désactivé pour éviter qu'une personne non invitée rejoigne l'équipe.
            </p>
          </div>

          <form onSubmit={submit} className="min-w-0 space-y-3">
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="emails" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {t("modals.invite.fieldEmails")}</Label>
              <Textarea id="emails" name="emails" rows={3} className="max-w-full resize-none" placeholder="lea@team.com, marc@team.com…" />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
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
