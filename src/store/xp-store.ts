import { create } from 'zustand'

export interface WindowState {
  id: string
  title: string
  icon: string
  x: number
  y: number
  width: number
  height: number
  minWidth: number
  minHeight: number
  minimized: boolean
  maximized: boolean
  zIndex: number
  content: string
}

interface XPStore {
  windows: WindowState[]
  activeWindowId: string | null
  startMenuOpen: boolean
  nextZIndex: number
  clock: string

  openWindow: (id: string, title: string, icon: string, content: string, width?: number, height?: number) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  focusWindow: (id: string) => void
  moveWindow: (id: string, x: number, y: number) => void
  resizeWindow: (id: string, width: number, height: number) => void
  toggleStartMenu: () => void
  closeStartMenu: () => void
  updateClock: () => void
}

export const useXPStore = create<XPStore>((set, get) => ({
  windows: [],
  activeWindowId: null,
  startMenuOpen: false,
  nextZIndex: 10,
  clock: '',

  openWindow: (id, title, icon, content, width = 600, height = 450) => {
    const state = get()
    const existing = state.windows.find(w => w.id === id)
    if (existing) {
      if (existing.minimized) {
        set(s => ({
          windows: s.windows.map(w => w.id === id ? { ...w, minimized: false } : w),
          activeWindowId: id,
          nextZIndex: s.nextZIndex + 1,
          startMenuOpen: false,
        }))
        get().focusWindow(id)
        return
      }
      get().focusWindow(id)
      return
    }

    const offset = (state.windows.length % 8) * 30
    const newZ = state.nextZIndex + 1

    const newWindow: WindowState = {
      id,
      title,
      icon,
      x: 80 + offset,
      y: 40 + offset,
      width,
      height,
      minWidth: 300,
      minHeight: 200,
      minimized: false,
      maximized: false,
      zIndex: newZ,
      content,
    }

    set(s => ({
      windows: [...s.windows, newWindow],
      activeWindowId: id,
      nextZIndex: newZ,
      startMenuOpen: false,
    }))
  },

  closeWindow: (id) => {
    set(s => {
      const remaining = s.windows.filter(w => w.id !== id)
      const newActive = remaining.length > 0
        ? remaining.reduce((a, b) => a.zIndex > b.zIndex ? a : b).id
        : null
      return { windows: remaining, activeWindowId: newActive }
    })
  },

  minimizeWindow: (id) => {
    set(s => ({
      windows: s.windows.map(w => w.id === id ? { ...w, minimized: true } : w),
      activeWindowId: s.activeWindowId === id
        ? (s.windows.filter(w => w.id !== id && !w.minimized).sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null)
        : s.activeWindowId,
    }))
  },

  maximizeWindow: (id) => {
    set(s => ({
      windows: s.windows.map(w => w.id === id ? { ...w, maximized: true } : w),
      activeWindowId: id,
    }))
  },

  restoreWindow: (id) => {
    set(s => ({
      windows: s.windows.map(w => w.id === id ? { ...w, maximized: false } : w),
      activeWindowId: id,
    }))
  },

  focusWindow: (id) => {
    const newZ = get().nextZIndex + 1
    set(s => ({
      windows: s.windows.map(w => w.id === id ? { ...w, zIndex: newZ, minimized: false } : w),
      activeWindowId: id,
      nextZIndex: newZ,
      startMenuOpen: false,
    }))
  },

  moveWindow: (id, x, y) => {
    set(s => ({
      windows: s.windows.map(w => w.id === id ? { ...w, x, y } : w),
    }))
  },

  resizeWindow: (id, width, height) => {
    set(s => ({
      windows: s.windows.map(w => w.id === id ? { ...w, width, height } : w),
    }))
  },

  toggleStartMenu: () => {
    set(s => ({ startMenuOpen: !s.startMenuOpen }))
  },

  closeStartMenu: () => {
    set({ startMenuOpen: false })
  },

  updateClock: () => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    set({ clock: `${hours}:${minutes}` })
  },
}))