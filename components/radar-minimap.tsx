'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/lib/game-store'

export function RadarMinimap() {
  const [radarData, setRadarData] = useState<{
    ball: [number, number]
    team1: Array<{ id: string; x: number; y: number; isSelected: boolean }>
    team2: Array<{ id: string; x: number; y: number }>
  }>({
    ball: [50, 50],
    team1: [],
    team2: [],
  })

  // Throttled update loop (15 FPS is optimal for 2D tactical radar and frees main thread)
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useGameStore.getState()
      const { ballPosition, playerPositions, team1Players, team2Players, selectedPlayer } = state

      const ballX = Math.min(94, Math.max(6, ((ballPosition[0] + 52.5) / 105) * 100))
      const ballY = Math.min(94, Math.max(6, ((ballPosition[2] + 34) / 68) * 100))

      const t1 = team1Players.map((p, idx) => {
        const pos = playerPositions[p.id] || [-35 + idx * 5, 0, -20 + (idx % 5) * 10]
        return {
          id: p.id,
          x: Math.min(94, Math.max(6, ((pos[0] + 52.5) / 105) * 100)),
          y: Math.min(94, Math.max(6, ((pos[2] + 34) / 68) * 100)),
          isSelected: p.id === selectedPlayer?.id,
        }
      })

      const t2 = team2Players.map((p, idx) => {
        const pos = playerPositions[p.id] || [35 - idx * 5, 0, -20 + (idx % 5) * 10]
        return {
          id: p.id,
          x: Math.min(94, Math.max(6, ((pos[0] + 52.5) / 105) * 100)),
          y: Math.min(94, Math.max(6, ((pos[2] + 34) / 68) * 100)),
        }
      })

      setRadarData({
        ball: [ballX, ballY],
        team1: t1,
        team2: t2,
      })
    }, 66) // ~15 FPS

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="hidden lg:flex flex-col items-center pb-2 pointer-events-auto">
      <div className="w-56 h-32 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-2.5 relative shadow-2xl overflow-hidden">
        <div className="w-full h-full border border-white/20 rounded relative flex items-center justify-center bg-emerald-950/20">
          {/* Halfway line */}
          <div className="absolute h-full w-px bg-white/20" />
          {/* Center circle */}
          <div className="w-10 h-10 rounded-full border border-white/20" />

          {/* Ball */}
          <div
            style={{
              left: `${radarData.ball[0]}%`,
              top: `${radarData.ball[1]}%`,
            }}
            className="absolute w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-lg shadow-yellow-400 ring-2 ring-white/60 animate-pulse transform -translate-x-1/2 -translate-y-1/2 z-30"
          />

          {/* Team 1 Players (Gold/White) */}
          {radarData.team1.map((p) => (
            <div
              key={`t1-${p.id}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className={`absolute w-2.5 h-2.5 rounded-full shadow transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ${
                p.isSelected
                  ? 'bg-amber-400 ring-2 ring-white scale-125 z-20'
                  : 'bg-amber-400 z-10'
              }`}
            />
          ))}

          {/* Team 2 Players (Sky Blue) */}
          {radarData.team2.map((p) => (
            <div
              key={`t2-${p.id}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className="absolute w-2.5 h-2.5 rounded-full bg-sky-400 shadow ring-1 ring-white/30 transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-75"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
