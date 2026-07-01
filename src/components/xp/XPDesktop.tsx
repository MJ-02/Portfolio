'use client'

import React, { useEffect, useCallback } from 'react'
import { useXPStore } from '@/store/xp-store'
import XPDesktopIcons from './XPDesktopIcons'
import XPWindow from './XPWindow'
import XPTaskbar from './XPTaskbar'
import XPStartMenu from './XPStartMenu'

export default function XPDesktop() {
  const { windows, startMenuOpen, closeStartMenu } = useXPStore()

  // Close start menu on desktop click
  const handleDesktopClick = useCallback(() => {
    if (startMenuOpen) closeStartMenu()
  }, [startMenuOpen, closeStartMenu])

  return (
    <div className="xp-desktop" onClick={handleDesktopClick}>
      {/* Bliss-like Wallpaper */}
      <div className="xp-wallpaper" />

      {/* Desktop Icons */}
      <XPDesktopIcons />

      {/* Windows */}
      {windows.map(win => (
        <XPWindow key={win.id} window={win} />
      ))}

      {/* Start Menu */}
      <XPStartMenu />

      {/* Taskbar */}
      <XPTaskbar />
    </div>
  )
}