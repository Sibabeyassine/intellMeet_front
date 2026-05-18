import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
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
import type { Channel, ChatMessage } from "@/services";

const Chat = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const channelsLive = useChatStore(s => s.channels);
  const dmsLive = useChatStore(s => s.dms);
  const messagesMap = useChatStore(s => s.messages);
  const activeId = useChatStore(s => s.activeId);
  const setActive = useChatStore(s => s.setActive);
  const send = useChatStore(s => s.send);
  const fetchAll = useChatStore(s => s.fetchAll);
  const refreshActive = useChatStore(s => s.refreshActive);
  const disconnectChat = useChatStore(s => s.disconnect);
  const openModal = useUIStore(s => s.open);
  const targetChannelId = useMemo(
    () => new URLSearchParams(location.search).get("channel"),
    [location.search]
  );

  useEffect(() => {
    void fetchAll().catch(() => undefined);
  }, [fetchAll]);
  useEffect(() => {
    if (!targetChannelId) return;

    const exists = [...channelsLive, ...dmsLive].some((channel) => channel.id === targetChannelId);
    if (!exists) {
      if (channelsLive.length || dmsLive.length) {
        navigate("/chat", { replace: true });
      }
      return;
    }

    setActive(targetChannelId);
    navigate("/chat", { replace: true });
  }, [channelsLive, dmsLive, navigate, setActive, targetChannelId]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshActive();
    }, 5000);

    return () => {
      window.clearInterval(interval);
      disconnectChat();
    };
  }, [disconnectChat, refreshActive]);

  const active = [...channelsLive, ...dmsLive].find(c => c.id === activeId) ?? channelsLive[0] ?? dmsLive[0];
  const messages = active ? (messagesMap[active.id] ?? []) as ChatMessage[] : [];
  const [input, setInput] = useState("");

  const switchChannel = (id: string) => setActive(id);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !active) return;
    const text = input.trim();
    setInput("");
    await send(text);
  };

  return (
    <AppShell>
      <AppTopbar title={t("chat.title")} description={t("chat.subtitle")} />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_1fr]">
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
                {channelsLive.map(c => (
                  <ChannelItem key={c.id} channel={c} active={active?.id === c.id} onClick={() => switchChannel(c.id)} />
                ))}
              </ul>
              <SectionLabel className="mt-5">{t("chat.directMessages")} <Plus className="h-3 w-3" /></SectionLabel>
              <ul className="mt-1 space-y-0.5">
                {dmsLive.map(c => (
                  <ChannelItem key={c.id} channel={c} active={active?.id === c.id} onClick={() => switchChannel(c.id)} />
                ))}
              </ul>
              {!channelsLive.length && !dmsLive.length && (
                <p className="px-2 py-4 text-sm text-muted-foreground">
                  Aucun canal disponible. Crée ou ouvre une réunion pour activer son chat.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/40 px-5">
            <div className="flex min-w-0 items-center gap-3">
              {!active ? (
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">Chat</p>
                  <p className="text-[11px] text-muted-foreground">Aucune conversation disponible</p>
                </div>
              ) : active.kind === "channel" ? (
                <>
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{active.name}</p>
                    <p className="text-[11px] text-muted-foreground">{active.topic ?? t("chat.topic")}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: `hsl(${active.color ?? "221 83% 53%"})` }}
                    >
                      {active.initials ?? active.name.slice(0, 2).toUpperCase()}
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

          <ScrollArea className="flex-1">
            <div className="space-y-1 p-5">
              <div className="mx-auto my-4 flex max-w-md items-center gap-3 text-[11px] text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> {t("chat.today")} <span className="h-px flex-1 bg-border" />
              </div>
              {messages.length ? messages.map((m, i) => {
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
              }) : (
                <p className="mx-auto my-10 max-w-md rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Aucun message pour cette conversation.
                </p>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSend} className="border-t border-border bg-card/40 p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground"><Paperclip className="h-4 w-4" /></Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!active}
                placeholder={active ? t("chat.messagePlaceholder", { target: active.kind === "channel" ? "#" + active.name : active.name }) : "Aucune conversation sélectionnée"}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground"><Smile className="h-4 w-4" /></Button>
              <Button type="submit" size="icon-sm" disabled={!active} className="bg-gradient-accent text-primary-foreground hover:brightness-110">
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
              style={{ backgroundColor: `hsl(${channel.color ?? "221 83% 53%"})` }}
            >
              {channel.initials ?? channel.name.slice(0, 2).toUpperCase()}
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
