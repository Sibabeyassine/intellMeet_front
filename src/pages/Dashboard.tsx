import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock, FileText, Sparkles, TrendingUp, Users2, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/app/AppShell";
import { AppTopbar } from "@/components/app/AppTopbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useMeetingsStore } from "@/store/meetings";
import { useProjectsStore } from "@/store/projects";
import { useUser } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { useFormatters } from "@/i18n/hooks";
import { isToday } from "date-fns";
import { api, type DashboardOverview } from "@/services";

const COLORS = ["221 83% 53%", "330 75% 55%", "152 70% 45%", "38 92% 55%", "265 70% 60%", "190 80% 45%"];

const Dashboard = () => {
  const { t } = useTranslation();
  const { format: fmt } = useFormatters();
  const user = useUser();
  const meetings = useMeetingsStore(s => s.list);
  const fetchMeetings = useMeetingsStore(s => s.fetch);
  const tasks = useProjectsStore(s => s.tasks);
  const projects = useProjectsStore(s => s.projects);
  const fetchTasks = useProjectsStore(s => s.fetch);
  const openModal = useUIStore(s => s.open);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => { void fetchMeetings(); void fetchTasks(); }, [fetchMeetings, fetchTasks]);
  useEffect(() => {
    let alive = true;
    void api.dashboard.overview().then((data) => {
      if (alive) setOverview(data);
    }).catch(() => {
      if (alive) setOverview(null);
    });
    return () => { alive = false; };
  }, []);

  const dayLabels = [t("dashboard.days.mon", "Lun"), t("dashboard.days.tue", "Mar"), t("dashboard.days.wed", "Mer"), t("dashboard.days.thu", "Jeu"), t("dashboard.days.fri", "Ven"), t("dashboard.days.sat", "Sam"), t("dashboard.days.sun", "Dim")];

  const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;
  const chartData = dayLabels.map((day, i) => {
    const dayMeetings = meetings.filter((meeting) => weekdayIndex(new Date(meeting.scheduledAt)) === i);
    return {
      day,
      meetings: dayMeetings.length,
      hours: Number((dayMeetings.reduce((sum, meeting) => sum + meeting.durationMin, 0) / 60).toFixed(1))
    };
  });
  const productivityData = dayLabels.map((day, i) => ({
    day,
    actions: tasks.filter((task) => {
      const sourceDate = task.dueDate ?? task.createdAt;
      return sourceDate && weekdayIndex(new Date(sourceDate)) === i;
    }).length
  }));
  const totalMeetingHours = meetings.reduce((sum, meeting) => sum + meeting.durationMin, 0) / 60;
  const liveMeetings = meetings.filter((meeting) => meeting.status === "live").length;

  const recentSummaries = meetings.slice(0, 3).map((m, i) => ({
    title: m.title,
    time: fmt(m.scheduledAt, "EEE d · HH:mm"),
    actions: tasks.filter((task) => task.fromAI || task.tag?.label === m.title).length,
    color: COLORS[i % COLORS.length],
  }));

  const todayMeetings = useMemo(() => meetings
    .filter(m => isToday(new Date(m.scheduledAt)) || m.status === "live")
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
    .map((m, i) => ({
      id: m.id,
      time: fmt(m.scheduledAt, "HH:mm"),
      title: m.title,
      participants: m.participants.length,
      duration: `${m.durationMin} ${t("common.minutes")}`,
      color: COLORS[i % COLORS.length],
      live: m.status === "live",
    })), [meetings, fmt, t]);

  const aiTasks = useMemo(() => tasks
    .filter(t => t.status !== "done")
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))
    .slice(0, 5)
    .map(task => ({
      title: task.title,
      from: task.tag?.label ?? "Sync",
      due: task.due ?? "—",
      priority: task.priority,
    })), [tasks]);

  const teamGoals = useMemo(() => projects.slice(0, 3).map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const doneTasks = projectTasks.filter((task) => task.status === "done").length;
    return {
      id: project.id,
      name: project.name,
      value: projectTasks.length ? Math.round((doneTasks / projectTasks.length) * 100) : 0
    };
  }), [projects, tasks]);

  const kpis = {
    meetings: overview?.meetingsCount ?? meetings.length,
    actions: overview?.tasksCount ?? tasks.length,
    done: overview?.completedTasksCount ?? tasks.filter(t => t.status === "done").length,
    completion: (overview?.tasksCount ?? tasks.length) ? Math.round(((overview?.completedTasksCount ?? tasks.filter(t => t.status === "done").length) / (overview?.tasksCount ?? tasks.length)) * 100) : 0,
  };

  const firstName = user?.fullName.split(" ")[0] ?? "";

  return (
    <AppShell>
      <AppTopbar
        title={firstName ? t("dashboard.greeting", { name: firstName }) : t("dashboard.title")}
        description={fmt(new Date(), "EEEE d MMMM")}
        actions={
          <Button onClick={() => openModal("new-meeting")} variant="hero" className="hidden sm:inline-flex">
            {t("dashboard.startMeeting")}
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label={t("dashboard.kpiMeetings")} value={String(kpis.meetings)} trend={`${liveMeetings} live`} icon={Video} color="221 83% 53%" />
            <KpiCard label={t("dashboard.kpiHours")} value={`${totalMeetingHours.toFixed(1)}h`} trend={`${meetings.length} total`} icon={Sparkles} color="265 70% 60%" />
            <KpiCard label={t("dashboard.kpiTasks")} value={String(kpis.actions)} trend={`${kpis.done} done`} icon={CheckCircle2} color="152 70% 45%" />
            <KpiCard label={t("dashboard.kpiCompletion")} value={`${kpis.completion}%`} trend={`${projects.length} projets`} icon={TrendingUp} color="38 92% 55%" />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Big chart */}
            <Card className="lg:col-span-2 overflow-hidden border-border p-6 shadow-elev-sm animate-fade-in">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{t("dashboard.activity")}</h3>
                  <p className="text-xs text-muted-foreground">{t("dashboard.activitySub")}</p>
                </div>
                <Badge variant="outline" className="gap-1.5 border-success/30 bg-success/10 text-success">
                  <TrendingUp className="h-3 w-3" /> API
                </Badge>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="meetings" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#g1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Productivity */}
            <Card className="overflow-hidden border-border p-6 shadow-elev-sm animate-fade-in">
              <div className="mb-4">
                <h3 className="font-display text-base font-semibold text-foreground">{t("dashboard.productivity")}</h3>
                <p className="text-xs text-muted-foreground">{t("dashboard.productivitySub")}</p>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="actions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Today + AI tasks */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Today meetings */}
            <Card className="lg:col-span-2 overflow-hidden border-border shadow-elev-sm animate-fade-in">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{t("dashboard.todayMeetings")}</h3>
                  <p className="text-xs text-muted-foreground">{t("dashboard.todayCount", { count: todayMeetings.length })}</p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  {t("dashboard.viewAgenda")} <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              {todayMeetings.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">{t("dashboard.noMeetingsToday")}</div>
              ) : (
                <ul className="divide-y divide-border">
                  {todayMeetings.map((m, i) => (
                    <li key={i} className="group flex items-center gap-4 px-6 py-3.5 transition hover:bg-muted/40">
                      <div className="flex min-w-[60px] flex-col items-center text-center">
                        <span className="font-display text-sm font-semibold text-foreground tabular-nums">{m.time}</span>
                        <span className="text-[10px] text-muted-foreground">{m.duration}</span>
                      </div>
                      <span className="h-10 w-1 rounded-full" style={{ backgroundColor: `hsl(${m.color})` }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{m.title}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <Users2 className="h-3 w-3" />
                          {m.participants} {t("common.participants")}
                        </div>
                      </div>
                      {m.live ? (
                        <Button asChild size="sm" variant="hero">
                          <Link to={`/meeting/${m.id}`}>{t("meeting.join")}</Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-muted-foreground opacity-0 transition group-hover:opacity-100">
                          {t("common.details")}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* AI tasks */}
            <Card className="overflow-hidden border-border shadow-elev-sm animate-fade-in">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-base font-semibold text-foreground">{t("dashboard.priorityTasks")}</h3>
                </div>
                <Badge variant="outline" className="text-[10px]">{aiTasks.length}</Badge>
              </div>
              <ul className="divide-y divide-border">
                {aiTasks.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 px-5 py-3 transition hover:bg-muted/40">
                    <span className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      t.priority === "high" && "bg-destructive",
                      t.priority === "med" && "bg-warning",
                      t.priority === "low" && "bg-muted-foreground/40",
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-foreground">{t.title}</p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span className="truncate">{t.from}</span>
                        <span>·</span>
                        <Clock className="h-3 w-3" />
                        <span>{t.due}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Recent summaries + activity */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden border-border p-6 shadow-elev-sm animate-fade-in">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-foreground">{t("dashboard.recentSummaries")}</h3>
                <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <Link to="/meetings">{t("common.viewAll")} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </div>
              <ul className="space-y-3">
                {recentSummaries.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border border-border p-3 transition hover:border-primary/30 hover:shadow-elev-sm">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: `hsl(${s.color})` }}
                    >
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground">{s.time} · {s.actions} {t("meetings.actionItems").toLowerCase()}</p>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                      <Link to="/meetings">{t("common.open")}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="overflow-hidden border-border p-6 shadow-elev-sm animate-fade-in">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-foreground">{t("dashboard.teamGoals")}</h3>
                <Badge variant="secondary">Q2</Badge>
              </div>
              <div className="space-y-4">
                {teamGoals.length ? teamGoals.map((g) => (
                  <div key={g.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{g.name}</span>
                      <span className="font-semibold tabular-nums text-muted-foreground">{g.value}%</span>
                    </div>
                    <Progress value={g.value} className="h-2" />
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

function KpiCard({ label, value, trend, icon: Icon, color }: any) {
  return (
    <Card className="group overflow-hidden border-border p-5 shadow-elev-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elev-md animate-fade-in">
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ backgroundColor: `hsl(${color})` }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
          <TrendingUp className="h-3 w-3" /> {trend}
        </Badge>
      </div>
      <div className="mt-4">
        <p className="font-display text-3xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

// local cn
import { cn } from "@/lib/utils";

export default Dashboard;

function priorityRank(priority: "low" | "med" | "high") {
  return priority === "high" ? 3 : priority === "med" ? 2 : 1;
}
