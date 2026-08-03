'use client'

import React, { useState } from 'react'
import { Play, Trophy, Users, Shield, Sparkles, LogOut, Award, Flame, Star } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

interface HomeDashboardProps {
  onPlayClick?: () => void
}

export function HomeDashboard({ onPlayClick }: HomeDashboardProps = {}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1128] to-slate-950 text-slate-100 font-sans select-none overflow-x-hidden">
      {/* Top Navigation Header */}
      <header className="border-b border-lime-500/20 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-lime-500 to-emerald-400 rounded-xl flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-lime-500/30">
              FL
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white via-slate-200 to-lime-400 bg-clip-text text-transparent">
                FOOTBALL LEGENDS
              </span>
              <div className="text-[10px] text-lime-400 font-bold uppercase tracking-widest -mt-1">
                Pro League 2026 Edition
              </div>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="hidden md:flex gap-8 items-center bg-slate-900/80 px-6 py-2.5 rounded-full border border-slate-800">
            {['home', 'play', 'club', 'career', 'store', 'leaderboard'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-black uppercase tracking-wider transition-all px-3 py-1 rounded-full ${
                  activeTab === tab
                    ? 'bg-lime-500 text-slate-950 shadow-md shadow-lime-500/40 scale-105'
                    : 'text-slate-400 hover:text-lime-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Right Resource Bar & Avatar */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
                <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-slate-950">
                  $
                </div>
                <span className="font-black text-amber-400 text-sm">125,450</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400 fill-current" />
                <span className="font-black text-cyan-400 text-sm">2,850</span>
              </div>
            </div>

            {/* Profile badge */}
            <div className="flex items-center gap-3 pl-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-500 via-emerald-600 to-teal-800 flex items-center justify-center font-black text-slate-950 text-sm border-2 border-white/20 shadow-md">
                BX
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-800/80 rounded-xl transition text-slate-400 hover:text-rose-400"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Hero & Gameplay Modes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Majestic KICK OFF Hero Card (Screenshot #3 Vibe) */}
          <div className="relative rounded-3xl overflow-hidden h-80 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 border-2 border-lime-500/40 shadow-2xl group">
            {/* Background pattern styling */}
            <div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
            <div className="absolute right-0 bottom-0 w-96 h-full bg-gradient-to-tl from-lime-500/20 to-transparent pointer-events-none" />
            
            <div className="relative h-full flex flex-col justify-between p-8 text-white z-10">
              <div className="inline-flex items-center gap-2 bg-lime-500/20 border border-lime-500/50 px-3 py-1 rounded-full text-lime-400 text-xs font-black uppercase tracking-widest w-fit">
                <Flame className="w-3.5 h-3.5 fill-current" /> Live Season Match
              </div>

              <div>
                <h1 className="text-6xl font-black tracking-tight mb-2 bg-gradient-to-r from-white via-slate-100 to-lime-300 bg-clip-text text-transparent">
                  KICK OFF
                </h1>
                <p className="text-slate-300 text-base max-w-md">
                  Experience next-gen 3D physics, real-time tactical camera tracking, and stadium atmosphere.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={onPlayClick}
                  className="px-8 py-4 bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-500 text-slate-950 font-black text-lg rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-lime-500/40 flex items-center gap-3 group-hover:shadow-2xl"
                >
                  <Play className="w-6 h-6 fill-current" />
                  PLAY NOW &gt;
                </button>
                <div className="text-xs text-slate-400 font-semibold bg-slate-900/80 px-4 py-3 rounded-xl border border-slate-800">
                  ⚡ 60+ FPS Real-Time Physics Ready
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Game Modes Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Career Mode */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 hover:border-cyan-500/50 transition-all transform hover:-translate-y-1 shadow-xl group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-white mb-1">CAREER MODE</h3>
              <p className="text-slate-400 text-xs mb-4">Lead Dubai United to global champion victory.</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Season Progress</span>
                  <span className="text-cyan-400">68%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Live Events */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 hover:border-amber-500/50 transition-all transform hover:-translate-y-1 shadow-xl group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-white mb-1">LIVE EVENTS</h3>
              <p className="text-slate-400 text-xs mb-4">Weekend Challenge: Score 5 goals in Derby.</p>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-300 font-bold text-xs flex justify-between items-center">
                <span>Reward</span>
                <span className="text-amber-400 font-black">+5,000 $</span>
              </div>
            </div>

            {/* Ultimate Team */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 hover:border-lime-500/50 transition-all transform hover:-translate-y-1 shadow-xl group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-lime-500/20 text-lime-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-white mb-1">ULTIMATE TEAM</h3>
              <p className="text-slate-400 text-xs mb-4">Customize kits, formations, and transfers.</p>
              <div className="bg-lime-500/10 border border-lime-500/30 rounded-lg px-3 py-2 text-lime-400 font-bold text-xs text-center uppercase tracking-widest">
                4-3-3 Attacking
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tactical My Team Preview & Daily Tasks */}
        <div className="space-y-8">
          {/* Tactical 4-3-3 My Team Formation Board (Screenshot #3) */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-lime-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-lime-400" /> My Team (4-3-3)
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">Dubai United First XI</span>
              </div>
              <div className="bg-lime-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-md shadow-lime-500/20">
                92 CHEM
              </div>
            </div>

            {/* Pitch Tactical View */}
            <div className="w-full h-64 bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 border border-emerald-500/40 rounded-2xl relative p-4 flex flex-col justify-between overflow-hidden shadow-inner">
              <div className="absolute inset-0 border-2 border-emerald-500/20 m-2 rounded-xl pointer-events-none" />
              
              {/* Attackers */}
              <div className="flex justify-around items-center z-10">
                {[{ pos: 'LW', ovr: 89, name: 'SILVA' }, { pos: 'ST', ovr: 93, name: 'BAKHTIYOR' }, { pos: 'RW', ovr: 88, name: 'SALA' }].map((p, idx) => (
                  <div key={idx} className="flex flex-col items-center bg-slate-900/90 border border-lime-400/60 rounded-lg px-2 py-1 shadow-lg transform hover:scale-110 transition">
                    <div className="flex items-center gap-1 text-[10px] font-black text-lime-400">
                      <span>{p.ovr}</span>
                      <Star className="w-2.5 h-2.5 fill-current" />
                    </div>
                    <span className="text-[11px] font-black text-white uppercase">{p.pos}</span>
                    <span className="text-[9px] text-slate-300 font-medium">{p.name}</span>
                  </div>
                ))}
              </div>

              {/* Midfielders */}
              <div className="flex justify-around items-center z-10 px-4">
                {[{ pos: 'CM', ovr: 87 }, { pos: 'CDM', ovr: 88 }, { pos: 'CM', ovr: 86 }].map((p, idx) => (
                  <div key={idx} className="flex flex-col items-center bg-slate-900/90 border border-cyan-400/60 rounded-lg px-2 py-1 shadow-lg">
                    <span className="text-[10px] font-black text-cyan-400">{p.ovr}</span>
                    <span className="text-[11px] font-black text-white">{p.pos}</span>
                  </div>
                ))}
              </div>

              {/* Defenders & GK */}
              <div className="flex justify-around items-center z-10">
                {[{ pos: 'LB', ovr: 85 }, { pos: 'CB', ovr: 89 }, { pos: 'CB', ovr: 88 }, { pos: 'RB', ovr: 85 }, { pos: 'GK', ovr: 91 }].map((p, idx) => (
                  <div key={idx} className="flex flex-col items-center bg-slate-900/90 border border-amber-400/60 rounded-lg px-2 py-0.5 shadow-lg">
                    <span className="text-[9px] font-black text-amber-400">{p.ovr}</span>
                    <span className="text-[10px] font-black text-white">{p.pos}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Tasks Showcase */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-black text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>DAILY TASKS</span>
              <span className="text-xs text-lime-400 bg-lime-500/10 px-2.5 py-1 rounded-full border border-lime-500/30">
                Refresh in 6h
              </span>
            </h3>
            <div className="space-y-3">
              {[
                { task: 'Win 2 matches in 11v11 Mode', prog: 1, total: 2, reward: '+400 XP', complete: false },
                { task: 'Score a goal with BAKHTIYOR', prog: 1, total: 1, reward: '+250 XP', complete: true },
                { task: 'Perform 3 successful passes', prog: 2, total: 3, reward: '+150 XP', complete: false },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                  <div>
                    <div className="text-xs font-bold text-slate-200">{t.task}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Progress: <span className="text-lime-400 font-bold">{t.prog} / {t.total}</span>
                    </div>
                  </div>
                  <div className={`text-xs font-black px-3 py-1.5 rounded-xl ${t.complete ? 'bg-lime-500 text-slate-950 shadow-md shadow-lime-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    {t.reward}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Dock & Shop Promo */}
      <footer className="max-w-7xl mx-auto px-6 pb-12 pt-4">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 p-0.5 rounded-2xl shadow-2xl">
          <div className="bg-slate-950 px-6 py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛍️</span>
              <div>
                <span className="text-sm font-black text-white uppercase tracking-wider">New Season Kits & Boots Available</span>
                <p className="text-xs text-slate-400">Visit the shop to unlock limited edition emerald football cleats.</p>
              </div>
            </div>
            <button className="px-6 py-2.5 bg-white text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-lime-400 transition-colors shadow-lg">
              Open Shop
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
