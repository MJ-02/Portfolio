'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

const GRID_SIZE = 20
const CELL_SIZE = 16
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE
const INITIAL_SPEED = 150
const SPEED_INCREMENT = 3
const MIN_SPEED = 60

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = { x: number; y: number }

interface HighScore {
  score: number
  date: string
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [highScores, setHighScores] = useState<HighScore[]>(() => {
    try {
      const saved = localStorage.getItem('xp-snake-highscores')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [speed, setSpeed] = useState(INITIAL_SPEED)

  const snakeRef = useRef<Position[]>([])
  const foodRef = useRef<Position>({ x: 10, y: 10 })
  const directionRef = useRef<Direction>('RIGHT')
  const nextDirectionRef = useRef<Direction>('RIGHT')
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<() => void>(() => {})
  const gameStateRef = useRef(gameState)
  const scoreRef = useRef(0)
  const speedRef = useRef(INITIAL_SPEED)

  // Keep refs in sync
  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { speedRef.current = speed }, [speed])

  const saveHighScore = useCallback((newScore: number) => {
    setHighScores(prev => {
      const updated = [...prev, { score: newScore, date: new Date().toLocaleDateString() }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
      try { localStorage.setItem('xp-snake-highscores', JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
  }, [])

  const generateFood = useCallback((snake: Position[]): Position => {
    let pos: Position
    do {
      pos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) }
    } while (snake.some(s => s.x === pos.x && s.y === pos.y))
    return pos
  }, [])

  const resetGame = useCallback(() => {
    const initialSnake: Position[] = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ]
    snakeRef.current = initialSnake
    foodRef.current = generateFood(initialSnake)
    directionRef.current = 'RIGHT'
    nextDirectionRef.current = 'RIGHT'
    setScore(0)
    setSpeed(INITIAL_SPEED)
  }, [generateFood])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background - dark green XP game style
    ctx.fillStyle = '#2D5A1E'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Border
    ctx.strokeStyle = '#1A3A10'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2)

    // Food - red apple style
    const food = foodRef.current
    const fx = food.x * CELL_SIZE + CELL_SIZE / 2
    const fy = food.y * CELL_SIZE + CELL_SIZE / 2
    // Apple body
    ctx.fillStyle = '#FF3333'
    ctx.beginPath()
    ctx.arc(fx, fy + 1, CELL_SIZE / 2 - 2, 0, Math.PI * 2)
    ctx.fill()
    // Apple highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath()
    ctx.arc(fx - 2, fy - 1, 3, 0, Math.PI * 2)
    ctx.fill()
    // Apple stem
    ctx.strokeStyle = '#5D4037'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(fx, fy - 4)
    ctx.lineTo(fx + 2, fy - 7)
    ctx.stroke()
    // Leaf
    ctx.fillStyle = '#4CAF50'
    ctx.beginPath()
    ctx.ellipse(fx + 4, fy - 6, 3, 1.5, Math.PI / 4, 0, Math.PI * 2)
    ctx.fill()

    // Snake
    const snake = snakeRef.current
    snake.forEach((segment, index) => {
      const sx = segment.x * CELL_SIZE
      const sy = segment.y * CELL_SIZE
      const pad = 1

      if (index === 0) {
        // Head - brighter green with 3D effect
        ctx.fillStyle = '#66FF66'
        ctx.fillRect(sx + pad, sy + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2)
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.fillRect(sx + pad + 1, sy + pad + 1, CELL_SIZE - pad * 2 - 3, (CELL_SIZE - pad * 2) / 2 - 1)

        // Eyes
        const dir = directionRef.current
        ctx.fillStyle = '#1A3A10'
        if (dir === 'RIGHT' || dir === 'LEFT') {
          const ex = dir === 'RIGHT' ? sx + 10 : sx + 3
          ctx.fillRect(ex, sy + 4, 2.5, 2.5)
          ctx.fillRect(ex, sy + 10, 2.5, 2.5)
        } else {
          const ey = dir === 'DOWN' ? sy + 10 : sy + 3
          ctx.fillRect(sx + 4, ey, 2.5, 2.5)
          ctx.fillRect(sx + 10, ey, 2.5, 2.5)
        }
      } else {
        // Body - gradient from bright to darker green
        const t = index / snake.length
        const r = Math.round(30 + (80 - 30) * (1 - t))
        const g = Math.round(200 + (255 - 200) * (1 - t))
        const b = Math.round(30 + (80 - 30) * (1 - t))
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(sx + pad + 0.5, sy + pad + 0.5, CELL_SIZE - pad * 2 - 1, CELL_SIZE - pad * 2 - 1)

        // Subtle scale pattern
        ctx.fillStyle = `rgba(255,255,255,0.08)`
        ctx.fillRect(sx + pad + 2, sy + pad + 2, CELL_SIZE / 2 - 2, CELL_SIZE / 2 - 2)
      }
    })

    // Game over overlay
    if (gameStateRef.current === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 22px Tahoma, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20)

      ctx.font = '14px Tahoma, sans-serif'
      ctx.fillStyle = '#FFD044'
      ctx.fillText(`Score: ${scoreRef.current}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10)

      ctx.font = '11px Tahoma, sans-serif'
      ctx.fillStyle = '#B4C7DC'
      ctx.fillText('Click "New Game" to play again', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 35)
    }

    // Idle / Paused overlay
    if (gameStateRef.current === 'idle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 18px Tahoma, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('SNAKE', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 15)

      ctx.font = '11px Tahoma, sans-serif'
      ctx.fillStyle = '#B4C7DC'
      ctx.fillText('Click "New Game" to start', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10)
      ctx.fillText('Use Arrow Keys to move', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 28)
    }

    if (gameStateRef.current === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 18px Tahoma, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('PAUSED', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 5)

      ctx.font = '11px Tahoma, sans-serif'
      ctx.fillStyle = '#B4C7DC'
      ctx.fillText('Press Space to resume', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 18)
    }
  }, [])

  const tick = useCallback(() => {
    const snake = snakeRef.current
    const head = { ...snake[0] }
    const dir = nextDirectionRef.current
    directionRef.current = dir

    switch (dir) {
      case 'UP': head.y -= 1; break
      case 'DOWN': head.y += 1; break
      case 'LEFT': head.x -= 1; break
      case 'RIGHT': head.x += 1; break
    }

    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      setGameState('gameover')
      saveHighScore(scoreRef.current)
      draw()
      return
    }

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      setGameState('gameover')
      saveHighScore(scoreRef.current)
      draw()
      return
    }

    snake.unshift(head)

    // Food collision
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      const newScore = scoreRef.current + 10
      setScore(newScore)
      foodRef.current = generateFood(snake)
      // Speed up
      const newSpeed = Math.max(MIN_SPEED, INITIAL_SPEED - Math.floor(newScore / 10) * SPEED_INCREMENT)
      setSpeed(newSpeed)
      // Restart loop with new speed
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      gameLoopRef.current = setInterval(tickRef.current, newSpeed)
    } else {
      snake.pop()
    }

    draw()
  }, [draw, generateFood, saveHighScore])

  // Keep tick ref up to date
  useEffect(() => { tickRef.current = tick }, [tick])

  const startGame = useCallback(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    resetGame()
    setGameState('playing')
    draw()
    // Small delay so reset state propagates
    setTimeout(() => {
      gameLoopRef.current = setInterval(tickRef.current, INITIAL_SPEED)
    }, 50)
  }, [resetGame, draw, tick])

  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      setGameState('paused')
      draw()
    } else if (gameStateRef.current === 'paused') {
      setGameState('playing')
      gameLoopRef.current = setInterval(tickRef.current, speedRef.current)
    }
  }, [tick, draw])

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing' && gameStateRef.current !== 'paused') return

      const dir = directionRef.current

      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        togglePause()
        return
      }

      if (gameStateRef.current !== 'playing') return

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          if (dir !== 'DOWN') nextDirectionRef.current = 'UP'
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          if (dir !== 'UP') nextDirectionRef.current = 'DOWN'
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          if (dir !== 'RIGHT') nextDirectionRef.current = 'LEFT'
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          if (dir !== 'LEFT') nextDirectionRef.current = 'RIGHT'
          break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [togglePause])

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [])

  // Initial draw - use refs to avoid triggering on every draw/resetGame change
  const initialDrawRef = useRef(false)
  if (!initialDrawRef.current && canvasRef.current) {
    initialDrawRef.current = true
    snakeRef.current = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ]
    foodRef.current = (() => {
      const snake = snakeRef.current
      let pos: Position
      do {
        pos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) }
      } while (snake.some(s => s.x === pos.x && s.y === pos.y))
      return pos
    })()
    const ctx = canvasRef.current.getContext('2d')
    if (ctx) {
      // Background
      ctx.fillStyle = '#2D5A1E'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      // Idle overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 18px Tahoma, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('SNAKE', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 15)
      ctx.font = '11px Tahoma, sans-serif'
      ctx.fillStyle = '#B4C7DC'
      ctx.fillText('Click "New Game" to start', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10)
      ctx.fillText('Use Arrow Keys to move', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 28)
    }
  }

  return (
    <div className="xp-snake-game">
      <div className="xp-snake-layout">
        <div className="xp-snake-canvas-area">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="xp-snake-canvas"
          />
        </div>

        <div className="xp-snake-sidebar">
          {/* Score */}
          <div className="xp-snake-score-panel">
            <div className="xp-snake-score-label">Score</div>
            <div className="xp-snake-score-value">{score}</div>
          </div>

          {/* Speed */}
          <div className="xp-snake-score-panel">
            <div className="xp-snake-score-label">Speed</div>
            <div className="xp-snake-score-value xp-snake-speed">
              {Math.round((1 - (speed - MIN_SPEED) / (INITIAL_SPEED - MIN_SPEED)) * 100)}%
            </div>
          </div>

          {/* Buttons */}
          <button className="xp-snake-btn xp-snake-btn-new" onClick={startGame}>
            <span className="xp-snake-btn-icon">&#9654;</span> New Game
          </button>
          {gameState === 'playing' && (
            <button className="xp-snake-btn xp-snake-btn-pause" onClick={togglePause}>
              <span className="xp-snake-btn-icon">&#10074;&#10074;</span> Pause
            </button>
          )}
          {gameState === 'paused' && (
            <button className="xp-snake-btn xp-snake-btn-pause" onClick={togglePause}>
              <span className="xp-snake-btn-icon">&#9654;</span> Resume
            </button>
          )}

          {/* Controls Help */}
          <div className="xp-snake-help">
            <div className="xp-snake-help-title">Controls</div>
            <div className="xp-snake-help-row"><kbd>Arrow Keys</kbd> Move</div>
            <div className="xp-snake-help-row"><kbd>Space</kbd> Pause</div>
            <div className="xp-snake-help-row"><kbd>W/A/S/D</kbd> Move</div>
          </div>

          {/* High Scores */}
          {highScores.length > 0 && (
            <div className="xp-snake-highscores">
              <div className="xp-snake-help-title">High Scores</div>
              {highScores.map((hs, i) => (
                <div key={i} className="xp-snake-hs-row">
                  <span className="xp-snake-hs-rank">#{i + 1}</span>
                  <span className="xp-snake-hs-score">{hs.score}</span>
                  <span className="xp-snake-hs-date">{hs.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}