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

export interface ContextMenuTarget {
  x: number
  y: number
  type: 'desktop' | 'icon'
  iconId?: string
}

export type DesktopIconKind = 'app' | 'folder' | 'text' | 'shortcut'

export interface DesktopIconItem {
  id: string
  label: string
  icon: string
  content: string
  windowTitle: string
  windowWidth?: number
  windowHeight?: number
  kind: DesktopIconKind
  text?: string
}

export const defaultDesktopIcons: DesktopIconItem[] = [
  { id: 'about', label: 'My Computer', icon: 'computer', content: 'about', windowTitle: 'My Computer - About Me', kind: 'app' },
  { id: 'experience', label: 'Internet Explorer', icon: 'ie', content: 'experience', windowTitle: 'Work Experience - Internet Explorer', windowWidth: 650, windowHeight: 480, kind: 'app' },
  { id: 'education', label: 'My Pictures', icon: 'photos', content: 'education', windowTitle: 'Education - My Pictures', windowWidth: 580, windowHeight: 480, kind: 'app' },
  { id: 'projects', label: 'My Documents', icon: 'folder', content: 'projects', windowTitle: 'Projects - My Documents', windowWidth: 600, windowHeight: 500, kind: 'app' },
  { id: 'skills', label: 'Notepad', icon: 'notepad', content: 'skills', windowTitle: 'Skills - Notepad', windowWidth: 550, windowHeight: 480, kind: 'app' },
  { id: 'contact', label: 'Outlook Express', icon: 'outlook', content: 'contact', windowTitle: 'Contact - Outlook Express', windowWidth: 560, windowHeight: 440, kind: 'app' },
  { id: 'snake', label: 'Snake.exe', icon: 'snake', content: 'game', windowTitle: 'Snake', windowWidth: 520, windowHeight: 460, kind: 'app' },
]

let iconIdCounter = 0
const nextIconId = (prefix: string) => `${prefix}-${Date.now()}-${iconIdCounter++}`

interface XPStore {
  windows: WindowState[]
  activeWindowId: string | null
  startMenuOpen: boolean
  nextZIndex: number
  clock: string
  contextMenu: ContextMenuTarget | null
  desktopIconsVisible: boolean
  desktopIcons: DesktopIconItem[]
  iconSize: 'large' | 'classic'
  autoArrange: boolean
  alignToGrid: boolean
  renamingIconId: string | null
  clipboard: { id: string; mode: 'copy' | 'cut' } | null
  desktopRefreshKey: number

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
  openContextMenu: (target: ContextMenuTarget) => void
  closeContextMenu: () => void
  setDesktopIconsVisible: (visible: boolean) => void
  setIconSize: (size: 'large' | 'classic') => void
  toggleAutoArrange: () => void
  toggleAlignToGrid: () => void
  sortDesktopIcons: (by: 'name' | 'type') => void
  addDesktopIcon: (kind: 'folder' | 'text' | 'shortcut') => void
  renameDesktopIcon: (id: string, label: string) => void
  deleteDesktopIcon: (id: string) => void
  startRenaming: (id: string) => void
  stopRenaming: () => void
  copyDesktopIcon: (id: string) => void
  cutDesktopIcon: (id: string) => void
  pasteDesktopIcon: () => void
  updateIconText: (id: string, text: string) => void
  refreshDesktop: () => void
}

export const useXPStore = create<XPStore>((set, get) => ({
  windows: [],
  activeWindowId: null,
  startMenuOpen: false,
  nextZIndex: 10,
  clock: '',
  contextMenu: null,
  desktopIconsVisible: true,
  desktopIcons: defaultDesktopIcons,
  iconSize: 'large',
  autoArrange: true,
  alignToGrid: true,
  renamingIconId: null,
  clipboard: null,
  desktopRefreshKey: 0,

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

  openContextMenu: (target) => {
    set({ contextMenu: target, startMenuOpen: false })
  },

  closeContextMenu: () => {
    set({ contextMenu: null })
  },

  setDesktopIconsVisible: (visible) => {
    set({ desktopIconsVisible: visible })
  },

  setIconSize: (size) => {
    set({ iconSize: size })
  },

  toggleAutoArrange: () => {
    set(s => ({ autoArrange: !s.autoArrange }))
  },

  toggleAlignToGrid: () => {
    set(s => ({ alignToGrid: !s.alignToGrid }))
  },

  sortDesktopIcons: (by) => {
    set(s => {
      const sorted = [...s.desktopIcons].sort((a, b) => {
        if (by === 'name') return a.label.localeCompare(b.label)
        return a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label)
      })
      return { desktopIcons: sorted }
    })
  },

  addDesktopIcon: (kind) => {
    const state = get()
    const kindMeta: Record<'folder' | 'text' | 'shortcut', { baseLabel: string; icon: string; content: string; width?: number; height?: number }> = {
      folder: { baseLabel: 'New Folder', icon: 'folder', content: 'empty-folder' },
      text: { baseLabel: 'New Text Document.txt', icon: 'notepad', content: 'text-file', width: 480, height: 400 },
      shortcut: { baseLabel: 'New Shortcut', icon: 'shortcut', content: 'shortcut-error', width: 380, height: 180 },
    }
    const meta = kindMeta[kind]
    let label = meta.baseLabel
    let n = 2
    while (state.desktopIcons.some(i => i.label === label)) {
      label = kind === 'text' ? `New Text Document (${n}).txt` : `${meta.baseLabel} (${n})`
      n++
    }
    const id = nextIconId(kind)
    const newIcon: DesktopIconItem = {
      id,
      label,
      icon: meta.icon,
      content: kind === 'text' ? `text-file:${id}` : meta.content,
      windowTitle: label,
      windowWidth: meta.width,
      windowHeight: meta.height,
      kind,
      text: kind === 'text' ? '' : undefined,
    }
    set(s => ({ desktopIcons: [...s.desktopIcons, newIcon], renamingIconId: id }))
  },

  renameDesktopIcon: (id, label) => {
    const trimmed = label.trim()
    set(s => ({
      desktopIcons: s.desktopIcons.map(i => i.id === id && trimmed ? { ...i, label: trimmed, windowTitle: i.kind === 'app' ? i.windowTitle : trimmed } : i),
      renamingIconId: null,
    }))
  },

  deleteDesktopIcon: (id) => {
    set(s => ({
      desktopIcons: s.desktopIcons.filter(i => i.id !== id),
      clipboard: s.clipboard?.id === id ? null : s.clipboard,
    }))
    get().closeWindow(id)
  },

  startRenaming: (id) => {
    set({ renamingIconId: id })
  },

  stopRenaming: () => {
    set({ renamingIconId: null })
  },

  copyDesktopIcon: (id) => {
    set({ clipboard: { id, mode: 'copy' } })
  },

  cutDesktopIcon: (id) => {
    set({ clipboard: { id, mode: 'cut' } })
  },

  pasteDesktopIcon: () => {
    const state = get()
    if (!state.clipboard) return
    const source = state.desktopIcons.find(i => i.id === state.clipboard!.id)
    if (!source) {
      set({ clipboard: null })
      return
    }
    if (state.clipboard.mode === 'cut') {
      set({ clipboard: null })
      return
    }
    let label = `Copy of ${source.label}`
    let n = 2
    while (state.desktopIcons.some(i => i.label === label)) {
      label = `Copy of ${source.label} (${n})`
      n++
    }
    const id = nextIconId(source.kind)
    const copy: DesktopIconItem = {
      ...source,
      id,
      label,
      windowTitle: source.kind === 'app' ? source.windowTitle : label,
      content: source.kind === 'text' ? `text-file:${id}` : source.content,
    }
    set(s => ({ desktopIcons: [...s.desktopIcons, copy], clipboard: null }))
  },

  updateIconText: (id, text) => {
    set(s => ({ desktopIcons: s.desktopIcons.map(i => i.id === id ? { ...i, text } : i) }))
  },

  refreshDesktop: () => {
    set(s => ({ desktopRefreshKey: s.desktopRefreshKey + 1 }))
  },
}))