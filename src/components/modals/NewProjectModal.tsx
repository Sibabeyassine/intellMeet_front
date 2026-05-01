import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderKanban, Loader2 } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useProjectsStore } from "@/store/projects";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function NewProjectModal() {
  const { t } = useTranslation();
  const open = useUIStore(s => s.modal === "new-project");
  const close = useUIStore(s => s.close);
  const teams = useProjectsStore(s => s.teams);
  const currentTeamId = useProjectsStore(s => s.currentTeamId);
  const createProject = useProjectsStore(s => s.createProject);
  const [teamId, setTeamId] = useState<string | undefined>(currentTeamId ?? teams[0]?.id);
  const [loading, setLoading] = useState(false);

  // sync if opened later
  const effectiveTeamId = teamId ?? currentTeamId ?? teams[0]?.id;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!effectiveTeamId) { toast.error(t("modals.newProject.errorTeam")); return; }
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const key = String(fd.get("key") ?? "").trim().toUpperCase() || undefined;
    const description = String(fd.get("description") ?? "").trim() || undefined;
    if (!name) { toast.error(t("modals.newProject.errorRequired")); return; }
    setLoading(true);
    try {
      await createProject({ teamId: effectiveTeamId, name, key, description });
      toast.success(t("modals.newProject.created"));
      close();
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FolderKanban className="h-4 w-4" /> {t("modals.newProject.title")}
          </DialogTitle>
          <DialogDescription>{t("modals.newProject.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-1.5">
            <Label>{t("modals.newProject.fieldTeam")}</Label>
            <Select value={effectiveTeamId} onValueChange={setTeamId}>
              <SelectTrigger><SelectValue placeholder={t("projects.selectTeam")} /></SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${team.color})` }} />
                      {team.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5 col-span-2">
              <Label htmlFor="name">{t("modals.newProject.fieldName")}</Label>
              <Input id="name" name="name" placeholder={t("modals.newProject.fieldNamePlaceholder")} required autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="key">{t("modals.newProject.fieldKey")}</Label>
              <Input id="key" name="key" placeholder={t("modals.newProject.fieldKeyPlaceholder")} maxLength={6} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">{t("modals.newProject.fieldDescription")}</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>{t("common.cancel")}</Button>
            <Button type="submit" variant="hero" disabled={loading || !teams.length}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("modals.newProject.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
