'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useGameStore } from '@/lib/game-store'
import { Play, Shield, Zap, Flame, Trophy } from 'lucide-react'

interface GameMenuProps {
  onStartGame: (type: '1v1' | '11v11' | 'sandbox') => void
  user: any
}

export function GameMenu({ onStartGame, user }: GameMenuProps) {
  const router = useRouter()
  const { setMatchType, setDifficulty } = useGameStore()
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<'easy' | 'medium' | 'hard'>('medium')

  const handleGameMode = (mode: '1v1' | '11v11' | 'sandbox') => {
    setMatchType(mode)
    if (mode !== 'sandbox') {
      setDifficulty(selectedDifficulty)
    }
    onStartGame(mode)
  }

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/sign-in')
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-[#0b1329] to-slate-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="max-w-3xl w-full flex flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-lime-500/20 border border-lime-500/40 px-4 py-1 rounded-full text-lime-400 text-xs font-black uppercase tracking-widest">
            <Flame className="w-4 h-4 fill-current" /> Select Your Match Challenge
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-lime-400 bg-clip-text text-transparent">
            FOOTBALL LEGENDS
          </h1>
          <p className="text-slate-400 font-medium text-base">
            Welcome back, <span className="text-lime-400 font-bold">{user?.name || 'Pro Athlete'}</span>! Prepare for kick-off.
          </p>
        </div>

        {/* Game Mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* 1v1 Mode */}
          <button
            onClick={() => handleGameMode('1v1')}
            className="group relative bg-slate-900/80 backdrop-blur border border-slate-800 hover:border-lime-500/60 rounded-3xl p-6 text-left transition-all transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-lime-500/20 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-lime-500 to-emerald-500 text-slate-950 flex items-center justify-center font-black text-2xl mb-4 shadow-lg shadow-lime-500/30 group-hover:scale-110 transition-transform">
                1v1
              </div>
              <h3 className="text-xl font-black text-white mb-1">Quick Duel</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Fast-paced solo battle against intelligent AI on the grand field.
              </p>
            </div>
            <div className="w-full py-3 bg-lime-500/10 border border-lime-500/30 group-hover:bg-lime-500 group-hover:text-slate-950 rounded-xl text-lime-400 font-black text-xs uppercase tracking-widest text-center transition-colors">
              Play 1v1
            </div>
          </button>

          {/* 11v11 Full Match */}
          <button
            onClick={() => handleGameMode('11v11')}
            className="group relative bg-slate-900/80 backdrop-blur border-2 border-lime-500/60 rounded-3xl p-6 text-left transition-all transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-lime-500/30 flex flex-col justify-between"
          >
            <div className="absolute top-4 right-4 bg-lime-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow">
              Featured
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 text-white flex items-center justify-center font-black text-xl mb-4 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 fill-current" />
              </div>
              <h3 className="text-xl font-black text-white mb-1">11v11 Championship</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Full squads, 4-3-3 tactical formation, night stadium floodlights and cheering crowds.
              </p>
            </div>
            <div className="w-full py-3 bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest text-center rounded-xl shadow-lg group-hover:scale-102 transition-transform">
              Start Match &gt;
            </div>
          </button>

          {/* Sandbox Free Practice */}
          <button
            onClick={() => handleGameMode('sandbox')}
            className="group relative bg-slate-900/80 backdrop-blur border border-slate-800 hover:border-amber-500/60 rounded-3xl p-6 text-left transition-all transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/20 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xl mb-4 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                ⚽
              </div>
              <h3 className="text-xl font-black text-white mb-1">Free Practice</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Sandbox turf mode to test power shooting, passing accuracy and speed dribbling.
              </p>
            </div>
            <div className="w-full py-3 bg-amber-500/10 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 rounded-xl text-amber-400 font-black text-xs uppercase tracking-widest text-center transition-colors">
              Enter Sandbox
            </div>
          </button>
        </div>

        {/* AI Difficulty Toggle */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-5 w-full max-w-lg flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <span className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-lime-400" /> AI Opponent Difficulty
          </span>
          <div className="flex gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {(['easy', 'medium', 'hard'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedDifficulty(lvl)}
                className={`px-4 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all ${
                  selectedDifficulty === lvl
                    ? 'bg-lime-500 text-slate-950 shadow-md shadow-lime-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Controls Guide Badge */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl px-6 py-4 w-full max-w-xl text-center flex flex-wrap justify-around gap-4 text-xs text-slate-400">
          <div><span className="text-lime-400 font-bold">WASD / Joy:</span> Move Athlete</div>
          <div><span className="text-rose-400 font-bold">Space / K:</span> Shoot Goal</div>
          <div><span className="text-cyan-400 font-bold">J / I:</span> Pass / Through</div>
          <div><span className="text-amber-400 font-bold">Shift / L:</span> Sprint Boost</div>
        </div>
      </div>
    </div>
  )
}
