import { create } from "zustand";
import { api } from "@/services";
import type { CreateMeetingPayload, Meeting } from "@/services";

interface MeetingsState {
  list: Meeting[];
  loading: boolean;
  loaded: boolean;
  fetch: () => Promise<void>;
  create: (p: CreateMeetingPayload) => Promise<Meeting>;
  remove: (id: string) => Promise<void>;
  removeLocal: (id: string) => void;
}

export const useMeetingsStore = create<MeetingsState>((set, get) => ({
  list: [], loading: false, loaded: false,
  async fetch() {
    if (get().loading) return;
    set({ loading: true });
    try {
      const list = await api.meetings.list();
      set({ list, loaded: true });
    } finally { set({ loading: false }); }
  },
  async create(p) {
    const m = await api.meetings.create(p);
    set({ list: [m, ...get().list] });
    return m;
  },
  async remove(id) {
    set({ list: get().list.filter(m => m.id !== id) });
    try { await api.meetings.delete(id); } catch { await get().fetch(); }
  },
  removeLocal(id) {
    set({ list: get().list.filter(m => m.id !== id) });
  },
}));
