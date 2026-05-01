import { useState } from "react";
import { Mic, MicOff, MoreHorizontal, PhoneOff, ScreenShare, Video, VideoOff, MessageSquare, Sparkles, Hand, CircleDot, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Props {
  micOn: boolean;
  cameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleSidebar: () => void;
  onToggleAI: () => void;
}

export function MeetingControls({ micOn, cameraOn, onToggleMic, onToggleCamera, onToggleSidebar, onToggleAI }: Props) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [hand, setHand] = useState(false);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-elev-lg backdrop-blur-xl">
        {/* Recording indicator */}
        <div className="hidden items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-destructive sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider">{t("meeting.recording")} · 12:34</span>
        </div>

        <Separator />

        <CtrlBtn label={micOn ? t("meeting.mute") : t("meeting.unmute")} active={!micOn} onClick={onToggleMic} variant={micOn ? "default" : "danger"}>
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </CtrlBtn>
        <CtrlBtn label={t("meeting.video")} active={!cameraOn} onClick={onToggleCamera} variant={cameraOn ? "default" : "danger"}>
          {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </CtrlBtn>
        <CtrlBtn
          label={t("meeting.share")}
          active={sharing}
          onClick={() => { setSharing(s => !s); toast(t("meeting.share")); }}
        >
          <ScreenShare className="h-5 w-5" />
        </CtrlBtn>
        <CtrlBtn
          label={t("meeting.record")}
          active={recording}
          onClick={() => { setRecording(r => !r); toast(t("meeting.record")); }}
        >
          <CircleDot className="h-5 w-5" />
        </CtrlBtn>
        <CtrlBtn label={t("common.actions")} active={hand} onClick={() => setHand(h => !h)}>
          <Hand className="h-5 w-5" />
        </CtrlBtn>

        <Separator />

        <CtrlBtn label={t("meeting.chat")} onClick={onToggleSidebar}>
          <MessageSquare className="h-5 w-5" />
        </CtrlBtn>
        <CtrlBtn label={t("meeting.aiSummary")} onClick={onToggleAI} highlight>
          <Sparkles className="h-5 w-5" />
        </CtrlBtn>
        <CtrlBtn label={t("nav.settings")} onClick={() => toast(t("common.comingSoon"))}>
          <Settings className="h-5 w-5" />
        </CtrlBtn>
        <CtrlBtn label={t("common.more")} onClick={() => {}}>
          <MoreHorizontal className="h-5 w-5" />
        </CtrlBtn>

        <Separator />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="danger" size="lg" className="gap-2 px-5" onClick={() => toast.success(t("meeting.leave"))}>
              <PhoneOff className="h-5 w-5" />
              <span className="hidden sm:inline">{t("meeting.leave")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t("meeting.leave")}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function Separator() {
  return <span className="mx-1 h-8 w-px bg-border" />;
}

function CtrlBtn({
  children, label, onClick, active, variant, highlight,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  variant?: "default" | "danger";
  highlight?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
            "hover:bg-accent hover:scale-105 active:scale-95",
            active && variant === "danger" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            active && variant !== "danger" && "bg-primary text-primary-foreground hover:bg-primary/90",
            !active && "text-foreground",
            highlight && "bg-gradient-accent text-primary-foreground shadow-glow hover:brightness-110",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
