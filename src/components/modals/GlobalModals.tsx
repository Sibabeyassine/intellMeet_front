import { NewMeetingModal } from "./NewMeetingModal";
import { NewTaskModal } from "./NewTaskModal";
import { EditTaskModal } from "./EditTaskModal";
import { NewChannelModal } from "./NewChannelModal";
import { NewTeamModal } from "./NewTeamModal";
import { NewProjectModal } from "./NewProjectModal";
import { InviteTeamModal } from "./InviteTeamModal";
import { CommandPalette } from "./CommandPalette";
import { useEffect } from "react";
import { useUIStore } from "@/store/ui";

/** Mounts global modals + ⌘K listener. Place once inside the router. */
export function GlobalModals() {
  const openModal = useUIStore(s => s.open);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openModal("command");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openModal]);

  return (
    <>
      <NewMeetingModal />
      <NewTaskModal />
      <EditTaskModal />
      <NewChannelModal />
      <NewTeamModal />
      <NewProjectModal />
      <InviteTeamModal />
      <CommandPalette />
    </>
  );
}
