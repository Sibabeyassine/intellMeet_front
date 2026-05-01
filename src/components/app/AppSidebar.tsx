import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  Sparkles,
  Users2,
  MessageSquare,
  Settings,
  HelpCircle,
  PlusCircle,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore, useUser } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { useChatStore } from "@/store/chat";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainNav = [
  { to: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/meetings", icon: Sparkles, key: "aiMeetings" },
  { to: "/projects", icon: Users2, key: "projects" },
  { to: "/chat", icon: MessageSquare, key: "chat" },
];

const secondaryNav = [
  { to: "/settings", icon: Settings, key: "settings" },
  { to: "/help", icon: HelpCircle, key: "help" },
];

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const user = useUser();
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const openModal = useUIStore(s => s.open);
  const channels = useChatStore(s => s.channels);
  const dms = useChatStore(s => s.dms);
  const fetchChat = useChatStore(s => s.fetchAll);
  const setActive = useChatStore(s => s.setActive);
  const { t } = useTranslation();
  useEffect(() => { void fetchChat(); }, [fetchChat]);

  const unreadByPath: Record<string, number> = {
    "/chat": [...channels, ...dms].reduce((n, c) => n + (c.unread ?? 0), 0),
  };

  const handleLogout = async () => {
    await logout();
    toast.success(t("auth.loggedOut"));
    navigate("/login");
  };
  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "relative flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-16 shrink-0 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-5")}>
          <Logo size="sm" showWordmark={!collapsed} />
        </div>

        {/* New meeting CTA */}
        <div className={cn("p-3", collapsed && "px-2")}>
          <Button
            variant="hero"
            className={cn("w-full justify-center gap-2", collapsed && "px-0")}
            size={collapsed ? "icon" : "default"}
            onClick={() => openModal("new-meeting")}
          >
            <PlusCircle className="h-4 w-4" />
            {!collapsed && <span>{t("nav.newMeeting")}</span>}
          </Button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          {!collapsed && (
            <p className="mb-2 mt-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("nav.workspace")}
            </p>
          )}
          <ul className="space-y-0.5">
            {mainNav.map((item) => {
              const unread = unreadByPath[item.to];
              return (
                <NavItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={t(`nav.${item.key}`)}
                  badge={unread ? String(unread) : undefined}
                  collapsed={collapsed}
                />
              );
            })}
          </ul>

          {!collapsed && (
            <>
              <div className="mb-2 mt-6 flex items-center justify-between px-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("nav.channels")}
                </p>
                <button
                  onClick={() => openModal("new-channel")}
                  className="text-muted-foreground transition hover:text-foreground"
                  aria-label={t("nav.newChannel")}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                </button>
              </div>
              <ul className="space-y-0.5">
                {channels.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => { setActive(c.id); navigate("/chat"); }}
                      className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
                    >
                      <span className="text-muted-foreground/60">#</span>
                      <span className="flex-1 truncate text-left">{c.name}</span>
                      {!!c.unread && (
                        <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{c.unread}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Secondary */}
        <div className="border-t border-sidebar-border p-3">
          <ul className="space-y-0.5">
            {secondaryNav.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={t(`nav.${item.key}`)}
                collapsed={collapsed}
              />
            ))}
          </ul>

          {/* User card with menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "mt-3 flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-2 text-left transition hover:bg-sidebar-accent",
                  collapsed && "justify-center px-1"
                )}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground"
                  style={{ backgroundColor: user ? `hsl(${user.color})` : undefined, background: !user ? "var(--gradient-accent)" : undefined }}
                >
                  {user?.initials ?? "VB"}
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{user?.fullName ?? t("nav.guest")}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{user ? t("nav.proPlan") : t("nav.notConnected")}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel className="truncate">{user?.email ?? "—"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> {t("nav.profile")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" /> {t("nav.settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Collapse button */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? t("common.next") : t("common.back")}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-elev-sm transition hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
    </TooltipProvider>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  badge,
  collapsed,
}: {
  to: string;
  icon: any;
  label: string;
  badge?: string;
  collapsed: boolean;
}) {
  const location = useLocation();
  const active = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));

  const link = (
    <NavLink
      to={to}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />}
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge && (
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return <li>{link}</li>;
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">
          {label} {badge && <span className="ml-1 text-muted-foreground">· {badge}</span>}
        </TooltipContent>
      </Tooltip>
    </li>
  );
}
