import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles, Users2 } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useMeetingsStore } from "@/store/meetings";
import { useProjectsStore } from "@/store/projects";
import { useUser } from "@/store/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/services";
import { cn } from "@/lib/utils";

export function NewMeetingModal() {
  const { t } = useTranslation();
  const open = useUIStore(s => s.modal === "new-meeting");
  const close = useUIStore(s => s.close);
  const create = useMeetingsStore(s => s.create);
  const members = useProjectsStore(s => s.members);
  const fetchProjects = useProjectsStore(s => s.fetchAll);
  const user = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const activeMembers = useMemo(
    () => members.filter((member) => member.status === "active" && member.userId !== user?.id),
    [members, user?.id]
  );

  useEffect(() => {
    if (open) void fetchProjects();
  }, [fetchProjects, open]);

  useEffect(() => {
    if (!open) setSelectedParticipantIds([]);
  }, [open]);

  const toggleParticipant = (userId: string) => {
    setSelectedParticipantIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const startNow = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("data-action") === "start";
    if (!title) { toast.error(t("modals.newMeeting.errorTitleRequired")); return; }
    setLoading(true);
    try {
      const durationMin = Number(fd.get("duration") ?? 30);
      const scheduledAt = startNow
        ? new Date()
        : new Date(String(fd.get("scheduledAt") ?? new Date().toISOString()));
      const meeting = await create({
        title,
        description: String(fd.get("description") ?? ""),
        scheduledAt: scheduledAt.toISOString(),
        durationMin,
        participantIds: selectedParticipantIds,
      });
      if (startNow) {
        await api.meetings.start(meeting.id);
      }
      toast.success(startNow ? t("modals.newMeeting.createdLive") : t("modals.newMeeting.createdScheduled"));
      close();
      navigate(startNow ? `/meeting/${meeting.id}` : "/meetings");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.errors.generic"));
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
          <div className="grid gap-2">
            <Label className="flex items-center gap-1.5">
              <Users2 className="h-3.5 w-3.5" />
              Participants de l'équipe
            </Label>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-muted/20 p-2 scrollbar-thin">
              {activeMembers.length ? (
                <div className="grid gap-1.5">
                  {activeMembers.map((member) => {
                    const selected = selectedParticipantIds.includes(member.userId);
                    return (
                      <button
                        key={member.userId}
                        type="button"
                        onClick={() => toggleParticipant(member.userId)}
                        className={cn(
                          "flex min-w-0 items-center gap-3 rounded-lg px-2.5 py-2 text-left transition",
                          selected ? "bg-primary/10 text-foreground" : "hover:bg-background"
                        )}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: `hsl(${member.color})` }}
                        >
                          {member.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{member.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                        </span>
                        <span className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        )}>
                          {selected && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  Aucun autre membre actif dans cette équipe.
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Seuls les membres sélectionnés pourront rejoindre cette réunion via le lien.
            </p>
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
