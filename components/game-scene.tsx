'use client'

import React, { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { FootballField } from './football-field'
import { FootballBall } from './football-ball'
import { PlayerCharacter } from './player-character'
import { useGameStore, Player } from '@/lib/game-store'
import { Leaderboard } from './leaderboard'
import { audioEngine } from '@/lib/sound-engine'
import { getTeamProfile, getPlayerAvatarUrl } from '@/lib/teams-database'

// Silence benign Three.js r185 deprecation warnings triggered by internal R3F loops
if (typeof window !== 'undefined') {
  const origWarn = console.warn
  console.warn = (...args: any[]) => {
    const msg = args.join(' ')
    if (
      msg.includes('THREE.Clock') ||
      msg.includes('deprecated parameters for the initialization') ||
      msg.includes('PCFSoftShadowMap')
    ) {
      return
    }
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
  } = useGameStore()

  const [initialized, setInitialized] = useState(false)

  // Load team clubs cleanly from our modular database!
  const team1Profile = getTeamProfile('REAL_MADRID')
  const team2Profile = getTeamProfile('MANCHESTER_CITY')

  useEffect(() => {
    if (!initialized && matchStatus === 'idle') {
      initializeMatch()
    }
  }, [initialized, matchStatus])

  useEffect(() => {
    if (matchStatus === 'playing') {
      audioEngine.startStadiumLoop()
      audioEngine.playRefereeWhistle('short')
    } else {
      audioEngine.stopStadiumLoop()
    }
    return () => {
      audioEngine.stopStadiumLoop()
    }
  }, [matchStatus])

  const initializeMatch = () => {
    const isFullSquad = matchType === '11v11'
    const playerCount = isFullSquad ? 11 : 1

    const t1Roster = team1Profile.roster
    const t2Roster = team2Profile.roster

    const team1: Player[] = Array.from({ length: playerCount }, (_, i) => {
      const athlete = isFullSquad ? t1Roster[i] : t1Roster[10] // Bakhtiyor #10 in 1v1
      return {
        id: `team1-player-${i}`,
        name: athlete.name,
        position: athlete.pos,
        team: 1,
        jerseyNumber: athlete.num,
        country: athlete.country,
        height: athlete.height,
        photoUrl: getPlayerAvatarUrl(athlete.name, '09090b', 'eab308'),
        stats: {
          rating: athlete.rating,
          goals: 0,
          assists: 0,
          pace: athlete.pace,
          shooting: athlete.shooting,
          passing: athlete.passing,
          dribbling: athlete.dribbling,
          defense: athlete.defense,
          physical: athlete.physical,
        },
      }
    })

    const team2: Player[] = Array.from({ length: playerCount }, (_, i) => {
      const athlete = isFullSquad ? t2Roster[i] : t2Roster[9] // Haaland #9 in 1v1
      return {
        id: `team2-player-${i}`,
        name: athlete.name,
        position: athlete.pos,
        team: 2,
        jerseyNumber: athlete.num,
        country: athlete.country,
        height: athlete.height,
        photoUrl: getPlayerAvatarUrl(athlete.name, '0284c7', 'ffffff'),
        stats: {
          rating: athlete.rating,
          goals: 0,
          assists: 0,
          pace: athlete.pace,
          shooting: athlete.shooting,
          passing: athlete.passing,
          dribbling: athlete.dribbling,
          defense: athlete.defense,
          physical: athlete.physical,
        },
      }
    })

    setTeam1Players(team1)
    setTeam2Players(team2)

    if (matchType !== 'sandbox' && team1.length > 0) {
      // Select Bakhtiyor (#10 at index 10) by default as the lead striker
      const starterIndex = isFullSquad ? 10 : 0
      setSelectedPlayer(team1[starterIndex] || team1[0])
    }

    setInitialized(true)
    setMatchStatus('playing')
  }

  const generatePlayerStartPosition = (
    team: 1 | 2,
    index: number,
    totalPlayers: number
  ): [number, number, number] => {
    if (totalPlayers === 1) {
      return team === 1 ? [-8, 1.0, 0] : [8, 1.0, 0]
    }

    const coords: [number, number, number][] = [
      [-49, 1.0, 0],    // 0: GK
      [-32, 1.0, -23],  // 1: RB
      [-35, 1.0, -8],   // 2: CB
      [-35, 1.0, 8],    // 3: CB
      [-32, 1.0, 23],   // 4: LB
      [-20, 1.0, -15],  // 5: CM
      [-25, 1.0, 0],    // 6: CDM
      [-20, 1.0, 15],   // 7: CAM
      [-8, 1.0, -22],   // 8: LW
      [-7, 1.0, 22],    // 9: RW
      [-3.5, 1.0, 0],   // 10: ST (Kickoff Spot)
    ]

    const pos = coords[index % coords.length] || [-15, 1.0, 0]
    return team === 1 ? [pos[0], pos[1], pos[2]] : [-pos[0], pos[1], -pos[2]]
  }

  return (
    <div className="w-full h-full flex flex-col relative select-none overflow-hidden bg-slate-950">
      <Canvas
        camera={{ position: [-18, 12, 0], fov: 60 }}
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      >
        <PerspectiveCamera makeDefault position={[-18, 12, 0]} fov={60} />
        {matchStatus === 'paused' && <OrbitControls enableDamping dampingFactor={0.05} />}

        <ambientLight intensity={0.55} color="#94a3b8" />
        <directionalLight
          position={[25, 35, 20]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={120}
          shadow-camera-left={-60}
          shadow-camera-right={60}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />
        <directionalLight position={[-25, 30, -20]} intensity={0.8} color="#93c5fd" />

        <Physics gravity={[0, -9.81, 0]}>
          <FootballField />
          <FootballBall />

          <RigidBody type="fixed" position={[0, -0.5, 0]} friction={0.7} restitution={0.3}>
            <CuboidCollider args={[75, 0.5, 55]} />
          </RigidBody>

          <RigidBody type="fixed" position={[0, 10, -39]}>
            <CuboidCollider args={[75, 12, 1]} />
          </RigidBody>
          <RigidBody type="fixed" position={[0, 10, 39]}>
            <CuboidCollider args={[75, 12, 1]} />
          </RigidBody>
          <RigidBody type="fixed" position={[-57, 10, 0]}>
            <CuboidCollider args={[1, 12, 40]} />
          </RigidBody>
          <RigidBody type="fixed" position={[57, 10, 0]}>
            <CuboidCollider args={[1, 12, 40]} />
          </RigidBody>

          {team1Players.map((player, index) => {
            return (
              <PlayerCharacter
                key={player.id}
                playerData={player}
                position={generatePlayerStartPosition(1, index, team1Players.length)}
                team={1}
                jerseyNumber={player.jerseyNumber || index + 1}
                isSelected={selectedPlayer?.id === player.id}
                onSelected={() => setSelectedPlayer(player)}
              />
            )
          })}

          {team2Players.map((player, index) => {
            return (
              <PlayerCharacter
                key={player.id}
                playerData={player}
                position={generatePlayerStartPosition(2, index, team2Players.length)}
                team={2}
                jerseyNumber={player.jerseyNumber || index + 1}
                isSelected={false}
                onSelected={() => { }}
              />
            )
          })}
        </Physics>
      </Canvas>
      <Leaderboard />
    </div>
  )
}
