import { create } from "zustand";

// Lightweight UI store for global modals & command palette.
type ModalKind = null | "new-meeting" | "new-task" | "edit-task" | "new-channel" | "new-team" | "new-project" | "new-resource" | "command" | "invite" | "meeting-detail";

interface UIState {
  modal: ModalKind;
  modalProps?: Record<string, unknown>;
  open: (m: Exclude<ModalKind, null>, props?: Record<string, unknown>) => void;
  close: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  modal: null,
  open: (modal, modalProps) => set({ modal, modalProps }),
  close: () => set({ modal: null, modalProps: undefined }),
}));
