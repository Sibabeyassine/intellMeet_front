import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useProjectsStore } from "@/store/projects";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { TaskPriority, TaskStatus } from "@/services";

export function NewTaskModal() {
  const { t } = useTranslation();
  const open = useUIStore(s => s.modal === "new-task");
  const close = useUIStore(s => s.close);
  const initialStatus = (useUIStore(s => s.modalProps?.status) as TaskStatus | undefined) ?? "todo";
  const create = useProjectsStore(s => s.create);
  const currentProjectId = useProjectsStore(s => s.currentProjectId);
  const projects = useProjectsStore(s => s.projects);
  const members = useProjectsStore(s => s.members);
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState<TaskPriority>("med");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [projectId, setProjectId] = useState<string>(currentProjectId ?? projects[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");

  useEffect(() => {
    if (!open) return;
    setStatus(initialStatus);
    setProjectId(currentProjectId ?? projects[0]?.id ?? "");
    setAssigneeId("unassigned");
  }, [currentProjectId, initialStatus, open, projects]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    if (!title) { toast.error(t("modals.newTask.errorTitleRequired")); return; }
    const dueRaw = String(fd.get("due") ?? "").trim();
    const dueDate = dueRaw ? new Date(dueRaw).toISOString() : undefined;
    const pid = projectId || currentProjectId || projects[0]?.id;
    if (!pid) { toast.error("Select a project first"); return; }
    setLoading(true);
    try {
      await create({
        projectId: pid,
        title,
        description: String(fd.get("description") ?? ""),
        dueDate,
        priority, status,
        assigneeId: assigneeId === "unassigned" ? undefined : assigneeId,
      });
      toast.success(t("projects.taskCreated"));
      close();
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t("modals.newTask.title")}</DialogTitle>
          <DialogDescription>{t("modals.newTask.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {projects.length > 1 && (
            <div className="grid gap-1.5">
              <Label>{t("projects.project")}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="title">{t("projects.form.title")}</Label>
            <Input id="title" name="title" placeholder={t("projects.form.titlePlaceholder")} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">{t("projects.form.description")}</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{t("projects.form.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">{t("projects.backlog")}</SelectItem>
                  <SelectItem value="todo">{t("projects.todo")}</SelectItem>
                  <SelectItem value="in_progress">{t("projects.inProgress")}</SelectItem>
                  <SelectItem value="review">{t("projects.review")}</SelectItem>
                  <SelectItem value="done">{t("projects.done")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("projects.form.priority")}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("projects.priorityLow")}</SelectItem>
                  <SelectItem value="med">{t("projects.priorityMedium")}</SelectItem>
                  <SelectItem value="high">{t("projects.priorityHigh")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="due">{t("projects.form.due")}</Label>
            <Input id="due" name="due" type="date" />
          </div>
          <div className="grid gap-1.5">
            <Label>Responsable</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Non assignée</SelectItem>
                {members.map(member => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.name} · {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>{t("common.cancel")}</Button>
            <Button type="submit" variant="hero" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("modals.newTask.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
