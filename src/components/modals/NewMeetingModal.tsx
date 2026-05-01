import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useMeetingsStore } from "@/store/meetings";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NewMeetingModal() {
  const { t } = useTranslation();
  const open = useUIStore(s => s.modal === "new-meeting");
  const close = useUIStore(s => s.close);
  const create = useMeetingsStore(s => s.create);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const startNow = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("data-action") === "start";
    if (!title) { toast.error(t("modals.newMeeting.errorTitleRequired")); return; }
    setLoading(true);
    try {
      await create({
        title,
        description: String(fd.get("description") ?? ""),
        scheduledAt: new Date(String(fd.get("scheduledAt") ?? new Date().toISOString())).toISOString(),
        durationMin: Number(fd.get("duration") ?? 30),
        participantEmails: String(fd.get("emails") ?? "").split(",").map(s => s.trim()).filter(Boolean),
      });
      toast.success(startNow ? t("modals.newMeeting.createdLive") : t("modals.newMeeting.createdScheduled"));
      close();
      navigate(startNow ? "/meeting" : "/meetings");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> {t("modals.newMeeting.title")}
          </DialogTitle>
          <DialogDescription>{t("modals.newMeeting.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="title">{t("modals.newMeeting.fieldTitle")}</Label>
            <Input id="title" name="title" placeholder={t("modals.newMeeting.fieldTitlePlaceholder")} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">{t("modals.newMeeting.fieldDescription")}</Label>
            <Textarea id="description" name="description" rows={2} placeholder={t("modals.newMeeting.fieldDescriptionPlaceholder")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="scheduledAt">{t("modals.newMeeting.fieldDate")}</Label>
              <Input id="scheduledAt" name="scheduledAt" type="datetime-local" defaultValue={toLocal(new Date())} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="duration">{t("modals.newMeeting.fieldDuration")}</Label>
              <Input id="duration" name="duration" type="number" min={5} max={240} step={5} defaultValue={30} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="emails">{t("modals.newMeeting.fieldEmails")}</Label>
            <Input id="emails" name="emails" placeholder={t("modals.newMeeting.fieldEmailsPlaceholder")} />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={close}>{t("common.cancel")}</Button>
            <Button type="submit" data-action="schedule" disabled={loading} variant="outline">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("modals.newMeeting.schedule")}
            </Button>
            <Button type="submit" data-action="start" disabled={loading} variant="hero">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("modals.newMeeting.startNow")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toLocal(d: Date) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}
