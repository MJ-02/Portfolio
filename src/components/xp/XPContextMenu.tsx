'use client'

import React, { useEffect, useRef, useState } from 'react'

export interface ContextMenuItem {
  id: string
  label?: string
  icon?: React.ReactNode
  disabled?: boolean
  separator?: boolean
  bold?: boolean
  submenu?: ContextMenuItem[]
  onClick?: () => void
}

interface XPContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

function MenuList({
  items,
  onClose,
  style,
}: {
  items: ContextMenuItem[]
  onClose: () => void
  style?: React.CSSProperties
}) {
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null)

  return (
    <div className="xp-context-menu" style={style}>
      {items.map(item => {
        if (item.separator) {
          return <div key={item.id} className="xp-context-menu-separator" />
        }

        const hasSubmenu = !!item.submenu?.length

        return (
          <div
            key={item.id}
            className="xp-context-menu-item-wrapper"
            onMouseEnter={() => hasSubmenu && setOpenSubmenuId(item.id)}
            onMouseLeave={() => hasSubmenu && setOpenSubmenuId(null)}
          >
            <button
              className={`xp-context-menu-item ${item.disabled ? 'xp-context-menu-item-disabled' : ''} ${item.bold ? 'xp-context-menu-item-bold' : ''}`}
              disabled={item.disabled}
              onClick={() => {
                if (hasSubmenu) return
                item.onClick?.()
                onClose()
              }}
            >
              <span className="xp-context-menu-item-icon">{item.icon}</span>
              <span className="xp-context-menu-item-label">{item.label}</span>
              {hasSubmenu && <span className="xp-context-menu-item-arrow">▶</span>}
            </button>
            {hasSubmenu && openSubmenuId === item.id && (
              <MenuList
                items={item.submenu!}
                onClose={onClose}
                style={{ position: 'absolute', top: -6, left: '100%' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function XPContextMenu({ x, y, items, onClose }: XPContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let adjX = x
    let adjY = y
    if (x + rect.width > vw) adjX = Math.max(0, vw - rect.width - 4)
    if (y + rect.height > vh) adjY = Math.max(0, vh - rect.height - 4)
    setPos({ x: adjX, y: adjY })
  }, [x, y])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="xp-context-menu-overlay" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }}>
      <div ref={ref} style={{ position: 'absolute', left: pos.x, top: pos.y }} onClick={e => e.stopPropagation()}>
        <MenuList items={items} onClose={onClose} />
      </div>
    </div>
  )
}
