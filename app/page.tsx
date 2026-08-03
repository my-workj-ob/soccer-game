'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { HomeDashboard } from '@/components/home-dashboard'
import { GameMenu } from '@/components/game-menu'
import { GameScene } from '@/components/game-scene'
import { MatchHUD } from '@/components/match-hud'
import { useGameStore } from '@/lib/game-store'

export default function Page() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'home' | 'menu' | 'game'>('home')
  const [gameStarted, setGameStarted] = useState(false)
  const [matchTime, setMatchTime] = useState(0)
  const { resetMatch } = useGameStore()

  // Match timer effect
  useEffect(() => {
    if (currentView !== 'game') return

    const interval = setInterval(() => {
      setMatchTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [currentView])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession()
        if (session?.data?.user) {
          setUser(session.data.user)
          setLoading(false)
          return
        }

        // Check for demo mode
        const { getDemoSession } = await import('@/lib/demo-session')
        const demoSession = getDemoSession()
        if (demoSession) {
          setUser(demoSession)
          setLoading(false)
          return
        }

        // No session found
        setLoading(false)
        router.push('/sign-in')
      } catch (error) {
        console.error('[v0] Auth check failed:', error)
        // Try demo mode as fallback
        try {
          const { getDemoSession } = await import('@/lib/demo-session')
          const demoSession = getDemoSession()
          if (demoSession) {
            setUser(demoSession)
            setLoading(false)
            return
          }
        } catch {}
        setLoading(false)
        router.push('/sign-in')
      }
    }

    checkAuth()
  }, [router])

  const handleStartGame = (gameType: '1v1' | '11v11' | 'sandbox') => {
    resetMatch()
    useGameStore.getState().setMatchType(gameType)
    useGameStore.getState().setMatchStatus('idle')
    setGameStarted(true)
    setCurrentView('game')
    setMatchTime(0)
  }

  const handleBackToMenu = () => {
    setGameStarted(false)
    setCurrentView('menu')
  }

  const handleBackToHome = () => {
    setCurrentView('home')
  }

  const handlePlayFromHome = () => {
    setCurrentView('menu')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-600 to-blue-400">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-slate-900">
      {currentView === 'home' && <HomeDashboard onPlayClick={handlePlayFromHome} />}

      {currentView === 'menu' && (
        <GameMenu onStartGame={handleStartGame} user={user} />
      )}

      {currentView === 'game' && (
        <div className="relative w-full h-full">
          <GameScene />
          <MatchHUD matchTime={matchTime} onExit={handleBackToMenu} />
        </div>
      )}
    </div>
  )
}
