import { useEffect, useRef } from "react";
import { Mic, MicOff, Pin, ScreenShare, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Participant } from "@/services";

interface Props {
  participant: Participant;
  className?: string;
  isPinned?: boolean;
}

export function ParticipantTile({ participant, className, isPinned }: Props) {
  const { name, initials, color, isSpeaking, isMuted, isCameraOn, isHost, isYou, isScreenSharing } = participant;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [isCameraOn, participant.stream]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-elev-sm transition-all duration-300",
        isSpeaking && "ring-2 ring-primary shadow-glow",
        className
      )}
    >
      {/* Video / Avatar */}
      {isCameraOn && participant.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isYou}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
          <div
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full font-display text-2xl font-semibold text-white shadow-lg",
              isSpeaking && "animate-pulse-ring"
            )}
            style={{ backgroundColor: `hsl(${color})` }}
          >
            {initials}
          </div>
        </div>
      )}

      {/* Top-right indicators */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        {isScreenSharing && (
          <span className="flex items-center gap-1 rounded-md bg-primary/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
            <ScreenShare className="h-3 w-3" /> Share
          </span>
        )}
        {isPinned && (
          <span className="rounded-md bg-foreground/80 p-1 text-background">
            <Pin className="h-3 w-3" />
          </span>
        )}
      </div>

      {/* Speaking equalizer */}
      {isSpeaking && (
        <div className="absolute right-3 top-3 flex h-6 items-end gap-0.5 rounded-md bg-foreground/40 px-1.5 py-1">
          {[0.2, 0.4, 0.3].map((d, i) => (
            <span
              key={i}
              className="block w-1 origin-bottom rounded-full bg-primary animate-wave"
              style={{ height: "100%", animationDelay: `${d}s` }}
            />
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-medium text-white">
            {name}
            {isYou && <span className="ml-1 text-white/60">(toi)</span>}
          </span>
          {isHost && (
            <span className="rounded-sm bg-white/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
              Host
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", isMuted ? "bg-destructive/90 text-white" : "bg-white/10 text-white")}>
            {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </span>
          <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", isCameraOn ? "bg-white/10 text-white" : "bg-white/20 text-white")}>
            {isCameraOn ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
          </span>
        </div>
      </div>
    </div>
  );
}
