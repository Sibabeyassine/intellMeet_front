import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useProjectsStore } from "@/store/projects";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Task, TaskPriority, TaskStatus } from "@/services";
import { ConfirmDialog } from "./ConfirmDialog";

export function EditTaskModal() {
  const { t } = useTranslation();
  const open = useUIStore(s => s.modal === "edit-task");
  const close = useUIStore(s => s.close);
  const taskId = useUIStore(s => s.modalProps?.taskId) as string | undefined;
  const tasks = useProjectsStore(s => s.tasks);
  const members = useProjectsStore(s => s.members);
  const update = useProjectsStore(s => s.update);
  const remove = useProjectsStore(s => s.remove);
  const task = tasks.find(t => t.id === taskId) as Task | undefined;

  const [loading, setLoading] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("med");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [assigneeId, setAssigneeId] = useState("unassigned");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setDue(task.dueDate ? task.dueDate.slice(0, 10) : "");
      setPriority(task.priority);
      setStatus(task.status);
      setAssigneeId(task.assigneeId ?? "unassigned");
    }
  }, [task]);

  if (!task) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error(t("modals.newTask.errorTitleRequired")); return; }
    setLoading(true);
    try {
      await update(task.id, {
        title: title.trim(),
        description,
        dueDate: due ? new Date(due).toISOString() : undefined,
        priority, status,
        assigneeId: assigneeId === "unassigned" ? undefined : assigneeId,
      });
      toast.success(t("projects.taskUpdated"));
      close();
    } finally { setLoading(false); }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{t("modals.editTask.title")}</DialogTitle>
            <DialogDescription>{t("projects.details")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="t-title">{t("projects.form.title")}</Label>
              <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-desc">{t("projects.form.description")}</Label>
              <Textarea id="t-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
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
              <Label htmlFor="t-due">{t("projects.form.due")}</Label>
              <Input id="t-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
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
            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDel(true)}>
                <Trash2 className="mr-2 h-4 w-4" />{t("projects.delete")}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={close}>{t("common.cancel")}</Button>
                <Button type="submit" variant="hero" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("common.save")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title={t("projects.deleteConfirmTitle")}
        description={t("projects.deleteConfirmDescription")}
        destructive
        onConfirm={async () => { await remove(task.id); toast.success(t("projects.taskDeleted")); close(); }}
      />
    </>
  );
}
