'use client'

import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/game-store'
import { AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react'

interface ReplayFrame {
  ballPos: [number, number, number]
  ballVel: [number, number, number]
  timestamp: number
}

export function VARReplay() {
  const { ballPosition, offsideData, refereeEvent } = useGameStore()
  const [isReplaying, setIsReplaying] = useState(false)
  const [showReplay, setShowReplay] = useState(false)
  const [replayFrames, setReplayFrames] = useState<ReplayFrame[]>([])
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const recordingRef = useRef<ReplayFrame[]>([])

  // Record last 5 seconds of gameplay
  useEffect(() => {
    const interval = setInterval(() => {
      recordingRef.current.push({
        ballPos: ballPosition,
        ballVel: [0, 0, 0],
        timestamp: Date.now(),
      })

      if (recordingRef.current.length > 150) {
        recordingRef.current.shift()
      }
    }, 33) // ~30fps

    return () => clearInterval(interval)
  }, [ballPosition])

  useEffect(() => {
    const handleTrigger = () => {
      setReplayFrames([...recordingRef.current])
      setIsReplaying(true)
      setShowReplay(true)
      setCurrentFrameIndex(0)

      if (refereeEvent === 'goal' && !offsideData) {
        playConfetti()
      }
    }

    window.addEventListener('triggerGoalReplay', handleTrigger)
    return () => window.removeEventListener('triggerGoalReplay', handleTrigger)
  }, [refereeEvent, offsideData])

  // Replay frame progression
  useEffect(() => {
    if (!isReplaying || replayFrames.length === 0) return

    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        if (prev >= replayFrames.length - 1) {
          setIsReplaying(false)
          return prev
        }
        return prev + 1
      })
    }, 33)

    return () => clearInterval(interval)
  }, [isReplaying, replayFrames])

  const playConfetti = () => {
    if (typeof document === 'undefined') return
    const canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '100'
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')!
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      color: string
    }> = []

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 5,
        color: ['#FFD700', '#FFA500', '#FF4500', '#00BFFF'][Math.floor(Math.random() * 4)],
      })
    }

    const animateConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.2
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, 4, 4)
      })

      if (particles.some((p) => p.y < canvas.height)) {
        requestAnimationFrame(animateConfetti)
      } else {
        try { document.body.removeChild(canvas) } catch {}
      }
    }

    animateConfetti()
  }

  // Calculate centimeter margin for offside display
  const offsideMarginCm = offsideData
    ? Math.round(Math.abs(offsideData.receiverX - offsideData.defenderX) * 100)
    : 0

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* --- VAR OFFSIDE CALIBRATION STUDIO OVERLAY --- */}
      {showReplay && offsideData && (
        <div className="fixed inset-0 bg-slate-950/85 pointer-events-auto flex flex-col items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-3xl w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl text-white space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 animate-pulse" />
                <div>
                  <h2 className="text-2xl font-black uppercase text-amber-400 tracking-widest">VAR Studio Verification</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Law 11 Offside Line Calibration</p>
                </div>
              </div>
              <div className="px-4 py-1.5 bg-rose-600/20 border border-rose-500 rounded-full text-rose-400 font-black text-xs uppercase tracking-wider">
                Decision: OFFSIDE CONFIRMED
              </div>
            </div>

            {/* Simulated Calibration Pitch Geometry */}
            <div className="relative w-full h-64 bg-emerald-950 rounded-2xl overflow-hidden border border-emerald-800/80 flex items-center justify-center shadow-inner">
              {/* Pitch turf lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#022c22_50%,#047857_50%)] bg-[length:40px_100%] opacity-40" />
              
              {/* Ball position marker */}
              <div 
                className="absolute w-4 h-4 rounded-full bg-yellow-400 shadow-lg transform -translate-x-1/2 z-30" 
                style={{ left: '35%' }}
                title="Ball release coordinates"
              />

              {/* Blue Defensive Offside Calibration Line */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_#3b82f6] z-20 flex flex-col justify-between items-center py-2"
                style={{ left: '55%' }}
              >
                <span className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">DEFENDER LINE</span>
              </div>

              {/* Red Attacker Offside Calibration Line */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-rose-500 shadow-[0_0_12px_#f43f5e] z-30 flex flex-col justify-between items-center py-2"
                style={{ left: '62%' }}
              >
                <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">ATTACKER (+{offsideMarginCm} CM)</span>
              </div>

              {/* Connecting Measurement Arrow */}
              <div className="absolute left-[55%] w-[7%] h-0.5 bg-yellow-400 top-1/2 z-40 flex items-center justify-center">
                <span className="bg-black/90 text-yellow-400 text-xs font-mono font-bold px-1.5 py-0.5 rounded border border-yellow-400/50">
                  {offsideMarginCm} cm
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-lime-400" />
                <span>Virtual offside lines calibrated to second-last defending opponent. Play resumes via indirect free-kick.</span>
              </div>
              <button
                onClick={() => setShowReplay(false)}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black uppercase tracking-wider transition shadow-lg"
              >
                Resume Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Goal Broadcast Replay */}
      {showReplay && !offsideData && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t-4 border-yellow-500 p-4 pointer-events-auto">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <div className="flex justify-between text-white text-sm mb-2">
                  <span className="font-bold text-lime-400 uppercase tracking-wider">⚽ GOAL! VAR REPLAY VERIFIED</span>
                  <span className="text-gray-400">
                    {currentFrameIndex} / {replayFrames.length} frames
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded h-2">
                  <div
                    className="h-2 bg-yellow-500 rounded transition-all"
                    style={{ width: `${(currentFrameIndex / (replayFrames.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => setShowReplay(false)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition uppercase font-bold text-xs"
              >
                Close Replay
              </button>
            </div>
          </div>
        </div>
      )}

      {isReplaying && !offsideData && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl animate-pulse mb-4">⚽</div>
            <div className="text-6xl font-black text-yellow-400 animate-bounce tracking-tight drop-shadow-2xl">SUPERSTAR GOAL!</div>
            <div className="text-2xl text-white mt-4 font-bold tracking-widest uppercase">What an incredible strike!</div>
          </div>
        </div>
      )}
    </div>
  )
}

export const triggerVARReplay = () => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('triggerGoalReplay')
    window.dispatchEvent(event)
  }
}
