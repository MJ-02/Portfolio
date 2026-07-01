'use client'

import React from 'react'
import { useXPStore } from '@/store/xp-store'
import { desktopIcons } from './XPDesktopIcons'
import { XPAppIcon } from './XPWindow'

export default function XPStartMenu() {
  const { startMenuOpen, openWindow, closeStartMenu, toggleStartMenu } = useXPStore()

  if (!startMenuOpen) return null

  return (
    <div className="xp-start-menu-overlay" onClick={closeStartMenu}>
      <div className="xp-start-menu" onClick={e => e.stopPropagation()}>
        {/* Left Panel */}
        <div className="xp-start-left">
          <div className="xp-start-header">
            <div className="xp-start-user-icon">
              <svg viewBox="0 0 48 48" width="40" height="40">
                <circle cx="24" cy="16" r="10" fill="#5B9BD5"/>
                <ellipse cx="24" cy="40" rx="18" ry="14" fill="#5B9BD5"/>
                <circle cx="24" cy="14" r="9" fill="#6CB4FF"/>
                <ellipse cx="24" cy="38" rx="16" ry="12" fill="#6CB4FF"/>
              </svg>
            </div>
            <span className="xp-start-username">John Doe</span>
          </div>
          <div className="xp-start-items">
            {desktopIcons.map(icon => (
              <button
                key={icon.id}
                className="xp-start-item"
                onClick={() => {
                  openWindow(icon.id, icon.windowTitle, icon.icon, icon.content, icon.windowWidth, icon.windowHeight)
                  closeStartMenu()
                }}
              >
                <XPAppIcon icon={icon.icon} size={28} />
                <span>{icon.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="xp-start-right">
          <button className="xp-start-right-item">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <rect x="3" y="3" width="18" height="14" rx="2" fill="#FFD044" stroke="#C4960C" strokeWidth="1"/>
              <rect x="3" y="5" width="18" height="12" fill="#FFE680"/>
            </svg>
            <span>My Documents</span>
          </button>
          <button className="xp-start-right-item">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" fill="#E8F0FE" stroke="#5B9BD5" strokeWidth="1"/>
              <path d="M7 10L11 7L15 10L19 7" stroke="#5B9BD5" strokeWidth="1.5" fill="none"/>
              <rect x="6" y="13" width="12" height="6" fill="#4DA6FF"/>
            </svg>
            <span>My Pictures</span>
          </button>
          <button className="xp-start-right-item">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <circle cx="12" cy="12" r="9" fill="#E8F0FE" stroke="#5B9BD5" strokeWidth="1"/>
              <text x="12" y="16" textAnchor="middle" fill="#0054E3" fontSize="10" fontWeight="bold">?</text>
            </svg>
            <span>Help and Support</span>
          </button>
          <div className="xp-start-right-separator" />
          <button className="xp-start-right-item">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <circle cx="12" cy="12" r="9" fill="#FF6B6B" stroke="#CC4444" strokeWidth="1"/>
              <circle cx="12" cy="10" r="5" fill="#FFB3B3"/>
              <circle cx="12" cy="10" r="3" fill="#FF6B6B"/>
            </svg>
            <span>Log Off</span>
          </button>
          <button className="xp-start-right-item xp-shutdown-item">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <circle cx="12" cy="12" r="9" fill="#4CAF50" stroke="#2E7D32" strokeWidth="1"/>
              <circle cx="12" cy="12" r="6" fill="#FFF"/>
              <circle cx="12" cy="12" r="3" fill="#4CAF50"/>
            </svg>
            <span>Turn Off Computer</span>
          </button>
        </div>
      </div>
    </div>
  )
}