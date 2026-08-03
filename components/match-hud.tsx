'use client'

import React, { useState, useRef } from 'react'
import { Pause, Trophy, Shield, Flag, Repeat, Camera, LogOut, Sliders, RefreshCw, FileText, Settings as SettingsIcon, AlertCircle, BarChart2 } from 'lucide-react'
import { useGameStore, TacticalPreset } from '@/lib/game-store'

interface MatchHUDProps {
  matchTime?: number
  team1Score?: number
  team2Score?: number
  team1Name?: string
  team2Name?: string
  possession?: { team1: number; team2: number }
  onPause?: () => void
  onExit?: () => void
}

export function MatchHUD({
  team1Name = 'RMA',
  team2Name = 'MCI',
  possession = { team1: 54, team2: 46 },
  onPause,
  onExit,
}: MatchHUDProps) {
  const {
    team1Score: storeScore1,
    team2Score: storeScore2,
    matchTime: storeTime,
    selectedPlayer,
    team1Players,
    team2Players,
    setMoveInput,
    triggerAction,
    setIsSprinting,
    switchPlayerToClosest,
    ballPosition,
    ballPossession,
    refereeEvent,
    cameraView,
    setCameraView,
    playerStamina,
    playerPositions,
    fouls,
    yellowCards,
    redCards,
    tacticalPreset,
    setTacticalPreset,
  } = useGameStore()

  const currentScore1 = storeScore1 || 0
  const currentScore2 = storeScore2 || 0
  const currentTime = storeTime || 0
  const minutes = Math.floor(currentTime / 60)
  const seconds = Math.floor(currentTime % 60)

  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showTacticsModal, setShowTacticsModal] = useState(false)
  const [showMobileTelemetry, setShowMobileTelemetry] = useState(false)
  const joystickCenterRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    updateJoystick(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    updateJoystick(e.clientX, e.clientY)
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    setJoystickPos({ x: 0, y: 0 })
    setMoveInput({ x: 0, y: 0 })
  }

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickCenterRef.current) return
    const rect = joystickCenterRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const maxRadius = 40

    let dx = clientX - centerX
    let dy = clientY - centerY
    const distance = Math.hypot(dx, dy)

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius
      dy = (dy / distance) * maxRadius
    }

    setJoystickPos({ x: dx, y: dy })
    setMoveInput({ x: dx / maxRadius, y: dy / maxRadius })
  }

  const cycleCamera = () => {
    if (cameraView === 'third-person') setCameraView('top-down')
    else if (cameraView === 'top-down') setCameraView('side-view')
    else setCameraView('third-person')
  }

  const team1Yellows = team1Players.reduce((acc, p) => acc + (yellowCards[p.id] || 0), 0)
  const team2Yellows = team2Players.reduce((acc, p) => acc + (yellowCards[p.id] || 0), 0)
  const team1Reds = team1Players.filter(p => redCards[p.id]).length
  const team2Reds = team2Players.filter(p => redCards[p.id]).length

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between select-none font-sans overflow-hidden"
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* --- REFEREE EVENT OVERLAY BANNERS (MOVED HIGH TO NOT OBSCURE FIELD) --- */}
      {refereeEvent && (
        <div className="absolute inset-x-0 top-12 sm:top-20 flex justify-center pointer-events-none z-50 animate-bounce">
          <div className="px-5 py-2 sm:px-8 sm:py-3 rounded-2xl border-2 backdrop-blur-xl bg-slate-950/95 border-amber-400 text-amber-400 shadow-2xl flex items-center gap-3 text-base sm:text-2xl font-black uppercase tracking-wider">
            {refereeEvent === 'goal' && <span>⚽ GOAL! SUPERSTAR STRIKE! 🎉</span>}
            {refereeEvent === 'offside' && <span className="text-amber-400 flex items-center gap-2"><AlertCircle className="w-5 h-5 sm:w-7 sm:h-7" /> 🚩 OFFSIDE</span>}
            {refereeEvent === 'foul' && <span className="text-rose-400 flex items-center gap-2">🛑 FOUL CALLED</span>}
            {refereeEvent === 'throw-in' && <span className="flex items-center gap-2"><Flag className="w-5 h-5 sm:w-7 sm:h-7" /> THROW-IN</span>}
            {refereeEvent === 'corner' && <span className="flex items-center gap-2"><Flag className="w-5 h-5 sm:w-7 sm:h-7" /> CORNER KICK</span>}
            {refereeEvent === 'goal-kick' && <span className="flex items-center gap-2"><Shield className="w-5 h-5 sm:w-7 sm:h-7" /> GOAL KICK</span>}
          </div>
        </div>
      )}

      {/* --- TACTICS MODAL SELECTOR --- */}
      {showTacticsModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto z-50 p-4">
          <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full text-white shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-lg font-black uppercase tracking-widest text-amber-400">Team Tactics</span>
              <button onClick={() => setShowTacticsModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">CLOSE ✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'tiki-taka', label: 'Tiki-Taka', desc: 'Short passing, compact triangles & high ball retention.' },
                { id: 'high-press', label: 'High Press', desc: 'Aggressive line push into opposition defensive third.' },
                { id: 'counter-attack', label: 'Counter Attack', desc: 'Forwards linger on offside edge for long diagonal balls.' },
                { id: 'park-the-bus', label: 'Park The Bus', desc: 'Ultra-defensive low block inside defensive penalty arc.' },
              ].map((tac) => (
                <button
                  key={tac.id}
                  onClick={() => {
                    setTacticalPreset(tac.id as TacticalPreset)
                    setShowTacticsModal(false)
                  }}
                  className={`p-3 sm:p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${tacticalPreset === tac.id ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-slate-800 hover:border-slate-700 text-slate-300'}`}
                >
                  <span className="font-extrabold text-xs sm:text-base uppercase">{tac.label}</span>
                  <span className="text-[10px] text-slate-400 mt-1 font-normal leading-relaxed hidden sm:block">{tac.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TOP HEADER (COMPACT ON MOBILE LANDSCAPE) --- */}
      <div className="p-2 sm:p-4 flex items-center justify-between pointer-events-auto w-full z-40">
        <div className="flex items-center gap-1.5 sm:gap-2 shadow-2xl">
          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-slate-950/90 border border-amber-500/50 rounded-lg flex items-center justify-center font-black text-[10px] sm:text-xs text-amber-400">
            UCL
          </div>

          <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-lg overflow-hidden h-7 sm:h-9 px-2 sm:px-3 gap-2 text-white font-bold tracking-wider">
            <span className="text-xs sm:text-sm text-slate-200 font-extrabold flex items-center gap-1"><span className="text-[10px]">⚪</span> {team1Name}</span>
            {team1Reds > 0 && <span className="w-2 h-3 bg-rose-600 rounded-xs block" />}
            
            <div className="bg-amber-400 text-slate-950 px-2 sm:px-3 py-0.5 rounded font-black text-xs sm:text-base flex items-center gap-1 shadow-sm">
              <span>{currentScore1}</span>
              <span>-</span>
              <span>{currentScore2}</span>
            </div>

            {team2Reds > 0 && <span className="w-2 h-3 bg-rose-600 rounded-xs block" />}
            <span className="text-xs sm:text-sm text-slate-200 font-extrabold flex items-center gap-1">{team2Name} <span className="text-[10px]">🔵</span></span>
          </div>

          <div className="h-7 sm:h-9 px-2.5 sm:px-4 bg-slate-950/90 border border-slate-800 rounded-lg flex items-center text-white font-mono font-bold text-xs sm:text-base">
            {String(minutes + 70).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Telemetry Toggle Button */}
          <button
            onClick={() => setShowMobileTelemetry(!showMobileTelemetry)}
            className="xl:hidden h-7 sm:h-9 px-2.5 bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-amber-400 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 shadow-lg"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">FUT Stats</span>
          </button>

          {/* Mobile Tactics Button */}
          <button
            onClick={() => setShowTacticsModal(true)}
            className="lg:hidden h-7 sm:h-9 px-2.5 bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-amber-400 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 shadow-lg"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tactics</span>
          </button>

          <button
            onClick={cycleCamera}
            className="h-7 sm:h-9 px-2.5 sm:px-3 bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-amber-400 rounded-lg text-[10px] sm:text-xs font-bold uppercase flex items-center gap-1.5 transition shadow-lg"
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Cam: {cameraView.split('-')[0]}</span>
          </button>
          <button
            onClick={onPause}
            className="w-7 h-7 sm:w-9 sm:h-9 bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-white rounded-lg flex items-center justify-center transition shadow-lg"
          >
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
          </button>
          {onExit && (
            <button
              onClick={onExit}
              title="Exit Game"
              className="w-7 h-7 sm:w-9 sm:h-9 bg-rose-950/90 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-lg flex items-center justify-center transition shadow-lg"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* --- MIDDLE SIDE PANELS (HIDDEN ON MOBILE BY DEFAULT TO KEEP FIELD 100% CLEAR) --- */}
      <div className="flex items-start justify-between px-4 sm:px-6 pointer-events-auto z-30 mt-1">
        {/* Left Stats: PC Only */}
        <div className="hidden xl:block w-64 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 shadow-2xl text-white">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-800/80 flex justify-between">
            <span>Match Stats</span>
            <span className="text-amber-400 uppercase text-[10px] font-bold">{tacticalPreset}</span>
          </div>
          <div className="space-y-2.5 font-sans text-xs font-bold">
            {[
              { label: 'POSSESSION', t1: `${possession.team1}%`, t2: `${possession.team2}%` },
              { label: 'FOULS CALLED', t1: fouls.team1, t2: fouls.team2 },
              { label: 'YELLOW CARDS', t1: team1Yellows, t2: team2Yellows },
              { label: 'RED CARDS', t1: team1Reds, t2: team2Reds },
              { label: 'SHOTS ON GOAL', t1: currentScore1 + 4, t2: currentScore2 + 3 },
            ].map((st, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-white w-8 text-left font-extrabold">{st.t1}</span>
                <span className="text-slate-400 text-[10px] tracking-wider text-center flex-1">{st.label}</span>
                <span className="text-amber-400 w-8 text-right font-extrabold">{st.t2}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right FUT Telemetry Card: Desktop ONLY or Mobile Toggle */}
        <div className={`${showMobileTelemetry ? 'flex' : 'hidden xl:flex'} w-72 sm:w-80 bg-slate-950/90 backdrop-blur-md rounded-2xl border-2 border-amber-500/60 p-3.5 shadow-2xl text-white flex-col gap-2.5 absolute right-4 sm:static top-14 z-50`}>
          <div className="flex justify-between items-center pb-1 border-b border-slate-800">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              EA FC 25 / FUT TELEMETRY
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-300 font-black">
                {selectedPlayer?.country || '🇺🇿 UZB'}
              </span>
              <button onClick={() => setShowMobileTelemetry(false)} className="xl:hidden text-slate-400 hover:text-white text-xs font-bold">✕</button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border-2 border-amber-400 flex flex-col items-center justify-center bg-gradient-to-b from-amber-500/30 to-slate-900 text-amber-300 shadow-lg">
              <span className="font-black text-xl leading-none">{selectedPlayer?.stats?.rating || 94}</span>
              <span className="text-[8px] uppercase font-bold text-white tracking-wider">{selectedPlayer?.position === 'forward' ? 'ST' : selectedPlayer?.position?.slice(0, 3).toUpperCase() || 'ST'}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-base font-black uppercase text-white tracking-wide truncate">
                {selectedPlayer?.name || 'BAKHTIYOR'}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-semibold">
                <span className="text-amber-400 font-extrabold">#{selectedPlayer?.jerseyNumber || 10}</span>
                <span>•</span>
                <span>Height: {selectedPlayer?.height?.toFixed(2) || '1.85'}m</span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 shadow-lg">
              <img
                src={selectedPlayer?.photoUrl || `https://ui-avatars.com/api/?name=BAKHTIYOR&background=0D0D0D&color=F59E0B&size=128&bold=true`}
                alt={selectedPlayer?.name || 'Player'}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-800 text-[9px] font-mono text-center">
            <div className="bg-slate-900/80 p-1 rounded border border-slate-800">
              <div className="text-slate-400">PAC</div>
              <div className="font-extrabold text-white text-xs">{selectedPlayer?.stats?.pace || 96}</div>
            </div>
            <div className="bg-slate-900/80 p-1 rounded border border-slate-800">
              <div className="text-slate-400">SHO</div>
              <div className="font-extrabold text-amber-400 text-xs">{selectedPlayer?.stats?.shooting || 95}</div>
            </div>
            <div className="bg-slate-900/80 p-1 rounded border border-slate-800">
              <div className="text-slate-400">DRI</div>
              <div className="font-extrabold text-lime-400 text-xs">{selectedPlayer?.stats?.dribbling || 96}</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ERGONOMIC MOBILE TOUCH CONTROLLER PADDING & THUMB JOYSTICK --- */}
      <div className="flex items-end justify-between px-3 sm:px-8 pb-3 sm:pb-8 pointer-events-auto z-30 w-full mb-0 sm:mb-12">
        
        {/* LEFT THUMB: JOYSTICK & COMPACT STAMINA BAR */}
        <div className="flex flex-col items-start gap-2 sm:gap-4">
          <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col w-40 sm:w-52 shadow-xl">
            <div className="flex items-center gap-1.5 text-xs font-black text-white justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-amber-500 text-slate-950 flex items-center justify-center font-black text-[9px]">#{selectedPlayer?.jerseyNumber || 10}</span>
                <span className="truncate max-w-[90px] text-amber-300">{selectedPlayer ? `${selectedPlayer.name}` : 'BAKHTIYOR'}</span>
              </div>
              <span className="text-[9px] text-slate-400 font-bold">{Math.round(playerStamina)}%</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full transition-all duration-200 ${playerStamina < 30 ? 'bg-rose-500' : 'bg-amber-400'}`} 
                style={{ width: `${playerStamina}%` }}
              />
            </div>
          </div>

          <div
            ref={joystickCenterRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-slate-950/50 border-2 border-white/35 backdrop-blur-sm shadow-2xl relative flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <div className="absolute inset-3 rounded-full border border-dashed border-white/25 pointer-events-none" />
            <div
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-400/80 backdrop-blur-md shadow-lg border-2 border-white flex items-center justify-center pointer-events-none"
            />
          </div>
        </div>

        {/* CENTER: RADAR MINIMAP (TABLETS & DESKTOP ONLY) */}
        <div className="hidden lg:flex flex-col items-center pb-2">
          <div className="w-56 h-32 bg-slate-950/70 backdrop-blur-md border border-slate-700/60 rounded-xl p-2.5 relative shadow-2xl overflow-hidden">
            <div className="w-full h-full border border-white/20 rounded relative flex items-center justify-center">
              <div className="absolute h-full w-px bg-white/20" />
              <div className="w-10 h-10 rounded-full border border-white/20" />

              <div
                style={{
                  left: `${Math.min(92, Math.max(5, ((ballPosition[0] + 52.5) / 105) * 100))}%`,
                  top: `${Math.min(92, Math.max(5, ((ballPosition[2] + 34) / 68) * 100))}%`,
                }}
                className="absolute w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400 animate-pulse transform -translate-x-1/2 -translate-y-1/2 z-30"
              />

              {team1Players.map((p, idx) => {
                const pos = playerPositions[p.id] || [-35 + idx * 5, 0, -20 + (idx % 5) * 10]
                const ratioX = ((pos[0] + 52.5) / 105) * 100
                const ratioY = ((pos[2] + 34) / 68) * 100
                return (
                  <div
                    key={`r-t1-${idx}`}
                    style={{ left: `${Math.min(94, Math.max(6, ratioX))}%`, top: `${Math.min(94, Math.max(6, ratioY))}%` }}
                    className={`absolute w-2 h-2 rounded-full shadow transform -translate-x-1/2 -translate-y-1/2 ${p.id === selectedPlayer?.id ? 'bg-amber-400 ring-2 ring-white scale-125 z-20' : 'bg-amber-400 z-10'}`}
                  />
                )
              })}
              {team2Players.map((p, idx) => {
                const pos = playerPositions[p.id] || [35 - idx * 5, 0, -20 + (idx % 5) * 10]
                const ratioX = ((pos[0] + 52.5) / 105) * 100
                const ratioY = ((pos[2] + 34) / 68) * 100
                return (
                  <div
                    key={`r-t2-${idx}`}
                    style={{ left: `${Math.min(94, Math.max(6, ratioX))}%`, top: `${Math.min(94, Math.max(6, ratioY))}%` }}
                    className="absolute w-2 h-2 rounded-full bg-sky-400 shadow transform -translate-x-1/2 -translate-y-1/2 z-10"
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT THUMB: CONSOLE ARCADE BUTTON DIAMOND CLUSTER */}
        <div className="relative w-56 h-48 sm:w-64 sm:h-56 flex items-center justify-end pr-2">
          
          {/* SWITCH PLAYER (Top Left of cluster) */}
          <button
            onPointerDown={() => switchPlayerToClosest()}
            className="absolute top-1 left-2 sm:top-2 sm:left-4 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-950/80 border-2 border-slate-400/80 text-white font-black text-[9px] sm:text-[10px] uppercase shadow-xl hover:scale-105 active:scale-90 transition flex flex-col items-center justify-center"
          >
            <Repeat className="w-3 h-3 sm:w-4 sm:h-4 mb-0.5 text-sky-400" />
            <span>SWITCH</span>
          </button>

          {/* THROUGH BALL (Top Center/Right) */}
          <button
            onPointerDown={() => triggerAction('through')}
            className="absolute top-0 right-14 sm:top-2 sm:right-18 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-slate-950/85 border-[3px] border-yellow-400 text-yellow-300 font-extrabold text-xs sm:text-sm uppercase shadow-2xl shadow-yellow-500/30 hover:scale-105 active:scale-90 transition flex items-center justify-center"
          >
            THROUGH
          </button>

          {/* PASS (Bottom Left of shoot) */}
          <button
            onPointerDown={() => triggerAction('pass')}
            className="absolute bottom-2 left-6 sm:bottom-4 sm:left-10 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-slate-950/85 border-[3px] border-sky-400 text-sky-300 font-extrabold text-xs sm:text-sm uppercase shadow-2xl shadow-sky-500/30 hover:scale-105 active:scale-90 transition flex items-center justify-center"
          >
            PASS
          </button>

          {/* SPRINT / SLIDE TACKLE (Bottom Right under shoot) */}
          <button
            onPointerDown={() => {
              if (ballPossession !== 1) triggerAction('tackle')
              else setIsSprinting(true)
            }}
            onPointerUp={() => setIsSprinting(false)}
            className={`absolute -bottom-1 right-14 sm:bottom-0 sm:right-20 w-15 h-15 sm:w-18 sm:h-18 rounded-full bg-slate-950/85 border-[3px] font-extrabold text-[10px] sm:text-xs uppercase text-center shadow-2xl hover:scale-105 active:scale-90 transition flex flex-col items-center justify-center leading-tight ${ballPossession !== 1 ? 'border-rose-500 text-rose-300 shadow-rose-500/30' : 'border-amber-400 text-white shadow-amber-500/30'}`}
          >
            {ballPossession !== 1 ? (
              <span>SLIDE<br/>TACKLE</span>
            ) : (
              <>
                <span>SPRINT</span>
                <span className="text-[8px] sm:text-[9px] opacity-80">&amp; SKILL</span>
              </>
            )}
          </button>

          {/* SHOOT (Primary Thumb Strike Target - Rightmost Edge) */}
          <button
            onPointerDown={() => triggerAction('shoot')}
            className="absolute top-1/2 -translate-y-1/2 right-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-950/95 border-4 border-orange-500 text-white font-black text-sm sm:text-base uppercase shadow-2xl shadow-orange-500/50 hover:scale-105 active:scale-90 transition flex items-center justify-center"
          >
            SHOOT
          </button>
        </div>
      </div>

      {/* --- BOTTOM MENU BAR (DESKTOP & TABLETS ONLY) --- */}
      <div className="hidden lg:flex w-full bg-slate-950/95 border-t border-slate-800/80 px-8 py-2 items-center justify-around pointer-events-auto z-40 text-slate-400 text-xs font-bold tracking-widest uppercase">
        <button onClick={() => setShowTacticsModal(true)} className="flex items-center gap-2 hover:text-white text-amber-400 transition">
          <Sliders className="w-4 h-4" />
          <span>Tactics ({tacticalPreset.toUpperCase()})</span>
        </button>
        <div className="w-px h-5 bg-slate-800" />
        <button className="flex items-center gap-2 hover:text-white transition">
          <RefreshCw className="w-4 h-4 text-sky-400" />
          <span>Substitutions</span>
        </button>
        <div className="w-px h-5 bg-slate-800" />
        <button className="flex items-center gap-2 hover:text-white transition">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Instructions</span>
        </button>
        <div className="w-px h-5 bg-slate-800" />
        <button className="flex items-center gap-2 hover:text-white transition">
          <SettingsIcon className="w-4 h-4 text-slate-300" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  )
}
