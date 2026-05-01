import { create } from "zustand";
import { api } from "@/services";
import type { Notification } from "@/services";

interface NotifState {
  list: Notification[];
  loaded: boolean;
  fetch: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationsStore = create<NotifState>((set, get) => ({
  list: [], loaded: false,
  async fetch() {
    const list = await api.notifications.list();
    set({ list, loaded: true });
  },
  async markAllRead() {
    await api.notifications.markAllRead();
    set({ list: get().list.map(n => ({ ...n, read: true })) });
  },
}));

export const useUnreadCount = () => useNotificationsStore(s => s.list.filter(n => !n.read).length);
