import { create } from "zustand";
import { api } from "@/services";
import type { Channel, ChatMessage } from "@/services";

interface ChatState {
  channels: Channel[];
  dms: Channel[];
  messages: Record<string, ChatMessage[]>;
  activeId: string;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  loadMessages: (channelId: string) => Promise<void>;
  send: (text: string) => Promise<void>;
  setActive: (id: string) => void;
  createChannel: (name: string) => Promise<Channel>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [], dms: [], messages: {}, activeId: "", loaded: false,
  async fetchAll() {
    const [channels, dms] = await Promise.all([api.chat.listChannels(), api.chat.listDMs()]);
    if (!channels.length && !dms.length) {
      set({ channels, dms, activeId: "", loaded: true });
      return;
    }
    const activeId =
      [...channels, ...dms].some(channel => channel.id === get().activeId)
        ? get().activeId
        : channels[0]?.id ?? dms[0]?.id ?? get().activeId;
    set({ channels, dms, activeId, loaded: true });
    await get().loadMessages(activeId);
  },
  async loadMessages(channelId) {
    if (!channelId) return;
    if (get().messages[channelId]) return;
    const list = await api.chat.listMessages(channelId);
    set({ messages: { ...get().messages, [channelId]: list } });
  },
  async send(text) {
    const channelId = get().activeId;
    if (!text.trim()) return;
    const msg = await api.chat.sendMessage({ channelId, text: text.trim() });
    set({
      messages: {
        ...get().messages,
        [channelId]: [...(get().messages[channelId] ?? []), msg],
      },
    });
  },
  setActive(id) {
    set({ activeId: id });
    void get().loadMessages(id);
    // mark unread = 0 locally
    set({
      channels: get().channels.map(c => c.id === id ? { ...c, unread: 0 } : c),
      dms: get().dms.map(c => c.id === id ? { ...c, unread: 0 } : c),
    });
  },
  async createChannel(name) {
    const ch = await api.chat.createChannel(name);
    set({ channels: [...get().channels, ch] });
    return ch;
  },
}));
