import { useState } from "react";
import { ArrowLeft, Copy, Lock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ParticipantTile } from "@/features/meeting/ParticipantTile";
import { MeetingControls } from "@/features/meeting/MeetingControls";
import { MeetingSidebar } from "@/features/meeting/MeetingSidebar";
import { AIPanel } from "@/features/meeting/AIPanel";
import { mockParticipants } from "@/features/meeting/mock";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MeetingRoom = () => {
  const { t } = useTranslation();
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAI, setShowAI] = useState(true);

  // "you" reflects toggles
  const participants = mockParticipants.map(p =>
    p.isYou ? { ...p, isMuted: !micOn, isCameraOn: cameraOn } : p
  );
  const mainSpeaker = participants.find(p => p.isSpeaking) ?? participants[0];
  const others = participants.filter(p => p.id !== mainSpeaker.id);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon-sm" aria-label={t("meeting.back")}>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <Logo size="sm" />
          <span className="hidden h-5 w-px bg-border sm:block" />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-sm font-semibold text-foreground">{t("meeting.title")}</span>
            <span className="text-[11px] text-muted-foreground">{t("meeting.live")} · 12 {t("common.minutes")}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden gap-1.5 border-border bg-background sm:flex">
            <Lock className="h-3 w-3" /> intellmeet.app/r/q2-sync
            <button onClick={() => { navigator.clipboard?.writeText("intellmeet.app/r/q2-sync"); toast.success(t("meeting.linkCopied")); }} className="ml-1 text-muted-foreground hover:text-foreground">
              <Copy className="h-3 w-3" />
            </button>
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Users className="h-3 w-3" />
            {participants.length}
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Main area */}
      <div className="flex min-h-0 flex-1">
        {/* Video grid */}
        <main className="relative flex min-w-0 flex-1 flex-col bg-gradient-mesh">
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 lg:flex-row">
            {/* Main speaker */}
            <div className="relative min-h-[40vh] flex-1 lg:min-h-0">
              <ParticipantTile participant={mainSpeaker} isPinned className="h-full w-full animate-scale-in" />
            </div>

            {/* Side strip (desktop) / horizontal (mobile) */}
            <div className="grid grid-flow-col auto-cols-[160px] gap-3 overflow-x-auto pb-1 scrollbar-thin lg:grid-flow-row lg:auto-cols-auto lg:auto-rows-[120px] lg:w-44 lg:overflow-y-auto">
              {others.map((p, i) => (
                <ParticipantTile
                  key={p.id}
                  participant={p}
                  className="h-[120px] w-full animate-fade-in"
                />
              ))}
            </div>
          </div>

          {/* Floating controls */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4">
            <MeetingControls
              micOn={micOn}
              cameraOn={cameraOn}
              onToggleMic={() => setMicOn(v => !v)}
              onToggleCamera={() => setCameraOn(v => !v)}
              onToggleSidebar={() => setShowSidebar(v => !v)}
              onToggleAI={() => setShowAI(v => !v)}
            />
          </div>
        </main>

        {/* Sidebar (chat/notes/transcript) */}
        <div
          className={cn(
            "hidden border-l border-border transition-[width] duration-300 lg:block",
            showSidebar ? "w-[340px]" : "w-0"
          )}
        >
          {showSidebar && <MeetingSidebar />}
        </div>

        {/* AI panel */}
        <div
          className={cn(
            "hidden transition-[width] duration-300 xl:block",
            showAI ? "w-[360px]" : "w-0"
          )}
        >
          {showAI && <AIPanel />}
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
