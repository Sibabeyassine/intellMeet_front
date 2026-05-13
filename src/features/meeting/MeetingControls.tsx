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
  screenSharing: boolean;
  onToggleScreenShare: () => void;
  onOpenSettings: () => void;
  recording: boolean;
  recordingSeconds: number;
  recordingSaving?: boolean;
  onToggleRecording: () => void;
  onLeave: () => void;
}

export function MeetingControls({
  micOn,
  cameraOn,
  onToggleMic,
  onToggleCamera,
  onToggleSidebar,
  onToggleAI,
  screenSharing,
  onToggleScreenShare,
  onOpenSettings,
  recording,
  recordingSeconds,
  recordingSaving,
  onToggleRecording,
  onLeave
}: Props) {
  const { t } = useTranslation();
  const [hand, setHand] = useState(false);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-elev-lg backdrop-blur-xl">
        {/* Recording indicator */}
        {recording && (
          <>
            <div className="hidden items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-destructive sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider">{t("meeting.recording")} · {formatDuration(recordingSeconds)}</span>
            </div>

            <Separator />
          </>
        )}

        <CtrlBtn label={micOn ? t("meeting.mute") : t("meeting.unmute")} active={!micOn} onClick={onToggleMic} variant={micOn ? "default" : "danger"}>
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </CtrlBtn>
        <CtrlBtn label={t("meeting.video")} active={!cameraOn} onClick={onToggleCamera} variant={cameraOn ? "default" : "danger"}>
          {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </CtrlBtn>
        <CtrlBtn
          label={t("meeting.share")}
          active={screenSharing}
          onClick={onToggleScreenShare}
        >
          <ScreenShare className="h-5 w-5" />
        </CtrlBtn>
        <CtrlBtn
          label={recording ? "Arrêter l'enregistrement" : t("meeting.record")}
          active={recording}
          onClick={onToggleRecording}
          disabled={recordingSaving}
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
        <CtrlBtn label={t("nav.settings")} onClick={onOpenSettings}>
          <Settings className="h-5 w-5" />
        </CtrlBtn>
        <CtrlBtn label={t("common.more")} onClick={() => {}}>
          <MoreHorizontal className="h-5 w-5" />
        </CtrlBtn>

        <Separator />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="danger" size="lg" className="gap-2 px-5" onClick={onLeave}>
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

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function Separator() {
  return <span className="mx-1 h-8 w-px bg-border" />;
}

function CtrlBtn({
  children, label, onClick, active, variant, highlight, disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  variant?: "default" | "danger";
  highlight?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          disabled={disabled}
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
            "hover:bg-accent hover:scale-105 active:scale-95",
            disabled && "cursor-not-allowed opacity-60 hover:scale-100",
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
