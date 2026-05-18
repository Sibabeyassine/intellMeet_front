import { useEffect, useMemo, useState } from "react";
import { Plus, Calendar as CalIcon, MessageSquare, Paperclip, Sparkles, UserPlus, Users2, LayoutGrid, List as ListIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { AppShell } from "@/components/app/AppShell";
import { AppTopbar } from "@/components/app/AppTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useProjectsStore, useCurrentProject } from "@/store/projects";
import { useUIStore } from "@/store/ui";
import type { Task, TaskStatus, Team } from "@/services";

type ViewMode = "kanban" | "list" | "calendar";

const Projects = () => {
  const { t, i18n } = useTranslation();
  const fetchAll = useProjectsStore(s => s.fetchAll);
  const teams = useProjectsStore(s => s.teams);
  const members = useProjectsStore(s => s.members);
  const allProjects = useProjectsStore(s => s.projects);
  const allTasks = useProjectsStore(s => s.tasks);
  const setTeam = useProjectsStore(s => s.setTeam);
  const setProject = useProjectsStore(s => s.setProject);
  const currentTeamId = useProjectsStore(s => s.currentTeamId);
  const currentProjectId = useProjectsStore(s => s.currentProjectId);
  const currentTeam = useMemo(
    () => teams.find(team => team.id === currentTeamId) ?? null,
    [currentTeamId, teams]
  );
  const teamProjects = useMemo(
    () => allProjects.filter(p => p.teamId === currentTeamId),
    [allProjects, currentTeamId]
  );
  const project = useCurrentProject();
  const memberById = useMemo(
    () => new Map(members.map(member => [member.userId, member])),
    [members]
  );
  const tasks = useMemo(
    () => allTasks
      .filter(tt => !currentProjectId || tt.projectId === currentProjectId)
      .map(task => {
        const assignee = task.assigneeId ? memberById.get(task.assigneeId) : undefined;
        return assignee
          ? { ...task, assignees: [{ initials: assignee.initials, color: assignee.color }] }
          : task;
      }),
    [allTasks, currentProjectId, memberById]
  );
  const move = useProjectsStore(s => s.move);
  const openModal = useUIStore(s => s.open);

  const [view, setView] = useState<ViewMode>("kanban");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const columns: { id: TaskStatus; label: string }[] = [
    { id: "backlog", label: t("projects.backlog") },
    { id: "todo", label: t("projects.todo") },
    { id: "in_progress", label: t("projects.inProgress") },
    { id: "review", label: t("projects.review") },
    { id: "done", label: t("projects.done") },
  ];

  const handleDrop = (col: TaskStatus) => {
    if (!draggingId) return;
    void move(draggingId, col);
    setDraggingId(null);
    setOverCol(null);
  };

  const aiCount = tasks.filter(t => t.fromAI).length;
  const subtitle = !workspaceOpen
    ? "Sélectionne une équipe pour ouvrir ses projets et son tableau de tâches."
    : project
    ? `${teams.find(tm => tm.id === currentTeamId)?.name ?? ""} · ${project.name} · ${tasks.length} ${t("projects.activeTasks")}`
    : t("projects.subtitle", { count: tasks.length });

  const openTeamWorkspace = (teamId: string) => {
    setTeam(teamId);
    setWorkspaceOpen(true);
  };

  return (
    <AppShell>
      <AppTopbar
        title={t("projects.title")}
        description={subtitle}
        actions={
          <div className="flex items-center gap-2">
            {!workspaceOpen ? (
              <Button onClick={() => openModal("new-team")} variant="hero" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />{t("modals.newTeam.title")}
              </Button>
            ) : (
              <>
                <Button onClick={() => openModal("invite")} variant="outline" size="sm" className="gap-2 hidden sm:inline-flex">
                  <UserPlus className="h-4 w-4" />{t("modals.invite.title")}
                </Button>
                <Button onClick={() => openModal("new-task")} variant="hero" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />{t("projects.newTask")}
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        {!workspaceOpen ? (
          <TeamsOverview
            teams={teams}
            onOpen={openTeamWorkspace}
            onCreate={() => openModal("new-team")}
          />
        ) : (
        <>
        {/* Sub bar — team / project switcher + view toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/40 px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setWorkspaceOpen(false)}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Équipes
            </Button>
            <Select value={currentTeamId ?? undefined} onValueChange={setTeam}>
              <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder={t("projects.selectTeam")} /></SelectTrigger>
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
            <Button
              onClick={() => openModal("new-team")}
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              title={t("modals.newTeam.title")}
              aria-label={t("modals.newTeam.title")}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Select value={teamProjects.find(p => p.id === currentProjectId)?.id ?? undefined} onValueChange={setProject} disabled={!teamProjects.length}>
              <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder={t("projects.selectProject")} /></SelectTrigger>
              <SelectContent>
                {teamProjects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono">{p.key}</span>
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => openModal("new-project")}
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              title={t("modals.newProject.title")}
              aria-label={t("modals.newProject.title")}
              disabled={!teams.length}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className="ml-1 gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> {t("projects.aiBadge", { count: aiCount })}
            </Badge>
            <div className="ml-1 flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
              <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex -space-x-1.5">
                {members.slice(0, 5).map(member => (
                  <div
                    key={member.userId}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background text-[9px] font-semibold text-white"
                    title={`${member.name} · ${member.role}`}
                    style={{ backgroundColor: `hsl(${member.color})` }}
                  >
                    {member.initials}
                  </div>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {members.length} {t("common.members")}
              </span>
            </div>
            {currentTeam && (
              <Badge variant="secondary" className="hidden h-9 rounded-lg px-3 sm:inline-flex">
                {currentTeam.memberCount ?? members.length} membres
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <Button onClick={() => setView("kanban")} variant={view === "kanban" ? "secondary" : "ghost"} size="sm" className="gap-1.5 h-7">
              <LayoutGrid className="h-3.5 w-3.5" />{t("projects.view.kanban")}
            </Button>
            <Button onClick={() => setView("list")} variant={view === "list" ? "secondary" : "ghost"} size="sm" className="gap-1.5 h-7">
              <ListIcon className="h-3.5 w-3.5" />{t("projects.view.list")}
            </Button>
            <Button onClick={() => setView("calendar")} variant={view === "calendar" ? "secondary" : "ghost"} size="sm" className="gap-1.5 h-7">
              <CalIcon className="h-3.5 w-3.5" />{t("projects.view.calendar")}
            </Button>
          </div>
        </div>

        {/* View body */}
        <div className="flex-1 overflow-hidden">
          {view === "kanban" && (
            <div className="h-full overflow-x-auto scrollbar-thin">
              <div className="flex h-full min-w-max gap-4 p-6">
                {columns.map((col) => {
                  const items = tasks.filter(tt => tt.status === col.id);
                  return (
                    <div
                      key={col.id}
                      onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
                      onDragLeave={() => setOverCol((c) => c === col.id ? null : c)}
                      onDrop={() => handleDrop(col.id)}
                      className={cn(
                        "flex h-full w-[300px] shrink-0 flex-col rounded-2xl border border-border bg-muted/30 transition-colors",
                        overCol === col.id && "bg-primary/5 border-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            col.id === "done" && "bg-success",
                            col.id === "in_progress" && "bg-warning",
                            col.id === "review" && "bg-primary",
                            col.id === "todo" && "bg-primary",
                            col.id === "backlog" && "bg-muted-foreground/40",
                          )} />
                          <h3 className="font-display text-sm font-semibold text-foreground">{col.label}</h3>
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{items.length}</Badge>
                        </div>
                        <Button onClick={() => openModal("new-task", { status: col.id })} variant="ghost" size="icon-sm" className="text-muted-foreground"><Plus className="h-4 w-4" /></Button>
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin">
                        {items.map((task) => (
                          <TaskCard key={task.id} task={task} draggingId={draggingId} setDraggingId={setDraggingId} setOverCol={setOverCol} onClick={() => openModal("edit-task", { taskId: task.id })} />
                        ))}
                        <button onClick={() => openModal("new-task", { status: col.id })} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-card hover:text-foreground">
                          <Plus className="h-4 w-4" /> {t("projects.addTask")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === "list" && <ListView tasks={tasks} onOpen={(id) => openModal("edit-task", { taskId: id })} />}
          {view === "calendar" && <CalendarView tasks={tasks} locale={i18n.language} onOpen={(id) => openModal("edit-task", { taskId: id })} />}
        </div>
        </>
        )}
      </div>
    </AppShell>
  );
};

function TeamsOverview({ teams, onOpen, onCreate }: { teams: Team[]; onOpen: (id: string) => void; onCreate: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Tes équipes</h2>
            <p className="text-sm text-muted-foreground">
              Ouvre une équipe pour gérer ses projets, ses membres et ses tâches.
            </p>
          </div>
          <Button onClick={onCreate} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle équipe
          </Button>
        </div>

        {teams.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => onOpen(team.id)}
                className="group rounded-2xl border border-border bg-card p-5 text-left shadow-elev-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elev-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: `hsl(${team.color})` }}
                    >
                      {team.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-semibold text-foreground">
                        {team.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {team.memberCount ?? 0} membres
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                  <span>Espace de travail</span>
                  <span>Ouvrir</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
            <Users2 className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
              Aucune équipe créée
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Crée d’abord une équipe. Ensuite tu pourras ouvrir son espace, créer des projets et assigner des tâches.
            </p>
            <Button onClick={onCreate} variant="hero" className="mt-5 gap-2">
              <Plus className="h-4 w-4" />
              Créer une équipe
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Task Card ----------
function TaskCard({ task, draggingId, setDraggingId, setOverCol, onClick }: { task: Task; draggingId: string | null; setDraggingId: (id: string | null) => void; setOverCol: (s: TaskStatus | null) => void; onClick: () => void; }) {
  const dueLabel = task.dueDate ? format(new Date(task.dueDate), "MMM d") : task.due;
  return (
    <Card
      draggable
      onDragStart={() => setDraggingId(task.id)}
      onDragEnd={() => { setDraggingId(null); setOverCol(null); }}
      onClick={onClick}
      className={cn(
        "group cursor-pointer border-border bg-card p-3 shadow-elev-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-elev-md hover:border-primary/30",
        draggingId === task.id && "opacity-50 rotate-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {task.tag && (
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: `hsl(${task.tag.color})` }}>
            {task.tag.label}
          </span>
        )}
        {task.fromAI && (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            <Sparkles className="h-2.5 w-2.5" /> AI
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-medium leading-snug text-foreground">{task.title}</p>
      {task.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {dueLabel && <span className="flex items-center gap-1"><CalIcon className="h-3 w-3" />{dueLabel}</span>}
          {task.comments && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{task.comments}</span>}
          {task.attachments && <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{task.attachments}</span>}
        </div>
        <div className="flex -space-x-1.5">
          {task.assignees.map((a, i) => (
            <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[9px] font-semibold text-white" style={{ backgroundColor: `hsl(${a.color})` }}>
              {a.initials}
            </div>
          ))}
        </div>
      </div>
      <div className={cn("mt-2 h-0.5 rounded-full",
        task.priority === "high" && "bg-destructive/40",
        task.priority === "med" && "bg-warning/40",
        task.priority === "low" && "bg-muted-foreground/20",
      )} />
    </Card>
  );
}

// ---------- List view ----------
function ListView({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const statusLabel: Record<TaskStatus, string> = {
    backlog: t("projects.backlog"), todo: t("projects.todo"),
    in_progress: t("projects.inProgress"), review: t("projects.review"), done: t("projects.done"),
  };
  if (!tasks.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t("projects.noTasks")}</div>;
  }
  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-border">
            <th className="px-6 py-3 font-medium">{t("projects.form.title")}</th>
            <th className="px-3 py-3 font-medium">{t("common.status")}</th>
            <th className="px-3 py-3 font-medium">{t("common.priority")}</th>
            <th className="px-3 py-3 font-medium">{t("projects.form.due")}</th>
            <th className="px-3 py-3 font-medium">Assignees</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} onClick={() => onOpen(task.id)} className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40">
              <td className="px-6 py-3">
                <div className="flex items-center gap-2">
                  {task.tag && <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: `hsl(${task.tag.color})` }}>{task.tag.label}</span>}
                  <span className="font-medium text-foreground">{task.title}</span>
                  {task.fromAI && <Sparkles className="h-3 w-3 text-primary" />}
                </div>
              </td>
              <td className="px-3 py-3"><Badge variant="outline">{statusLabel[task.status]}</Badge></td>
              <td className="px-3 py-3">
                <span className={cn("inline-flex items-center gap-1 text-xs",
                  task.priority === "high" && "text-destructive",
                  task.priority === "med" && "text-warning",
                  task.priority === "low" && "text-muted-foreground",
                )}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {t(task.priority === "high" ? "projects.priorityHigh" : task.priority === "med" ? "projects.priorityMedium" : "projects.priorityLow")}
                </span>
              </td>
              <td className="px-3 py-3 text-xs text-muted-foreground">{task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : task.due ?? "—"}</td>
              <td className="px-3 py-3">
                <div className="flex -space-x-1.5">
                  {task.assignees.map((a, i) => (
                    <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[9px] font-semibold text-white" style={{ backgroundColor: `hsl(${a.color})` }}>{a.initials}</div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Calendar view ----------
function CalendarView({ tasks, onOpen }: { tasks: Task[]; locale: string; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const [cursor, setCursor] = useState(new Date());
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(() => {
    const arr: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) { arr.push(d); d = addDays(d, 1); }
    return arr;
  }, [gridStart, gridEnd]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      if (!task.dueDate) return;
      const key = format(new Date(task.dueDate), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    });
    return map;
  }, [tasks]);

  const weekdayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="font-display text-base font-semibold text-foreground min-w-[140px] text-center">{format(cursor, "MMMM yyyy")}</h2>
          <Button variant="outline" size="icon-sm" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => setCursor(new Date())}>{t("common.today")}</Button>
        </div>
        <p className="text-xs text-muted-foreground">{tasks.filter(tt => tt.dueDate).length} {t("projects.scheduledTasks")}</p>
      </div>

      <div className="grid grid-cols-7 border-b border-border bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {weekdayLabels.map(d => <div key={d} className="px-3 py-2 text-center">{d}</div>)}
      </div>

      <div className="grid flex-1 grid-cols-7 grid-rows-6 overflow-y-auto">
        {days.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const today = isSameDay(day, new Date());
          return (
            <div key={i} className={cn(
              "min-h-[100px] border-b border-r border-border/60 p-1.5",
              !inMonth && "bg-muted/20",
            )}>
              <div className={cn("mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                today ? "bg-primary text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground/50",
              )}>{format(day, "d")}</div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <button key={task.id} onClick={() => onOpen(task.id)} className="block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium text-white transition hover:opacity-90"
                    style={{ backgroundColor: `hsl(${task.tag?.color ?? task.assignees[0]?.color ?? "221 83% 53%"})` }}>
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && <p className="px-1 text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Projects;
