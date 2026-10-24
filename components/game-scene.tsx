'use client'

import React, { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { FootballField } from './football-field'
import { FootballBall } from './football-ball'
import { PlayerCharacter } from './player-character'
import { CameraController } from './camera-controller'
import { useGameStore, Player } from '@/lib/game-store'
import { Leaderboard } from './leaderboard'
import { audioEngine } from '@/lib/sound-engine'
import { getTeamProfile, getPlayerAvatarUrl } from '@/lib/teams-database'

// Suppress benign Three.js r185 deprecation warnings
if (typeof window !== 'undefined') {
  const origWarn = console.warn
  console.warn = (...args: any[]) => {
    const msg = args.join(' ')
    if (
      msg.includes('THREE.Clock') ||
      msg.includes('deprecated parameters') ||
      msg.includes('PCFSoftShadowMap')
    ) return
    origWarn.apply(console, args as any)
  }
}

export function GameScene() {
  const {
    matchType,
    matchStatus,
    setMatchStatus,
    team1Players,
    team2Players,
    setTeam1Players,
    setTeam2Players,
    selectedPlayer,
    setSelectedPlayer,
    cameraView,
  } = useGameStore()

  const [initialized, setInitialized] = useState(false)
  const team1Profile = getTeamProfile('REAL_MADRID')
  const team2Profile = getTeamProfile('MANCHESTER_CITY')

  useEffect(() => {
    if (!initialized && matchStatus === 'idle') initializeMatch()
  }, [initialized, matchStatus])

  useEffect(() => {
    if (matchStatus === 'playing') {
      audioEngine.startStadiumLoop()
      audioEngine.playRefereeWhistle('short')
    } else {
      audioEngine.stopStadiumLoop()
    }
    return () => audioEngine.stopStadiumLoop()
  }, [matchStatus])

  // ── Match time tick — connected to store ─────────────────────────────
  useEffect(() => {
    if (matchStatus !== 'playing') return
    const interval = setInterval(() => {
      const { matchTime, matchDuration, updateMatchTime, setMatchStatus, setRefereeEvent } = useGameStore.getState()
      const newTime = matchTime + 1
      updateMatchTime(newTime)
      if (newTime >= matchDuration) {
        setRefereeEvent('fulltime')
        setMatchStatus('ended')
        audioEngine.playRefereeWhistle('long')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [matchStatus])

  const initializeMatch = () => {
    const isFullSquad = matchType === '11v11'
    const count = isFullSquad ? 11 : 1
    const t1 = team1Profile.roster
    const t2 = team2Profile.roster

    const makePlayer = (roster: typeof t1, i: number, teamNum: 1 | 2): Player => {
      const a = isFullSquad ? roster[i] : (teamNum === 1 ? roster[10] : roster[9])
      const colors = teamNum === 1 ? ['09090b', 'eab308'] : ['0284c7', 'ffffff']
      return {
        id: `team${teamNum}-player-${i}`,
        name: a.name,
        position: a.pos,
        team: teamNum,
        jerseyNumber: a.num,
        country: a.country,
        height: a.height,
        photoUrl: getPlayerAvatarUrl(a.name, colors[0], colors[1]),
        stats: {
          rating: a.rating, goals: 0, assists: 0,
          pace: a.pace, shooting: a.shooting, passing: a.passing,
          dribbling: a.dribbling, defense: a.defense, physical: a.physical,
        },
      }
    }

    const team1 = Array.from({ length: count }, (_, i) => makePlayer(t1, i, 1))
    const team2 = Array.from({ length: count }, (_, i) => makePlayer(t2, i, 2))

    setTeam1Players(team1)
    setTeam2Players(team2)

    if (matchType !== 'sandbox' && team1.length > 0) {
      const starterIdx = isFullSquad ? 10 : 0
      setSelectedPlayer(team1[starterIdx] || team1[0])
    }

    setInitialized(true)
    setMatchStatus('playing')
  }

  const playerStart = (team: 1 | 2, idx: number, total: number): [number, number, number] => {
    if (total === 1) return team === 1 ? [-8, 1, 0] : [8, 1, 0]
    const coords: [number, number, number][] = [
      [-49, 1, 0],    // GK
      [-32, 1, -22],  // RB
      [-35, 1, -8],   // CB
      [-35, 1,  8],   // CB
      [-32, 1,  22],  // LB
      [-20, 1, -14],  // CM
      [-25, 1,  0],   // CDM
      [-20, 1,  14],  // CAM
      [-8,  1, -21],  // LW
      [-7,  1,  21],  // RW
      [-3,  1,  0],   // ST
    ]
    const p = coords[idx % coords.length] ?? [-15, 1, 0]
    return team === 1 ? p : [-p[0], p[1], -p[2]]
  }

  return (
    <div className="w-full h-full flex flex-col relative select-none overflow-hidden bg-slate-950">
      <Canvas
        camera={{ position: [0, 22, 30], fov: 55 }}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      >
        {/* ── Camera ─────────────────────────────────────────── */}
        <CameraController />
        {matchStatus === 'paused' && (
          <OrbitControls enableDamping dampingFactor={0.06} maxPolarAngle={Math.PI / 2.2} />
        )}

        {/* ── Lighting ────────────────────────────────────────── */}
        {/* Ambient: cooler sky fill */}
        <ambientLight intensity={0.38} color="#b8c8d8" />

        {/* Primary sun (stadium angle — comes from over the main stand) */}
        <directionalLight
          position={[20, 40, 15]}
          intensity={2.2}
          color="#fff8ec"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={140}
          shadow-camera-left={-68}
          shadow-camera-right={68}
          shadow-camera-top={45}
          shadow-camera-bottom={-45}
          shadow-bias={-0.001}
        />

        {/* Fill light: opposite side, cooler */}
        <directionalLight position={[-20, 28, -15]} intensity={0.7} color="#b8d4f8" />

        {/* Ground bounce (warm) */}
        <hemisphereLight args={['#d4edaa', '#2d5a0e', 0.4]} />

        {/* ── Physics World ────────────────────────────────────── */}
        <Physics gravity={[0, -9.81, 0]}>
          <FootballField />
          <FootballBall />

          {/* Ground plane */}
          <RigidBody type="fixed" position={[0, -0.05, 0]} friction={0.65} restitution={0.3}>
            <CuboidCollider args={[80, 0.05, 60]} />
          </RigidBody>

          {/* Boundary walls (invisible) */}
          <RigidBody type="fixed" position={[0, 8, -39]}>
            <CuboidCollider args={[80, 10, 0.5]} />
          </RigidBody>
          <RigidBody type="fixed" position={[0, 8, 39]}>
            <CuboidCollider args={[80, 10, 0.5]} />
          </RigidBody>
          <RigidBody type="fixed" position={[-58, 8, 0]}>
            <CuboidCollider args={[0.5, 10, 45]} />
          </RigidBody>
          <RigidBody type="fixed" position={[58, 8, 0]}>
            <CuboidCollider args={[0.5, 10, 45]} />
          </RigidBody>

          {/* ── Goal post physics colliders ────────────────────── */}
          {/* West goal */}
          <RigidBody type="fixed" position={[-52.5, 1.22, -3.66]}>
            <CuboidCollider args={[0.06, 1.22, 0.06]} />
          </RigidBody>
          <RigidBody type="fixed" position={[-52.5, 1.22, 3.66]}>
            <CuboidCollider args={[0.06, 1.22, 0.06]} />
          </RigidBody>
          <RigidBody type="fixed" position={[-52.5, 2.44, 0]}>
            <CuboidCollider args={[0.06, 0.06, 3.66]} />
          </RigidBody>
          {/* East goal */}
          <RigidBody type="fixed" position={[52.5, 1.22, -3.66]}>
            <CuboidCollider args={[0.06, 1.22, 0.06]} />
          </RigidBody>
          <RigidBody type="fixed" position={[52.5, 1.22, 3.66]}>
            <CuboidCollider args={[0.06, 1.22, 0.06]} />
          </RigidBody>
          <RigidBody type="fixed" position={[52.5, 2.44, 0]}>
            <CuboidCollider args={[0.06, 0.06, 3.66]} />
          </RigidBody>

          {/* ── Players ─────────────────────────────────────────── */}
          {team1Players.map((p, i) => (
            <PlayerCharacter
              key={p.id}
              playerData={p}
              position={playerStart(1, i, team1Players.length)}
              team={1}
              jerseyNumber={p.jerseyNumber || i + 1}
              isSelected={selectedPlayer?.id === p.id}
              onSelected={() => setSelectedPlayer(p)}
            />
          ))}

          {team2Players.map((p, i) => (
            <PlayerCharacter
              key={p.id}
              playerData={p}
              position={playerStart(2, i, team2Players.length)}
              team={2}
              jerseyNumber={p.jerseyNumber || i + 1}
              isSelected={false}
              onSelected={() => {}}
            />
          ))}
        </Physics>
      </Canvas>

      <Leaderboard />
    </div>
  )
}
