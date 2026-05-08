// ============================================================
// Domain types — partagés entre stores, services et UI.
// Aucune dépendance externe. Sert de contrat avec n'importe
// quel backend (Supabase, Node, Django, etc.).
// ============================================================

export type ID = string;
export type ISODate = string;

// ---------- AUTH / USER ----------
export interface User {
  id: ID;
  email: string;
  fullName: string;
  initials: string;
  avatarUrl?: string;
  color: string; // HSL "221 83% 53%"
  role: "owner" | "admin" | "member";
  createdAt: ISODate;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: ISODate;
}

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { email: string; password: string; fullName: string; }

// ---------- MEETINGS ----------
export type MeetingStatus = "scheduled" | "live" | "ended";

export interface Participant {
  id: ID;
  name: string;
  initials: string;
  color: string;
  isHost?: boolean;
  isYou?: boolean;
  isMuted?: boolean;
  isCameraOn?: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
}

export interface Meeting {
  id: ID;
  title: string;
  description?: string;
  scheduledAt: ISODate;
  durationMin: number;
  status: MeetingStatus;
  hostId: ID;
  participants: Participant[];
  inviteUrl: string;
  recordingUrl?: string;
  hasAISummary?: boolean;
}

export interface MeetingSummary {
  meetingId: ID;
  topic: string;
  highlights: string[];
  decisions: string[];
  generatedAt: ISODate;
}

export interface TranscriptLine {
  id: ID;
  meetingId: ID;
  authorName: string;
  initials: string;
  color: string;
  time: string; // mm:ss
  text: string;
}

export interface ActionItem {
  id: ID;
  meetingId?: ID;
  title: string;
  assignee: string;
  initials: string;
  color: string;
  due: string;
  status: "todo" | "in_progress" | "done";
}

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  scheduledAt: ISODate;
  durationMin: number;
  participantEmails?: string[];
}

// ---------- TEAMS / PROJECTS / KANBAN ----------
export interface Team {
  id: ID;
  name: string;
  color: string;            // HSL triplet
  memberCount?: number;
  createdAt: ISODate;
}

export type ProjectResourceKind = "link" | "doc" | "image" | "file";

export interface ProjectResource {
  id: ID;
  name: string;
  url: string;
  kind: ProjectResourceKind;
  addedAt: ISODate;
}

export interface Project {
  id: ID;
  teamId: ID;
  name: string;
  key: string;              // short code shown on cards (e.g. "Q2")
  color: string;
  description?: string;
  resources?: ProjectResource[];
  createdAt: ISODate;
}

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "med" | "high";

export interface Task {
  id: ID;
  projectId: ID;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: { initials: string; color: string }[];
  /** ISO datetime — preferred. Used for calendar + sorting. */
  dueDate?: ISODate;
  /** Free-text fallback (legacy). Prefer dueDate. */
  due?: string;
  comments?: number;
  attachments?: number;
  fromAI?: boolean;
  tag?: { label: string; color: string };
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CreateTaskPayload {
  projectId: ID;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: ISODate;
  tag?: { label: string; color: string };
}

export interface CreateTeamPayload   { name: string; color?: string; }
export interface CreateProjectPayload { teamId: ID; name: string; key?: string; color?: string; description?: string; }

// ---------- CHAT ----------
export type ChannelKind = "channel" | "dm";

export interface Channel {
  id: ID;
  name: string;
  kind: ChannelKind;
  unread?: number;
  online?: boolean;
  color?: string;
  initials?: string;
  lastSeen?: string;
  topic?: string;
}

export interface ChatMessage {
  id: ID;
  channelId: ID;
  authorId: ID;
  authorName: string;
  initials: string;
  color: string;
  time: string;
  text: string;
  isYou?: boolean;
  reactions?: { emoji: string; count: number }[];
  ai?: boolean;
  createdAt: ISODate;
}

export interface SendMessagePayload {
  channelId: ID;
  text: string;
}

// ---------- NOTIFICATIONS ----------
export interface Notification {
  id: ID;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: ISODate;
  kind: "meeting" | "task" | "mention" | "ai";
}

// ---------- AI ----------
export interface AISuggestion {
  id: ID;
  text: string;
  kind: "summary" | "action" | "question" | "decision";
}
