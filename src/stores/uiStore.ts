/**
 * stores/uiStore.ts
 *
 * Zustand store for ephemeral UI state that doesn't need to be persisted:
 * sidebar visibility, open modals, and the currently active page title.
 *
 * Keep server-owned state (builds, notes, tasks) in TanStack Query hooks —
 * this store is for purely local, transient UI concerns.
 */

import { create } from 'zustand'

type ModalId = 'createBuild' | 'deleteConfirm' | 'addNote' | 'addTask' | null

interface UIState {
  /** Whether the sidebar is expanded (desktop) or shown (mobile). */
  sidebarOpen: boolean
  /** Which modal is currently displayed. */
  activeModal: ModalId
  /** ID of the entity the current modal is operating on (e.g. buildId for delete). */
  modalEntityId: string | null

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (id: ModalId, entityId?: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  activeModal: null,
  modalEntityId: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (id, entityId) => set({ activeModal: id, modalEntityId: entityId ?? null }),
  closeModal: () => set({ activeModal: null, modalEntityId: null }),
}))
