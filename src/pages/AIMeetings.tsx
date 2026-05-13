import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, CheckCircle2, Circle, Clock, Download, FileText, Filter, ListChecks,
  Search, Share2, Sparkles, Trash2, Users2, Video,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/app/AppShell";
import { AppTopbar } from "@/components/app/AppTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMeetingsStore } from "@/store/meetings";
import { api, type ActionItem, type Meeting as ApiMeeting, type MeetingSummary, type TranscriptLine } from "@/services";

type Meeting = {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: number;
  color: string;
  tags: string[];
  summary: string;
  highlights: string[];
  decisions: string[];
  actions: { id: string; title: string; assignee: string; done: boolean }[];
  transcript: { time: string; author: string; text: string }[];
};

const COLORS = ["221 83% 53%", "152 70% 45%", "330 75% 55%", "38 92% 55%", "265 70% 60%", "190 80% 45%"];

type MeetingDetails = {
  summary: MeetingSummary | null;
  actions: ActionItem[];
  transcript: TranscriptLine[];
};

const summaryText = (meeting: ApiMeeting, details?: MeetingDetails) => {
  const highlights = details?.summary?.highlights ?? [];
  if (highlights.length) return highlights.join(" ");
  return meeting.description ??
    "Aucun resume IA disponible pour cette reunion. Lance l'analyse IA depuis le backend pour generer un summary.";
};

const mapApiMeeting = (meeting: ApiMeeting, index: number, details?: MeetingDetails): Meeting => ({
  id: meeting.id,
  title: meeting.title,
  date: new Date(meeting.scheduledAt).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }),
  duration: `${meeting.durationMin} min`,
  participants: meeting.participants.length || 1,
  color: COLORS[index % COLORS.length],
  tags: meeting.hasAISummary ? ["ai", "summary"] : ["meeting"],
  summary: summaryText(meeting, details),
  highlights: details?.summary?.highlights ?? [],
  decisions: details?.summary?.decisions ?? [],
  actions: (details?.actions ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    assignee: item.assignee,
    done: item.status === "done"
  })),
  transcript: (details?.transcript ?? []).map((line) => ({
    time: line.time,
    author: line.authorName,
    text: line.text
  }))
});

const AIMeetings = () => {
  const { t } = useTranslation();
  const apiMeetings = useMeetingsStore(s => s.list);
  const fetchMeetings = useMeetingsStore(s => s.fetch);
  const removeMeeting = useMeetingsStore(s => s.remove);
  const [detailsById, setDetailsById] = useState<Record<string, MeetingDetails>>({});
  const meetings = apiMeetings.map((meeting, index) => mapApiMeeting(meeting, index, detailsById[meeting.id]));
  const [selectedId, setSelectedId] = useState(meetings[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const selected = meetings.find(m => m.id === selectedId) ?? meetings[0];

  useEffect(() => { void fetchMeetings(); }, [fetchMeetings]);

  useEffect(() => {
    if (!selectedId || detailsById[selectedId]) return;
    let alive = true;
    void Promise.all([
      api.meetings.getSummary(selectedId),
      api.meetings.getActionItems(selectedId),
      api.meetings.getTranscript(selectedId)
    ]).then(([summary, actions, transcript]) => {
      if (!alive) return;
      setDetailsById(current => ({
        ...current,
        [selectedId]: { summary, actions, transcript }
      }));
    });

    return () => { alive = false; };
  }, [detailsById, selectedId]);

  useEffect(() => {
    if (!meetings.find(m => m.id === selectedId) && meetings[0]) setSelectedId(meetings[0].id);
  }, [meetings, selectedId]);

  const filtered = meetings.filter(m =>
    m.title.toLowerCase().includes(query.toLowerCase()) ||
    m.tags.some(tg => tg.includes(query.toLowerCase())) ||
    m.summary.toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = () => {
    if (!selected) return;
    void removeMeeting(selected.id);
    toast.success(t("meetings.deleted"));
    setConfirmDel(false);
  };

  if (!selected) {
    return (
      <AppShell>
        <AppTopbar title={t("meetings.title")} description={t("meetings.subtitle")} />
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {t("common.empty")}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppTopbar
        title={t("meetings.title")}
        description={t("meetings.subtitle")}
        actions={
          <Button variant="outline" size="sm" className="gap-2 hidden sm:inline-flex">
            <Filter className="h-4 w-4" /> {t("meetings.filters")}
          </Button>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[380px_1fr]">
        {/* List */}
        <div className="flex min-h-0 flex-col border-r border-border bg-card/40">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("meetings.search")}
                className="h-10 rounded-xl border-border bg-background pl-9 text-sm"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{filtered.length} {t("nav.aiMeetings").toLowerCase()}</span>
              <button className="hover:text-foreground">{t("common.sort")} ▾</button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <ul className="space-y-1 p-2">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setSelectedId(m.id)}
                    className={cn(
                      "group w-full rounded-xl border border-transparent p-3 text-left transition-all",
                      "hover:bg-accent",
                      selectedId === m.id && "border-primary/30 bg-primary/5 shadow-elev-sm"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: `hsl(${m.color})` }}
                      >
                        <Video className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{m.title}</p>
                        <p className="text-[11px] text-muted-foreground">{m.date} · {m.duration}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Users2 className="h-3 w-3" />{m.participants}</span>
                          <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" />{m.actions.length}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>

        {/* Detail */}
        <ScrollArea className="min-h-0">
          <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
            {/* Header */}
            <div className="animate-fade-in">
              <div className="flex flex-wrap items-center gap-2">
                {selected.tags.map(tg => (
                  <Badge key={tg} variant="secondary" className="rounded-md">#{tg}</Badge>
                ))}
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {selected.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{selected.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{selected.duration}</span>
                <span className="flex items-center gap-1.5"><Users2 className="h-4 w-4" />{selected.participants} {t("common.participants")}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="hero" size="sm" className="gap-2" onClick={() => toast.success(t("meetings.exported"))}>
                  <Download className="h-4 w-4" /> {t("meetings.exportPdf")}
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast(t("meetings.linkCopied")); }}>
                  <Share2 className="h-4 w-4" /> {t("meetings.share")}
                </Button>
                <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <Link to={`/meeting/${selected.id}`}><Video className="h-4 w-4" /> {t("meetings.rejoin")}</Link>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive ml-auto" onClick={() => setConfirmDel(true)}>
                  <Trash2 className="h-4 w-4" /> {t("common.delete")}
                </Button>
              </div>
            </div>

            {/* Summary card */}
            <Card className="relative overflow-hidden border-border p-6 shadow-elev-sm animate-fade-in">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-accent" />
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">{t("meetings.summary")}</h3>
              </div>
              <p className="text-base leading-relaxed text-foreground/90">{selected.summary}</p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("meetings.highlights")}</h4>
                  {selected.highlights.length ? (
                    <ul className="mt-2 space-y-2">
                      {selected.highlights.map((h, i) => (
                        <li key={i} className="flex gap-2 text-sm text-foreground/90">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {h}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{t("common.empty")}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("meetings.decisions")}</h4>
                  {selected.decisions.length ? (
                    <ul className="mt-2 space-y-2">
                      {selected.decisions.map((d, i) => (
                        <li key={i} className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-foreground/90">{d}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{t("common.empty")}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <Card className="overflow-hidden border-border shadow-elev-sm animate-fade-in">
              <Tabs defaultValue="actions">
                <div className="border-b border-border px-4 pt-3">
                  <TabsList className="bg-transparent">
                    <TabsTrigger value="actions" className="data-[state=active]:bg-muted">
                      <ListChecks className="mr-2 h-4 w-4" /> {t("meetings.actionItems")} ({selected.actions.length})
                    </TabsTrigger>
                    <TabsTrigger value="transcript" className="data-[state=active]:bg-muted">
                      <FileText className="mr-2 h-4 w-4" /> {t("meetings.transcript")}
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="actions" className="m-0 p-2">
                  {selected.actions.length ? (
                    <ul className="divide-y divide-border">
                      {selected.actions.map(a => (
                        <li key={a.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/40">
                          {a.done ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={cn("flex-1 text-sm", a.done ? "text-muted-foreground line-through" : "text-foreground")}>
                            {a.title}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">{a.assignee}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground">{t("common.empty")}</p>
                  )}
                </TabsContent>
                <TabsContent value="transcript" className="m-0 p-4 space-y-3">
                  {selected.transcript.length ? (
                    selected.transcript.map((tr, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{tr.time}</span>
                        <div>
                          <span className="font-semibold text-foreground">{tr.author}</span>
                          <span className="ml-2 text-foreground/90">{tr.text}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </ScrollArea>
      </div>

      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title={t("meetings.deleteConfirmTitle")}
        description={t("meetings.deleteConfirmDescription")}
        destructive
        onConfirm={handleDelete}
      />
    </AppShell>
  );
};

export default AIMeetings;
