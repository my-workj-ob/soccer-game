'use client'

// Demo session management for testing without auth
export interface DemoSession {
  id: string
  email: string
  name: string
  isDemo: boolean
}

const DEMO_SESSION_KEY = 'football-game-demo-session'

export function setDemoSession(): DemoSession {
  const session: DemoSession = {
    id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
    email: 'demo@futbol.uz',
    name: 'Demo Player',
    isDemo: true,
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session))
  }

  return session
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(DEMO_SESSION_KEY)
  return stored ? JSON.parse(stored) : null
}

export function clearDemoSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_SESSION_KEY)
  }
}

export function isDemoMode(): boolean {
  const session = getDemoSession()
  return session?.isDemo ?? false
}
