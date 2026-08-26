"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Gamepad2, Pause, Play, RotateCcw, Trophy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Cell = string | null
type Piece = { shape: number[][]; color: string }
type Score = { name: string; score: number }

const BOARD_W = 10
const BOARD_H = 18
const PIECES: Piece[] = [
  { shape: [[1, 1, 1, 1]], color: "bg-info" },
  { shape: [[1, 1], [1, 1]], color: "bg-warning" },
  { shape: [[0, 1, 0], [1, 1, 1]], color: "bg-brand" },
  { shape: [[1, 0, 0], [1, 1, 1]], color: "bg-success" },
  { shape: [[0, 0, 1], [1, 1, 1]], color: "bg-danger" },
  { shape: [[0, 1, 1], [1, 1, 0]], color: "bg-chart-2" },
  { shape: [[1, 1, 0], [0, 1, 1]], color: "bg-chart-4" },
]
const emptyBoard = (): Cell[][] => Array.from({ length: BOARD_H }, () => Array<Cell>(BOARD_W).fill(null))
const rotate = (shape: number[][]) => shape[0].map((_, i) => shape.map((row) => row[i]).reverse())
const randomPiece = () => PIECES[Math.floor(Math.random() * PIECES.length)]

function collides(board: Cell[][], piece: Piece, x: number, y: number) {
  return piece.shape.some((row, dy) => row.some((filled, dx) => filled && (x + dx < 0 || x + dx >= BOARD_W || y + dy >= BOARD_H || (y + dy >= 0 && board[y + dy][x + dx]))) )
}

function merge(board: Cell[][], piece: Piece, x: number, y: number) {
  const next = board.map((row) => [...row])
  piece.shape.forEach((row, dy) => row.forEach((filled, dx) => { if (filled && y + dy >= 0) next[y + dy][x + dx] = piece.color }))
  return next
}

function clearLines(board: Cell[][]) {
  const kept = board.filter((row) => row.some((cell) => !cell))
  const cleared = BOARD_H - kept.length
  return { board: [...Array.from({ length: cleared }, () => Array<Cell>(BOARD_W).fill(null)), ...kept], cleared }
}

export function TetrisGame() {
  const [open, setOpen] = useState(false)
  const [board, setBoard] = useState(emptyBoard)
  const [piece, setPiece] = useState(randomPiece)
  const [x, setX] = useState(3)
  const [y, setY] = useState(-1)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [paused, setPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [leaderboard, setLeaderboard] = useState<Score[]>([
    { name: "M. Santos", score: 1280 }, { name: "J. Cruz", score: 940 }, { name: "A. Reyes", score: 720 },
  ])

  const level = Math.floor(lines / 5) + 1
  const speed = Math.max(140, 650 - (level - 1) * 65)
  const displayBoard = useMemo(() => merge(board, piece, x, y), [board, piece, x, y])

  const reset = useCallback(() => {
    setBoard(emptyBoard()); setPiece(randomPiece()); setX(3); setY(-1); setScore(0); setLines(0); setPaused(false); setGameOver(false)
  }, [])

  const lock = useCallback(() => {
    const merged = merge(board, piece, x, y)
    const result = clearLines(merged)
    const nextPiece = randomPiece()
    setBoard(result.board); setPiece(nextPiece); setX(3); setY(-1); setLines((value) => value + result.cleared); setScore((value) => value + [0, 100, 300, 500, 800][result.cleared] * level)
    if (collides(result.board, nextPiece, 3, -1)) setGameOver(true)
  }, [board, piece, x, y, level])

  const move = useCallback((dx: number, dy: number) => {
    if (paused || gameOver) return
    if (!collides(board, piece, x + dx, y + dy)) { setX((value) => value + dx); setY((value) => value + dy) } else if (dy > 0) lock()
  }, [board, piece, x, y, paused, gameOver, lock])

  const turn = useCallback(() => {
    if (paused || gameOver) return
    const next = { ...piece, shape: rotate(piece.shape) }
    if (!collides(board, next, x, y)) setPiece(next)
  }, [board, piece, x, y, paused, gameOver])

  useEffect(() => {
    if (!open || paused || gameOver) return
    const timer = window.setInterval(() => move(0, 1), speed)
    return () => window.clearInterval(timer)
  }, [open, paused, gameOver, speed, move])

  useEffect(() => {
    if (!open) return
    try { const saved = JSON.parse(localStorage.getItem("icpep-tetris-leaderboard") ?? "null"); if (Array.isArray(saved)) setLeaderboard(saved) } catch { /* ignore malformed local data */ }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === "ArrowLeft") move(-1, 0); if (event.key === "ArrowRight") move(1, 0); if (event.key === "ArrowDown") move(0, 1); if (event.key === "ArrowUp") turn(); if (event.key === " ") { event.preventDefault(); setPaused((value) => !value) } }
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey)
  }, [open, move, turn])

  useEffect(() => {
    if (!gameOver || score <= 0) return
    const next = [...leaderboard, { name: "You", score }].sort((a, b) => b.score - a.score).slice(0, 5)
    setLeaderboard(next); localStorage.setItem("icpep-tetris-leaderboard", JSON.stringify(next))
  }, [gameOver, score])

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); reset() }} aria-label="Open Tetris game" title="Play Tetris" className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-card text-brand transition-colors hover:border-brand hover:bg-brand/10">
        <Gamepad2 className="size-4" />
      </button>
      {open && <div role="dialog" aria-modal="true" aria-labelledby="tetris-title" className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><h2 id="tetris-title" className="flex items-center gap-2 text-base font-semibold"><Gamepad2 className="size-4 text-brand" />ICpEP Tetris</h2><p className="text-xs text-muted-foreground">Clear lines. Beat the board.</p></div><Button variant="ghost" size="icon" aria-label="Close Tetris" onClick={() => setOpen(false)}><X /></Button></div>
          <div className="grid gap-5 p-4 md:grid-cols-[minmax(0,1fr)_180px]">
            <div className="flex flex-col items-center gap-3"><div className="grid aspect-[10/18] w-full max-w-[260px] grid-cols-10 gap-px rounded-lg border border-border bg-background p-1">{displayBoard.flatMap((row, rowIndex) => row.map((cell, colIndex) => <span key={`${rowIndex}-${colIndex}`} className={cn("rounded-[2px] bg-muted/20", cell)} />))}</div><div className="flex flex-wrap justify-center gap-2"><Button size="sm" variant="outline" onClick={() => move(-1, 0)} aria-label="Move left">←</Button><Button size="sm" variant="outline" onClick={() => move(0, 1)} aria-label="Drop">↓</Button><Button size="sm" variant="outline" onClick={turn} aria-label="Rotate">↻</Button><Button size="sm" variant="outline" onClick={() => move(1, 0)} aria-label="Move right">→</Button></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setPaused((value) => !value)}>{paused ? <Play data-icon="inline-start" /> : <Pause data-icon="inline-start" />}{paused ? "Resume" : "Pause"}</Button><Button size="sm" variant="outline" onClick={reset}><RotateCcw data-icon="inline-start" />Restart</Button></div></div>
            <aside className="flex flex-col gap-3"><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-md border border-border p-2"><p className="text-[10px] uppercase text-muted-foreground">Score</p><p className="font-mono text-lg font-semibold">{score}</p></div><div className="rounded-md border border-border p-2"><p className="text-[10px] uppercase text-muted-foreground">Lines</p><p className="font-mono text-lg font-semibold">{lines}</p></div><div className="rounded-md border border-border p-2"><p className="text-[10px] uppercase text-muted-foreground">Level</p><p className="font-mono text-lg font-semibold">{level}</p></div></div><div className="rounded-md border border-border p-3"><h3 className="flex items-center gap-2 text-sm font-semibold"><Trophy className="size-4 text-warning-foreground" />Leaderboard</h3><ol className="mt-3 flex flex-col gap-2">{leaderboard.map((entry, index) => <li key={`${entry.name}-${index}`} className="flex items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-2"><span className="font-mono text-muted-foreground">{index + 1}</span><span className="truncate">{entry.name}</span></span><span className="font-mono tabular-nums text-muted-foreground">{entry.score}</span></li>)}</ol></div>{gameOver && <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-center"><p className="text-sm font-semibold text-danger">Game over</p><p className="mt-1 text-xs text-muted-foreground">Restart to play again.</p></div>}<p className="text-center text-[10px] text-muted-foreground">Arrow keys move · Space pauses</p></aside>
          </div>
        </div>
      </div>}
    </>
  )
}
