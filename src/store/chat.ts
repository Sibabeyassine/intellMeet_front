import { create } from "zustand";
import { api } from "@/services";
import { useNotificationsStore } from "@/store/notifications";
import type { Channel, ChatMessage } from "@/services";

interface ChatState {
  channels: Channel[];
  dms: Channel[];
  messages: Record<string, ChatMessage[]>;
  activeId: string;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  loadMessages: (channelId: string, options?: { force?: boolean }) => Promise<void>;
  refreshActive: () => Promise<void>;
  send: (text: string) => Promise<void>;
  setActive: (id: string) => void;
  createChannel: (name: string) => Promise<Channel>;
  subscribeActive: () => void;
  disconnect: () => void;
}

let unsubscribe: (() => void) | null = null;
let subscribedChannelId = "";

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [], dms: [], messages: {}, activeId: "", loaded: false,
  async fetchAll() {
    const [channels, dms] = await Promise.all([api.chat.listChannels(), api.chat.listDMs()]);
    const allChannels = [...channels, ...dms];
    if (!channels.length && !dms.length) {
      get().disconnect();
      set({ channels, dms, messages: {}, activeId: "", loaded: true });
      return;
    }
    const activeId =
      allChannels.some(channel => channel.id === get().activeId)
        ? get().activeId
        : channels[0]?.id ?? dms[0]?.id ?? get().activeId;
    set({ channels, dms, activeId, loaded: true });
    await get().loadMessages(activeId, { force: true });
    get().subscribeActive();
  },
  async loadMessages(channelId, options) {
    if (!channelId) return;
    const exists = [...get().channels, ...get().dms].some(channel => channel.id === channelId);
    if (!exists) {
      const nextActiveId = get().channels[0]?.id ?? get().dms[0]?.id ?? "";
      set({ activeId: nextActiveId });
      if (!nextActiveId) get().disconnect();
      return;
    }
    if (get().messages[channelId] && !options?.force) return;
    const list = await api.chat.listMessages(channelId);
    set({ messages: { ...get().messages, [channelId]: list } });
  },
  async refreshActive() {
    const channelId = get().activeId;
    if (channelId) await get().loadMessages(channelId, { force: true });
  },
  async send(text) {
    const channelId = get().activeId;
    if (!channelId || !text.trim()) return;
    const msg = await api.chat.sendMessage({ channelId, text: text.trim() });
    set({
      messages: {
        ...get().messages,
        [channelId]: mergeMessages(get().messages[channelId] ?? [], [msg]),
      },
    });
  },
  setActive(id) {
    set({ activeId: id });
    void get().loadMessages(id, { force: true });
    get().subscribeActive();
    // mark unread = 0 locally
    set({
      channels: get().channels.map(c => c.id === id ? { ...c, unread: 0 } : c),
      dms: get().dms.map(c => c.id === id ? { ...c, unread: 0 } : c),
    });
  },
  async createChannel(name) {
    const ch = await api.chat.createChannel(name);
    set({ channels: [ch, ...get().channels], activeId: ch.id });
    get().subscribeActive();
    return ch;
  },
  subscribeActive() {
    const channelId = get().activeId;
    if (!channelId || subscribedChannelId === channelId) return;

    unsubscribe?.();
    subscribedChannelId = channelId;
    unsubscribe = api.chat.subscribe(channelId, (message) => {
      const current = get();
      const existing = current.messages[message.channelId] ?? [];
      set({
        messages: {
          ...current.messages,
          [message.channelId]: mergeMessages(existing, [message])
        },
        channels: current.channels.map(channel =>
          channel.id === message.channelId && current.activeId !== message.channelId
            ? { ...channel, unread: (channel.unread ?? 0) + 1 }
            : channel
        )
      });
      if (!message.isYou) {
        void useNotificationsStore.getState().fetch();
      }
    });
  },
  disconnect() {
    unsubscribe?.();
    unsubscribe = null;
    subscribedChannelId = "";
  },
}));

const mergeMessages = (current: ChatMessage[], next: ChatMessage[]) => {
  const byId = new Map(current.map((message) => [message.id, message]));
  next.forEach((message) => byId.set(message.id, message));
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};
