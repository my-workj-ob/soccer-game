'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore, RefereeEvent } from '@/lib/game-store'
import { checkOffsideRule } from '@/lib/football-ai'
import { audioEngine } from '@/lib/sound-engine'
import { triggerVARReplay } from './var-replay'

// A real football: diameter ≈ 22cm → radius 0.11m
// Field scale: 1 unit = 1 metre.
const BALL_RADIUS = 0.11
const BALL_MASS = 0.43

/**
 * Generates a realistic black-and-white football panel texture (Jabulani/Adidas style).
 */
function createBallTexture(): THREE.CanvasTexture | undefined {
  if (typeof document === 'undefined') return undefined
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // White base
  ctx.fillStyle = '#f8f8f8'
  ctx.fillRect(0, 0, size, size)

  // Draw 6 curvilinear panels (simplified approximation)
  const panels = [
    { cx: 256, cy: 256, rx: 110, ry: 80, rot: 0 },
    { cx: 256, cy: 90, rx: 75, ry: 55, rot: 0.4 },
    { cx: 256, cy: 422, rx: 75, ry: 55, rot: -0.4 },
    { cx: 90, cy: 200, rx: 75, ry: 55, rot: 1.0 },
    { cx: 422, cy: 200, rx: 75, ry: 55, rot: -1.0 },
    { cx: 90, cy: 312, rx: 75, ry: 55, rot: 2.1 },
    { cx: 422, cy: 312, rx: 75, ry: 55, rot: -2.1 },
    { cx: 180, cy: 90, rx: 60, ry: 42, rot: 0.8 },
    { cx: 332, cy: 90, rx: 60, ry: 42, rot: -0.8 },
  ]

  for (const p of panels) {
    ctx.save()
    ctx.translate(p.cx, p.cy)
    ctx.rotate(p.rot)
    ctx.beginPath()
    ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#111111'
    ctx.fill()
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
  }

  // Subtle seam lines
  ctx.strokeStyle = 'rgba(60,60,60,0.3)'
  ctx.lineWidth = 2.5
  ctx.setLineDash([8, 6])

  const drawCurvedSeam = (pts: [number, number][]) => {
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2
      const my = (pts[i][1] + pts[i + 1][1]) / 2
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my)
    }
    ctx.stroke()
  }

  drawCurvedSeam([[80, 180], [180, 256], [80, 332]])
  drawCurvedSeam([[432, 180], [332, 256], [432, 332]])
  drawCurvedSeam([[180, 80], [256, 180], [332, 80]])
  drawCurvedSeam([[180, 432], [256, 332], [332, 432]])

  ctx.setLineDash([])

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

export function FootballBall() {
  const rigidBodyRef = useRef<any>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const isRuleProcessing = useRef(false)
  const kickConsumed = useRef(false) // Prevent multi-kick in same frame

  const ballTex = useMemo(() => createBallTexture(), [])

  const { setBallPosition, setBallVelocity, setRefereeEvent, setOffsideData } = useGameStore()

  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation({ x: 0, y: BALL_RADIUS + 0.01, z: 0 }, true)
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
    if (!rigidBodyRef.current || !meshRef.current) return

    const pos = rigidBodyRef.current.translation()
    const vel = rigidBodyRef.current.linvel()
    const ang = rigidBodyRef.current.angvel()
    const store = useGameStore.getState()

    // Rotate mesh visually with angular velocity (ball roll)
    if (meshRef.current) {
      const angMag = Math.hypot(ang.x, ang.y, ang.z)
      if (angMag > 0.01) {
        meshRef.current.rotation.x += ang.z * delta * 0.8
        meshRef.current.rotation.z -= ang.x * delta * 0.8
      }
    }

    // ─── MATCH RULES ───────────────────────────────────────────────
    if (!isRuleProcessing.current && store.matchStatus === 'playing') {

      // 1. GOAL DETECTION (goal line at X = ±52.5, posts at Z = ±3.66, crossbar at Y = 2.44)
      if (Math.abs(pos.z) <= 3.7 && pos.y <= 2.5) {
        if (pos.x > 52.5) {
          store.addTeam1Goal()
          restartWithEvent('goal', { x: 0, y: BALL_RADIUS + 0.1, z: 0 }, 4000, true)
          return
        } else if (pos.x < -52.5) {
          store.addTeam2Goal()
          restartWithEvent('goal', { x: 0, y: BALL_RADIUS + 0.1, z: 0 }, 4000, true)
          return
        }
      }

      // Goalpost ring sound
      if (
        Math.abs(pos.z) >= 3.6 && Math.abs(pos.z) <= 3.75 &&
        pos.y <= 2.6 && Math.abs(pos.x) >= 52.3 && Math.abs(pos.x) <= 52.7
      ) {
        audioEngine.playGoalpostHit()
      }

      // 2. OFFSIDE
      if (store.lastPasserId && store.lastTouchPlayerId && store.lastPasserId !== store.lastTouchPlayerId) {
        const { team1Players, team2Players, playerPositions, lastTouchTeam } = store
        const receivingPlayer = (lastTouchTeam === 1 ? team1Players : team2Players).find(
          (p) => p.id === store.lastTouchPlayerId
        )
        if (receivingPlayer && receivingPlayer.position === 'forward') {
          const receiverCoord = playerPositions[receivingPlayer.id]
          const oppCoords = (lastTouchTeam === 1 ? team2Players : team1Players)
            .map((p) => playerPositions[p.id])
            .filter(Boolean) as [number, number, number][]
          if (receiverCoord && oppCoords.length > 2) {
            const defX = checkOffsideRule(lastTouchTeam, receiverCoord, pos.x, oppCoords)
            if (defX !== null) {
              store.setOffsideData({
                ballX: pos.x,
                receiverId: receivingPlayer.id,
                receiverX: receiverCoord[0],
                defenderX: defX,
                timestamp: Date.now(),
              })
              restartWithEvent('offside', { x: defX, y: BALL_RADIUS + 0.1, z: receiverCoord[2] }, 4500)
              return
            }
          }
          store.setLastPasserId(null)
        }
      }

      // 3. THROW-IN (touchline at Z = ±34)
      if (Math.abs(pos.z) > 34.1) {
        const sideZ = pos.z > 0 ? 33.5 : -33.5
        const clampedX = THREE.MathUtils.clamp(pos.x, -50, 50)
        restartWithEvent('throw-in', { x: clampedX, y: BALL_RADIUS + 0.1, z: sideZ }, 2000)
        return
      }

      // 4. CORNER / GOAL KICK
      if (Math.abs(pos.x) > 52.6 && Math.abs(pos.z) > 3.8) {
        const { lastTouchTeam } = store
        if (pos.x > 52.6) {
          lastTouchTeam === 1
            ? restartWithEvent('goal-kick', { x: 47, y: BALL_RADIUS + 0.1, z: 0 })
            : restartWithEvent('corner', { x: 52, y: BALL_RADIUS + 0.1, z: pos.z > 0 ? 34 : -34 })
        } else {
          lastTouchTeam === 2
            ? restartWithEvent('goal-kick', { x: -47, y: BALL_RADIUS + 0.1, z: 0 })
            : restartWithEvent('corner', { x: -52, y: BALL_RADIUS + 0.1, z: pos.z > 0 ? 34 : -34 })
        }
        return
      }
    }

    // ─── KICK IMPULSE ─────────────────────────────────────────────
    const kick = store.kickImpulse
    if (kick && !kickConsumed.current && (kick[0] !== 0 || kick[1] !== 0 || kick[2] !== 0)) {
      kickConsumed.current = true
      rigidBodyRef.current.applyImpulse({ x: kick[0], y: kick[1], z: kick[2] }, true)
      const mag = Math.hypot(kick[0], kick[1], kick[2])
      audioEngine.playBallKick(Math.min(1, mag / 10))
      store.applyKick(null)
      // Allow next kick next frame
      setTimeout(() => { kickConsumed.current = false }, 16)
    }

    // ─── DRIBBLE VELOCITY (soft push rather than teleport) ────────
    const dribble = store.dribbleVelocity
    if (dribble) {
      // Blend dribble direction with current velocity for natural feel
      const blendX = vel.x * 0.3 + dribble[0] * 0.7
      const blendZ = vel.z * 0.3 + dribble[2] * 0.7
      rigidBodyRef.current.setLinvel({ x: blendX, y: vel.y, z: blendZ }, true)
      store.setDribbleVelocity(null)
    }

    // ─── MAGNUS AERODYNAMIC EFFECT ────────────────────────────────
    const speedXZ = Math.hypot(vel.x, vel.z)
    const spinMag = Math.hypot(ang.x, ang.y, ang.z)
    if (pos.y > BALL_RADIUS * 2 && speedXZ > 5 && spinMag > 1.5) {
      const c = 0.0035 * (delta * 60)
      rigidBodyRef.current.setLinvel(
        {
          x: vel.x + (ang.y * vel.z - ang.z * vel.y) * c,
          y: vel.y,
          z: vel.z + (ang.x * vel.y - ang.y * vel.x) * c,
        },
        true
      )
    }

    // ─── TURF FRICTION (rolling resistance on ground) ─────────────
    // Only apply our friction when ball is on the ground AND moving
    // — do NOT fight Rapier's solver in the air.
    if (pos.y < BALL_RADIUS + 0.05 && speedXZ > 0.05) {
      const turfFriction = 0.982
      rigidBodyRef.current.setLinvel(
        { x: vel.x * turfFriction, y: vel.y, z: vel.z * turfFriction },
        true
      )
    } else if (pos.y < BALL_RADIUS + 0.05 && speedXZ <= 0.05) {
      // Stop rolling on ground
      rigidBodyRef.current.setLinvel({ x: 0, y: vel.y, z: 0 }, true)
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }

    // ─── UPDATE STORE (throttled by store's own threshold guard) ──
    setBallPosition([pos.x, pos.y, pos.z])
    setBallVelocity([vel.x, vel.y, vel.z])

    // ─── SAFETY BOUNDS ────────────────────────────────────────────
    if (Math.abs(pos.x) > 70 || Math.abs(pos.z) > 50 || pos.y < -5 || pos.y > 40) {
      rigidBodyRef.current.setTranslation({ x: 0, y: 1, z: 0 }, true)
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, BALL_RADIUS + 0.05, 0]}
      mass={BALL_MASS}
      linearDamping={0.08}
      angularDamping={0.9}
      restitution={0.72}
      friction={0.5}
      colliders={false}
    >
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial
          map={ballTex}
          color="#f5f5f5"
          roughness={0.4}
          metalness={0.05}
          envMapIntensity={0.6}
        />
      </mesh>
      <BallCollider args={[BALL_RADIUS]} />
    </RigidBody>
  )
}
