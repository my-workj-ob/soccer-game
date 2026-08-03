'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { authClient } from '@/lib/auth-client'
import { HomeDashboard } from '@/components/home-dashboard'
import { GameMenu } from '@/components/game-menu'
import { MatchHUD } from '@/components/match-hud'
import { useGameStore } from '@/lib/game-store'

// CRITICAL VERCEL FIX: Dynamically import 3D GameScene with SSR disabled so cloud servers don't crash evaluating WebGL & WebAssembly
const GameScene = dynamic(() => import('@/components/game-scene').then(m => m.GameScene), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white z-20 space-y-4">
      <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin shadow-lg shadow-amber-500/20" />
      <div className="font-extrabold text-lg tracking-widest uppercase text-amber-400">Loading 3D Stadium & &nbsp;Superstars...</div>
    </div>
  )
})

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
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-amber-400 text-xl font-bold tracking-wider animate-pulse">Checking credentials...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-slate-950 overflow-hidden relative">
      {currentView === 'home' && <HomeDashboard onPlayClick={handlePlayFromHome} />}

      {currentView === 'menu' && (
        <GameMenu onStartGame={handleStartGame} user={user} />
      )}

      {currentView === 'game' && (
        <div className="relative w-full h-full bg-slate-950">
          <GameScene />
          <MatchHUD matchTime={matchTime} onExit={handleBackToMenu} />
        </div>
      )}
    </div>
  )
}
