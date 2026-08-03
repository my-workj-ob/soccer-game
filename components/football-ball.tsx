'use client'

import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier'
import { Trail } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore, RefereeEvent } from '@/lib/game-store'
import { checkOffsideRule } from '@/lib/football-ai'
import { audioEngine } from '@/lib/sound-engine'
import { triggerVARReplay } from './var-replay'

export function FootballBall() {
  const rigidBodyRef = useRef<any>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const isRuleProcessing = useRef(false)

  const {
    ballPosition,
    setBallPosition,
    setBallVelocity,
    addTeam1Goal,
    addTeam2Goal,
    setRefereeEvent,
    setOffsideData,
  } = useGameStore()

  // Standard soccer ball radius and mass
  const ballRadius = 0.35
  const ballMass = 0.43

  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation({ x: 0, y: 1, z: 0 }, true)
    }
  }, [])

  const restartWithEvent = (
    event: RefereeEvent,
    newPos: { x: number; y: number; z: number },
    duration = 3000,
    triggerVAR = false
  ) => {
    if (isRuleProcessing.current) return
    isRuleProcessing.current = true

    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(newPos, true)
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }

    setRefereeEvent(event)

    if (event === 'goal') {
      audioEngine.playRefereeWhistle('long')
      audioEngine.playCrowdReaction('goal')
      if (triggerVAR || Math.random() < 0.8) triggerVARReplay()
    } else if (event === 'offside') {
      audioEngine.playRefereeWhistle('short')
      audioEngine.playCrowdReaction('boo')
      triggerVARReplay()
    } else {
      audioEngine.playRefereeWhistle('short')
    }

    setTimeout(() => {
      useGameStore.getState().setRefereeEvent(null)
      useGameStore.getState().setOffsideData(null)
      isRuleProcessing.current = false
    }, duration)
  }

  useFrame((_, delta) => {
    if (rigidBodyRef.current && meshRef.current) {
      const pos = rigidBodyRef.current.translation()
      const vel = rigidBodyRef.current.linvel()
      const ang = rigidBodyRef.current.angvel()
      const store = useGameStore.getState()

      // --- SOCCER RULES & REFEREE ENGINE ---
      if (!isRuleProcessing.current && store.matchStatus === 'playing') {
        // 1. GOAL DETECTION (Goal line is at X = ±52.5, goalposts at Z = ±3.7, height Y < 2.5)
        if (Math.abs(pos.z) < 3.8 && pos.y < 2.6) {
          if (pos.x > 52.5) {
            store.addTeam1Goal()
            restartWithEvent('goal', { x: 0, y: 1, z: 0 }, 4000, true)
            return
          } else if (pos.x < -52.5) {
            store.addTeam2Goal()
            restartWithEvent('goal', { x: 0, y: 1, z: 0 }, 4000, true)
            return
          }
        }
        // Goalpost impact ring sound check
        else if (Math.abs(pos.z) >= 3.6 && Math.abs(pos.z) <= 3.9 && pos.y <= 2.7 && Math.abs(pos.x) >= 52.3 && Math.abs(pos.x) <= 52.8) {
          audioEngine.playGoalpostHit()
        }

        // 2. OFFSIDE RULE DETECTION DURING PASSING IN OPEN GAMEPLAY
        if (store.lastPasserId && store.lastTouchPlayerId && store.lastPasserId !== store.lastTouchPlayerId) {
          const { team1Players, team2Players, playerPositions, lastTouchTeam } = store
          const receivingPlayer = (lastTouchTeam === 1 ? team1Players : team2Players).find(p => p.id === store.lastTouchPlayerId)
          
          if (receivingPlayer && receivingPlayer.position === 'forward') {
            const receiverCoord = playerPositions[receivingPlayer.id]
            const oppCoords = (lastTouchTeam === 1 ? team2Players : team1Players).map(p => playerPositions[p.id]).filter(Boolean) as [number, number, number][]
            
            if (receiverCoord && oppCoords.length > 2) {
              const defX = checkOffsideRule(lastTouchTeam, receiverCoord, pos.x, oppCoords)
              if (defX !== null) {
                store.setOffsideData({
                  ballX: pos.x,
                  receiverId: receivingPlayer.id,
                  receiverX: receiverCoord[0],
                  defenderX: defX,
                  timestamp: Date.now()
                })
                restartWithEvent('offside', { x: defX, y: 1, z: receiverCoord[2] }, 5000, false)
                return
              }
            }
          }
          store.setLastPasserId(null) // Consume pass verification
        }

        // 3. THROW-IN DETECTION (Touchline sideline is at Z = ±34.2)
        if (Math.abs(pos.z) > 34.2) {
          const clampedX = Math.min(50, Math.max(-50, pos.x))
          const sideZ = pos.z > 0 ? 33.5 : -33.5
          restartWithEvent('throw-in', { x: clampedX, y: 1, z: sideZ }, 2500)
          return
        }

        // 4. CORNER KICK OR GOAL KICK DETECTION
        if (Math.abs(pos.x) > 52.6 && Math.abs(pos.z) >= 3.8) {
          const { lastTouchTeam } = store
          if (pos.x > 52.6) {
            if (lastTouchTeam === 1) {
              restartWithEvent('goal-kick', { x: 47, y: 1, z: 0 })
            } else {
              restartWithEvent('corner', { x: 52, y: 1, z: pos.z > 0 ? 33 : -33 })
            }
          } else {
            if (lastTouchTeam === 2) {
              restartWithEvent('goal-kick', { x: -47, y: 1, z: 0 })
            } else {
              restartWithEvent('corner', { x: -52, y: 1, z: pos.z > 0 ? 33 : -33 })
            }
          }
          return
        }
      }

      // Handle physical kick impulse triggered by player controls
      const currentKick = store.kickImpulse
      if (currentKick && (currentKick[0] !== 0 || currentKick[1] !== 0 || currentKick[2] !== 0)) {
        rigidBodyRef.current.applyImpulse(
          { x: currentKick[0], y: currentKick[1], z: currentKick[2] },
          true
        )
        const kickMagnitude = Math.hypot(currentKick[0], currentKick[1], currentKick[2])
        audioEngine.playBallKick(Math.min(1.0, kickMagnitude / 10))
        store.applyKick(null)
      }

      // Handle dribbling velocity override
      const dribbleVel = store.dribbleVelocity
      if (dribbleVel) {
        rigidBodyRef.current.setLinvel({ x: dribbleVel[0], y: vel.y, z: dribbleVel[2] }, true)
        store.setDribbleVelocity(null)
      }

      // --- MAGNUS AERODYNAMIC SPIN EFFECT (Curve / Banana Shots) ---
      const speedXZ = Math.hypot(vel.x, vel.z)
      const spinMag = Math.hypot(ang.x, ang.y, ang.z)
      if (pos.y > 0.6 && speedXZ > 6.0 && spinMag > 2.0) {
        // F_magnus = C_m * (omega x v)
        const magnusCoeff = 0.0028
        const crossX = ang.y * vel.z - ang.z * vel.y
        const crossZ = ang.x * vel.y - ang.y * vel.x
        
        rigidBodyRef.current.setLinvel(
          {
            x: vel.x + crossX * magnusCoeff * (delta * 60),
            y: vel.y,
            z: vel.z + crossZ * magnusCoeff * (delta * 60),
          },
          true
        )
      }

      setBallPosition([pos.x, pos.y, pos.z])
      setBallVelocity([vel.x, vel.y, vel.z])

      // Authentic Turf vs Aerial Aerodynamic Friction
      if (speedXZ > 0.05) {
        const frictionFactor = pos.y < 0.55 ? 0.984 : 0.997
        rigidBodyRef.current.setLinvel(
          {
            x: vel.x * frictionFactor,
            y: vel.y,
            z: vel.z * frictionFactor,
          },
          true
        )
      } else if (pos.y < 0.55 && speedXZ > 0 && speedXZ <= 0.05) {
        rigidBodyRef.current.setLinvel({ x: 0, y: vel.y, z: 0 }, true)
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
      }

      // Safety bounding check if ball flies outside stadium boundary walls
      if (Math.abs(pos.x) > 65 || Math.abs(pos.z) > 45 || pos.y < -5 || pos.y > 35) {
        rigidBodyRef.current.setTranslation({ x: 0, y: 2, z: 0 }, true)
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      }
    }
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 1, 0]}
      mass={ballMass}
      linearDamping={0.1}
      angularDamping={1.1}
      restitution={0.65}
      friction={0.65}
      colliders={false}
    >
      <Trail width={0.4} length={14} color={'#facc15'} attenuation={(t) => t * t}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <sphereGeometry args={[ballRadius, 32, 32]} />
          <meshStandardMaterial
            color={0xffffff}
            roughness={0.25}
            metalness={0.2}
            map={createBallTexture()}
          />
        </mesh>
      </Trail>
      <BallCollider args={[ballRadius]} />
    </RigidBody>
  )
}

function createBallTexture() {
  if (typeof document === 'undefined') return undefined
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const ctx = canvas.getContext('2d')
  if (!ctx) return undefined

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 256, 256)

  ctx.fillStyle = '#09090b'
  for (let y = 0; y < 256; y += 64) {
    for (let x = 0; x < 256; x += 64) {
      if ((x + y) % 128 === 0) {
        ctx.beginPath()
        ctx.arc(x + 32, y + 32, 16, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}
