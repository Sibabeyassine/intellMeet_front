import { useState } from "react";
import { Send, Smile, Paperclip } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockMessages, mockTranscript, type ChatMessage } from "./mock";
import { cn } from "@/lib/utils";

export function MeetingSidebar() {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [input, setInput] = useState("");

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(m => [
      ...m,
      {
        id: `m${Date.now()}`,
        authorId: "2",
        authorName: "Toi",
        initials: "VB",
        color: "152 70% 45%",
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        text: input.trim(),
        isYou: true,
      },
    ]);
    setInput("");
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
              {messages.map((m) => (
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
              ))}
            </div>
          </ScrollArea>

          <form onSubmit={send} className="border-t border-border bg-card p-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground"><Paperclip className="h-4 w-4" /></Button>
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
                <p className="mt-1 text-xs text-muted-foreground">3 collaborateurs éditent en direct</p>
              </div>
              <div className="space-y-3 text-sm leading-relaxed">
                <h3 className="font-display text-lg font-semibold text-foreground">Sync produit — Roadmap Q2</h3>
                <p className="text-muted-foreground">📅 25 avril · 10:00 · 6 participants</p>
                <h5 className="mt-4 font-display font-semibold text-foreground">Agenda</h5>
                <ul className="ml-5 list-disc space-y-1 text-foreground/90">
                  <li>Validation roadmap Q2</li>
                  <li>Status intégration Stripe</li>
                  <li>Présentation mockups onboarding</li>
                </ul>
                <h5 className="mt-4 font-display font-semibold text-foreground">Décisions</h5>
                <ul className="ml-5 list-disc space-y-1 text-foreground/90">
                  <li>Review interne planifiée jeudi 15h</li>
                  <li>Sprint Stripe priorité haute</li>
                </ul>
                <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary">
                  💡 L'IA a détecté 3 action items — voir le panneau IntellMeet AI
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
              {mockTranscript.map((t) => (
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
              ))}
              <div className="flex items-center gap-2 pt-2 text-sm italic text-muted-foreground">
                <span className="inline-flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0s" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0.15s" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0.3s" }} />
                </span>
                Léa parle…
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
