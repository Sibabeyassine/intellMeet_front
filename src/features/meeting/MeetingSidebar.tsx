import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  api,
  type ActionItem,
  type ChatMessage as ApiChatMessage,
  type ChatMessage,
  type Meeting,
  type MeetingSummary,
  type TranscriptLine
} from "@/services";
import { Paperclip, Send, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  meetingId?: string;
  meeting?: Meeting | null;
  summary?: MeetingSummary | null;
  actionItems?: ActionItem[];
  transcript?: TranscriptLine[];
}

const mapApiMessage = (message: ApiChatMessage): ChatMessage => ({
  id: message.id,
  authorId: message.authorId,
  authorName: message.authorName,
  initials: message.initials,
  color: message.color,
  time: message.time,
  text: message.text,
  isYou: message.isYou,
  channelId: message.channelId,
  createdAt: message.createdAt,
});

export function MeetingSidebar({ meetingId, meeting, summary, actionItems = [], transcript = [] }: Props) {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const lastSavedNotesRef = useRef("");

  useEffect(() => {
    const nextNotes = meeting?.notes ?? "";
    setNotes(nextNotes);
    lastSavedNotesRef.current = nextNotes;
  }, [meeting?.id, meeting?.notes]);

  useEffect(() => {
    if (!meetingId) {
      setMessages([]);
      return;
    }

    let alive = true;
    void api.chat.listMessages(meetingId).then((items) => {
      if (alive) setMessages(items.map(mapApiMessage));
    }).catch(() => {
      if (alive) setMessages([]);
    });

    const unsubscribe = api.chat.subscribe(meetingId, (message) => {
      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current;
        return [...current, mapApiMessage(message)];
      });
    });

    const unsubscribeMeeting = api.meetings.subscribe(meetingId, (event) => {
      if (event.type !== "notes-updated") return;
      const payload = event.payload as { meetingId?: string; notes?: string };
      if (payload.meetingId !== meetingId || typeof payload.notes !== "string") return;
      lastSavedNotesRef.current = payload.notes;
      setNotes(payload.notes);
    });

    return () => {
      alive = false;
      unsubscribe();
      unsubscribeMeeting();
    };
  }, [meetingId]);

  useEffect(() => {
    if (!meetingId || notes === lastSavedNotesRef.current) return;

    setNotesSaving(true);
    const timer = window.setTimeout(() => {
      void api.meetings.update(meetingId, { notes }).then((updatedMeeting) => {
        lastSavedNotesRef.current = updatedMeeting.notes ?? notes;
      }).catch((error) => {
        toast.error(error instanceof Error ? error.message : "Notes non sauvegardées");
      }).finally(() => {
        setNotesSaving(false);
      });
    }, 800);

    return () => {
      window.clearTimeout(timer);
      setNotesSaving(false);
    };
  }, [meetingId, notes]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    if (meetingId) {
      try {
        const message = await api.chat.sendMessage({ channelId: meetingId, text });
        setMessages((current) => {
          if (current.some((item) => item.id === message.id)) return current;
          return [...current, mapApiMessage(message)];
        });
      } catch (error) {
        setInput(text);
        toast.error(error instanceof Error ? error.message : "Message non envoyé");
      }
      return;
    }

    toast.error("Ouvre une réunion avant d'envoyer un message");
  };

  const uploadFile = async (file: File) => {
    if (!meetingId) {
      toast.error("Cree ou ouvre une reunion avant d'ajouter un fichier");
      return;
    }

    try {
      const mediaFile = await api.media.uploadMeetingFile(meetingId, file);
      toast.success("Fichier ajoute a la reunion");
      const message = await api.chat.sendMessage({
        channelId: meetingId,
        text: `Fichier partage : ${mediaFile.originalName} (${mediaFile.url})`
      });
      setMessages((current) => [...current, mapApiMessage(message)]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    }
  };

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-card">
      <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
        <div className="border-b border-border px-4 pt-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted/60">
            <TabsTrigger value="chat" className="data-[state=active]:bg-card data-[state=active]:shadow-elev-sm">Chat</TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-card data-[state=active]:shadow-elev-sm">Notes</TabsTrigger>
            <TabsTrigger value="transcript" className="data-[state=active]:bg-card data-[state=active]:shadow-elev-sm">Live</TabsTrigger>
          </TabsList>
        </div>

        {/* CHAT */}
        <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden data-[state=inactive]:hidden" forceMount>
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              {messages.length ? (
                messages.map((m) => (
                  <div key={m.id} className={cn("flex gap-3 animate-fade-in", m.isYou && "flex-row-reverse")}>
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: `hsl(${m.color})` }}
                    >
                      {m.initials}
                    </div>
                    <div className={cn("max-w-[80%]", m.isYou && "items-end text-right")}>
                      <div className={cn("flex items-baseline gap-2 text-xs text-muted-foreground", m.isYou && "justify-end")}>
                        <span className="font-medium text-foreground">{m.isYou ? "Toi" : m.authorName}</span>
                        <span>{m.time}</span>
                      </div>
                      <div
                        className={cn(
                          "mt-1 inline-block rounded-2xl px-3.5 py-2 text-sm",
                          m.isYou ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
                        )}
                      >
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Aucun message pour cette réunion.
                </p>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={send} className="border-t border-border bg-card p-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                title="Joindre un fichier"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadFile(file);
                  event.target.value = "";
                }}
              />
              <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrire un message…"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground"><Smile className="h-4 w-4" /></Button>
              <Button type="submit" size="icon-sm" className="bg-gradient-accent text-primary-foreground hover:brightness-110">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* NOTES */}
        <TabsContent value="notes" className="flex-1 overflow-hidden data-[state=inactive]:hidden" forceMount>
          <ScrollArea className="h-full">
            <div className="space-y-4 p-5">
              <div>
                <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes collaboratives</h4>
                <p className="mt-1 text-xs text-muted-foreground">{meeting?.status ?? "scheduled"}</p>
              </div>
              <div className="space-y-3 text-sm leading-relaxed">
                <h3 className="font-display text-lg font-semibold text-foreground">{meeting?.title ?? "Réunion"}</h3>
                <p className="text-muted-foreground">
                  {meeting?.scheduledAt ? new Date(meeting.scheduledAt).toLocaleString("fr-FR") : "Date non définie"} · {meeting?.participants.length ?? 0} participants
                </p>
                <h5 className="mt-4 font-display font-semibold text-foreground">Agenda</h5>
                <p className="text-foreground/90">{meeting?.description || "Aucun agenda renseigné pour cette réunion."}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="font-display font-semibold text-foreground">Notes partagées</h5>
                    <span className="text-[11px] text-muted-foreground">{notesSaving ? "Sauvegarde..." : "Synchronisées"}</span>
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Ajoute les décisions, points à suivre ou informations importantes..."
                    className="min-h-40 resize-none rounded-xl bg-background text-sm"
                    maxLength={20000}
                  />
                </div>
                <h5 className="mt-4 font-display font-semibold text-foreground">Décisions</h5>
                {summary?.decisions?.length ? (
                  <ul className="ml-5 list-disc space-y-1 text-foreground/90">
                    {summary.decisions.map((decision) => <li key={decision}>{decision}</li>)}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Aucune décision détectée.</p>
                )}
                <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary">
                  L'IA a détecté {actionItems.length} action item{actionItems.length > 1 ? "s" : ""}.
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* TRANSCRIPT */}
        <TabsContent value="transcript" className="flex-1 overflow-hidden data-[state=inactive]:hidden" forceMount>
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Transcription en direct · FR
              </div>
              {transcript.length ? (
                transcript.map((t) => (
                  <div key={t.id} className="flex gap-3 animate-fade-in">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: `hsl(${t.color})` }}
                    >
                      {t.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 text-xs">
                        <span className="font-medium text-foreground">{t.authorName}</span>
                        <span className="text-muted-foreground tabular-nums">{t.time}</span>
                      </div>
                      <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">{t.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Aucune transcription disponible pour cette réunion.
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
