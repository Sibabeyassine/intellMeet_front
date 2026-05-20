import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Lock, Mic, MicOff, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
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

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:8000";
const SESSION_KEY = "intellmeet.http.session";
const parseIceServers = (): RTCIceServer[] => {
  const value = import.meta.env.VITE_RTC_ICE_SERVERS;
  if (!value) return [{ urls: "stun:stun.l.google.com:19302" }];

  try {
    const parsed = JSON.parse(value) as RTCIceServer[];
    return Array.isArray(parsed) && parsed.length ? parsed : [{ urls: "stun:stun.l.google.com:19302" }];
  } catch {
    return value
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => ({ urls: url }));
  }
};
const rtcConfig: RTCConfiguration = {
  iceServers: parseIceServers(),
  iceCandidatePoolSize: 10
};

type RemoteParticipant = Participant & {
  socketId?: string;
  stream?: MediaStream;
};

type RealtimeSignal = {
  fromUserId: string;
  fromName?: string;
  fromEmail?: string;
  targetUserId?: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

type RealtimeParticipantPresence = {
  userId: string;
  socketId?: string;
  name?: string;
  email?: string;
};

type MediaStatePayload = {
  userId: string;
  micOn: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
};

type SpeechRecognitionConstructor = new () => SpeechRecognition;
type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = Event & {
  error?: string;
};

type SpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const readAccessToken = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null")?.accessToken as string | undefined;
  } catch {
    return undefined;
  }
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PT";
}

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
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingSaving, setRecordingSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptTextRef = useRef("");
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [screenSharing, setScreenSharing] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [renewingSession, setRenewingSession] = useState(false);
  const [now, setNow] = useState(Date.now());
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const autoEndedRef = useRef(false);
  const mediaStateRef = useRef({ micOn, cameraOn, screenSharing });
  const emitMediaState = (
    state: { micOn?: boolean; cameraOn?: boolean; screenSharing?: boolean } = {}
  ) => {
    if (!meetingId || !socketRef.current?.connected) return;
    const mediaState = { ...mediaStateRef.current, ...state };

    socketRef.current.emit("meeting:media-state", {
      meetingId,
      micOn: mediaState.micOn,
      cameraOn: mediaState.cameraOn,
      screenSharing: mediaState.screenSharing
    });
  };

  const sendSignalTo = (
    targetUserId: string,
    signal: RTCSessionDescriptionInit | RTCIceCandidateInit
  ) => {
    if (!meetingId || !socketRef.current?.connected) return;
    socketRef.current.emit("meeting:signal", {
      meetingId,
      targetUserId,
      signal
    });
  };

  useEffect(() => { void fetchMeetings(); }, [fetchMeetings]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!localStream || !meetingId) return;

    void Promise.all(
      Object.entries(peersRef.current).map(async ([remoteUserId, peer]) => {
        localStream.getTracks().forEach((track) => {
          const alreadySendingKind = peer
            .getSenders()
            .some((sender) => sender.track?.kind === track.kind);

          if (!alreadySendingKind) {
            peer.addTrack(track, localStream);
          }
        });

        if (peer.signalingState !== "stable") return;
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        sendSignalTo(remoteUserId, offer);
      })
    ).catch(() => undefined);

    emitMediaState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream, meetingId]);

  useEffect(() => {
    mediaStateRef.current = { micOn, cameraOn, screenSharing };
  }, [cameraOn, micOn, screenSharing]);

  const transcriptLineFromText = (text: string, authorName = "Transcription"): TranscriptLine => ({
    id: `${meetingId ?? "meeting"}_transcript_live`,
    meetingId: meetingId ?? "",
    authorName,
    initials: initialsFor(authorName),
    color: "221 83% 53%",
    time: "Live",
    text
  });

  const ensureLocalStream = async () => {
    if (localStream) return localStream;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getAudioTracks().forEach((track) => { track.enabled = micOn; });
    stream.getVideoTracks().forEach((track) => {
      track.enabled = cameraOn;
      cameraTrackRef.current = track;
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  useEffect(() => {
    let alive = true;
    void navigator.mediaDevices?.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        if (!alive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.getAudioTracks().forEach((track) => { track.enabled = micOn; });
        stream.getVideoTracks().forEach((track) => {
          track.enabled = cameraOn;
          cameraTrackRef.current = track;
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
      })
      .catch(() => {
        toast.error("Autorise la caméra et le micro pour participer comme dans une vraie réunion.");
      });

    return () => {
      alive = false;
      localStream?.getTracks().forEach((track) => track.stop());
    };
    // The initial permission request should happen once on room entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStream?.getAudioTracks().forEach((track) => { track.enabled = micOn; });
  }, [localStream, micOn]);

  useEffect(() => {
    localStream?.getVideoTracks().forEach((track) => { track.enabled = cameraOn; });
  }, [cameraOn, localStream]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      recognitionRef.current?.stop();
      socketRef.current?.disconnect();
      Object.values(peersRef.current).forEach((peer) => peer.close());
      screenTrackRef.current?.stop();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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
    void (async () => {
      const loadedMeeting = await api.meetings.join(id).catch(() => api.meetings.get(id));
      if (!alive || !loadedMeeting) return;
      setMeeting(loadedMeeting);
      setSessionExpired(false);

      const [loadedSummary, loadedTranscript, loadedActions, loadedSuggestions] = await Promise.all([
        api.meetings.getSummary(id).catch(() => null),
        api.meetings.getTranscript(id).catch(() => []),
        api.meetings.getActionItems(id).catch(() => []),
        api.ai.generateSuggestions(id).catch(() => [])
      ]);
      if (!alive) return;
      setSummary(loadedSummary);
      transcriptTextRef.current = loadedTranscript.map((line) => line.text).join("\n");
      setTranscript(loadedTranscript);
      setActionItems(loadedActions);
      setSuggestions(loadedSuggestions);
    })();

    return () => { alive = false; };
  }, [meetingId, meetings, navigate, user?.id]);

  useEffect(() => {
    if (!meetingId || !user) return;

    const token = readAccessToken();
    if (!token) return;

    const socket = io(WS_URL, { auth: { token } });
    socketRef.current = socket;

    const upsertRemote = (participant: RemoteParticipant) => {
      setRemoteParticipants((current) => {
        const exists = current.find((item) => item.id === participant.id);
        if (!exists) return [...current, participant];
        return current.map((item) => item.id === participant.id ? { ...item, ...participant } : item);
      });
    };

    const upsertPresence = (payload: RealtimeParticipantPresence) => {
      if (payload.userId === user.id) return;
      const name = payload.name ?? payload.email ?? "Participant";

      upsertRemote({
        id: payload.userId,
        socketId: payload.socketId,
        name,
        initials: initialsFor(name),
        color: "265 70% 60%",
        isMuted: true,
        isCameraOn: false
      });
    };

    const upsertMeetingParticipant = (participant: Participant) => {
      if (participant.id === user.id) return;

      upsertRemote({
        id: participant.id,
        name: participant.name,
        initials: participant.initials,
        color: participant.color,
        isHost: participant.isHost,
        isMuted: participant.isMuted ?? true,
        isCameraOn: participant.isCameraOn ?? false
      });
    };

    const removeRemote = (userId: string) => {
      peersRef.current[userId]?.close();
      delete peersRef.current[userId];
      setRemoteParticipants((current) => current.filter((item) => item.id !== userId));
      setMeeting((current) =>
        current
          ? {
              ...current,
              participants: current.participants.filter((item) => item.id !== userId)
            }
          : current
      );
    };

    const peerFor = (remoteUserId: string) => {
      if (peersRef.current[remoteUserId]) return peersRef.current[remoteUserId];

      const peer = new RTCPeerConnection(rtcConfig);
      peersRef.current[remoteUserId] = peer;
      const stream = localStreamRef.current;
      stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.onicecandidate = (event) => {
        if (event.candidate) sendSignalTo(remoteUserId, event.candidate.toJSON());
      };
      peer.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          setRemoteParticipants((current) => {
            const existing = current.find((item) => item.id === remoteUserId);
            const name = existing?.name ?? "Participant";
            const nextParticipant: RemoteParticipant = {
              id: remoteUserId,
              socketId: existing?.socketId,
              name,
              initials: existing?.initials ?? initialsFor(name),
              color: existing?.color ?? "265 70% 60%",
              isMuted: existing?.isMuted,
              isCameraOn: stream.getVideoTracks().some((track) => track.enabled),
              stream
            };

            if (!existing) return [...current, nextParticipant];
            return current.map((item) =>
              item.id === remoteUserId ? { ...item, ...nextParticipant } : item
            );
          });
        }
      };
      peer.onconnectionstatechange = () => {
        if (["closed", "failed", "disconnected"].includes(peer.connectionState)) {
          removeRemote(remoteUserId);
        }
      };

      return peer;
    };

    const initiatePeerOffer = async (remoteUserId: string) => {
      const peer = peerFor(remoteUserId);

      if (peer.signalingState !== "stable") return;

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      sendSignalTo(remoteUserId, offer);
    };

    const announcePresence = () => {
      socket.emit("meeting:presence", { meetingId });
      const mediaState = mediaStateRef.current;
      socket.emit("meeting:media-state", {
        meetingId,
        micOn: mediaState.micOn,
        cameraOn: mediaState.cameraOn,
        screenSharing: mediaState.screenSharing
      });
    };

    const syncPersistentPresence = async () => {
      const [activeParticipants, freshMeeting] = await Promise.all([
        api.meetings.touchPresence(meetingId),
        api.meetings.get(meetingId).catch(() => null)
      ]);
      const activeRemoteIds = new Set<string>();

      if (freshMeeting) {
        setMeeting(freshMeeting);
        const roomParticipants = freshMeeting.participants.filter(
          (participant, index, participants) =>
            participants.findIndex((item) => item.id === participant.id) === index
        );

        roomParticipants.forEach((participant) => {
          if (participant.id === user.id) return;
          activeRemoteIds.add(participant.id);
          upsertMeetingParticipant(participant);

          if (!peersRef.current[participant.id] && user.id > participant.id) {
            void initiatePeerOffer(participant.id).catch(() => undefined);
          }
        });
      }

      activeParticipants.forEach((participant) => {
        if (participant.userId !== user.id) activeRemoteIds.add(participant.userId);
      });

      activeParticipants.forEach((participant) => {
        if (participant.userId === user.id) return;

        upsertPresence({
          userId: participant.userId,
          name: participant.name,
          email: participant.email
        });

        if (!peersRef.current[participant.userId] && user.id > participant.userId) {
          void initiatePeerOffer(participant.userId).catch(() => undefined);
        }
      });

      setRemoteParticipants((current) =>
        current.filter((participant) => activeRemoteIds.has(participant.id))
      );
    };

    socket.on("connect", () => {
      socket.emit("meeting:join", { meetingId, presence: "room" });
    });

    socket.on("meeting:joined", (payload: { participants?: RealtimeParticipantPresence[] }) => {
      payload.participants?.forEach((participant) => {
        if (participant.userId === user.id) return;
        upsertPresence(participant);
        void initiatePeerOffer(participant.userId).catch(() => undefined);
      });
      const mediaState = mediaStateRef.current;
      socket.emit("meeting:media-state", {
        meetingId,
        micOn: mediaState.micOn,
        cameraOn: mediaState.cameraOn,
        screenSharing: mediaState.screenSharing
      });
      announcePresence();
      void syncPersistentPresence().catch(() => undefined);
    });

    socket.on("participant:joined", async (payload: { userId: string; name?: string; socketId?: string }) => {
      if (payload.userId === user.id) return;
      upsertPresence(payload);
      emitMediaState();
    });

    socket.on("participant:left", (payload: { userId: string }) => {
      removeRemote(payload.userId);
    });

    socket.on("participant:media-state", (payload: MediaStatePayload) => {
      if (payload.userId === user.id) return;
      setRemoteParticipants((current) =>
        current.some((participant) => participant.id === payload.userId)
          ? current.map((participant) =>
              participant.id === payload.userId
                ? {
                    ...participant,
                    isMuted: !payload.micOn,
                    isCameraOn: payload.cameraOn || payload.screenSharing,
                    isScreenSharing: payload.screenSharing
                  }
                : participant
            )
          : [
              ...current,
              {
                id: payload.userId,
                name: "Participant",
                initials: "PT",
                color: "265 70% 60%",
                isMuted: !payload.micOn,
                isCameraOn: payload.cameraOn || payload.screenSharing,
                isScreenSharing: payload.screenSharing
              }
            ]
      );
    });

    socket.on("participant:presence", (payload: RealtimeParticipantPresence) => {
      if (payload.userId === user.id) return;
      upsertPresence(payload);
      if (!peersRef.current[payload.userId] && user.id > payload.userId) {
        void initiatePeerOffer(payload.userId).catch(() => undefined);
      }
    });

    socket.on("meeting:transcript-updated", (payload: { meetingId?: string; transcript?: string; updatedBy?: { name?: string; email?: string } }) => {
      if (payload.meetingId !== meetingId || typeof payload.transcript !== "string") return;
      transcriptTextRef.current = payload.transcript;
      setTranscript(payload.transcript ? [transcriptLineFromText(payload.transcript, payload.updatedBy?.name ?? "Transcription")] : []);
    });

    socket.on("meeting:signal", async (payload: RealtimeSignal) => {
      if (payload.fromUserId === user.id) return;
      if (payload.targetUserId && payload.targetUserId !== user.id) return;

      upsertPresence({
        userId: payload.fromUserId,
        name: payload.fromName,
        email: payload.fromEmail
      });

      const peer = peerFor(payload.fromUserId);
      const signal = payload.signal;

      try {
        if ("type" in signal && signal.type === "offer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          sendSignalTo(payload.fromUserId, answer);
        } else if ("type" in signal && signal.type === "answer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
        } else if ("candidate" in signal) {
          await peer.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (error) {
        console.error("Realtime signal failed", error);
      }
    });

    socket.on("realtime:error", (payload: { message?: string }) => {
      if (payload.message) toast.error(payload.message);
    });

    void syncPersistentPresence().catch(() => undefined);
    const presenceInterval = window.setInterval(() => {
      announcePresence();
      void syncPersistentPresence().catch(() => undefined);
    }, 3000);

    return () => {
      window.clearInterval(presenceInterval);
      void api.meetings.leavePresence(meetingId);
      socket.disconnect();
      Object.values(peersRef.current).forEach((peer) => peer.close());
      peersRef.current = {};
      setRemoteParticipants([]);
    };
  }, [meetingId, user]);

  // "you" reflects toggles
  const participants = useMemo(() => {
    const fallbackParticipant: Participant = {
      id: user?.id ?? "current-user",
      name: user?.fullName ?? "Utilisateur",
      initials: user?.initials ?? "U",
      color: user?.color ?? "221 83% 53%",
      isYou: true,
      isHost: meeting?.hostId === user?.id,
      isSpeaking: true,
      isMuted: !micOn,
      isCameraOn: cameraOn || screenSharing,
      isScreenSharing: screenSharing,
      stream: localStream ?? undefined
    };
    const knownParticipants = [
      ...remoteParticipants,
      ...(meeting?.participants ?? [])
    ].filter(
      (participant, index, participantList) =>
        participant.id !== fallbackParticipant.id &&
        participantList.findIndex((item) => item.id === participant.id) === index
    );

    return [fallbackParticipant, ...knownParticipants];
  }, [
    cameraOn,
    localStream,
    meeting?.hostId,
    meeting?.participants,
    micOn,
    remoteParticipants,
    screenSharing,
    user
  ]);
  const mainSpeaker = participants.find(p => p.isSpeaking) ?? participants[0];
  const others = participants.filter(p => p.id !== mainSpeaker.id);
  const inviteUrl = meeting ? `${window.location.origin}/meeting/${meeting.id}` : window.location.href;
  const meetingEndsAt = meeting
    ? new Date(new Date(meeting.scheduledAt).getTime() + meeting.durationMin * 60000).getTime()
    : null;
  const remainingSeconds = meetingEndsAt
    ? Math.max(0, Math.ceil((meetingEndsAt - now) / 1000))
    : 0;
  const meetingTimeLabel =
    meeting?.status === "live"
      ? sessionExpired
        ? "Session expiree"
        : `${formatDuration(remainingSeconds)} restantes`
      : meeting?.status === "scheduled"
        ? `Planifiee · ${meeting.durationMin} min`
        : "Terminee";
  const isHost = meeting?.hostId === user?.id;

  const replaceOutgoingVideoTrack = (track: MediaStreamTrack | null) => {
    Object.values(peersRef.current).forEach((peer) => {
      const sender = peer.getSenders().find((item) => item.track?.kind === "video");
      void sender?.replaceTrack(track);
    });
  };

  const replaceLocalVideoTrack = (track: MediaStreamTrack) => {
    const stream = localStreamRef.current ?? new MediaStream();
    stream.getVideoTracks().forEach((existingTrack) => stream.removeTrack(existingTrack));
    stream.addTrack(track);
    const nextStream = new MediaStream(stream.getTracks());
    localStreamRef.current = nextStream;
    setLocalStream(nextStream);
    replaceOutgoingVideoTrack(track);
  };

  const toggleMic = async () => {
    try {
      const stream = await ensureLocalStream();
      const next = !micOn;
      stream.getAudioTracks().forEach((track) => { track.enabled = next; });
      setMicOn(next);
      emitMediaState({ micOn: next });
      toast(next ? "Micro activé" : "Micro coupé");
    } catch {
      toast.error("Impossible d'activer le micro. Vérifie les permissions du navigateur.");
    }
  };

  const toggleCamera = async () => {
    try {
      const stream = await ensureLocalStream();
      const next = !cameraOn;
      stream.getVideoTracks().forEach((track) => { track.enabled = next; });
      setCameraOn(next);
      emitMediaState({ cameraOn: next });
    } catch {
      toast.error("Impossible d'activer la caméra. Vérifie les permissions du navigateur.");
    }
  };

  const stopScreenShare = () => {
    if (!screenTrackRef.current && !screenSharing) return;

    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    setScreenSharing(false);
    emitMediaState({ screenSharing: false, cameraOn });

    const cameraTrack = cameraTrackRef.current;
    if (cameraTrack && cameraTrack.readyState === "live") {
      cameraTrack.enabled = cameraOn;
      replaceLocalVideoTrack(cameraTrack);
    } else {
      replaceOutgoingVideoTrack(null);
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      stopScreenShare();
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast.error("Le partage d'écran n'est pas supporté par ce navigateur.");
      return;
    }

    try {
      await ensureLocalStream();
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      const [screenTrack] = displayStream.getVideoTracks();
      if (!screenTrack) return;

      screenTrackRef.current = screenTrack;
      screenTrack.addEventListener("ended", stopScreenShare, { once: true });
      replaceLocalVideoTrack(screenTrack);
      setScreenSharing(true);
      setCameraOn(true);
      emitMediaState({ screenSharing: true, cameraOn: true });
      toast.success("Partage d'écran lancé");
    } catch (error) {
      if ((error as Error).name !== "NotAllowedError") {
        toast.error(error instanceof Error ? error.message : "Impossible de partager l'écran");
      }
    }
  };

  const leaveMeeting = async () => {
    stopRecording();
    stopScreenShare();
    if (meeting?.id) {
      await api.meetings.leavePresence(meeting.id).catch(() => undefined);
    }
    socketRef.current?.disconnect();
    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};
    localStream?.getTracks().forEach((track) => track.stop());

    if (meeting?.id && meeting.hostId === user?.id) {
      await api.meetings.end(meeting.id).catch(() => undefined);
      toast.success("Réunion terminée");
    } else {
      toast.success("Tu as quitté la réunion");
    }

    navigate("/dashboard");
  };

  useEffect(() => {
    if (!meeting || meeting.status !== "live" || remainingSeconds > 0 || autoEndedRef.current) {
      return;
    }

    autoEndedRef.current = true;
    setSessionExpired(true);
    toast("Temps de réunion écoulé");
  }, [meeting, remainingSeconds]);

  useEffect(() => {
    if (!sessionExpired || !meeting?.id) return;

    const interval = window.setInterval(() => {
      void api.meetings.get(meeting.id).then((freshMeeting) => {
        if (!freshMeeting) return;
        setMeeting(freshMeeting);
        const freshEndsAt = new Date(
          new Date(freshMeeting.scheduledAt).getTime() + freshMeeting.durationMin * 60000
        ).getTime();
        if (freshMeeting.status === "live" && freshEndsAt > Date.now()) {
          autoEndedRef.current = false;
          setSessionExpired(false);
          toast.success("Session renouvelée");
        }
      }).catch(() => undefined);
    }, 10000);

    return () => window.clearInterval(interval);
  }, [meeting?.id, sessionExpired]);

  const renewMeeting = async (durationMin = 30) => {
    if (!meeting?.id || !isHost || renewingSession) return;
    setRenewingSession(true);
    try {
      const updatedMeeting = await api.meetings.extend(meeting.id, durationMin);
      setMeeting(updatedMeeting);
      autoEndedRef.current = false;
      setSessionExpired(false);
      toast.success(`Réunion renouvelée de ${durationMin} min`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de renouveler la réunion");
    } finally {
      setRenewingSession(false);
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      recorder.stop();
      return;
    }

    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
    setRecording(false);
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
  };

  const startRecording = async () => {
    if (!meeting?.id) {
      toast.error("Ouvre une réunion avant de lancer l'enregistrement");
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") {
      toast.error("L'enregistrement n'est pas supporté par ce navigateur");
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      const micStream = micOn
        ? await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null)
        : null;
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
        ...(micStream?.getAudioTracks() ?? [])
      ]);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      const recorder = new MediaRecorder(combinedStream, { mimeType });

      recordedChunksRef.current = [];
      recordingStreamRef.current = combinedStream;
      recorderRef.current = recorder;

      displayStream.getVideoTracks()[0]?.addEventListener("ended", stopRecording, { once: true });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const chunks = recordedChunksRef.current;
        recordedChunksRef.current = [];
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
        void saveRecording(chunks);
      };

      recorder.start(1000);
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((value) => value + 1);
      }, 1000);
      toast.success("Enregistrement lancé");
    } catch (error) {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      if ((error as Error).name !== "NotAllowedError") {
        toast.error(error instanceof Error ? error.message : "Impossible de lancer l'enregistrement");
      }
    }
  };

  const saveRecording = async (chunks: BlobPart[]) => {
    if (!meeting?.id || !chunks.length) return;

    setRecordingSaving(true);
    try {
      const blob = new Blob(chunks, { type: "video/webm" });
      const file = new File(
        [blob],
        `recording-${meeting.id}-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`,
        { type: "video/webm" }
      );
      const mediaFile = await api.media.uploadMeetingFile(meeting.id, file);
      const updatedMeeting = await api.meetings.update(meeting.id, {
        recordingUrl: mediaFile.url
      });
      setMeeting(updatedMeeting);
      toast.success("Enregistrement sauvegardé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de sauvegarder l'enregistrement");
    } finally {
      setRecordingSaving(false);
    }
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
      return;
    }
    void startRecording();
  };

  const appendTranscript = (text: string) => {
    if (!meeting?.id || !text.trim()) return;

    const nextTranscript = [transcriptTextRef.current, text.trim()]
      .filter(Boolean)
      .join("\n");
    transcriptTextRef.current = nextTranscript;
    setTranscript([transcriptLineFromText(nextTranscript, user?.fullName ?? "Transcription")]);
    void api.meetings.update(meeting.id, {
      transcript: nextTranscript
    }).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Transcription non sauvegardée");
    });
  };

  const stopTranscription = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setTranscribing(false);
  };

  const startTranscription = () => {
    if (!meeting?.id) {
      toast.error("Ouvre une réunion avant de lancer la transcription");
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      toast.error("La transcription navigateur n'est pas supportée ici. Essaie Chrome ou Edge.");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "fr-FR";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let finalText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalText += `${result[0]?.transcript ?? ""} `;
        }
      }
      if (finalText.trim()) appendTranscript(finalText);
    };
    recognition.onerror = (event) => {
      toast.error(event.error ? `Transcription: ${event.error}` : "Transcription interrompue");
    };
    recognition.onend = () => {
      setTranscribing(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setTranscribing(true);
      toast.success("Transcription lancée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de lancer la transcription");
    }
  };

  const toggleTranscription = () => {
    if (transcribing) {
      stopTranscription();
      return;
    }
    startTranscription();
  };

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
            <span className="text-[11px] text-muted-foreground">{meetingTimeLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden gap-1.5 border-border bg-background sm:flex">
            <Lock className="h-3 w-3" /> {inviteUrl}
            <button onClick={() => { navigator.clipboard?.writeText(inviteUrl); toast.success(t("meeting.linkCopied")); }} className="ml-1 text-muted-foreground hover:text-foreground" title={t("meeting.linkCopied")} aria-label={t("meeting.linkCopied")}>
              <Copy className="h-3 w-3" />
            </button>
          </Badge>
          {meeting?.recordingUrl && (
            <Badge variant="outline" className="hidden border-primary/30 bg-primary/10 text-primary sm:flex">
              <a href={meeting.recordingUrl} target="_blank" rel="noreferrer">Enregistrement</a>
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1.5">
            <Users className="h-3 w-3" />
            {participants.length}
          </Badge>
          <Badge
            variant={micOn ? "secondary" : "destructive"}
            className="hidden gap-1.5 sm:flex"
          >
            {micOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
            {micOn ? "Micro actif" : "Micro coupé"}
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
              onToggleMic={toggleMic}
              onToggleCamera={toggleCamera}
              onToggleSidebar={() => setShowSidebar(v => !v)}
              onToggleAI={() => setShowAI(v => !v)}
              screenSharing={screenSharing}
              onToggleScreenShare={toggleScreenShare}
              onOpenSettings={() => navigate("/settings")}
              recording={recording}
              recordingSeconds={recordingSeconds}
              recordingSaving={recordingSaving}
              onToggleRecording={toggleRecording}
              transcribing={transcribing}
              onToggleTranscription={toggleTranscription}
              onLeave={leaveMeeting}
            />
          </div>
          {sessionExpired && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-center shadow-elev-lg">
                <p className="font-display text-lg font-semibold text-foreground">
                  Temps de réunion écoulé
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isHost
                    ? "Tu peux renouveler la session ou terminer la réunion."
                    : "La session est expirée. Attends que l'hôte la renouvelle ou quitte la réunion."}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {isHost && (
                    <>
                      <Button disabled={renewingSession} onClick={() => void renewMeeting(15)}>
                        +15 min
                      </Button>
                      <Button disabled={renewingSession} onClick={() => void renewMeeting(30)}>
                        +30 min
                      </Button>
                    </>
                  )}
                  <Button variant={isHost ? "danger" : "outline"} onClick={leaveMeeting}>
                    {isHost ? "Terminer" : "Quitter"}
                  </Button>
                </div>
              </div>
            </div>
          )}
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
