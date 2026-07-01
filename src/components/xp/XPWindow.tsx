'use client'

import React, { useCallback, useRef, useEffect, useState } from 'react'
import SnakeGame from './SnakeGame'
import { useXPStore, WindowState } from '@/store/xp-store'
import { assetPath } from '@/lib/base-path'

interface XPWindowProps {
  window: WindowState
}

export default function XPWindow({ window: win }: XPWindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
    activeWindowId,
  } = useXPStore()

  const isActive = activeWindowId === win.id
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(null)
  const resizeRef = useRef<{ startX: number; startY: number; winW: number; winH: number } | null>(null)
  const windowRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (win.maximized) return
    e.preventDefault()
    focusWindow(win.id)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      winX: win.x,
      winY: win.y,
    }
  }, [win.id, win.x, win.y, win.maximized, focusWindow])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (win.maximized) return
    e.preventDefault()
    e.stopPropagation()
    focusWindow(win.id)
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      winW: win.width,
      winH: win.height,
    }
  }, [win.id, win.width, win.height, win.maximized, focusWindow])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        const newX = Math.max(0, dragRef.current.winX + dx)
        const newY = Math.max(0, dragRef.current.winY + dy)
        moveWindow(win.id, newX, newY)
      }
      if (resizeRef.current) {
        const dx = e.clientX - resizeRef.current.startX
        const dy = e.clientY - resizeRef.current.startY
        const newW = Math.max(win.minWidth, resizeRef.current.winW + dx)
        const newH = Math.max(win.minHeight, resizeRef.current.winH + dy)
        resizeWindow(win.id, newW, newH)
      }
    }

    const handleMouseUp = () => {
      dragRef.current = null
      resizeRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [win.id, win.minWidth, win.minHeight, moveWindow, resizeWindow])

  if (win.minimized) return null

  const style: React.CSSProperties = win.maximized
    ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 40, zIndex: win.zIndex }
    : { position: 'absolute', top: win.y, left: win.x, width: win.width, height: win.height, zIndex: win.zIndex }

  return (
    <div
      ref={windowRef}
      className={`xp-window ${isActive ? 'xp-window-active' : 'xp-window-inactive'}`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title Bar */}
      <div
        className={`xp-titlebar ${isActive ? 'xp-titlebar-active' : 'xp-titlebar-inactive'}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => win.maximized ? restoreWindow(win.id) : maximizeWindow(win.id)}
      >
        <div className="xp-titlebar-icon">
          <XPAppIcon icon={win.icon} size={16} />
        </div>
        <div className={`xp-titlebar-text ${isActive ? '' : 'xp-titlebar-text-inactive'}`}>
          {win.title}
        </div>
        <div className="xp-titlebar-buttons">
          <button
            className="xp-titlebar-btn xp-btn-minimize"
            onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id) }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <MinimizeIcon />
          </button>
          <button
            className="xp-titlebar-btn xp-btn-maximize"
            onClick={(e) => { e.stopPropagation(); win.maximized ? restoreWindow(win.id) : maximizeWindow(win.id) }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {win.maximized ? <RestoreDownIcon /> : <MaximizeIcon />}
          </button>
          <button
            className="xp-titlebar-btn xp-btn-close"
            onClick={(e) => { e.stopPropagation(); closeWindow(win.id) }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      {win.content !== 'game' && (
        <div className="xp-menubar">
          <span className="xp-menubar-item">File</span>
          <span className="xp-menubar-item">Edit</span>
          <span className="xp-menubar-item">View</span>
          <span className="xp-menubar-item">Help</span>
        </div>
      )}

      {/* Content Area */}
      <div className="xp-window-content">
        <WindowContent content={win.content} win={win} />
      </div>

      {/* Status Bar */}
      <div className="xp-statusbar">
        <span className="xp-statusbar-text">{win.content === 'game' ? 'Use Arrow Keys or WASD to play' : 'Ready'}</span>
      </div>

      {/* Resize Handle */}
      {!win.maximized && (
        <div
          className="xp-resize-handle"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  )
}

// Reusable app icon component
export function XPAppIcon({ icon, size = 32 }: { icon: string; size?: number }) {
  const imageIconMap: Record<string, string> = {
    computer: '/images/icons/pc.png',
    laptop: '/images/icons/laptop.png',
    folder: '/images/icons/folder.png',
    openfolder: '/images/icons/openfolder.png',
    ie: '/images/icons/pc-with-globe.png',
    notepad: '/images/icons/blank-file.png',
    photos: '/images/icons/camera.png',
    outlook: '/images/icons/people.png',
  }

  if (imageIconMap[icon]) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={assetPath(imageIconMap[icon])}
        alt={icon}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'auto' }}
        draggable={false}
      />
    )
  }

  const iconMap: Record<string, JSX.Element> = {
    shortcut: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <rect x="6" y="3" width="20" height="26" rx="1" fill="white" stroke="#7F9DB9" strokeWidth="1"/>
        <rect x="6" y="3" width="20" height="4" fill="#7F9DB9"/>
        <rect x="4" y="20" width="12" height="10" rx="2" fill="#FFE680" stroke="#C4960C" strokeWidth="0.8"/>
        <path d="M8 27L14 21M14 21H9M14 21V26" stroke="#0054E3" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    recycle: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <path d="M8 10L10 27H22L24 10" stroke="#7F9DB9" strokeWidth="1.5" fill="none"/>
        <rect x="6" y="7" width="20" height="3" rx="1" fill="#7F9DB9"/>
        <path d="M12 13V23" stroke="#5B9BD5" strokeWidth="1.5"/>
        <path d="M16 13V23" stroke="#5B9BD5" strokeWidth="1.5"/>
        <path d="M20 13V23" stroke="#5B9BD5" strokeWidth="1.5"/>
        <path d="M13 7V5C13 4.44772 13.4477 4 14 4H18C18.5523 4 19 4.44772 19 5V7" stroke="#7F9DB9" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    cmd: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <rect x="2" y="4" width="28" height="24" rx="2" fill="#1E1E1E" stroke="#666" strokeWidth="1"/>
        <text x="6" y="18" fill="#CCCCCC" fontSize="11" fontFamily="monospace">C:\&gt;_</text>
      </svg>
    ),
    mspaint: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="white" stroke="#7F9DB9" strokeWidth="1"/>
        <path d="M7 20L12 10L17 16L22 8L25 14" stroke="#FF4444" strokeWidth="2" fill="none"/>
        <circle cx="10" cy="22" r="3" fill="#4DA6FF"/>
        <rect x="18" y="18" width="5" height="5" fill="#FFD044"/>
      </svg>
    ),
    media: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <rect x="4" y="8" width="24" height="16" rx="2" fill="#1E1E1E" stroke="#7F9DB9" strokeWidth="1"/>
        <polygon points="14,12 14,22 22,17" fill="#FFFFFF"/>
        <rect x="4" y="8" width="24" height="16" rx="2" fill="none" stroke="#5B9BD5" strokeWidth="1"/>
      </svg>
    ),
    snake: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <rect x="2" y="2" width="28" height="28" rx="3" fill="#2D5A1E" stroke="#1A3A10" strokeWidth="1.5"/>
        <rect x="4" y="4" width="8" height="8" rx="1.5" fill="#66FF66"/>
        <rect x="12" y="4" width="8" height="8" rx="1.5" fill="#4CAF50"/>
        <rect x="12" y="12" width="8" height="8" rx="1.5" fill="#388E3C"/>
        <rect x="20" y="12" width="8" height="8" rx="1.5" fill="#2E7D32"/>
        <circle cx="22" cy="22" r="4" fill="#FF3333"/>
        <circle cx="21" cy="21" r="1.5" fill="rgba(255,255,255,0.4)"/>
      </svg>
    ),
  }

  return iconMap[icon] || iconMap['recycle']
}

// Window Content Components
function WindowContent({ content, win }: { content: string; win: WindowState }) {
  if (content.startsWith('text-file:')) {
    return <TextFileContent iconId={content.slice('text-file:'.length)} />
  }
  if (content.startsWith('properties:')) {
    return <IconPropertiesContent win={win} kind={content.slice('properties:'.length)} />
  }

  switch (content) {
    case 'about': return <AboutContent />
    case 'experience': return <ExperienceContent />
    case 'education': return <EducationContent />
    case 'projects': return <ProjectsContent />
    case 'skills': return <SkillsContent />
    case 'contact': return <ContactContent />
    case 'game': return <SnakeGame />
    case 'display-properties': return <DisplayPropertiesContent />
    case 'empty-folder': return <EmptyFolderContent />
    case 'shortcut-error': return <ShortcutErrorContent />
    default: return <div className="xp-placeholder">Content not found</div>
  }
}

function TextFileContent({ iconId }: { iconId: string }) {
  const { desktopIcons, updateIconText } = useXPStore()
  const icon = desktopIcons.find(i => i.id === iconId)

  return (
    <textarea
      className="xp-notepad-textarea"
      value={icon?.text ?? ''}
      onChange={(e) => updateIconText(iconId, e.target.value)}
      placeholder="Type here..."
      spellCheck={false}
    />
  )
}

function IconPropertiesContent({ win, kind }: { win: WindowState; kind: string }) {
  const typeLabel: Record<string, string> = {
    app: 'Application',
    folder: 'File Folder',
    text: 'Text Document',
    shortcut: 'Shortcut',
  }
  const name = win.title.replace(/ Properties$/, '')

  return (
    <div className="xp-properties-content">
      <div className="xp-properties-header">
        <XPAppIcon icon={win.icon} size={32} />
        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{name}</span>
      </div>
      <div className="xp-properties-row"><span>Type:</span><span>{typeLabel[kind] ?? 'Unknown'}</span></div>
      <div className="xp-properties-row"><span>Location:</span><span>Desktop</span></div>
      <div className="xp-properties-row"><span>Size:</span><span>{kind === 'folder' ? '0 bytes' : '1.00 KB'}</span></div>
      <div className="xp-properties-row"><span>Created:</span><span>Today</span></div>
    </div>
  )
}

function EmptyFolderContent() {
  return (
    <div className="xp-placeholder" style={{ flexDirection: 'column', gap: '8px' }}>
      <XPAppIcon icon="openfolder" size={48} />
      <span>This folder is empty.</span>
    </div>
  )
}

function ShortcutErrorContent() {
  return (
    <div className="xp-shortcut-error">
      <div className="xp-shortcut-error-icon">
        <svg viewBox="0 0 32 32" width="32" height="32">
          <circle cx="16" cy="16" r="15" fill="#FFD700" stroke="#C4960C" strokeWidth="1"/>
          <text x="16" y="23" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#333">!</text>
        </svg>
      </div>
      <p>The item that this shortcut refers to has been changed or moved, so this shortcut will not work properly.</p>
    </div>
  )
}

function DisplayPropertiesContent() {
  const [activeTab, setActiveTab] = useState('desktop')
  const tabs = ['Themes', 'Desktop', 'Screen Saver', 'Appearance', 'Settings']

  return (
    <div className="xp-display-props">
      <div className="xp-display-props-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`xp-display-props-tab ${tab.toLowerCase() === activeTab ? 'xp-display-props-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.toLowerCase())}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="xp-display-props-body">
        {activeTab === 'desktop' ? (
          <>
            <div className="xp-display-props-preview">
              <div className="xp-display-props-monitor">
                <div className="xp-display-props-screen" style={{ backgroundImage: `url('${assetPath('/images/bliss.webp')}')` }} />
              </div>
            </div>
            <div className="xp-display-props-form">
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>Background:</label>
              <div className="xp-display-props-listbox">
                <div className="xp-display-props-list-item xp-display-props-list-item-selected">Bliss</div>
                <div className="xp-display-props-list-item">Azul</div>
                <div className="xp-display-props-list-item">Red Moon Desert</div>
                <div className="xp-display-props-list-item">(None)</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '11px' }}>
                <span>Position:</span>
                <span style={{ fontWeight: 'bold' }}>Stretch</span>
              </div>
            </div>
          </>
        ) : (
          <div className="xp-placeholder" style={{ padding: '30px', fontSize: '12px', color: '#666' }}>
            This tab is just for show — nice try though.
          </div>
        )}
      </div>
      <div className="xp-display-props-footer">
        <button className="xp-btn-ok" disabled>OK</button>
        <button className="xp-btn-ok" disabled>Cancel</button>
        <button className="xp-btn-ok" disabled>Apply</button>
      </div>
    </div>
  )
}

function AboutContent() {
  return (
    <div className="xp-about-content">
      <div className="xp-about-sidebar">
        <div className="xp-about-avatar">
          <div className="xp-about-avatar-placeholder">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="40" r="38" fill="#E8F0FE" stroke="#5B9BD5" strokeWidth="2"/>
              <circle cx="40" cy="30" r="12" fill="#5B9BD5"/>
              <ellipse cx="40" cy="58" rx="20" ry="14" fill="#5B9BD5"/>
            </svg>
          </div>
        </div>
        <h3 style={{ margin: '8px 0 4px', fontSize: '14px', fontWeight: 'bold', color: '#003399' }}>Abdullah Majali</h3>
        <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Full-stack AI/ML Engineer</p>
        <div className="xp-about-details">
          <div className="xp-about-detail-row"><span style={{ fontWeight: 'bold', color: '#333' }}>Location:</span> <span>Amman, Jordan</span></div>
          <div className="xp-about-detail-row"><span style={{ fontWeight: 'bold', color: '#333' }}>Email:</span> <span style={{ color: '#0054E3' }}>majaliabdullah@live.com</span></div>
          <div className="xp-about-detail-row"><span style={{ fontWeight: 'bold', color: '#333' }}>Website:</span> <a href="https://github.com/mj-02" target="_blank" rel="noopener noreferrer" className="xp-link">github.com/mj-02</a></div>
          <div className="xp-about-detail-row"><span style={{ fontWeight: 'bold', color: '#333' }}>Available:</span> <span style={{ color: '#008000' }}>Yes</span></div>
        </div>
      </div>
      <div className="xp-about-main">
        <h2 style={{ margin: '0 0 12px', fontSize: '18px', color: '#003399', borderBottom: '1px solid #B4C7DC', paddingBottom: '6px' }}>About Me</h2>
        <p style={{ margin: '0 0 12px', fontSize: '12px', lineHeight: '1.6', color: '#333' }}>
          Hi, I&apos;m Abdullah — a full-stack AI/Machine Learning engineer building production-grade
          systems around retrieval-augmented generation, document understanding, and applied ML.
          I hold a B.S. in Data Science and AI from Princess Sumaya University for Technology.
        </p>
        <p style={{ margin: '0 0 12px', fontSize: '12px', lineHeight: '1.6', color: '#333' }}>
          I enjoy turning research-y ML ideas into reliable, deployed services — from hybrid
          retrieval pipelines and vision-language document pipelines to fraud-detection models
          in financial compliance systems.
        </p>
        <h3 style={{ margin: '16px 0 8px', fontSize: '14px', color: '#003399' }}>Quick Facts</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', lineHeight: '1.8', color: '#333' }}>
          <li>Full-stack AI/ML Engineer at the Royal Hashemite Court</li>
          <li>Former Data Scientist at Eastnets (financial compliance &amp; AML)</li>
          <li>Published IEEE researcher — graph ML for media bias detection</li>
          <li>B.S. in Data Science and AI, PSUT (2020 – 2024)</li>
          <li>Comfortable across Python, RAG systems, and MLOps tooling</li>
        </ul>
      </div>
    </div>
  )
}

function ExperienceContent() {
  const experiences = [
    {
      company: 'Royal Hashemite Court · Amman, Jordan',
      role: 'Full-stack AI/Machine Learning Engineer',
      period: 'July 2025 - Present',
      items: [
        'Architected and deployed a hybrid Retrieval-Augmented Generation system combining BM25, sparse, and dense vector retrieval using Qdrant for low-latency, high-precision document Q&A at scale',
        'Built production-grade document processing pipelines for PDFs and scanned documents, performing text extraction, normalization, and structured ingestion into MongoDB and PostgreSQL',
        'Integrated Vision-Language Models for scanned document understanding — skew correction, image enhancement, ROI detection, and adaptive-resize retry logic — improving extraction accuracy from 60% to 80% over baseline VLM OCR',
        'Implemented automated data validation and anomaly detection pipelines that enforced business rules and triggered alerts for inconsistencies',
        'Designed interactive analytics dashboards to visualize document processing outputs and system-level metrics',
        'Implemented secure, scalable document storage using an S3-compatible object store (Garage)',
        'Containerized and deployed the full stack with Docker and docker-compose for reproducible on-premise production environments',
      ],
    },
    {
      company: 'Eastnets · Amman, Jordan',
      role: 'Data Scientist',
      period: 'July 2024 - June 2025',
      items: [
        'Developed and deployed ML models within financial compliance and AML systems to support fraud detection, risk scoring, and alert prioritization',
        'Designed risk-based prioritization pipelines that ranked alerts using learned risk factors, improving analyst focus on high-risk cases',
        'Applied model explainability techniques (SHAP, LIME) to support regulatory and audit requirements',
        'Designed and validated models using synthetically generated datasets to stress-test performance on rare-event, edge-case scenarios',
        'Prototyped an LLM-based AI copilot to assist analysts with compliance workflows',
        'Built a FastAPI forecasting service that aggregated historical message volumes from Apache Solr and trained time-series models with health-aware retry mechanisms',
        'Built a FastAPI trade analysis service that used LLMs to extract structured info from shipping descriptions and flag anomalous trade activity',
      ],
    },
  ]

  return (
    <div className="xp-experience-content">
      {experiences.map((exp, i) => (
        <div key={i} className="xp-experience-item">
          <div className="xp-exp-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XPAppIcon icon="laptop" size={28} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#003399' }}>{exp.role}</div>
                <div style={{ fontSize: '12px', color: '#0054E3' }}>{exp.company}</div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap' }}>{exp.period}</div>
          </div>
          <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
            {exp.items.map((item, j) => (
              <li key={j} style={{ fontSize: '11px', lineHeight: '1.7', color: '#333', marginBottom: '2px' }}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function EducationContent() {
  return (
    <div className="xp-education-content">
      <div className="xp-edu-item">
        <div className="xp-edu-icon-wrapper">
          <XPAppIcon icon="photos" size={40} />
        </div>
        <div className="xp-edu-details">
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#003399' }}>B.S. in Data Science and AI</div>
          <div style={{ fontSize: '12px', color: '#0054E3' }}>Princess Sumaya University for Technology, Amman</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Sept 2020 - Aug 2024</div>
        </div>
      </div>
      <div className="xp-edu-item" style={{ marginTop: '16px' }}>
        <div className="xp-edu-icon-wrapper">
          <XPAppIcon icon="notepad" size={40} />
        </div>
        <div className="xp-edu-details">
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#003399' }}>
            BiasLens: Graph Machine Learning Approach for Media Bias Detection
          </div>
          <div style={{ fontSize: '12px', color: '#0054E3' }}>
            2025 International Conference on New Trends in Computing Sciences (ICTCS) - IEEE
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>DOI: 10.1109/ICTCS65341.2025.10989457</div>
          <p style={{ margin: '6px 0 0', fontSize: '11px', lineHeight: '1.6', color: '#333' }}>
            Developed a graph-based machine learning framework to model and detect political bias in
            US news articles using structured knowledge representations and graph learning techniques.
          </p>
        </div>
      </div>
    </div>
  )
}

function ProjectsContent() {
  const projects = [
    {
      name: 'BiasLens',
      desc: 'A knowledge graph-based system for media bias detection. Models entities and relationships with a custom ontology, uses a graph ML pipeline over RDF data and graph embeddings to predict political bias in news articles, and applies GLiNER for named entity recognition to populate the graph. Backed by Apache Jena Fuseki as a scalable triplestore. Published at IEEE ICTCS 2025.',
      tech: ['Python', 'Apache Jena', 'GLiNER', 'Docker'],
      link: 'Sept 2023 - April 2025',
    },
    {
      name: 'Document RAG Platform',
      desc: 'Production hybrid Retrieval-Augmented Generation system combining BM25, sparse, and dense vector retrieval via Qdrant, with VLM-powered scanned document understanding and structured ingestion into MongoDB/PostgreSQL.',
      tech: ['Qdrant', 'FastAPI', 'Docker', 'MongoDB', 'PostgreSQL'],
      link: 'Royal Hashemite Court · July 2025 - Present',
    },
    {
      name: 'AML Risk & Forecasting Suite',
      desc: 'ML models for fraud detection and alert prioritization in financial compliance, plus FastAPI services for time-series demand forecasting and LLM-based trade-anomaly detection.',
      tech: ['PyTorch', 'scikit-learn', 'SHAP', 'FastAPI'],
      link: 'Eastnets · July 2024 - June 2025',
    },
  ]

  return (
    <div className="xp-projects-content">
      {projects.map((proj, i) => (
        <div key={i} className="xp-project-item">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div className="xp-project-icon">
              <XPAppIcon icon="openfolder" size={32} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#003399' }}>{proj.name}</div>
              <p style={{ margin: '4px 0', fontSize: '11px', lineHeight: '1.5', color: '#333' }}>{proj.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {proj.tech.map((t, j) => (
                  <span key={j} className="xp-tech-badge">{t}</span>
                ))}
              </div>
              <div style={{ marginTop: '6px', fontSize: '10px', color: '#0054E3' }}>{proj.link}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillsContent() {
  const categories = [
    {
      name: 'Languages & Frameworks',
      skills: [
        { name: 'Python', level: 95 },
        { name: 'SQL', level: 85 },
        { name: 'FastAPI', level: 92 },
        { name: 'Flask', level: 80 },
      ],
    },
    {
      name: 'Machine Learning',
      skills: [
        { name: 'PyTorch', level: 88 },
        { name: 'scikit-learn', level: 90 },
        { name: 'TensorFlow', level: 75 },
        { name: 'SHAP / LIME', level: 85 },
      ],
    },
    {
      name: 'LLMs & Retrieval',
      skills: [
        { name: 'Qdrant', level: 90 },
        { name: 'vLLM', level: 80 },
        { name: 'llama.cpp / Ollama', level: 82 },
      ],
    },
    {
      name: 'Data & Infra',
      skills: [
        { name: 'Docker', level: 88 },
        { name: 'MongoDB', level: 85 },
        { name: 'PostgreSQL', level: 85 },
        { name: 'S3-compatible Storage', level: 78 },
      ],
    },
    {
      name: 'Dev Tools',
      skills: [
        { name: 'Git', level: 92 },
        { name: 'WSL2', level: 85 },
        { name: 'VSCode / Cursor', level: 95 },
      ],
    },
  ]

  return (
    <div className="xp-skills-content">
      {categories.map((cat, i) => (
        <div key={i} className="xp-skill-category">
          <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 'bold', color: '#003399', borderBottom: '1px solid #B4C7DC', paddingBottom: '4px' }}>
            {cat.name}
          </h4>
          {cat.skills.map((skill, j) => (
            <div key={j} className="xp-skill-row">
              <div className="xp-skill-name">{skill.name}</div>
              <div className="xp-skill-bar-bg">
                <div
                  className="xp-skill-bar-fill"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
              <div className="xp-skill-level">{skill.level}%</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function ContactContent() {
  return (
    <div className="xp-contact-content">
      <div className="xp-contact-info">
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#003399', marginBottom: '12px' }}>Get in Touch</div>
        <p style={{ margin: '0 0 16px', fontSize: '12px', lineHeight: '1.6', color: '#333' }}>
          I&apos;m always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
          Feel free to reach out through any of the channels below!
        </p>
        <div className="xp-contact-row">
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#333', minWidth: '70px' }}>Email:</span>
          <a href="mailto:majaliabdullah@live.com" className="xp-link">majaliabdullah@live.com</a>
        </div>
        <div className="xp-contact-row">
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#333', minWidth: '70px' }}>Phone:</span>
          <span style={{ fontSize: '11px', color: '#333' }}>+962 77 268 5570</span>
        </div>
        <div className="xp-contact-row">
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#333', minWidth: '70px' }}>LinkedIn:</span>
          <a href="https://linkedin.com/in/abdullah-majali" target="_blank" rel="noopener noreferrer" className="xp-link">linkedin.com/in/abdullah-majali</a>
        </div>
        <div className="xp-contact-row">
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#333', minWidth: '70px' }}>GitHub:</span>
          <a href="https://github.com/mj-02" target="_blank" rel="noopener noreferrer" className="xp-link">github.com/mj-02</a>
        </div>
        <div className="xp-contact-row">
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#333', minWidth: '70px' }}>Location:</span>
          <span style={{ fontSize: '11px', color: '#333' }}>Amman, Jordan</span>
        </div>
      </div>
      <div className="xp-contact-form-area">
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#003399', marginBottom: '10px' }}>Send a Message</div>
        <div className="xp-form-field">
          <label style={{ fontSize: '11px', color: '#333', display: 'block', marginBottom: '3px' }}>Name:</label>
          <input className="xp-input" placeholder="Your name" />
        </div>
        <div className="xp-form-field">
          <label style={{ fontSize: '11px', color: '#333', display: 'block', marginBottom: '3px' }}>Email:</label>
          <input className="xp-input" placeholder="your@email.com" />
        </div>
        <div className="xp-form-field">
          <label style={{ fontSize: '11px', color: '#333', display: 'block', marginBottom: '3px' }}>Message:</label>
          <textarea className="xp-textarea" rows={4} placeholder="Type your message here..." />
        </div>
        <button className="xp-send-btn">Send Message</button>
      </div>
    </div>
  )
}

// Title bar control icons
function MinimizeIcon() {
  return (
    <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
      <rect x="0" y="6" width="6" height="1" fill="#1B3B6F"/>
    </svg>
  )
}

function MaximizeIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <rect x="0" y="0" width="8" height="8" rx="1" fill="#1B3B6F" stroke="#082463" strokeWidth="0.5"/>
      <rect x="1.5" y="1.5" width="5" height="5" fill="#3A8CF2"/>
    </svg>
  )
}

function RestoreDownIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <rect x="2" y="2" width="6" height="6" rx="0.5" fill="#1B3B6F" stroke="#082463" strokeWidth="0.5"/>
      <rect x="0" y="0" width="6" height="6" rx="1" fill="#3A8CF2" stroke="#082463" strokeWidth="0.5"/>
      <rect x="1" y="1" width="4" height="4" rx="0.5" fill="#6CB4FF"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <line x1="0.5" y1="0.5" x2="7.5" y2="7.5" stroke="#FFF" strokeWidth="1.2"/>
      <line x1="7.5" y1="0.5" x2="0.5" y2="7.5" stroke="#FFF" strokeWidth="1.2"/>
    </svg>
  )
}