import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Lock, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ParticipantTile } from "@/features/meeting/ParticipantTile";
import { MeetingControls } from "@/features/meeting/MeetingControls";
import { MeetingSidebar } from "@/features/meeting/MeetingSidebar";
import { AIPanel } from "@/features/meeting/AIPanel";
import { api, type ActionItem, type AISuggestion, type Meeting, type MeetingSummary, type Participant, type TranscriptLine } from "@/services";
import { useUser } from "@/store/auth";
import { useMeetingsStore } from "@/store/meetings";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MeetingRoom = () => {
  const { t } = useTranslation();
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const meetings = useMeetingsStore(s => s.list);
  const fetchMeetings = useMeetingsStore(s => s.fetch);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  useEffect(() => { void fetchMeetings(); }, [fetchMeetings]);

  useEffect(() => {
    const id = meetingId ?? meetings[0]?.id;
    if (!id) return;

    if (!meetingId) {
      navigate(`/meeting/${id}`, { replace: true });
      return;
    }

    let alive = true;
    setSummary(null);
    setTranscript([]);
    setActionItems([]);
    setSuggestions([]);
    void Promise.all([
      api.meetings.get(id),
      api.meetings.getSummary(id),
      api.meetings.getTranscript(id),
      api.meetings.getActionItems(id),
      api.ai.generateSuggestions(id).catch(() => [])
    ]).then(([loadedMeeting, loadedSummary, loadedTranscript, loadedActions, loadedSuggestions]) => {
      if (!alive) return;
      setMeeting(loadedMeeting);
      setSummary(loadedSummary);
      setTranscript(loadedTranscript);
      setActionItems(loadedActions);
      setSuggestions(loadedSuggestions);
    });

    return () => { alive = false; };
  }, [meetingId, meetings, navigate]);

  // "you" reflects toggles
  const participants = useMemo(() => {
    const fallbackParticipant: Participant = {
      id: user?.id ?? "current-user",
      name: user?.fullName ?? "Utilisateur",
      initials: user?.initials ?? "U",
      color: user?.color ?? "221 83% 53%",
      isYou: true,
      isHost: meeting?.hostId === user?.id,
      isSpeaking: true
    };
    const source = meeting?.participants?.length ? meeting.participants : [fallbackParticipant];
    return source.map(p =>
      p.isYou || p.id === user?.id ? { ...p, isYou: true, isMuted: !micOn, isCameraOn: cameraOn } : p
    );
  }, [cameraOn, meeting, micOn, user]);
  const mainSpeaker = participants.find(p => p.isSpeaking) ?? participants[0];
  const others = participants.filter(p => p.id !== mainSpeaker.id);
  const inviteUrl = meeting?.inviteUrl ?? "intellmeet.app/r/q2-sync";
  const elapsedLabel = meeting?.status === "live" ? "Live" : meeting?.status === "scheduled" ? "Planifiee" : "Terminee";

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
            <span className="font-display text-sm font-semibold text-foreground">{meeting?.title ?? t("meeting.title")}</span>
            <span className="text-[11px] text-muted-foreground">{elapsedLabel} · {meeting?.durationMin ?? 12} {t("common.minutes")}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden gap-1.5 border-border bg-background sm:flex">
            <Lock className="h-3 w-3" /> {inviteUrl}
            <button onClick={() => { navigator.clipboard?.writeText(inviteUrl); toast.success(t("meeting.linkCopied")); }} className="ml-1 text-muted-foreground hover:text-foreground">
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
          {showSidebar && (
            <MeetingSidebar
              meetingId={meeting?.id}
              meeting={meeting}
              summary={summary}
              actionItems={actionItems}
              transcript={transcript}
            />
          )}
        </div>

        {/* AI panel */}
        <div
          className={cn(
            "hidden transition-[width] duration-300 xl:block",
            showAI ? "w-[360px]" : "w-0"
          )}
        >
          {showAI && <AIPanel summary={summary} actionItems={actionItems} suggestions={suggestions} />}
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
