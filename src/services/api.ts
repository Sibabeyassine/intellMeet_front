// ============================================================
// API contract — every method the application uses.
// The mock implementation lives in ./mock. To switch to a real
// backend, create a new implementation (e.g. ./http) that
// satisfies this interface and export it from ./index.ts.
// ============================================================

import type {
  ActionItem, AISuggestion, AddProjectResourcePayload,
  Channel,
  ChatMessage,
  CreateMeetingPayload,
  CreateProjectPayload,
  CreateTaskPayload,
  CreateTeamPayload,
  ID,
  LoginPayload,
  Meeting,
  MeetingSummary,
  Notification,
  Project,
  ProjectResource,
  RegisterPayload,
  SendMessagePayload,
  Session,
  Task,
  TaskStatus,
  Team,
  TranscriptLine,
  User,
} from "./types";

export interface AuthAPI {
  login(p: LoginPayload): Promise<Session>;
  register(p: RegisterPayload): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Promise<Session | null>;
  updateProfile(patch: Partial<Pick<User, "fullName" | "avatarUrl">>): Promise<User>;
}

export interface MeetingsAPI {
  list(): Promise<Meeting[]>;
  get(id: ID): Promise<Meeting | null>;
  create(p: CreateMeetingPayload): Promise<Meeting>;
  update(id: ID, patch: Partial<Meeting>): Promise<Meeting>;
  delete(id: ID): Promise<void>;
  getSummary(id: ID): Promise<MeetingSummary | null>;
  getTranscript(id: ID): Promise<TranscriptLine[]>;
  getActionItems(id: ID): Promise<ActionItem[]>;
  // realtime hooks (no-op in mock, pluggable in real backend)
  subscribe(id: ID, cb: (event: { type: string; payload: unknown }) => void): () => void;
}

export interface ProjectsAPI {
  listTeams(): Promise<Team[]>;
  createTeam(p: CreateTeamPayload): Promise<Team>;
  listProjects(): Promise<Project[]>;
  createProject(p: CreateProjectPayload): Promise<Project>;
  listTasks(projectId?: ID): Promise<Task[]>;
  createTask(p: CreateTaskPayload): Promise<Task>;
  updateTaskStatus(id: ID, status: TaskStatus): Promise<Task>;
  updateTask(id: ID, patch: Partial<Task>): Promise<Task>;
  deleteTask(id: ID): Promise<void>;
}

export interface ChatAPI {
  listChannels(): Promise<Channel[]>;
  listDMs(): Promise<Channel[]>;
  listMessages(channelId: ID): Promise<ChatMessage[]>;
  sendMessage(p: SendMessagePayload): Promise<ChatMessage>;
  createChannel(name: string): Promise<Channel>;
  subscribe(channelId: ID, cb: (msg: ChatMessage) => void): () => void;
}

export interface NotificationsAPI {
  list(): Promise<Notification[]>;
  markAllRead(): Promise<void>;
}

export interface AIAPI {
  generateSuggestions(meetingId: ID): Promise<AISuggestion[]>;
  ask(prompt: string, context?: { meetingId?: ID; channelId?: ID }): Promise<string>;
}

export interface API {
  auth: AuthAPI;
  meetings: MeetingsAPI;
  projects: ProjectsAPI;
  chat: ChatAPI;
  notifications: NotificationsAPI;
  ai: AIAPI;
}
