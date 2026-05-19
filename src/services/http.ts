import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { io, Socket } from "socket.io-client";

import type {
  API,
  AuthAPI,
  ChatAPI,
  MeetingsAPI,
  MediaAPI,
  NotificationsAPI,
  ProjectsAPI,
  AIAPI,
  DashboardAPI
} from "./api";
import type {
  ActionItem,
  AISuggestion,
  Channel,
  ChatMessage,
  CreateMeetingPayload,
  CreateProjectPayload,
  CreateTaskPayload,
  CreateTeamPayload,
  DashboardOverview,
  ID,
  LoginPayload,
  Meeting,
  MeetingSummary,
  MediaFile,
  Notification,
  Project,
  RegisterPayload,
  SendMessagePayload,
  Session,
  Task,
  TaskPriority,
  TaskStatus,
  Team,
  TeamMember,
  TranscriptLine,
  User
} from "./types";

type ApiResponse<T> = {
  succeed: boolean;
  message: string;
  data: T;
  errors?: unknown[];
};

type ApiErrorDetail = {
  path?: string;
  message?: string;
};

const isApiErrorDetail = (error: unknown): error is ApiErrorDetail =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof (error as ApiErrorDetail).message === "string";

const formatApiErrorMessage = (data: ApiResponse<unknown> | undefined, fallback: string): string => {
  const detail = data?.errors?.find(isApiErrorDetail);
  return detail?.message ?? data?.message ?? fallback;
};

type BackendUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: "admin" | "member";
  createdAt: string;
};

type BackendWorkspace = {
  id: string;
  name: string;
  description?: string;
  members?: Array<{ userId: string; status: string }>;
  createdAt: string;
};

type BackendWorkspaceMember = {
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: "owner" | "admin" | "member";
  status: "active" | "invited" | "removed";
  joinedAt?: string;
};

type BackendProject = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: "planning" | "active" | "completed" | "archived";
  createdAt: string;
};

type BackendTask = {
  id: string;
  projectId?: string;
  assigneeId?: string;
  title: string;
  description?: string;
  status: "todo" | "doing" | "done" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
};

type BackendMeeting = {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
  hostId: string;
  participantIds?: string[];
  participants?: Array<{
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
    isHost?: boolean;
  }>;
  recordingUrl?: string;
  transcript?: string;
  notes?: string;
  summary?: string;
  actionItems?: Array<{
    title: string;
    assigneeId?: string;
    status: "todo" | "doing" | "done";
    dueDate?: string;
  }>;
};

type BackendNotification = {
  id: string;
  type:
    | "task_assigned"
    | "chat_message"
    | "meeting_updated"
    | "meeting_reminder"
    | "system";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
};

type BackendChatMessage = {
  id: string;
  meetingId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    email?: string;
  };
};

type BackendMediaFile = {
  id: string;
  workspaceId: string;
  projectId?: string;
  meetingId?: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:8000";
const SESSION_KEY = "intellmeet.http.session";
const ACTIVE_WORKSPACE_KEY = "intellmeet.activeWorkspaceId";
const ACTIVE_PROJECT_KEY = "intellmeet.activeProjectId";
const ACTIVE_MEETING_KEY = "intellmeet.activeMeetingId";

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

const refreshClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

client.interceptors.request.use((config) => {
  const session = readSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  if (config.method?.toLowerCase() === "get") {
    config.headers["Cache-Control"] = "no-cache";
    config.headers.Pragma = "no-cache";
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isUnauthorized = error.response?.status === 401;
    const canRefresh =
      isUnauthorized &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register") &&
      !originalRequest.url?.includes("/auth/refresh");

    if (canRefresh) {
      originalRequest._retry = true;
      const refreshed = await refreshSession();
      if (refreshed) {
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return client(originalRequest);
      }
      notifySessionExpired();
    }

    const message = formatApiErrorMessage(
      error.response?.data,
      error.message ?? "API request failed"
    );
    return Promise.reject(new Error(message));
  }
);

const unwrap = async <T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> => {
  const response = await promise;
  return response.data.data;
};

const readSession = (): Session | null => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as Session | null;
  } catch {
    return null;
  }
};

const saveSession = (session: Session | null) => {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

const notifySessionExpired = () => {
  saveSession(null);
  window.dispatchEvent(new CustomEvent("intellmeet:session-expired"));
};

const refreshSession = async (): Promise<Session | null> => {
  const session = readSession();
  if (!session?.refreshToken) return null;

  try {
    const data = await unwrap<{
      tokens: { accessToken: string; refreshToken: string };
    }>(
      refreshClient.post("/auth/refresh", {
        refreshToken: session.refreshToken
      })
    );

    const nextSession: Session = {
      ...session,
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };
    saveSession(nextSession);
    return nextSession;
  } catch {
    saveSession(null);
    return null;
  }
};

const getValidSession = async (): Promise<Session | null> => {
  const session = readSession();
  if (!session) return null;

  const expiresAt = new Date(session.expiresAt).getTime();
  const hasUsableAccessToken =
    Number.isFinite(expiresAt) && expiresAt - Date.now() > 60 * 1000;

  if (hasUsableAccessToken) {
    return session;
  }

  if (!session.refreshToken) {
    saveSession(null);
    return null;
  }

  return refreshSession();
};

const initialsFor = (name: string) =>
  name
    .split(" ")
    .map((item) => item[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "IM";

const colorFor = (id: string) => {
  const colors = [
    "221 83% 53%",
    "152 70% 45%",
    "38 92% 55%",
    "330 75% 55%",
    "265 70% 60%",
    "190 80% 45%"
  ];
  const index = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

const mapUser = (user: BackendUser): User => ({
  id: user.id,
  email: user.email,
  fullName: user.name,
  initials: initialsFor(user.name),
  avatarUrl: user.avatarUrl,
  color: colorFor(user.id),
  role: user.role === "admin" ? "admin" : "member",
  createdAt: user.createdAt
});

const mapTeam = (workspace: BackendWorkspace): Team => ({
  id: workspace.id,
  name: workspace.name,
  color: colorFor(workspace.id),
  memberCount: workspace.members?.filter((member) => member.status === "active")
    .length,
  createdAt: workspace.createdAt
});

const mapTeamMember = (member: BackendWorkspaceMember): TeamMember => ({
  userId: member.userId,
  name: member.name,
  email: member.email,
  avatarUrl: member.avatarUrl,
  role: member.role,
  status: member.status,
  joinedAt: member.joinedAt,
  initials: initialsFor(member.name),
  color: colorFor(member.userId)
});

const mapProject = (project: BackendProject): Project => ({
  id: project.id,
  teamId: project.workspaceId,
  name: project.name,
  key: project.name.slice(0, 3).toUpperCase(),
  color: colorFor(project.id),
  description: project.description,
  createdAt: project.createdAt
});

const toBackendTaskStatus = (status?: TaskStatus) => {
  if (!status) return undefined;
  if (status === "in_progress" || status === "review") return "doing";
  if (status === "backlog") return "todo";
  return status;
};

const mapTaskStatus = (status: BackendTask["status"]): TaskStatus => {
  if (status === "doing") return "in_progress";
  if (status === "cancelled") return "backlog";
  return status;
};

const toBackendPriority = (priority?: TaskPriority) => {
  if (priority === "med") return "medium";
  return priority;
};

const mapTaskPriority = (priority: BackendTask["priority"]): TaskPriority =>
  priority === "medium" ? "med" : priority;

const mapTask = (task: BackendTask): Task => ({
  id: task.id,
  projectId: task.projectId ?? "",
  title: task.title,
  description: task.description,
  status: mapTaskStatus(task.status),
  priority: mapTaskPriority(task.priority),
  assigneeId: task.assigneeId,
  assignees: task.assigneeId
    ? [{ initials: "MB", color: colorFor(task.assigneeId) }]
    : [],
  dueDate: task.dueDate,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt
});

const mapMeetingStatus = (status: BackendMeeting["status"]): Meeting["status"] => {
  if (status === "completed" || status === "cancelled") return "ended";
  return status;
};

const minutesBetween = (start: string, end?: string) => {
  if (!end) return 30;
  return Math.max(
    5,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  );
};

const mapMeeting = (meeting: BackendMeeting): Meeting => {
  const backendParticipants = meeting.participants?.length
    ? meeting.participants
    : [
        {
          id: meeting.hostId,
          name: "Host",
          isHost: true
        },
        ...(meeting.participantIds ?? [])
          .filter((participantId) => participantId !== meeting.hostId)
          .map((participantId, index) => ({
            id: participantId,
            name: `Participant ${index + 1}`,
            isHost: false
          }))
      ];

  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    notes: meeting.notes,
    scheduledAt: meeting.startsAt,
    durationMin: minutesBetween(meeting.startsAt, meeting.endsAt),
    status: mapMeetingStatus(meeting.status),
    hostId: meeting.hostId,
    participants: backendParticipants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      initials: initialsFor(participant.name),
      color: colorFor(participant.id),
      isHost: participant.isHost ?? participant.id === meeting.hostId
    })),
    inviteUrl: `/meeting/${meeting.id}`,
    recordingUrl: meeting.recordingUrl,
    transcript: meeting.transcript,
    hasAISummary: Boolean(meeting.summary)
  };
};

const toAppPath = (value: string): string | undefined => {
  if (value.startsWith("/")) return value;

  try {
    return new URL(value).pathname;
  } catch {
    return undefined;
  }
};

const mapNotification = (notification: BackendNotification): Notification => {
  const data = notification.data ?? {};
  const meetingId = typeof data.meetingId === "string" ? data.meetingId : undefined;
  const workspaceId = typeof data.workspaceId === "string" ? data.workspaceId : undefined;
  const inviteId = typeof data.inviteId === "string" ? data.inviteId : undefined;
  const inviteHref =
    typeof data.inviteUrl === "string"
      ? toAppPath(data.inviteUrl)
      : inviteId
        ? `/invite/id/${inviteId}`
        : undefined;

  return {
    id: notification.id,
    title: notification.title,
    body: notification.message,
    href:
      notification.type === "chat_message"
        ? undefined
        : inviteHref
          ? inviteHref
          : meetingId
          ? `/meeting/${meetingId}`
          : workspaceId
            ? "/projects"
            : "/dashboard",
    read: Boolean(notification.readAt),
    createdAt: notification.createdAt,
    kind:
      notification.type === "task_assigned"
        ? "task"
        : notification.type === "chat_message"
          ? "message"
        : notification.type === "system"
          ? inviteHref ? "mention" : "ai"
          : "meeting"
  };
};

const mapMediaFile = (file: BackendMediaFile): MediaFile => ({
  id: file.id,
  workspaceId: file.workspaceId,
  projectId: file.projectId,
  meetingId: file.meetingId,
  originalName: file.originalName,
  filename: file.filename,
  mimeType: file.mimeType,
  size: file.size,
  url: file.url.startsWith("http") ? file.url : `${API_URL.replace(/\/api$/, "")}${file.url}`,
  createdAt: file.createdAt
});

const mapChatMessage = (message: BackendChatMessage): ChatMessage => {
  const session = readSession();
  const isYou = message.senderId === session?.user.id;
  const authorName = isYou
    ? "Toi"
    : message.sender?.name ?? message.sender?.email ?? "Membre";

  return {
    id: message.id,
    channelId: message.meetingId,
    authorId: message.senderId,
    authorName,
    initials: isYou ? session?.user.initials ?? "ME" : initialsFor(authorName),
    color: isYou ? session?.user.color ?? "152 70% 45%" : colorFor(message.senderId),
    time: new Date(message.createdAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    text: message.message,
    isYou,
    createdAt: message.createdAt
  };
};

const activeWorkspaceId = () => localStorage.getItem(ACTIVE_WORKSPACE_KEY);
const setActiveWorkspaceId = (id: string) =>
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
const activeProjectId = () => localStorage.getItem(ACTIVE_PROJECT_KEY);
const setActiveProjectId = (id: string) =>
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
const activeMeetingId = () => localStorage.getItem(ACTIVE_MEETING_KEY);
const setActiveMeetingId = (id: string) =>
  localStorage.setItem(ACTIVE_MEETING_KEY, id);

const ensureWorkspaceId = async () => {
  const existing = activeWorkspaceId();
  if (existing) return existing;

  const workspaces = await unwrap<BackendWorkspace[]>(client.get("/workspaces"));
  if (!workspaces[0]) return null;

  setActiveWorkspaceId(workspaces[0].id);
  return workspaces[0].id;
};

const createDefaultWorkspaceId = async () => {
  const workspace = await unwrap<BackendWorkspace>(
    client.post("/workspaces", {
      name: "Espace IntellMeet",
      description: "Espace cree automatiquement depuis le frontend"
    })
  );
  setActiveWorkspaceId(workspace.id);
  return workspace.id;
};

const auth: AuthAPI = {
  async login(payload: LoginPayload) {
    const data = await unwrap<{
      user: BackendUser;
      tokens: { accessToken: string; refreshToken: string };
    }>(client.post("/auth/login", payload));

    const session: Session = {
      user: mapUser(data.user),
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };
    saveSession(session);
    return session;
  },
  async register(payload: RegisterPayload) {
    await unwrap<{ user: BackendUser }>(
      client.post("/auth/register", {
        name: payload.fullName,
        email: payload.email,
        password: payload.password
      })
    );
    return null;
  },
  async verifyEmail(payload) {
    await client.post("/auth/verify-email", payload);
  },
  async resendVerification(email) {
    await client.post("/auth/resend-verification", { email });
  },
  async logout() {
    const session = readSession();
    if (session?.refreshToken) {
      try {
        await client.post("/auth/logout", { refreshToken: session.refreshToken });
      } catch {
        // The local session still has to be removed even if the access token
        // is already expired or revoked on the backend.
      }
    }
    saveSession(null);
  },
  async getSession() {
    return getValidSession();
  },
  async updateProfile(patch) {
    const user = await unwrap<BackendUser>(
      client.patch("/users/me", {
        name: patch.fullName,
        avatarUrl: patch.avatarUrl
      })
    );
    const session = readSession();
    if (session) {
      const nextSession = { ...session, user: mapUser(user) };
      saveSession(nextSession);
    }
    return mapUser(user);
  },
  async changePassword(payload) {
    await client.patch("/auth/change-password", payload);
  }
};

const projects: ProjectsAPI = {
  async listTeams() {
    const workspaces = await unwrap<BackendWorkspace[]>(client.get("/workspaces"));
    const currentWorkspaceId = activeWorkspaceId();
    if (
      workspaces[0] &&
      (!currentWorkspaceId || !workspaces.some((workspace) => workspace.id === currentWorkspaceId))
    ) {
      setActiveWorkspaceId(workspaces[0].id);
    }
    return workspaces.map(mapTeam);
  },
  async listTeamMembers(teamId) {
    const members = await unwrap<BackendWorkspaceMember[]>(
      client.get(`/workspaces/${teamId}/members`)
    );
    return members.map(mapTeamMember);
  },
  async createTeam(payload: CreateTeamPayload) {
    const workspace = await unwrap<BackendWorkspace>(
      client.post("/workspaces", {
        name: payload.name,
        description: "Created from IntellMeet frontend"
      })
    );
    setActiveWorkspaceId(workspace.id);
    return mapTeam(workspace);
  },
  async inviteTeamMembers(teamId, emails) {
    await unwrap<{ invites: Array<{ id: string; email: string; inviteUrl: string }> }>(
      client.post(`/workspaces/${teamId}/invites`, {
        emails,
        role: "member"
      })
    );
  },
  async acceptTeamInvite(token) {
    const data = await unwrap<{ workspace: BackendWorkspace }>(
      client.post(`/workspaces/invites/${token}/accept`)
    );
    setActiveWorkspaceId(data.workspace.id);
    return mapTeam(data.workspace);
  },
  async acceptTeamInviteById(inviteId) {
    const data = await unwrap<{ workspace: BackendWorkspace }>(
      client.post(`/workspaces/invites/by-id/${inviteId}/accept`)
    );
    setActiveWorkspaceId(data.workspace.id);
    return mapTeam(data.workspace);
  },
  async listProjects(teamId) {
    const workspaceId = teamId ?? await ensureWorkspaceId();
    if (!workspaceId) return [];
    if (teamId) setActiveWorkspaceId(teamId);
    const list = await unwrap<BackendProject[]>(
      client.get("/projects", { params: { workspaceId } })
    );
    const currentProjectId = activeProjectId();
    if (list[0] && !list.some((project) => project.id === currentProjectId)) {
      setActiveProjectId(list[0].id);
    }
    return list.map(mapProject);
  },
  async createProject(payload: CreateProjectPayload) {
    setActiveWorkspaceId(payload.teamId);
    const project = await unwrap<BackendProject>(
      client.post("/projects", {
        workspaceId: payload.teamId,
        name: payload.name,
        description: payload.description,
        memberIds: []
      })
    );
    setActiveProjectId(project.id);
    return mapProject(project);
  },
  async listTasks(projectId?: ID, teamId?: ID) {
    const workspaceId = teamId ?? await ensureWorkspaceId();
    if (!workspaceId) return [];
    if (teamId) setActiveWorkspaceId(teamId);
    const tasks = await unwrap<BackendTask[]>(
      client.get("/tasks", {
        params: {
          workspaceId,
          projectId
        }
      })
    );
    return tasks.map(mapTask);
  },
  async createTask(payload: CreateTaskPayload) {
    const workspaceId = await ensureWorkspaceId();
    if (!workspaceId) throw new Error("Aucun workspace actif");
    const task = await unwrap<BackendTask>(
      client.post("/tasks", {
        workspaceId,
        projectId: payload.projectId,
        title: payload.title,
        description: payload.description,
        status: toBackendTaskStatus(payload.status),
        priority: toBackendPriority(payload.priority),
        assigneeId: payload.assigneeId,
        dueDate: payload.dueDate
      })
    );
    return mapTask(task);
  },
  async updateTaskStatus(id, status) {
    const task = await unwrap<BackendTask>(
      client.patch(`/tasks/${id}`, { status: toBackendTaskStatus(status) })
    );
    return mapTask(task);
  },
  async updateTask(id, patch) {
    const task = await unwrap<BackendTask>(
      client.patch(`/tasks/${id}`, {
        title: patch.title,
        description: patch.description,
        dueDate: patch.dueDate,
        status: toBackendTaskStatus(patch.status),
        priority: toBackendPriority(patch.priority),
        assigneeId: patch.assigneeId
      })
    );
    return mapTask(task);
  },
  async deleteTask(id) {
    await client.delete(`/tasks/${id}`);
  }
};

const meetings: MeetingsAPI = {
  async list() {
    const workspaceId = await ensureWorkspaceId();
    if (!workspaceId) return [];
    const list = await unwrap<BackendMeeting[]>(
      client.get("/meetings", { params: { workspaceId } })
    );
    if (list[0]) setActiveMeetingId(list[0].id);
    return list.map(mapMeeting);
  },
  async get(id) {
    const meeting = await unwrap<BackendMeeting>(client.get(`/meetings/${id}`));
    return mapMeeting(meeting);
  },
  async join(id) {
    const meeting = await unwrap<BackendMeeting>(client.post(`/meetings/${id}/join`));
    setActiveMeetingId(meeting.id);
    return mapMeeting(meeting);
  },
  async start(id) {
    const meeting = await unwrap<BackendMeeting>(client.post(`/meetings/${id}/start`));
    setActiveMeetingId(meeting.id);
    return mapMeeting(meeting);
  },
  async end(id) {
    const meeting = await unwrap<BackendMeeting>(client.post(`/meetings/${id}/end`));
    return mapMeeting(meeting);
  },
  async extend(id, durationMin = 30) {
    const meeting = await unwrap<BackendMeeting>(
      client.post(`/meetings/${id}/extend`, { durationMin })
    );
    setActiveMeetingId(meeting.id);
    return mapMeeting(meeting);
  },
  async create(payload: CreateMeetingPayload) {
    const workspaceId = (await ensureWorkspaceId()) ?? await createDefaultWorkspaceId();
    const startsAt = payload.scheduledAt;
    const endsAt = new Date(
      new Date(startsAt).getTime() + payload.durationMin * 60000
    ).toISOString();
    const meeting = await unwrap<BackendMeeting>(
      client.post("/meetings", {
        workspaceId,
        title: payload.title,
        description: payload.description,
        startsAt,
        endsAt,
        participantEmails: payload.participantEmails ?? []
      })
    );
    setActiveMeetingId(meeting.id);
    return mapMeeting(meeting);
  },
  async update(id, patch) {
    const meeting = await unwrap<BackendMeeting>(
      client.patch(`/meetings/${id}`, {
        title: patch.title,
        description: patch.description,
        startsAt: patch.scheduledAt,
        notes: patch.notes,
        transcript: patch.transcript,
        recordingUrl: patch.recordingUrl,
        status:
          patch.status === "ended"
            ? "completed"
            : patch.status === "live"
              ? "live"
              : undefined
      })
    );
    return mapMeeting(meeting);
  },
  async delete(id) {
    await client.delete(`/meetings/${id}`);
  },
  async getSummary(id) {
    const meeting = await unwrap<BackendMeeting>(client.get(`/meetings/${id}`));
    if (!meeting.summary) return null;
    return {
      meetingId: id,
      topic: meeting.title,
      highlights: [meeting.summary],
      decisions: [],
      generatedAt: new Date().toISOString()
    };
  },
  async getTranscript(id) {
    const meeting = await unwrap<BackendMeeting>(client.get(`/meetings/${id}`));
    if (!meeting.transcript) return [];
    return [
      {
        id: `${id}_transcript`,
        meetingId: id,
        authorName: "Transcript",
        initials: "TR",
        color: "221 83% 53%",
        time: "00:00",
        text: meeting.transcript
      }
    ];
  },
  async getActionItems(id) {
    const meeting = await unwrap<BackendMeeting>(client.get(`/meetings/${id}`));
    return (meeting.actionItems ?? []).map((item, index): ActionItem => ({
      id: `${id}_action_${index}`,
      meetingId: id,
      title: item.title,
      assignee: meeting.participants?.find((participant) => participant.id === item.assigneeId)?.name ?? "Equipe",
      initials: initialsFor(meeting.participants?.find((participant) => participant.id === item.assigneeId)?.name ?? "Equipe"),
      color: item.assigneeId ? colorFor(item.assigneeId) : "152 70% 45%",
      due: item.dueDate ? new Date(item.dueDate).toLocaleDateString("fr-FR") : "A planifier",
      status: item.status === "doing" ? "in_progress" : item.status
    }));
  },
  subscribe(id, cb) {
    const session = readSession();
    if (!session?.accessToken) return () => {};

    const socket: Socket = io(WS_URL, {
      auth: { token: session.accessToken }
    });

    socket.on("connect", () => {
      socket.emit("meeting:join", { meetingId: id });
    });

    socket.on("meeting:notes-updated", (payload: unknown) => {
      cb({ type: "notes-updated", payload });
    });

    socket.on("meeting:transcript-updated", (payload: unknown) => {
      cb({ type: "transcript-updated", payload });
    });

    socket.on("realtime:error", (payload: { message?: string }) => {
      if (payload.message) console.warn(payload.message);
    });

    return () => {
      socket.disconnect();
    };
  }
};

const chat: ChatAPI = {
  async listChannels() {
    const meetingsList = await meetings.list();
    return meetingsList.map((meeting): Channel => ({
      id: meeting.id,
      name: meeting.title,
      kind: "channel",
      topic: meeting.status === "live" ? "Réunion en direct" : "Chat de réunion",
      unread: 0
    }));
  },
  async listDMs() {
    return [];
  },
  async listMessages(channelId) {
    let messages: BackendChatMessage[] = [];
    try {
      messages = await unwrap<BackendChatMessage[]>(
        client.get(`/chat/meetings/${channelId}/messages`, { params: { limit: 50 } })
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("Meeting not found")) {
        if (activeMeetingId() === channelId) localStorage.removeItem(ACTIVE_MEETING_KEY);
        return [];
      }
      throw error;
    }
    return messages.reverse().map(mapChatMessage);
  },
  async sendMessage(payload: SendMessagePayload) {
    let message: BackendChatMessage;
    try {
      message = await unwrap<BackendChatMessage>(
        client.post(`/chat/meetings/${payload.channelId}/messages`, {
          message: payload.text
        })
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("Meeting not found")) {
        if (activeMeetingId() === payload.channelId) localStorage.removeItem(ACTIVE_MEETING_KEY);
      }
      throw error;
    }
    return mapChatMessage(message);
  },
  async createChannel(name) {
    const meeting = await meetings.create({
      title: name,
      scheduledAt: new Date().toISOString(),
      durationMin: 30
    });
    return {
      id: meeting.id,
      name: meeting.title,
      kind: "channel",
      topic: "Chat de reunion"
    };
  },
  subscribe(channelId, cb) {
    const session = readSession();
    if (!session?.accessToken) return () => {};

    const socket: Socket = io(WS_URL, {
      auth: {
        token: session.accessToken
      }
    });

    socket.on("connect", () => {
      socket.emit("meeting:join", {
        meetingId: channelId
      });
    });

    socket.on("chat:message", (message: BackendChatMessage) => {
      cb(mapChatMessage(message));
    });

    return () => {
      socket.disconnect();
    };
  }
};

const notifications: NotificationsAPI = {
  async list() {
    const data = await unwrap<{
      notifications: BackendNotification[];
      unreadCount: number;
    }>(
      client.get("/notifications", {
        params: { limit: 50 },
        headers: { "Cache-Control": "no-cache" }
      })
    );
    return data.notifications.map(mapNotification);
  },
  async markRead(id) {
    const notification = await unwrap<BackendNotification>(
      client.patch(`/notifications/${id}/read`)
    );
    return mapNotification(notification);
  },
  async markAllRead() {
    await client.patch("/notifications/read-all");
  }
};

const media: MediaAPI = {
  async uploadMeetingFile(meetingId, file) {
    const workspaceId = await ensureWorkspaceId();
    if (!workspaceId) throw new Error("Aucun workspace actif");

    const formData = new FormData();
    formData.append("workspaceId", workspaceId);
    const projectId = activeProjectId();
    if (projectId) formData.append("projectId", projectId);
    formData.append("meetingId", meetingId);
    formData.append("file", file);

    const mediaFile = await unwrap<BackendMediaFile>(
      client.post("/media", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
    );
    return mapMediaFile(mediaFile);
  },
  async listMeetingFiles(meetingId) {
    const workspaceId = await ensureWorkspaceId();
    const files = await unwrap<BackendMediaFile[]>(
      client.get("/media", {
        params: {
          workspaceId,
          meetingId
        }
      })
    );
    return files.map(mapMediaFile);
  }
};

const ai: AIAPI = {
  async generateSuggestions(meetingId) {
    const meeting = await unwrap<BackendMeeting>(client.get(`/meetings/${meetingId}`));
    const transcript = meeting.transcript ?? meeting.summary ?? meeting.description;
    if (!transcript || transcript.trim().length < 10) return [];
    const data = await unwrap<{
      intelligence: { summary: string; actionItems: Array<{ title: string }> };
    }>(
      client.post(`/ai/meetings/${meetingId}/analyze`, {
        transcript,
        persistTasks: false
      })
    );
    const suggestions: AISuggestion[] = [
      { id: `${meetingId}_summary`, text: data.intelligence.summary, kind: "summary" },
      ...data.intelligence.actionItems.map((item, index) => ({
        id: `${meetingId}_action_${index}`,
        text: item.title,
        kind: "action" as const
      }))
    ];
    return suggestions;
  },
  async ask(prompt) {
    return `Question recue: ${prompt}. Le module IA backend MVP analyse surtout les transcripts de reunion.`;
  }
};

const dashboard: DashboardAPI = {
  async overview(workspaceId) {
    return unwrap<DashboardOverview>(
      client.get("/dashboard/overview", {
        params: {
          workspaceId: workspaceId ?? activeWorkspaceId() ?? undefined
        }
      })
    );
  }
};

export const httpApi: API = {
  auth,
  meetings,
  projects,
  chat,
  notifications,
  media,
  ai,
  dashboard
};
