import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/store/chat";
import { useUIStore } from "@/store/ui";
import { Hash, Plus, Search, Send, Smile, Paperclip, Phone, Video, Info, Pin, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { AppTopbar } from "@/components/app/AppTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ChannelKind = "channel" | "dm";

type Channel = {
  id: string;
  name: string;
  kind: ChannelKind;
  unread?: number;
  online?: boolean;
  color?: string;
  initials?: string;
  lastSeen?: string;
};

const channels: Channel[] = [
  { id: "produit", name: "produit", kind: "channel", unread: 2 },
  { id: "design", name: "design", kind: "channel", unread: 0 },
  { id: "engineering", name: "engineering", kind: "channel", unread: 5 },
  { id: "random", name: "random", kind: "channel" },
  { id: "annonces", name: "annonces", kind: "channel" },
];

const dms: Channel[] = [
  { id: "lea", name: "Léa Moreau", kind: "dm", online: true, color: "221 83% 53%", initials: "LM", unread: 1 },
  { id: "marc", name: "Marc Dubois", kind: "dm", online: true, color: "38 92% 55%", initials: "MD" },
  { id: "sofia", name: "Sofia Rinaldi", kind: "dm", online: false, color: "330 75% 55%", initials: "SR", lastSeen: "il y a 1h" },
  { id: "amira", name: "Amira Haddad", kind: "dm", online: true, color: "190 80% 45%", initials: "AH" },
  { id: "kenji", name: "Kenji Tanaka", kind: "dm", online: false, color: "265 70% 60%", initials: "KT", lastSeen: "hier" },
];

type Msg = {
  id: string;
  authorName: string;
  initials: string;
  color: string;
  time: string;
  text: string;
  isYou?: boolean;
  reactions?: { emoji: string; count: number }[];
  ai?: boolean;
};

const seedMessages: Record<string, Msg[]> = {
  produit: [
    { id: "p1", authorName: "Léa Moreau", initials: "LM", color: "221 83% 53%", time: "09:42", text: "Hello team 👋 dispo pour le sync produit dans 15 min ?" },
    { id: "p2", authorName: "Marc Dubois", initials: "MD", color: "38 92% 55%", time: "09:43", text: "Yes, j'arrive avec les chiffres Stripe", reactions: [{ emoji: "🔥", count: 3 }] },
    { id: "p3", authorName: "Sofia Rinaldi", initials: "SR", color: "330 75% 55%", time: "09:45", text: "Mockups push sur Figma : https://figma.com/intellmeet-onb-v2" },
    { id: "p4", authorName: "IntellMeet AI", initials: "AI", color: "265 70% 60%", time: "09:46", text: "📌 J'ai créé 4 action items à partir du sync produit de ce matin. Tu veux les voir ?", ai: true },
    { id: "p5", authorName: "Toi", initials: "VB", color: "152 70% 45%", time: "09:48", text: "Top, on regarde ça après le call ✨", isYou: true, reactions: [{ emoji: "👍", count: 2 }] },
    { id: "p6", authorName: "Amira Haddad", initials: "AH", color: "190 80% 45%", time: "09:55", text: "Je rejoins, j'ai aussi update sur la doc API." },
  ],
};

const Chat = () => {
  const { t } = useTranslation();
  const channelsLive = useChatStore(s => s.channels);
  const dmsLive = useChatStore(s => s.dms);
  const messagesMap = useChatStore(s => s.messages);
  const activeId = useChatStore(s => s.activeId);
  const setActive = useChatStore(s => s.setActive);
  const send = useChatStore(s => s.send);
  const fetchAll = useChatStore(s => s.fetchAll);
  const openModal = useUIStore(s => s.open);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const allChannels = channelsLive.length ? channelsLive : channels;
  const allDms = dmsLive.length ? dmsLive : dms;
  const active = [...allChannels, ...allDms].find(c => c.id === activeId) ?? allChannels[0] ?? channels[0];
  const messages = (messagesMap[activeId] ?? seedMessages[activeId] ?? []) as Msg[];
  const [input, setInput] = useState("");

  const switchChannel = (id: string) => setActive(id);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    await send(text);
  };

  return (
    <AppShell>
      <AppTopbar title={t("chat.title")} description={t("chat.subtitle")} />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_1fr]">
        {/* Channels list */}
        <div className="flex min-h-0 flex-col border-r border-border bg-card/40">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={t("chat.search")} className="h-9 rounded-lg border-border bg-background pl-9 text-sm" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              <SectionLabel>
                {t("chat.channels")}
                <button onClick={() => openModal("new-channel")} aria-label={t("chat.newChannel")} className="hover:text-foreground"><Plus className="h-3 w-3" /></button>
              </SectionLabel>
              <ul className="mt-1 space-y-0.5">
                {allChannels.map(c => (
                  <ChannelItem key={c.id} channel={c} active={activeId === c.id} onClick={() => switchChannel(c.id)} />
                ))}
              </ul>
              <SectionLabel className="mt-5">{t("chat.directMessages")} <Plus className="h-3 w-3" /></SectionLabel>
              <ul className="mt-1 space-y-0.5">
                {allDms.map(c => (
                  <ChannelItem key={c.id} channel={c} active={activeId === c.id} onClick={() => switchChannel(c.id)} />
                ))}
              </ul>
            </div>
          </ScrollArea>
        </div>

        {/* Conversation */}
        <div className="flex min-h-0 flex-col">
          {/* header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/40 px-5">
            <div className="flex min-w-0 items-center gap-3">
              {active.kind === "channel" ? (
                <>
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{active.name}</p>
                    <p className="text-[11px] text-muted-foreground">8 {t("common.members")} · {t("chat.topic")} : roadmap & releases</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: `hsl(${active.color})` }}
                    >
                      {active.initials}
                    </div>
                    {active.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />}
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{active.name}</p>
                    <p className="text-[11px] text-muted-foreground">{active.online ? t("chat.online") : t("chat.lastSeen", { when: active.lastSeen })}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm"><Phone className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon-sm"><Video className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon-sm"><Pin className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon-sm"><Info className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* messages */}
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-5">
              <div className="mx-auto my-4 flex max-w-md items-center gap-3 text-[11px] text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> {t("chat.today")} <span className="h-px flex-1 bg-border" />
              </div>
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const grouped = prev && prev.authorName === m.authorName;
                return (
                  <div key={m.id} className={cn("flex gap-3 px-2 py-1.5 -mx-2 rounded-lg hover:bg-muted/40 animate-fade-in", grouped && "pt-0.5")}>
                    {grouped ? (
                      <span className="w-9 shrink-0 text-center text-[10px] text-transparent group-hover:text-muted-foreground">{m.time}</span>
                    ) : (
                      <div
                        className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white", m.ai && "shadow-glow")}
                        style={{ backgroundColor: `hsl(${m.color})`, backgroundImage: m.ai ? "var(--gradient-accent)" : undefined }}
                      >
                        {m.ai ? <Sparkles className="h-4 w-4" /> : m.initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {!grouped && (
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-foreground text-sm">{m.authorName}</span>
                          {m.ai && <Badge variant="outline" className="h-4 border-primary/30 bg-primary/10 px-1.5 text-[9px] font-bold text-primary">AI</Badge>}
                          <span className="text-[11px] text-muted-foreground tabular-nums">{m.time}</span>
                        </div>
                      )}
                      <p className="text-sm text-foreground/90 leading-relaxed">{m.text}</p>
                      {m.reactions && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {m.reactions.map((r, ri) => (
                            <button key={ri} className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] hover:bg-primary/15">
                              <span>{r.emoji}</span>
                              <span className="font-semibold text-primary">{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* composer */}
          <form onSubmit={handleSend} className="border-t border-border bg-card/40 p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground"><Paperclip className="h-4 w-4" /></Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.messagePlaceholder", { target: active.kind === "channel" ? "#" + active.name : active.name })}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground"><Smile className="h-4 w-4" /></Button>
              <Button type="submit" size="icon-sm" className="bg-gradient-accent text-primary-foreground hover:brightness-110">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 px-1 text-[10px] text-muted-foreground">
              {t("chat.channelHint")}
            </p>
          </form>
        </div>
      </div>
    </AppShell>
  );
};

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>
      {children}
    </div>
  );
}

function ChannelItem({ channel, active, onClick }: { channel: Channel; active: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
        )}
      >
        {channel.kind === "channel" ? (
          <Hash className="h-4 w-4 shrink-0" />
        ) : (
          <span className="relative">
            <span
              className="flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white"
              style={{ backgroundColor: `hsl(${channel.color})` }}
            >
              {channel.initials}
            </span>
            {channel.online && <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-sidebar" />}
          </span>
        )}
        <span className="flex-1 truncate text-left">{channel.name}</span>
        {channel.unread ? (
          <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{channel.unread}</span>
        ) : null}
      </button>
    </li>
  );
}

export default Chat;
