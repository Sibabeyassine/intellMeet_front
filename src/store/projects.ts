import { create } from "zustand";
import { api } from "@/services";
import type { AddProjectResourcePayload, CreateProjectPayload, CreateTaskPayload, CreateTeamPayload, Project, ProjectResource, Task, TaskStatus, Team } from "@/services";

interface ProjectsState {
  // entities
  teams: Team[];
  projects: Project[];
  tasks: Task[];
  // active context
  currentTeamId: string | null;
  currentProjectId: string | null;
  // status
  loading: boolean;
  loaded: boolean;
  // actions
  fetchAll: () => Promise<void>;
  fetch: () => Promise<void>; // alias kept for backwards compatibility
  setTeam: (id: string | null) => void;
  setProject: (id: string | null) => void;
  createTeam: (p: CreateTeamPayload) => Promise<Team>;
  createProject: (p: CreateProjectPayload) => Promise<Project>;
  create: (p: CreateTaskPayload) => Promise<Task>;
  move: (id: string, status: TaskStatus) => Promise<void>;
  update: (id: string, patch: Partial<Task>) => Promise<Task>;
  remove: (id: string) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  teams: [], projects: [], tasks: [],
  currentTeamId: null, currentProjectId: null,
  loading: false, loaded: false,

  async fetchAll() {
    if (get().loading) return;
    set({ loading: true });
    try {
      const [teams, projects, tasks] = await Promise.all([
        api.projects.listTeams(),
        api.projects.listProjects(),
        api.projects.listTasks(),
      ]);
      const state = get();
      const teamId = state.currentTeamId && teams.some(t => t.id === state.currentTeamId)
        ? state.currentTeamId
        : teams[0]?.id ?? null;
      const teamProjects = projects.filter(p => p.teamId === teamId);
      const projectId = state.currentProjectId && teamProjects.some(p => p.id === state.currentProjectId)
        ? state.currentProjectId
        : teamProjects[0]?.id ?? null;
      set({ teams, projects, tasks, loaded: true, currentTeamId: teamId, currentProjectId: projectId });
    } finally { set({ loading: false }); }
  },
  fetch() { return get().fetchAll(); },

  setTeam(id) {
    const projects = get().projects.filter(p => p.teamId === id);
    set({ currentTeamId: id, currentProjectId: projects[0]?.id ?? null });
  },
  setProject(id) { set({ currentProjectId: id }); },

  async createTeam(p) {
    const team = await api.projects.createTeam(p);
    set({ teams: [...get().teams, team], currentTeamId: team.id });
    return team;
  },
  async createProject(p) {
    const project = await api.projects.createProject(p);
    set({ projects: [...get().projects, project], currentProjectId: project.id, currentTeamId: project.teamId });
    return project;
  },

  async create(p) {
    const projectId = p.projectId ?? get().currentProjectId;
    if (!projectId) throw new Error("No active project");
    const t = await api.projects.createTask({ ...p, projectId });
    set({ tasks: [t, ...get().tasks] });
    return t;
  },
  async move(id, status) {
    set({ tasks: get().tasks.map(t => t.id === id ? { ...t, status } : t) });
    try { await api.projects.updateTaskStatus(id, status); }
    catch { await get().fetchAll(); }
  },
  async update(id, patch) {
    const prev = get().tasks;
    set({ tasks: prev.map(t => t.id === id ? { ...t, ...patch } : t) });
    try {
      const next = await api.projects.updateTask(id, patch);
      set({ tasks: get().tasks.map(t => t.id === id ? next : t) });
      return next;
    } catch (e) { set({ tasks: prev }); throw e; }
  },
  async remove(id) {
    await api.projects.deleteTask(id);
    set({ tasks: get().tasks.filter(t => t.id !== id) });
  },
}));

// Selectors -----------------------------------------------------
export const useCurrentTeam = () => useProjectsStore(s => s.teams.find(t => t.id === s.currentTeamId) ?? null);
export const useCurrentProject = () => useProjectsStore(s => s.projects.find(p => p.id === s.currentProjectId) ?? null);
// NOTE: do NOT return new arrays from selectors — that triggers infinite re-renders.
// Consumers should memoize with useMemo from (projects, currentTeamId) / (tasks, currentProjectId).
