import type { API } from "../api";
import type {
  ActionItem, AISuggestion, Channel, ChatMessage, CreateMeetingPayload, CreateProjectPayload,
  CreateTaskPayload, CreateTeamPayload, ID, LoginPayload, Meeting, MeetingSummary, Notification,
  Project, RegisterPayload, SendMessagePayload, Session, Task, TaskStatus, Team, TranscriptLine, User,
} from "../types";
import { delay, nowISO, storage, uid } from "./storage";
import {
  COLORS, seedChannels, seedDMs, seedMeetings, seedMessages, seedNotifications,
  seedProjects, seedTasks, seedTeams, seedUser,
} from "./seed";

// ---------- Persistent collections ----------
const K = {
  session: "session",
  meetings: "meetings",
  tasks: "tasks",
  teams: "teams",
  projects: "projects",
  channels: "channels",
  dms: "dms",
  messages: "messages",
  notifications: "notifications",
};

function load<T>(key: string, seed: T): T {
  const v = storage.get<T | null>(key, null);
  if (v === null) {
    storage.set(key, seed);
    return seed;
  }
  return v;
}

// ---------- AUTH ----------
const auth = {
  async login(p: LoginPayload): Promise<Session> {
    await delay(400);
    if (!p.email.includes("@")) throw new Error("Email invalide");
    if (!p.password || p.password.length < 6) throw new Error("Mot de passe trop court (min 6 caractères)");
    const user: User = { ...seedUser, email: p.email };
    const session: Session = {
      user, accessToken: "mock_" + uid(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    storage.set(K.session, session);
    return session;
  },
  async register(p: RegisterPayload): Promise<Session> {
    await delay(500);
    if (!p.email.includes("@")) throw new Error("Email invalide");
    if (p.password.length < 6) throw new Error("Mot de passe trop court (min 6 caractères)");
    if (!p.fullName.trim()) throw new Error("Nom requis");
    const initials = p.fullName.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
    const user: User = {
      id: "u_" + uid(), email: p.email, fullName: p.fullName, initials,
      color: COLORS.green, role: "owner", createdAt: nowISO(),
    };
    const session: Session = {
      user, accessToken: "mock_" + uid(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    storage.set(K.session, session);
    return session;
  },
  async logout() {
    await delay(120);
    storage.remove(K.session);
  },
  async getSession(): Promise<Session | null> {
    return storage.get<Session | null>(K.session, null);
  },
  async updateProfile(patch) {
    const s = storage.get<Session | null>(K.session, null);
    if (!s) throw new Error("Non authentifié");
    const user = { ...s.user, ...patch };
    storage.set(K.session, { ...s, user });
    return user;
  },
};

// ---------- MEETINGS ----------
const meetings = {
  async list(): Promise<Meeting[]> {
    await delay();
    return load(K.meetings, seedMeetings);
  },
  async get(id: ID) {
    const all = load(K.meetings, seedMeetings);
    return all.find(m => m.id === id) ?? null;
  },
  async create(p: CreateMeetingPayload): Promise<Meeting> {
    await delay();
    const all = load(K.meetings, seedMeetings);
    const me = (await auth.getSession())?.user;
    const m: Meeting = {
      id: "m_" + uid(),
      title: p.title,
      description: p.description,
      scheduledAt: p.scheduledAt,
      durationMin: p.durationMin,
      status: "scheduled",
      hostId: me?.id ?? "u_you",
      inviteUrl: `intellmeet.app/r/${uid()}`,
      participants: [
        ...(me ? [{ id: me.id, name: me.fullName, initials: me.initials, color: me.color, isHost: true, isYou: true }] : []),
      ],
    };
    storage.set(K.meetings, [m, ...all]);
    return m;
  },
  async update(id: ID, patch: Partial<Meeting>) {
    const all = load(K.meetings, seedMeetings);
    const next = all.map(m => m.id === id ? { ...m, ...patch } : m);
    storage.set(K.meetings, next);
    const updated = next.find(m => m.id === id);
    if (!updated) throw new Error("Meeting introuvable");
    return updated;
  },
  async delete(id: ID) {
    const all = load(K.meetings, seedMeetings);
    storage.set(K.meetings, all.filter(m => m.id !== id));
  },
  async getSummary(id: ID): Promise<MeetingSummary | null> {
    await delay();
    return {
      meetingId: id,
      topic: "Roadmap Q2 — Sync produit hebdo",
      generatedAt: nowISO(),
      highlights: [
        "Objectif : valider la roadmap Q2 et débloquer les sujets design.",
        "Intégration Stripe en retard — priorité haute cette semaine.",
        "Nouveaux mockups onboarding prêts à être partagés.",
        "Documentation API partenaires à livrer vendredi.",
      ],
      decisions: [
        "Review interne planifiée jeudi 15h.",
        "Sofia présente les mockups en fin de réunion.",
      ],
    };
  },
  async getTranscript(id: ID): Promise<TranscriptLine[]> {
    await delay();
    return [
      { id: "t1", meetingId: id, authorName: "Léa Moreau", initials: "LM", color: COLORS.blue, time: "00:14", text: "Objectif aujourd'hui : valider la roadmap Q2 et clore les blocants côté design." },
      { id: "t2", meetingId: id, authorName: "Marc Dubois", initials: "MD", color: COLORS.amber, time: "00:42", text: "On a un retard sur l'intégration Stripe — il faut prioriser cette semaine." },
      { id: "t3", meetingId: id, authorName: "Sofia Rinaldi", initials: "SR", color: COLORS.pink, time: "01:18", text: "Les nouveaux mockups onboarding sont prêts." },
      { id: "t4", meetingId: id, authorName: "Amira Haddad", initials: "AH", color: COLORS.cyan, time: "01:55", text: "Je m'occupe de la doc API pour les partenaires d'ici vendredi." },
      { id: "t5", meetingId: id, authorName: "Léa Moreau", initials: "LM", color: COLORS.blue, time: "02:20", text: "Parfait. On bloque jeudi 15h pour la review interne." },
    ];
  },
  async getActionItems(id: ID): Promise<ActionItem[]> {
    await delay();
    return [
      { id: "a1", meetingId: id, title: "Finaliser intégration Stripe", assignee: "Marc Dubois", initials: "MD", color: COLORS.amber, due: "Ven. 26 avril", status: "in_progress" },
      { id: "a2", meetingId: id, title: "Pousser mockups onboarding sur Figma", assignee: "Sofia Rinaldi", initials: "SR", color: COLORS.pink, due: "Aujourd'hui", status: "todo" },
      { id: "a3", meetingId: id, title: "Rédiger doc API partenaires", assignee: "Amira Haddad", initials: "AH", color: COLORS.cyan, due: "Ven. 26 avril", status: "todo" },
      { id: "a4", meetingId: id, title: "Bloquer review interne (jeudi 15h)", assignee: "Léa Moreau", initials: "LM", color: COLORS.blue, due: "Jeu. 25 avril", status: "done" },
    ];
  },
  subscribe(_id, _cb) { return () => {}; },
} as API["meetings"];

// ---------- TEAMS / PROJECTS / TASKS ----------
const projects = {
  async listTeams(): Promise<Team[]> {
    await delay(120);
    return load(K.teams, seedTeams);
  },
  async createTeam(p: CreateTeamPayload): Promise<Team> {
    await delay();
    const all = load(K.teams, seedTeams);
    const team: Team = {
      id: "team_" + uid(),
      name: p.name,
      color: p.color ?? COLORS.blue,
      memberCount: 1,
      createdAt: nowISO(),
    };
    storage.set(K.teams, [...all, team]);
    return team;
  },
  async listProjects(): Promise<Project[]> {
    await delay(120);
    return load(K.projects, seedProjects);
  },
  async createProject(p: CreateProjectPayload): Promise<Project> {
    await delay();
    const all = load(K.projects, seedProjects);
    const project: Project = {
      id: "proj_" + uid(),
      teamId: p.teamId,
      name: p.name,
      key: (p.key ?? p.name.slice(0, 3)).toUpperCase(),
      color: p.color ?? COLORS.blue,
      description: p.description,
      createdAt: nowISO(),
    };
    storage.set(K.projects, [...all, project]);
    return project;
  },
  async listTasks(projectId?: ID): Promise<Task[]> {
    await delay();
    const all = load(K.tasks, seedTasks);
    return projectId ? all.filter(t => t.projectId === projectId) : all;
  },
  async createTask(p: CreateTaskPayload): Promise<Task> {
    await delay();
    const all = load(K.tasks, seedTasks);
    const me = (await auth.getSession())?.user;
    const t: Task = {
      id: "t_" + uid(),
      projectId: p.projectId,
      title: p.title,
      description: p.description,
      status: p.status ?? "todo",
      priority: p.priority ?? "med",
      assignees: me ? [{ initials: me.initials, color: me.color }] : [],
      dueDate: p.dueDate,
      tag: p.tag,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    storage.set(K.tasks, [t, ...all]);
    return t;
  },
  async updateTaskStatus(id, status) {
    const all = load(K.tasks, seedTasks);
    const next = all.map(t => t.id === id ? { ...t, status, updatedAt: nowISO() } : t);
    storage.set(K.tasks, next);
    return next.find(t => t.id === id)!;
  },
  async updateTask(id, patch) {
    const all = load(K.tasks, seedTasks);
    const next = all.map(t => t.id === id ? { ...t, ...patch, updatedAt: nowISO() } : t);
    storage.set(K.tasks, next);
    return next.find(t => t.id === id)!;
  },
  async deleteTask(id) {
    const all = load(K.tasks, seedTasks);
    storage.set(K.tasks, all.filter(t => t.id !== id));
  },
} as API["projects"];

// ---------- CHAT ----------
type MessagesMap = Record<string, ChatMessage[]>;
const subs: Record<string, Set<(m: ChatMessage) => void>> = {};

const chat = {
  async listChannels(): Promise<Channel[]> {
    await delay(150);
    return load(K.channels, seedChannels);
  },
  async listDMs(): Promise<Channel[]> {
    await delay(150);
    return load(K.dms, seedDMs);
  },
  async listMessages(channelId): Promise<ChatMessage[]> {
    await delay(150);
    const all = load<MessagesMap>(K.messages, seedMessages);
    return all[channelId] ?? [];
  },
  async sendMessage(p: SendMessagePayload): Promise<ChatMessage> {
    await delay(120);
    const me = (await auth.getSession())?.user;
    const all = load<MessagesMap>(K.messages, seedMessages);
    const msg: ChatMessage = {
      id: "m_" + uid(),
      channelId: p.channelId,
      authorId: me?.id ?? "u_you",
      authorName: me?.fullName ?? "Toi",
      initials: me?.initials ?? "VB",
      color: me?.color ?? COLORS.green,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      text: p.text,
      isYou: true,
      createdAt: nowISO(),
    };
    const next: MessagesMap = { ...all, [p.channelId]: [...(all[p.channelId] ?? []), msg] };
    storage.set(K.messages, next);
    subs[p.channelId]?.forEach(cb => cb(msg));
    return msg;
  },
  async createChannel(name: string): Promise<Channel> {
    await delay();
    const all = load(K.channels, seedChannels);
    const ch: Channel = { id: name.toLowerCase().replace(/\s+/g, "-"), name, kind: "channel" };
    storage.set(K.channels, [...all, ch]);
    return ch;
  },
  subscribe(channelId, cb) {
    subs[channelId] ??= new Set();
    subs[channelId].add(cb);
    return () => subs[channelId]?.delete(cb);
  },
} as API["chat"];

// ---------- NOTIFICATIONS ----------
const notifications = {
  async list(): Promise<Notification[]> {
    await delay(100);
    return load(K.notifications, seedNotifications);
  },
  async markAllRead() {
    const all = load(K.notifications, seedNotifications);
    storage.set(K.notifications, all.map(n => ({ ...n, read: true })));
  },
} as API["notifications"];

// ---------- AI ----------
const ai = {
  async generateSuggestions(_id): Promise<AISuggestion[]> {
    await delay(400);
    return [
      { id: "s1", text: "Créer une action : valider Stripe avant vendredi", kind: "action" },
      { id: "s2", text: "Suggérer de planifier la review interne jeudi 15h", kind: "decision" },
      { id: "s3", text: "Avez-vous parlé du roadmap Q3 ?", kind: "question" },
    ];
  },
  async ask(prompt) {
    await delay(600);
    return `Voici une réponse simulée à : « ${prompt} ». Branche un vrai LLM via /services/api.ts.`;
  },
} as API["ai"];

export const mockApi: API = { auth, meetings, projects, chat, notifications, ai };
