'use client'

import React, { useEffect, useRef } from 'react'
import { useXPStore } from '@/store/xp-store'
import { XPAppIcon } from './XPWindow'
import { assetPath } from '@/lib/base-path'

export default function XPTaskbar() {
  const { windows, activeWindowId, toggleStartMenu, startMenuOpen, clock, updateClock, focusWindow, minimizeWindow } = useXPStore()
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    updateClock()
    clockRef.current = setInterval(updateClock, 10000)
    return () => {
      if (clockRef.current) clearInterval(clockRef.current)
    }
  }, [updateClock])

  // Get current date
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="xp-taskbar">
      {/* Start Button */}
      <button className="xp-start-btn" onClick={toggleStartMenu}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath('/images/icons/windows-logo.webp')} alt="" width={18} height={18} draggable={false} />
        <span className="xp-start-text">start</span>
      </button>

      {/* Quick Launch separator */}
      <div className="xp-taskbar-separator" />

      {/* Window Buttons */}
      <div className="xp-taskbar-windows">
        {windows.map(win => (
          <button
            key={win.id}
            className={`xp-taskbar-window-btn ${activeWindowId === win.id && !win.minimized ? 'xp-taskbar-btn-active' : 'xp-taskbar-btn-inactive'}`}
            onClick={() => {
              if (win.minimized) {
                focusWindow(win.id)
              } else if (activeWindowId === win.id) {
                minimizeWindow(win.id)
              } else {
                focusWindow(win.id)
              }
            }}
          >
            <XPAppIcon icon={win.icon} size={16} />
            <span className="xp-taskbar-window-title">{win.title}</span>
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className="xp-system-tray">
        <div className="xp-tray-icons">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
            <path d="M3 12L7 6L11 9L13 7" stroke="#0054E3" strokeWidth="1.2" fill="none"/>
            <rect x="1" y="12" width="3" height="2" fill="#5B9BD5" rx="0.5"/>
            <rect x="5" y="11" width="3" height="3" fill="#5B9BD5" rx="0.5"/>
            <rect x="9" y="10" width="3" height="4" fill="#5B9BD5" rx="0.5"/>
            <rect x="13" y="8" width="3" height="6" fill="#5B9BD5" rx="0.5"/>
          </svg>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
            <path d="M2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8" stroke="#333" strokeWidth="1.2" fill="none"/>
            <path d="M8 8L5 14H11L8 8Z" fill="#333"/>
          </svg>
        </div>
        <div className="xp-clock">
          <div className="xp-clock-time">{clock}</div>
          <div className="xp-clock-date">{dateStr}</div>
        </div>
      </div>
    </div>
  )
}