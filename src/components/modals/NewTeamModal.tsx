import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Users, Loader2 } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useProjectsStore } from "@/store/projects";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const COLORS = [
  "221 83% 53%", // blue
  "262 83% 58%", // violet
  "142 71% 45%", // green
  "24 95% 53%",  // orange
  "346 87% 60%", // pink
  "190 90% 50%", // cyan
];

export function NewTeamModal() {
  const { t } = useTranslation();
  const open = useUIStore(s => s.modal === "new-team");
  const close = useUIStore(s => s.close);
  const createTeam = useProjectsStore(s => s.createTeam);
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState(COLORS[0]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) { toast.error(t("modals.newTeam.errorRequired")); return; }
    setLoading(true);
    try {
      await createTeam({ name, color });
      toast.success(t("modals.newTeam.created"));
      close();
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Users className="h-4 w-4" /> {t("modals.newTeam.title")}
          </DialogTitle>
          <DialogDescription>{t("modals.newTeam.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">{t("modals.newTeam.fieldName")}</Label>
            <Input id="name" name="name" placeholder={t("modals.newTeam.fieldNamePlaceholder")} required autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("modals.newTeam.fieldColor")}</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: `hsl(${c})` }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>{t("common.cancel")}</Button>
            <Button type="submit" variant="hero" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("modals.newTeam.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
