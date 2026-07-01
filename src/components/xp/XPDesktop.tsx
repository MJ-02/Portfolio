'use client'

import React, { useCallback } from 'react'
import { useXPStore } from '@/store/xp-store'
import XPDesktopIcons from './XPDesktopIcons'
import XPWindow from './XPWindow'
import XPTaskbar from './XPTaskbar'
import XPStartMenu from './XPStartMenu'
import XPContextMenu, { ContextMenuItem } from './XPContextMenu'
import { assetPath } from '@/lib/base-path'

export default function XPDesktop() {
  const {
    windows,
    startMenuOpen,
    closeStartMenu,
    contextMenu,
    openContextMenu,
    closeContextMenu,
    openWindow,
    desktopIconsVisible,
    setDesktopIconsVisible,
    desktopIcons,
    iconSize,
    setIconSize,
    autoArrange,
    alignToGrid,
    toggleAutoArrange,
    toggleAlignToGrid,
    sortDesktopIcons,
    addDesktopIcon,
    startRenaming,
    deleteDesktopIcon,
    copyDesktopIcon,
    cutDesktopIcon,
    pasteDesktopIcon,
    clipboard,
    refreshDesktop,
  } = useXPStore()

  // Close start menu on desktop click
  const handleDesktopClick = useCallback(() => {
    if (startMenuOpen) closeStartMenu()
  }, [startMenuOpen, closeStartMenu])

  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    openContextMenu({ x: e.clientX, y: e.clientY, type: 'desktop' })
  }, [openContextMenu])

  const check = (on: boolean) => (on ? '✓' : undefined)

  const desktopMenuItems: ContextMenuItem[] = [
    {
      id: 'view',
      label: 'View',
      submenu: [
        { id: 'view-large', label: 'Large Icons', icon: check(iconSize === 'large'), onClick: () => setIconSize('large') },
        { id: 'view-classic', label: 'Classic Icons', icon: check(iconSize === 'classic'), onClick: () => setIconSize('classic') },
        { id: 'view-sep', separator: true },
        {
          id: 'view-show-icons',
          label: 'Show Desktop Icons',
          icon: check(desktopIconsVisible),
          onClick: () => setDesktopIconsVisible(!desktopIconsVisible),
        },
      ],
    },
    {
      id: 'arrange',
      label: 'Arrange Icons By',
      submenu: [
        { id: 'arrange-name', label: 'Name', onClick: () => sortDesktopIcons('name') },
        { id: 'arrange-type', label: 'Type', onClick: () => sortDesktopIcons('type') },
        { id: 'arrange-sep', separator: true },
        { id: 'arrange-auto', label: 'Auto Arrange', icon: check(autoArrange), onClick: toggleAutoArrange },
        { id: 'arrange-align', label: 'Align to Grid', icon: check(alignToGrid), onClick: toggleAlignToGrid },
      ],
    },
    { id: 'sep-1', separator: true },
    { id: 'refresh', label: 'Refresh', onClick: refreshDesktop },
    { id: 'sep-2', separator: true },
    { id: 'paste', label: 'Paste', disabled: !clipboard, onClick: pasteDesktopIcon },
    { id: 'paste-shortcut', label: 'Paste Shortcut', disabled: true },
    { id: 'sep-3', separator: true },
    {
      id: 'new',
      label: 'New',
      submenu: [
        { id: 'new-folder', label: 'Folder', onClick: () => addDesktopIcon('folder') },
        { id: 'new-shortcut', label: 'Shortcut', onClick: () => addDesktopIcon('shortcut') },
        { id: 'new-sep', separator: true },
        { id: 'new-text', label: 'Text Document', onClick: () => addDesktopIcon('text') },
      ],
    },
    { id: 'sep-4', separator: true },
    {
      id: 'properties',
      label: 'Properties',
      onClick: () => openWindow('display-properties', 'Display Properties', 'computer', 'display-properties', 480, 420),
    },
  ]

  const activeIcon = contextMenu?.type === 'icon' ? desktopIcons.find(i => i.id === contextMenu.iconId) : null

  const iconMenuItems: ContextMenuItem[] = activeIcon ? [
    {
      id: 'open',
      label: 'Open',
      bold: true,
      onClick: () => openWindow(activeIcon.id, activeIcon.windowTitle, activeIcon.icon, activeIcon.content, activeIcon.windowWidth, activeIcon.windowHeight),
    },
    { id: 'sep-1', separator: true },
    { id: 'cut', label: 'Cut', onClick: () => cutDesktopIcon(activeIcon.id) },
    { id: 'copy', label: 'Copy', onClick: () => copyDesktopIcon(activeIcon.id) },
    {
      id: 'create-shortcut',
      label: 'Create Shortcut',
      disabled: activeIcon.kind === 'shortcut',
      onClick: () => {
        copyDesktopIcon(activeIcon.id)
        pasteDesktopIcon()
      },
    },
    { id: 'delete', label: 'Delete', onClick: () => deleteDesktopIcon(activeIcon.id) },
    { id: 'rename', label: 'Rename', onClick: () => startRenaming(activeIcon.id) },
    { id: 'sep-2', separator: true },
    {
      id: 'properties',
      label: 'Properties',
      onClick: () => openWindow(
        `${activeIcon.id}-properties`,
        `${activeIcon.label} Properties`,
        activeIcon.icon,
        `properties:${activeIcon.kind}`,
        360,
        280
      ),
    },
  ] : []

  return (
    <div className="xp-desktop" onClick={handleDesktopClick} onContextMenu={handleDesktopContextMenu}>
      {/* Bliss-like Wallpaper */}
      <div className="xp-wallpaper" style={{ backgroundImage: `url('${assetPath('/images/bliss.webp')}')` }} />

      {/* Desktop Icons */}
      {desktopIconsVisible && <XPDesktopIcons />}

      {/* Windows */}
      {windows.map(win => (
        <XPWindow key={win.id} window={win} />
      ))}

      {/* Start Menu */}
      <XPStartMenu />

      {/* Taskbar */}
      <XPTaskbar />

      {/* Right-click Context Menu */}
      {contextMenu && contextMenu.type === 'desktop' && (
        <XPContextMenu x={contextMenu.x} y={contextMenu.y} items={desktopMenuItems} onClose={closeContextMenu} />
      )}
      {contextMenu && contextMenu.type === 'icon' && activeIcon && (
        <XPContextMenu x={contextMenu.x} y={contextMenu.y} items={iconMenuItems} onClose={closeContextMenu} />
      )}
    </div>
  )
}
