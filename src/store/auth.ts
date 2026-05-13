import { create } from "zustand";
import { api } from "@/services";
import type { LoginPayload, RegisterPayload, Session, User } from "@/services";

interface AuthState {
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  hydrate: () => Promise<void>;
  login: (p: LoginPayload) => Promise<void>;
  register: (p: RegisterPayload) => Promise<Session | null>;
  verifyEmail: (p: { email: string; code: string }) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, "fullName" | "avatarUrl">>) => Promise<void>;
  changePassword: (p: { currentPassword: string; newPassword: string }) => Promise<void>;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  loading: false,
  initialized: false,
  async hydrate() {
    if (get().initialized) return;
    const session = await api.auth.getSession();
    set({ session, initialized: true });
  },
  async login(p) {
    set({ loading: true });
    try {
      const session = await api.auth.login(p);
      set({ session });
    } finally { set({ loading: false }); }
  },
  async register(p) {
    set({ loading: true });
    try {
      const session = await api.auth.register(p);
      if (session) set({ session });
      return session;
    } finally { set({ loading: false }); }
  },
  async verifyEmail(p) {
    set({ loading: true });
    try {
      await api.auth.verifyEmail(p);
    } finally { set({ loading: false }); }
  },
  async resendVerification(email) {
    set({ loading: true });
    try {
      await api.auth.resendVerification(email);
    } finally { set({ loading: false }); }
  },
  async logout() {
    await api.auth.logout();
    set({ session: null });
  },
  async updateProfile(patch) {
    const user = await api.auth.updateProfile(patch);
    const s = get().session;
    if (s) set({ session: { ...s, user } });
  },
  async changePassword(p) {
    await api.auth.changePassword(p);
  },
  clearSession() {
    set({ session: null });
  },
}));

export const useUser = () => useAuthStore(s => s.session?.user ?? null);
export const useIsAuthenticated = () => useAuthStore(s => !!s.session);
