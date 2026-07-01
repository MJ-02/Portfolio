'use client'

import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useXPStore, WindowState } from '@/store/xp-store'

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
      <div className="xp-menubar">
        <span className="xp-menubar-item">File</span>
        <span className="xp-menubar-item">Edit</span>
        <span className="xp-menubar-item">View</span>
        <span className="xp-menubar-item">Help</span>
      </div>

      {/* Content Area */}
      <div className="xp-window-content">
        <WindowContent content={win.content} />
      </div>

      {/* Status Bar */}
      <div className="xp-statusbar">
        <span className="xp-statusbar-text">Ready</span>
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
  const iconMap: Record<string, JSX.Element> = {
    computer: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <rect x="3" y="4" width="26" height="18" rx="2" fill="#E8F0FE" stroke="#5B9BD5" strokeWidth="1.5"/>
        <rect x="5" y="6" width="22" height="14" rx="1" fill="#0054E3"/>
        <rect x="6" y="7" width="20" height="10" rx="0.5" fill="#4DA6FF"/>
        <rect x="12" y="22" width="8" height="2" fill="#7F9DB9"/>
        <rect x="8" y="24" width="16" height="2" rx="1" fill="#B4C7DC"/>
      </svg>
    ),
    folder: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <path d="M2 7C2 5.89543 2.89543 5 4 5H12L14 8H28C29.1046 8 30 8.89543 30 10V25C30 26.1046 29.1046 27 28 27H4C2.89543 27 2 26.1046 2 25V7Z" fill="#FFD044" stroke="#C4960C" strokeWidth="0.5"/>
        <path d="M2 10H30V25C30 26.1046 29.1046 27 28 27H4C2.89543 27 2 26.1046 2 25V10Z" fill="#FFE680" stroke="#C4960C" strokeWidth="0.5"/>
      </svg>
    ),
    ie: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <circle cx="16" cy="16" r="13" fill="#0078D4"/>
        <ellipse cx="16" cy="16" rx="6" ry="13" stroke="#FFB900" strokeWidth="1.5" fill="none"/>
        <path d="M4 16H28" stroke="#FFB900" strokeWidth="1"/>
        <path d="M6.5 9H25.5" stroke="#FFB900" strokeWidth="0.8"/>
        <path d="M6.5 23H25.5" stroke="#FFB900" strokeWidth="0.8"/>
        <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">e</text>
      </svg>
    ),
    notepad: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <rect x="6" y="3" width="20" height="26" rx="1" fill="white" stroke="#7F9DB9" strokeWidth="1"/>
        <rect x="6" y="3" width="20" height="4" fill="#0078D4"/>
        <line x1="9" y1="11" x2="23" y2="11" stroke="#333" strokeWidth="0.5"/>
        <line x1="9" y1="14" x2="23" y2="14" stroke="#333" strokeWidth="0.5"/>
        <line x1="9" y1="17" x2="20" y2="17" stroke="#333" strokeWidth="0.5"/>
        <line x1="9" y1="20" x2="22" y2="20" stroke="#333" strokeWidth="0.5"/>
        <line x1="9" y1="23" x2="18" y2="23" stroke="#333" strokeWidth="0.5"/>
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
    photos: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <rect x="4" y="6" width="24" height="20" rx="2" fill="#5B9BD5" stroke="#3A6EA5" strokeWidth="1"/>
        <circle cx="12" cy="14" r="3" fill="#FFD044"/>
        <path d="M4 22L10 16L14 20L20 13L28 22V24C28 25.1046 27.1046 26 26 26H6C4.89543 26 4 25.1046 4 24V22Z" fill="#2E8B57" opacity="0.7"/>
      </svg>
    ),
    outlook: (
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <rect x="3" y="6" width="26" height="20" rx="2" fill="white" stroke="#0078D4" strokeWidth="1.5"/>
        <rect x="3" y="6" width="26" height="5" rx="2" fill="#0078D4"/>
        <rect x="3" y="6" width="10" height="20" rx="2" fill="#005A9E"/>
        <rect x="6" y="14" width="4" height="0.5" fill="white" rx="0.25"/>
        <rect x="6" y="16" width="3" height="0.5" fill="#B4C7DC" rx="0.25"/>
        <rect x="6" y="18" width="5" height="0.5" fill="white" rx="0.25"/>
        <rect x="15" y="14" width="11" height="0.5" fill="#333" rx="0.25"/>
        <rect x="15" y="16" width="9" height="0.5" fill="#666" rx="0.25"/>
        <rect x="15" y="18" width="10" height="0.5" fill="#333" rx="0.25"/>
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
  }

  return iconMap[icon] || iconMap['computer']
}

// Window Content Components
function WindowContent({ content }: { content: string }) {
  switch (content) {
    case 'about': return <AboutContent />
    case 'experience': return <ExperienceContent />
    case 'education': return <EducationContent />
    case 'projects': return <ProjectsContent />
    case 'skills': return <SkillsContent />
    case 'contact': return <ContactContent />
    default: return <div className="xp-placeholder">Content not found</div>
  }
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
        <h3 style={{ margin: '8px 0 4px', fontSize: '14px', fontWeight: 'bold', color: '#003399' }}>John Doe</h3>
        <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Full Stack Developer</p>
        <div className="xp-about-details">
          <div className="xp-about-detail-row"><span style={{ fontWeight: 'bold', color: '#333' }}>Location:</span> <span>San Francisco, CA</span></div>
          <div className="xp-about-detail-row"><span style={{ fontWeight: 'bold', color: '#333' }}>Email:</span> <span style={{ color: '#0054E3' }}>john@example.com</span></div>
          <div className="xp-about-detail-row"><span style={{ fontWeight: 'bold', color: '#333' }}>Website:</span> <span style={{ color: '#0054E3' }}>johndoe.dev</span></div>
          <div className="xp-about-detail-row"><span style={{ fontWeight: 'bold', color: '#333' }}>Available:</span> <span style={{ color: '#008000' }}>Yes</span></div>
        </div>
      </div>
      <div className="xp-about-main">
        <h2 style={{ margin: '0 0 12px', fontSize: '18px', color: '#003399', borderBottom: '1px solid #B4C7DC', paddingBottom: '6px' }}>About Me</h2>
        <p style={{ margin: '0 0 12px', fontSize: '12px', lineHeight: '1.6', color: '#333' }}>
          Hello! I&apos;m a passionate full-stack developer with over 5 years of experience building
          modern web applications. I specialize in React, Next.js, TypeScript, and Node.js,
          with a strong foundation in both frontend and backend development.
        </p>
        <p style={{ margin: '0 0 12px', fontSize: '12px', lineHeight: '1.6', color: '#333' }}>
          I love turning complex problems into simple, beautiful, and intuitive solutions.
          When I&apos;m not coding, you&apos;ll find me exploring new technologies, contributing to
          open-source projects, or enjoying a good cup of coffee.
        </p>
        <h3 style={{ margin: '16px 0 8px', fontSize: '14px', color: '#003399' }}>Quick Facts</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', lineHeight: '1.8', color: '#333' }}>
          <li>5+ years of professional experience</li>
          <li>Built 20+ production applications</li>
          <li>Open-source contributor &amp; maintainer</li>
          <li>Fluent in English and Spanish</li>
          <li>Computer Science B.S. from UC Berkeley</li>
        </ul>
      </div>
    </div>
  )
}

function ExperienceContent() {
  const experiences = [
    {
      company: 'TechCorp Inc.',
      role: 'Senior Full Stack Developer',
      period: 'Jan 2023 - Present',
      items: [
        'Led development of a microservices platform serving 2M+ users',
        'Architected real-time notification system using WebSockets',
        'Mentored 5 junior developers and conducted code reviews',
        'Reduced API response times by 40% through optimization',
      ],
    },
    {
      company: 'StartupXYZ',
      role: 'Full Stack Developer',
      period: 'Mar 2021 - Dec 2022',
      items: [
        'Built customer-facing dashboard from scratch using React and TypeScript',
        'Implemented CI/CD pipelines reducing deployment time by 60%',
        'Developed RESTful APIs with Node.js and PostgreSQL',
        'Collaborated with design team to implement pixel-perfect UIs',
      ],
    },
    {
      company: 'WebAgency Co.',
      role: 'Junior Developer',
      period: 'Jun 2019 - Feb 2021',
      items: [
        'Developed responsive websites for 15+ clients across various industries',
        'Built WordPress themes and plugins for e-commerce sites',
        'Participated in agile sprints and daily standups',
        'Maintained and updated legacy codebases',
      ],
    },
  ]

  return (
    <div className="xp-experience-content">
      {experiences.map((exp, i) => (
        <div key={i} className="xp-experience-item">
          <div className="xp-exp-header">
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#003399' }}>{exp.role}</div>
              <div style={{ fontSize: '12px', color: '#0054E3' }}>{exp.company}</div>
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
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#003399' }}>B.S. Computer Science</div>
          <div style={{ fontSize: '12px', color: '#0054E3' }}>University of California, Berkeley</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>2015 - 2019 | GPA: 3.8/4.0</div>
          <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
            <li style={{ fontSize: '11px', lineHeight: '1.6', color: '#333' }}>Dean&apos;s List all semesters</li>
            <li style={{ fontSize: '11px', lineHeight: '1.6', color: '#333' }}>Relevant coursework: Data Structures, Algorithms, Machine Learning, Database Systems, Operating Systems</li>
            <li style={{ fontSize: '11px', lineHeight: '1.6', color: '#333' }}>Senior thesis: &quot;Optimizing Real-Time Collaborative Editing Systems&quot;</li>
          </ul>
        </div>
      </div>
      <div className="xp-edu-item" style={{ marginTop: '16px' }}>
        <div className="xp-edu-icon-wrapper">
          <XPAppIcon icon="folder" size={40} />
        </div>
        <div className="xp-edu-details">
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#003399' }}>AWS Solutions Architect Associate</div>
          <div style={{ fontSize: '12px', color: '#0054E3' }}>Amazon Web Services</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Certified - 2022</div>
          <p style={{ margin: '6px 0 0', fontSize: '11px', lineHeight: '1.6', color: '#333' }}>
            Demonstrated proficiency in designing distributed systems on AWS, including EC2, S3, Lambda, DynamoDB, and CloudFormation.
          </p>
        </div>
      </div>
      <div className="xp-edu-item" style={{ marginTop: '16px' }}>
        <div className="xp-edu-icon-wrapper">
          <XPAppIcon icon="notepad" size={40} />
        </div>
        <div className="xp-edu-details">
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#003399' }}>Meta Front-End Developer Certificate</div>
          <div style={{ fontSize: '12px', color: '#0054E3' }}>Coursera / Meta</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Completed - 2021</div>
          <p style={{ margin: '6px 0 0', fontSize: '11px', lineHeight: '1.6', color: '#333' }}>
            9-course program covering React, responsive design, version control, and JavaScript fundamentals.
          </p>
        </div>
      </div>
    </div>
  )
}

function ProjectsContent() {
  const projects = [
    {
      name: 'CloudSync Pro',
      desc: 'A real-time collaborative workspace platform with live editing, video conferencing, and project management features. Built with Next.js, Socket.io, and WebRTC.',
      tech: ['Next.js', 'Socket.io', 'PostgreSQL', 'Redis', 'Docker'],
      link: 'github.com/johndoe/cloudsync',
    },
    {
      name: 'DataViz Studio',
      desc: 'An interactive data visualization tool that transforms complex datasets into beautiful, shareable charts and dashboards with drag-and-drop functionality.',
      tech: ['React', 'D3.js', 'Node.js', 'MongoDB'],
      link: 'github.com/johndoe/dataviz',
    },
    {
      name: 'TaskFlow AI',
      desc: 'An AI-powered task management app that automatically prioritizes tasks, estimates completion times, and suggests optimal scheduling.',
      tech: ['TypeScript', 'OpenAI API', 'Express', 'React', 'Prisma'],
      link: 'github.com/johndoe/taskflow',
    },
    {
      name: 'EcoTrack',
      desc: 'A carbon footprint tracking mobile app that gamifies sustainable living with challenges, rewards, and community features.',
      tech: ['React Native', 'Firebase', 'Node.js', 'Chart.js'],
      link: 'github.com/johndoe/ecotrack',
    },
  ]

  return (
    <div className="xp-projects-content">
      {projects.map((proj, i) => (
        <div key={i} className="xp-project-item">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div className="xp-project-icon">
              <XPAppIcon icon="folder" size={32} />
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
      name: 'Frontend',
      skills: [
        { name: 'React / Next.js', level: 95 },
        { name: 'TypeScript', level: 90 },
        { name: 'Tailwind CSS', level: 92 },
        { name: 'HTML / CSS', level: 95 },
        { name: 'Vue.js', level: 70 },
      ],
    },
    {
      name: 'Backend',
      skills: [
        { name: 'Node.js / Express', level: 88 },
        { name: 'Python / Django', level: 75 },
        { name: 'PostgreSQL', level: 85 },
        { name: 'MongoDB', level: 80 },
        { name: 'REST / GraphQL', level: 87 },
      ],
    },
    {
      name: 'DevOps & Tools',
      skills: [
        { name: 'Docker / K8s', level: 78 },
        { name: 'AWS / GCP', level: 82 },
        { name: 'CI/CD Pipelines', level: 85 },
        { name: 'Git / GitHub', level: 95 },
        { name: 'Linux / Bash', level: 80 },
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
          <span style={{ fontSize: '11px', color: '#0054E3' }}>john.doe@example.com</span>
        </div>
        <div className="xp-contact-row">
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#333', minWidth: '70px' }}>Phone:</span>
          <span style={{ fontSize: '11px', color: '#333' }}>+1 (555) 123-4567</span>
        </div>
        <div className="xp-contact-row">
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#333', minWidth: '70px' }}>LinkedIn:</span>
          <span style={{ fontSize: '11px', color: '#0054E3' }}>linkedin.com/in/johndoe</span>
        </div>
        <div className="xp-contact-row">
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#333', minWidth: '70px' }}>GitHub:</span>
          <span style={{ fontSize: '11px', color: '#0054E3' }}>github.com/johndoe</span>
        </div>
        <div className="xp-contact-row">
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#333', minWidth: '70px' }}>Twitter:</span>
          <span style={{ fontSize: '11px', color: '#0054E3' }}>@johndoe_dev</span>
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