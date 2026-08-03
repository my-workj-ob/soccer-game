'use client'

import React, { useState } from 'react'
import { HomeDashboard } from './home-dashboard'
import { GameScene } from './game-scene'
import { MatchHUD } from './match-hud'

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
    <div className="relative w-full h-screen">
      <GameScene />
      <MatchHUD matchTime={matchTime} />
      <button
        onClick={() => {
          setView('home')
          setMatchTime(0)
        }}
        className="fixed bottom-4 right-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg z-50"
      >
        Exit Game
      </button>
    </div>
  )
}
