import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/store/ui";
import { Calendar, FolderKanban, Hash, LayoutDashboard, LogOut, MessageSquare, Plus, Sparkles, Video } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function CommandPalette() {
  const open = useUIStore(s => s.modal === "command");
  const close = useUIStore(s => s.close);
  const openModal = useUIStore(s => s.open);
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);
  const { t } = useTranslation();

  const go = (path: string) => { close(); navigate(path); };
  const action = (fn: () => void) => { close(); fn(); };

  return (
    <CommandDialog open={open} onOpenChange={(v) => !v && close()}>
      <CommandInput placeholder={t("command.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("command.empty")}</CommandEmpty>
        <CommandGroup heading={t("command.quickActions")}>
          <CommandItem onSelect={() => action(() => openModal("new-meeting"))}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" /> {t("command.newMeeting")}
          </CommandItem>
          <CommandItem onSelect={() => action(() => openModal("new-task"))}>
            <Plus className="mr-2 h-4 w-4" /> {t("command.newTask")}
          </CommandItem>
          <CommandItem onSelect={() => action(() => openModal("new-channel"))}>
            <Hash className="mr-2 h-4 w-4" /> {t("command.newChannel")}
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("command.navigation")}>
          <CommandItem onSelect={() => go("/dashboard")}><LayoutDashboard className="mr-2 h-4 w-4" /> {t("nav.dashboard")}</CommandItem>
          <CommandItem onSelect={() => go("/meeting")}><Video className="mr-2 h-4 w-4" /> {t("command.meetingRoom")}</CommandItem>
          <CommandItem onSelect={() => go("/meetings")}><Calendar className="mr-2 h-4 w-4" /> {t("nav.aiMeetings")}</CommandItem>
          <CommandItem onSelect={() => go("/projects")}><FolderKanban className="mr-2 h-4 w-4" /> {t("nav.projects")}</CommandItem>
          <CommandItem onSelect={() => go("/chat")}><MessageSquare className="mr-2 h-4 w-4" /> {t("nav.chat")}</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("command.account")}>
          <CommandItem onSelect={() => action(async () => { await logout(); toast.success(t("auth.loggedOut")); navigate("/login"); })}>
            <LogOut className="mr-2 h-4 w-4" /> {t("command.logout")}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
