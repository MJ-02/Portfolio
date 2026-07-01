'use client'

import React from 'react'
import { useXPStore } from '@/store/xp-store'
import { XPAppIcon } from './XPWindow'

interface DesktopIcon {
  id: string
  label: string
  icon: string
  content: string
  windowTitle: string
  windowWidth?: number
  windowHeight?: number
}

const desktopIcons: DesktopIcon[] = [
  { id: 'about', label: 'My Computer', icon: 'computer', content: 'about', windowTitle: 'My Computer - About Me' },
  { id: 'experience', label: 'Internet Explorer', icon: 'ie', content: 'experience', windowTitle: 'Work Experience - Internet Explorer', windowWidth: 650, windowHeight: 480 },
  { id: 'education', label: 'My Pictures', icon: 'photos', content: 'education', windowTitle: 'Education - My Pictures', windowWidth: 580, windowHeight: 480 },
  { id: 'projects', label: 'My Documents', icon: 'folder', content: 'projects', windowTitle: 'Projects - My Documents', windowWidth: 600, windowHeight: 500 },
  { id: 'skills', label: 'Notepad', icon: 'notepad', content: 'skills', windowTitle: 'Skills - Notepad', windowWidth: 550, windowHeight: 480 },
  { id: 'contact', label: 'Outlook Express', icon: 'outlook', content: 'contact', windowTitle: 'Contact - Outlook Express', windowWidth: 560, windowHeight: 440 },
]

export default function XPDesktopIcons() {
  const { openWindow, closeStartMenu } = useXPStore()

  const handleDoubleClick = (icon: DesktopIcon) => {
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

  return (
    <div className="xp-desktop-icons">
      {desktopIcons.map(icon => (
        <button
          key={icon.id}
          className="xp-desktop-icon"
          onDoubleClick={() => handleDoubleClick(icon)}
        >
          <div className="xp-desktop-icon-image">
            <XPAppIcon icon={icon.icon} size={40} />
          </div>
          <span className="xp-desktop-icon-label">{icon.label}</span>
        </button>
      ))}
    </div>
  )
}

export { desktopIcons }