import { create } from "zustand";
import { api } from "@/services";
import type { Notification } from "@/services";

interface NotifState {
  list: Notification[];
  loaded: boolean;
  error?: string;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clear: () => void;
}

export const useNotificationsStore = create<NotifState>((set, get) => ({
  list: [], loaded: false,
  async fetch() {
    try {
      const list = await api.notifications.list();
      set({ list, loaded: true, error: undefined });
    } catch (error) {
      set({
        loaded: true,
        error: error instanceof Error ? error.message : "Notifications unavailable"
      });
    }
  },
  async markRead(id) {
    const previous = get().list;
    set({ list: previous.map(n => n.id === id ? { ...n, read: true } : n) });

    try {
      const notification = await api.notifications.markRead(id);
      set({
        list: get().list.map(n => n.id === id ? notification : n),
        error: undefined
      });
    } catch (error) {
      set({
        list: previous,
        error: error instanceof Error ? error.message : "Notification update failed"
      });
    }
  },
  async markAllRead() {
    await api.notifications.markAllRead();
    set({ list: get().list.map(n => ({ ...n, read: true })) });
  },
  clear() {
    set({ list: [], loaded: false, error: undefined });
  },
}));

export const useUnreadCount = () => useNotificationsStore(s => s.list.filter(n => !n.read).length);
