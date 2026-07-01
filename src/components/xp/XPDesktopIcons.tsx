'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useXPStore, DesktopIconItem, defaultDesktopIcons } from '@/store/xp-store'
import { XPAppIcon } from './XPWindow'

export default function XPDesktopIcons() {
  const {
    desktopIcons,
    openWindow,
    closeStartMenu,
    openContextMenu,
    iconSize,
    renamingIconId,
    renameDesktopIcon,
    stopRenaming,
    clipboard,
    desktopRefreshKey,
  } = useXPStore()

  const handleDoubleClick = (icon: DesktopIconItem) => {
    openWindow(
      icon.id,
      icon.windowTitle,
      icon.icon,
      icon.content,
      icon.windowWidth,
      icon.windowHeight
    )
    closeStartMenu()
  }

  const handleContextMenu = (e: React.MouseEvent, icon: DesktopIconItem) => {
    e.preventDefault()
    e.stopPropagation()
    openContextMenu({ x: e.clientX, y: e.clientY, type: 'icon', iconId: icon.id })
  }

  return (
    <div
      key={desktopRefreshKey}
      className={`xp-desktop-icons xp-desktop-icons-refresh ${iconSize === 'classic' ? 'xp-desktop-icons-classic' : ''}`}
    >
      {desktopIcons.map(icon => (
        <button
          key={icon.id}
          className={`xp-desktop-icon ${clipboard?.id === icon.id && clipboard.mode === 'cut' ? 'xp-desktop-icon-cut' : ''}`}
          onDoubleClick={() => handleDoubleClick(icon)}
          onContextMenu={(e) => handleContextMenu(e, icon)}
        >
          <div className="xp-desktop-icon-image">
            <XPAppIcon icon={icon.icon} size={iconSize === 'classic' ? 28 : 40} />
          </div>
          {renamingIconId === icon.id ? (
            <RenameInput
              initial={icon.label}
              onSubmit={(label) => renameDesktopIcon(icon.id, label)}
              onCancel={stopRenaming}
            />
          ) : (
            <span className="xp-desktop-icon-label">{icon.label}</span>
          )}
        </button>
      ))}
    </div>
  )
}

function RenameInput({ initial, onSubmit, onCancel }: { initial: string; onSubmit: (label: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  return (
    <input
      ref={ref}
      className="xp-desktop-icon-rename-input"
      value={value}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onSubmit(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); onSubmit(value) }
        if (e.key === 'Escape') { e.preventDefault(); onCancel() }
      }}
    />
  )
}

export { defaultDesktopIcons as desktopIcons }
