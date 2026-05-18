import { Bell, Check, Command, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUIStore } from "@/store/ui";
import { useNotificationsStore, useUnreadCount } from "@/store/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sparkles, Calendar, AtSign, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { Notification } from "@/services";

interface Props {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const iconFor = (kind: Notification["kind"]) =>
  kind === "ai"
    ? Sparkles
    : kind === "meeting"
      ? Calendar
      : kind === "mention"
        ? AtSign
        : kind === "message"
          ? MessageSquare
          : CheckCircle2;

export function AppTopbar({ title, description, actions }: Props) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const openModal = useUIStore(s => s.open);
  const notifs = useNotificationsStore(s => s.list);
  const markAllRead = useNotificationsStore(s => s.markAllRead);
  const unread = useUnreadCount();
  const { t } = useTranslation();
  const handleNotificationsOpenChange = (open: boolean) => {
    setNotificationsOpen(open);
    if (open && unread > 0) {
      void markAllRead();
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-xl font-semibold leading-tight text-foreground">{title}</h1>
        {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
      </div>

      <div className="hidden flex-1 max-w-md md:block">
        <button
          type="button"
          onClick={() => openModal("command")}
          className="group relative flex h-10 w-full items-center rounded-xl border border-border bg-muted/40 px-3 text-left text-sm text-muted-foreground transition hover:bg-background"
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">{t("topbar.searchPlaceholder")}</span>
          <kbd className="pointer-events-none flex h-5 items-center gap-1 rounded-md border border-border bg-card px-1.5 text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {actions}

        <Popover open={notificationsOpen} onOpenChange={handleNotificationsOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={t("topbar.notifications")}>
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground ring-2 ring-background">
                  {unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[360px] p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-display text-sm font-semibold">{t("topbar.notifications")}</p>
              <button onClick={() => void markAllRead()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Check className="h-3 w-3" /> {t("topbar.markAllRead")}
              </button>
            </div>
            <ul className="max-h-[360px] overflow-y-auto scrollbar-thin">
              {notifs.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">{t("topbar.noNotifications")}</li>
              )}
              {notifs.map(n => {
                const Icon = iconFor(n.kind);
                const itemClassName = cn(
                  "flex items-start gap-3 px-4 py-3 transition",
                  n.kind === "message" ? "cursor-default" : "hover:bg-muted/40",
                  !n.read && "bg-primary/5"
                );
                const content = (
                  <>
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    </div>
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </>
                );

                return (
                  <li key={n.id}>
                    {n.kind === "message" || !n.href ? (
                      <div className={itemClassName}>{content}</div>
                    ) : (
                      <Link to={n.href} className={itemClassName}>{content}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>

        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
