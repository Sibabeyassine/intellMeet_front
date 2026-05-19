import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Paperclip, Loader2 } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useProjectsStore } from "@/store/projects";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function NewResourceModal() {
  const { t } = useTranslation();
  const open = useUIStore(s => s.modal === "new-resource");
  const close = useUIStore(s => s.close);
  const currentProjectId = useProjectsStore(s => s.currentProjectId);
  const addResource = useProjectsStore(s => s.addResource);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentProjectId) { toast.error(t("modals.newResource.errorProject")); return; }
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const url = String(fd.get("url") ?? "").trim();
    if (!name || !url) { toast.error(t("modals.newResource.errorRequired")); return; }
    setLoading(true);
    try {
      await addResource({ projectId: currentProjectId, name, url });
      toast.success(t("modals.newResource.added"));
      close();
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Paperclip className="h-4 w-4" /> {t("modals.newResource.title")}
          </DialogTitle>
          <DialogDescription>{t("modals.newResource.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">{t("modals.newResource.fieldName")}</Label>
            <Input id="name" name="name" placeholder={t("modals.newResource.fieldNamePlaceholder")} required autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="url">{t("modals.newResource.fieldUrl")}</Label>
            <Input id="url" name="url" type="url" placeholder="https://..." required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>{t("common.cancel")}</Button>
            <Button type="submit" variant="hero" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("modals.newResource.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
