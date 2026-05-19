// ============================================================
// API contract — every method the application uses.
// The HTTP implementation in ./http satisfies this interface and is
// exported from ./index.ts.
// ============================================================

import type {
  ActionItem, AISuggestion,
  Channel,
  ChatMessage,
  CreateMeetingPayload,
  CreateProjectPayload,
  AddProjectResourcePayload,
  CreateTaskPayload,
  CreateTeamPayload,
  DashboardOverview,
  ID,
  LoginPayload,
  MediaFile,
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
  TeamMember,
  TranscriptLine,
  User
} from "./types";

export interface AuthAPI {
  login(p: LoginPayload): Promise<Session>;
  register(p: RegisterPayload): Promise<Session | null>;
  verifyEmail(p: { email: string; code: string }): Promise<void>;
  resendVerification(email: string): Promise<void>;
  logout(): Promise<void>;
  getSession(): Promise<Session | null>;
  updateProfile(patch: Partial<Pick<User, "fullName" | "avatarUrl">>): Promise<User>;
  changePassword(p: { currentPassword: string; newPassword: string }): Promise<void>;
}

export interface MeetingsAPI {
  list(): Promise<Meeting[]>;
  get(id: ID): Promise<Meeting | null>;
  join(id: ID): Promise<Meeting>;
  start(id: ID): Promise<Meeting>;
  end(id: ID): Promise<Meeting>;
  extend(id: ID, durationMin?: number): Promise<Meeting>;
  create(p: CreateMeetingPayload): Promise<Meeting>;
  update(id: ID, patch: Partial<Meeting>): Promise<Meeting>;
  delete(id: ID): Promise<void>;
  getSummary(id: ID): Promise<MeetingSummary | null>;
  getTranscript(id: ID): Promise<TranscriptLine[]>;
  getActionItems(id: ID): Promise<ActionItem[]>;
  // realtime hooks
  subscribe(id: ID, cb: (event: { type: string; payload: unknown }) => void): () => void;
}

export interface ProjectsAPI {
  listTeams(): Promise<Team[]>;
  listTeamMembers(teamId: ID): Promise<TeamMember[]>;
  createTeam(p: CreateTeamPayload): Promise<Team>;
  inviteTeamMembers(teamId: ID, emails: string[]): Promise<void>;
  acceptTeamInvite(token: string): Promise<Team>;
  acceptTeamInviteById(inviteId: ID): Promise<Team>;
  listProjects(teamId?: ID): Promise<Project[]>;
  createProject(p: CreateProjectPayload): Promise<Project>;
  addProjectResource(p: AddProjectResourcePayload): Promise<ProjectResource>;
  removeProjectResource(projectId: ID, resourceId: ID): Promise<void>;
  listTasks(projectId?: ID, teamId?: ID): Promise<Task[]>;
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
  markRead(id: ID): Promise<Notification>;
  markAllRead(): Promise<void>;
}

export interface MediaAPI {
  uploadMeetingFile(meetingId: ID, file: File): Promise<MediaFile>;
  listMeetingFiles(meetingId: ID): Promise<MediaFile[]>;
}

export interface AIAPI {
  generateSuggestions(meetingId: ID): Promise<AISuggestion[]>;
  ask(prompt: string, context?: { meetingId?: ID; channelId?: ID }): Promise<string>;
}

export interface DashboardAPI {
  overview(workspaceId?: ID): Promise<DashboardOverview>;
}

export interface API {
  auth: AuthAPI;
  meetings: MeetingsAPI;
  projects: ProjectsAPI;
  chat: ChatAPI;
  notifications: NotificationsAPI;
  media: MediaAPI;
  ai: AIAPI;
  dashboard: DashboardAPI;
}
