'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { HomeDashboard } from './home-dashboard'
import { MatchHUD } from './match-hud'

// Dynamically load 3D GameScene without SSR for Vercel Cloud Serverless compatibility
const GameScene = dynamic(() => import('./game-scene').then(m => m.GameScene), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white z-20 space-y-4">
      <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      <div className="font-extrabold text-base tracking-widest uppercase text-sky-400">Loading Showcase 3D Arena...</div>
    </div>
  )
})

export function AppShowcase() {
  const [view, setView] = useState<'home' | 'game'>('home')
  const [matchTime, setMatchTime] = useState(0)

  React.useEffect(() => {
    if (view !== 'game') return

    const interval = setInterval(() => {
      setMatchTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [view])

  if (view === 'home') {
    return <HomeDashboard onPlayClick={() => setView('game')} />
  }

  return (
    <div className="relative w-full h-screen bg-slate-950">
      <GameScene />
      <MatchHUD matchTime={matchTime} />
      <button
        onClick={() => {
          setView('home')
          setMatchTime(0)
        }}
        className="fixed bottom-4 right-4 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl z-50 shadow-xl border border-rose-400"
      >
        Exit Game
      </button>
    </div>
  )
}
