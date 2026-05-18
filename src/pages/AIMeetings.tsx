import { useEffect, useMemo, useState } from "react";
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
  status: ApiMeeting["status"];
  statusLabel: string;
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

const formatMeetingDate = (value: string) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

const formatDuration = (meeting: ApiMeeting) => {
  if (meeting.status === "scheduled") return `${meeting.durationMin} min prévues`;
  if (meeting.durationMin > 480) return "Durée non clôturée";
  return `${meeting.durationMin} min`;
};

const statusLabel = (status: ApiMeeting["status"]) => {
  if (status === "live") return "En direct";
  if (status === "scheduled") return "Planifiée";
  return "Terminée";
};

const pdfEscape = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n]/g, "");

const wrapPdfText = (text: string, maxChars = 88) => {
  const lines: string[] = [];

  text.split("\n").forEach((rawLine) => {
    const words = rawLine.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      return;
    }

    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
  });

  return lines;
};

const buildMeetingPdf = (meeting: Meeting) => {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 48;
  const lineHeight = 16;
  const bottomMargin = 54;
  const commands: string[] = [];
  let pageCount = 1;
  let y = pageHeight - margin;

  const newPage = () => {
    commands.push("ET");
    commands.push("%%PAGE_BREAK%%");
    commands.push("BT");
    commands.push("/F1 11 Tf");
    y = pageHeight - margin;
    pageCount += 1;
  };

  const writeLine = (text = "", size = 11, offset = 0) => {
    if (y < bottomMargin) newPage();
    commands.push(`/F1 ${size} Tf`);
    commands.push(`${margin + offset} ${y} Td (${pdfEscape(text)}) Tj`);
    commands.push(`${-(margin + offset)} ${-lineHeight} Td`);
    y -= lineHeight;
  };

  const writeBlock = (title: string, lines: string[]) => {
    y -= 8;
    writeLine(title.toUpperCase(), 12);
    lines.forEach((line) => writeLine(line, 10));
  };

  commands.push("BT");
  commands.push("/F1 18 Tf");
  commands.push(`${margin} ${y} Td (${pdfEscape("IntellMeet - Compte rendu de reunion")}) Tj`);
  y -= 26;
  commands.push(`0 -26 Td`);
  writeLine(meeting.title, 16);
  writeLine(`${meeting.statusLabel} | ${meeting.date} | ${meeting.duration} | ${meeting.participants} participants`, 10);
  writeBlock("Resume IA", wrapPdfText(meeting.summary || "Aucun resume disponible."));
  writeBlock("Points cles", meeting.highlights.length ? meeting.highlights.flatMap((item) => wrapPdfText(`- ${item}`)) : ["- Aucun"]);
  writeBlock("Decisions", meeting.decisions.length ? meeting.decisions.flatMap((item) => wrapPdfText(`- ${item}`)) : ["- Aucune"]);
  writeBlock("Actions", meeting.actions.length ? meeting.actions.flatMap((item) => wrapPdfText(`- ${item.title} (${item.assignee})`)) : ["- Aucune"]);
  writeBlock("Transcription", meeting.transcript.length ? meeting.transcript.flatMap((item) => wrapPdfText(`${item.time} ${item.author}: ${item.text}`, 82)) : ["Aucune transcription disponible."]);
  commands.push("ET");

  const pageStreams = commands
    .join("\n")
    .split("%%PAGE_BREAK%%")
    .map((content) => content.trim());
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids ${pageStreams.map((_, index) => `${3 + index * 2} 0 R`).join(" ")} /Count ${pageCount} >>`
  ];

  pageStreams.forEach((stream, index) => {
    const pageObjectId = 3 + index * 2;
    const streamObjectId = pageObjectId + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + pageStreams.length * 2} 0 R >> >> /Contents ${streamObjectId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(chunks.join("").length);
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });
  const xrefOffset = chunks.join("").length;
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach((offset) => {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob([chunks.join("")], { type: "application/pdf" });
};

const mapApiMeeting = (meeting: ApiMeeting, index: number, details?: MeetingDetails): Meeting => ({
  id: meeting.id,
  title: meeting.title,
  date: formatMeetingDate(meeting.scheduledAt),
  duration: formatDuration(meeting),
  status: meeting.status,
  statusLabel: statusLabel(meeting.status),
  participants: meeting.participants.length || 1,
  color: COLORS[index % COLORS.length],
  tags: [
    statusLabel(meeting.status).toLowerCase(),
    ...(meeting.hasAISummary ? ["ia", "résumé"] : ["réunion"])
  ],
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
  const meetings = useMemo(
    () => apiMeetings.map((meeting, index) => mapApiMeeting(meeting, index, detailsById[meeting.id])),
    [apiMeetings, detailsById]
  );
  const [selectedId, setSelectedId] = useState(meetings[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const selected = meetings.find(m => m.id === selectedId) ?? meetings[0];
  const selectedIsJoinable = selected?.status === "live" || selected?.status === "scheduled";

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

  const handleAnalyze = async () => {
    if (!selected || analyzing) return;
    setAnalyzing(true);
    try {
      const suggestions = await api.ai.generateSuggestions(selected.id);
      await fetchMeetings();
      setDetailsById(current => {
        const next = { ...current };
        delete next[selected.id];
        return next;
      });
      if (suggestions.length) {
        toast.success("Analyse IA générée");
      } else {
        toast.error("Ajoute un transcript, une description ou un résumé avant de lancer l'analyse IA.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analyse IA impossible");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (!selected) return;
    const blob = buildMeetingPdf(selected);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selected.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-compte-rendu.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("meetings.exported"));
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
                        <p className="text-[11px] text-muted-foreground">{m.statusLabel} · {m.date}</p>
                        <p className="text-[11px] text-muted-foreground">{m.duration}</p>
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
                <Button variant="hero" size="sm" className="gap-2" onClick={handleExport}>
                  <Download className="h-4 w-4" /> Exporter le compte rendu
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleAnalyze} disabled={analyzing}>
                  <Sparkles className="h-4 w-4" /> {analyzing ? "Analyse..." : "Générer le résumé IA"}
                </Button>
                {selectedIsJoinable && (
                  <>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/meeting/${selected.id}`); toast(t("meetings.linkCopied")); }}>
                      <Share2 className="h-4 w-4" /> Copier le lien de salle
                    </Button>
                    <Button asChild variant={selected.status === "live" ? "outline" : "ghost"} size="sm" className="gap-2 text-muted-foreground">
                      <Link to={`/meeting/${selected.id}`}>
                        <Video className="h-4 w-4" /> {selected.status === "live" ? "Rejoindre la réunion" : "Ouvrir la salle"}
                      </Link>
                    </Button>
                  </>
                )}
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
