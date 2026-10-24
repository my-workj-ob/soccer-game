'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore, Player } from '@/lib/game-store'
import {
  calculatePassImpulse,
  findBestPassTarget,
  calculateShotImpulse,
  calculateTacticalAnchor,
  evaluateAIBallCarrierAction,
} from '@/lib/football-ai'
import { audioEngine } from '@/lib/sound-engine'

export interface PlayerCharacterProps {
  position: [number, number, number]
  team: 1 | 2
  isSelected?: boolean
  onSelected?: () => void
  playerData?: Player
  jerseyNumber?: number
}

// ── Accurate FIFA/EA kit palette ───────────────────────────────────────────
const TEAM_KITS = {
  1: {
    jersey: '#fafafa',
    trim: '#d4a91e',
    shorts: '#f0f0f0',
    socks: '#fafafa',
    boot: '#d4a91e',
    gkJersey: '#eab308',
    gkShorts: '#1a1a1a',
  },
  2: {
    jersey: '#75b2dd',
    trim: '#0a1e5c',
    shorts: '#0a1e5c',
    socks: '#75b2dd',
    boot: '#22d3ee',
    gkJersey: '#16a34a',
    gkShorts: '#1a1a1a',
  },
}

// ── Height references ─────────────────────────────────────────────────────
const BASELINE_HEIGHT = 1.85 // metres

// Skinned geometry body proportions (all relative to height 1.85m)
const BODY = {
  // Torso
  chestW: 0.38, chestH: 0.32, chestD: 0.21,
  absW: 0.32, absH: 0.22, absD: 0.19,
  // Shoulders
  shoulderRadius: 0.1,
  upperArmR: 0.055, upperArmLen: 0.28,
  forearmR: 0.046, forearmLen: 0.26,
  // Hips
  hipW: 0.34, hipH: 0.14, hipD: 0.20,
  // Legs
  thighR: 0.085, thighLen: 0.42,
  calfR: 0.068, calfLen: 0.38,
  // Feet
  bootW: 0.10, bootH: 0.09, bootL: 0.22,
  // Head
  headR: 0.115,
  neckR: 0.055, neckLen: 0.10,
}

export function PlayerCharacter({
  position,
  team,
  isSelected,
  onSelected,
  playerData,
  jerseyNumber = 7,
}: PlayerCharacterProps) {
  const rigidBodyRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  const torsoRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const indicatorRef = useRef<THREE.Mesh>(null)

  // Leg joint refs
  const leftHipRef = useRef<THREE.Group>(null)
  const leftKneeRef = useRef<THREE.Group>(null)
  const rightHipRef = useRef<THREE.Group>(null)
  const rightKneeRef = useRef<THREE.Group>(null)

  // Arm joint refs
  const leftShoulderRef = useRef<THREE.Group>(null)
  const leftElbowRef = useRef<THREE.Group>(null)
  const rightShoulderRef = useRef<THREE.Group>(null)
  const rightElbowRef = useRef<THREE.Group>(null)

  const keysPressed = useRef<{ [key: string]: boolean }>({})
  const aiCooldown = useRef(0) // AI action cooldown in seconds
  const [isTackling, setIsTackling] = useState(false)
  const [skillMoveTimer, setSkillMoveTimer] = useState(0)

  const kit = TEAM_KITS[team]
  const isGK = playerData?.position === 'goalkeeper'
  const jerseyColor = isGK ? kit.gkJersey : kit.jersey
  const trimColor = kit.trim
  const shortsColor = isGK ? kit.gkShorts : kit.shorts
  const socksColor = isGK ? '#555555' : kit.socks
  const bootColor = kit.boot
  const skinColor = '#d4956a'

  const realHeight = playerData?.height || BASELINE_HEIGHT
  const heightScale = realHeight / BASELINE_HEIGHT

  // Skin materials (memoised-ish)
  const matJersey = { color: jerseyColor, roughness: 0.5 }
  const matShorts = { color: shortsColor, roughness: 0.55 }
  const matSocks = { color: socksColor, roughness: 0.45 }
  const matBoot = { color: bootColor, roughness: 0.15, metalness: 0.15 }
  const matSkin = { color: skinColor, roughness: 0.7 }
  const matTrim = { color: trimColor, roughness: 0.3, metalness: 0.1 }

  // ── Keyboard bindings ─────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true
      if (!isSelected) return
      if (e.key === 'Tab') { e.preventDefault(); useGameStore.getState().switchPlayerToClosest() }
      if ((e.key === 'c' || e.key === 'e') && !isTackling && useGameStore.getState().ballPossession !== team) {
        triggerSlideTackle()
      }
      if (e.key === 'z' || e.key === 'r') setSkillMoveTimer(0.4)
    }
    const up = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [isSelected, isTackling, team])

  const triggerSlideTackle = () => {
    setIsTackling(true)
    if (rigidBodyRef.current && groupRef.current) {
      const rot = groupRef.current.rotation.y
      rigidBodyRef.current.setLinvel({ x: Math.sin(rot) * 22, y: 0.15, z: Math.cos(rot) * 22 }, true)
    }
    setTimeout(() => setIsTackling(false), 800)
  }

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return
    const store = useGameStore.getState()

    // Dismissed (red card)
    if (playerData?.id && store.redCards[playerData.id]) {
      rigidBodyRef.current.setTranslation({ x: -120, y: -10, z: 0 }, true)
      return
    }

    const pos = rigidBodyRef.current.translation()
    const vel = rigidBodyRef.current.linvel()
    const { ballPosition, matchStatus, refereeEvent, tacticalPreset, playerDistancesToBall } = store

    // Register position and distance
    const distToBall = Math.hypot(pos.x - ballPosition[0], pos.z - ballPosition[2])
    if (playerData?.id) {
      store.updatePlayerDistance(playerData.id, distToBall)
      store.updatePlayerPosition(playerData.id, [pos.x, pos.y, pos.z])
    }

    // ── Selected player indicator pulse ──────────────────────────
    if (isSelected && indicatorRef.current) {
      indicatorRef.current.rotation.y += delta * 3
      indicatorRef.current.position.y = 3.0 + Math.sin(state.clock.elapsedTime * 5) * 0.12
    }

    // ── Freeze on non-playing state ──────────────────────────────
    if (matchStatus !== 'playing') {
      rigidBodyRef.current.setLinvel({ x: 0, y: vel.y, z: 0 }, true)
      return
    }

    const teammateIds = team === 1 ? store.team1Players.map(p => p.id) : store.team2Players.map(p => p.id)
    const opponentIds = team === 1 ? store.team2Players.map(p => p.id) : store.team1Players.map(p => p.id)
    const myDist = playerDistancesToBall[playerData?.id || ''] ?? 999
    const minTeamDist = Math.min(...teammateIds.map(id => playerDistancesToBall[id] ?? 999))
    const isClosestToBall = myDist <= minTeamDist + 0.1

    // Possession grab (contact range — tighter than before)
    if (distToBall < 1.5 && store.ballPossession !== team) {
      store.setBallPossession(team)
    }

    let moveSpeedMagnitude = 0

    // ─────────────────────────────────────────────────────────────
    // TACKLE FOUL DETECTION
    // ─────────────────────────────────────────────────────────────
    if (isTackling && groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -Math.PI / 2.5, 0.2)
      for (const oppId of opponentIds) {
        const oppPos = store.playerPositions[oppId]
        if (oppPos) {
          const d = Math.hypot(pos.x - oppPos[0], pos.z - oppPos[2])
          if (d < 2.0 && distToBall > 1.5 && !store.refereeEvent) {
            const behind = Math.random() < 0.25
            store.addFoul(team, playerData?.id, behind ? 'red' : Math.random() < 0.6 ? 'yellow' : 'none')
            store.setRefereeEvent('foul')
            audioEngine.playRefereeWhistle('short')
            audioEngine.playCrowdReaction('boo')
            setTimeout(() => store.setRefereeEvent(null), 3000)
            break
          }
        }
      }
    } else if (groupRef.current && groupRef.current.rotation.x !== 0) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.18)
    }

    // ─────────────────────────────────────────────────────────────
    // SKILL MOVE (body feint rotation)
    // ─────────────────────────────────────────────────────────────
    if (skillMoveTimer > 0) {
      setSkillMoveTimer(prev => Math.max(0, prev - delta))
      if (groupRef.current) groupRef.current.rotation.y += delta * 12
    }

    // ─────────────────────────────────────────────────────────────
    // GOAL CELEBRATION
    // ─────────────────────────────────────────────────────────────
    const t = state.clock.elapsedTime
    if (refereeEvent === 'goal' && distToBall < 25) {
      if (leftShoulderRef.current) leftShoulderRef.current.rotation.z = Math.PI / 2.5
      if (rightShoulderRef.current) rightShoulderRef.current.rotation.z = -Math.PI / 2.5
      if (torsoRef.current) torsoRef.current.position.y = 0.82 * heightScale + Math.abs(Math.sin(t * 9)) * 0.3
      if (groupRef.current) groupRef.current.rotation.y += delta * 5
      return
    }

    // ─────────────────────────────────────────────────────────────
    // AI BEHAVIOUR (non-selected players)
    // ─────────────────────────────────────────────────────────────
    if (!isSelected && !isTackling) {

      // ── GK AI ────────────────────────────────────────────────
      if (isGK) {
        const goalX = team === 1 ? -49.5 : 49.5
        const targetZ = THREE.MathUtils.clamp(ballPosition[2], -3.5, 3.5)
        const dz = targetZ - pos.z
        const dx = goalX - pos.x

        // Smooth velocity instead of instant setLinvel
        const desiredVX = dx * 3.2
        const desiredVZ = dz * 4.2
        rigidBodyRef.current.setLinvel(
          {
            x: THREE.MathUtils.lerp(vel.x, desiredVX, 0.25),
            y: vel.y,
            z: THREE.MathUtils.lerp(vel.z, desiredVZ, 0.35),
          },
          true
        )

        if (groupRef.current) {
          groupRef.current.rotation.y = team === 1 ? Math.PI / 2 : -Math.PI / 2
          const ballSpeedXZ = Math.hypot(store.ballVelocity[0], store.ballVelocity[2])
          if (distToBall < 10 && ballSpeedXZ > 10) {
            const diveDir = ballPosition[2] < pos.z ? -1 : 1
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, diveDir * 1.1, 0.2)
          } else {
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.12)
          }
        }

        if (distToBall < 4.0 && Math.abs(pos.x) > 43) {
          store.setLastTouchTeam(team, playerData?.id)
          store.setBallPossession(team)
          const target = findBestPassTarget(pos, playerData?.id, team, teammateIds, store.playerPositions, false)
          if (target) {
            store.applyKick(calculatePassImpulse(pos, { x: target[0], y: target[1], z: target[2] }, false, team))
          } else {
            store.applyKick([team === 1 ? 7 : -7, 2, (Math.random() - 0.5) * 3])
          }
        }
        return
      }

      // ── Outfield AI ──────────────────────────────────────────
      const hasPossession = store.ballPossession === team
      const role = playerData?.position || 'midfielder'
      const anchor = calculateTacticalAnchor(role, position, ballPosition, team, hasPossession, tacticalPreset)

      let targetX = anchor[0]
      let targetZ = anchor[2]

      if (isClosestToBall && (distToBall < 18 || !hasPossession)) {
        targetX = ballPosition[0]
        targetZ = ballPosition[2]
      } else if (!hasPossession && role === 'defender' && opponentIds.length > 0) {
        // Intelligent defender marking: stay goalside of nearest attacker
        let nearestOppPos: [number, number, number] | null = null
        let minOppDist = Infinity
        for (const oppId of opponentIds) {
          const oppPos = store.playerPositions[oppId]
          if (oppPos) {
            const d = Math.hypot(oppPos[0] - pos.x, oppPos[2] - pos.z)
            if (d < minOppDist) {
              minOppDist = d
              nearestOppPos = oppPos
            }
          }
        }
        if (nearestOppPos && minOppDist < 26) {
          const goalX = team === 1 ? -52.5 : 52.5
          targetX = THREE.MathUtils.lerp(nearestOppPos[0], goalX, 0.35)
          targetZ = THREE.MathUtils.lerp(nearestOppPos[2], anchor[2], 0.3)
        }
      }

      const dx = targetX - pos.x
      const dz = targetZ - pos.z
      const distToTarget = Math.hypot(dx, dz)

      if (distToTarget > 0.5) {
        const speed = distToBall < 8 ? 15 : 10
        moveSpeedMagnitude = speed
        const norm = distToTarget || 1
        rigidBodyRef.current.setLinvel({ x: (dx / norm) * speed, y: vel.y, z: (dz / norm) * speed }, true)
        if (groupRef.current && distToTarget > 0.1 && skillMoveTimer === 0) {
          groupRef.current.rotation.y = Math.atan2(dx, dz)
        }
      } else {
        rigidBodyRef.current.setLinvel({ x: vel.x * 0.75, y: vel.y, z: vel.z * 0.75 }, true)
      }

      // ── AI ball action (cooldown-gated, not random per frame) ─
      aiCooldown.current = Math.max(0, aiCooldown.current - delta)
      if (distToBall < 2.0 && !store.kickImpulse && aiCooldown.current <= 0) {
        aiCooldown.current = 0.35 + Math.random() * 0.2 // 350–550ms between actions
        store.setLastTouchTeam(team, playerData?.id)
        store.setBallPossession(team)
        const action = evaluateAIBallCarrierAction(pos, team, distToBall, store.playerPositions, opponentIds, tacticalPreset)

        if (action === 'shoot') {
          store.applyKick(calculateShotImpulse(pos, team, 0.05))
        } else if (action === 'pass') {
          const target = findBestPassTarget(pos, playerData?.id, team, teammateIds, store.playerPositions, false)
          if (target) {
            store.setLastPasserId(playerData?.id || null)
            store.applyKick(calculatePassImpulse(pos, { x: target[0], y: target[1], z: target[2] }, false, team))
          }
        } else {
          // Dribble: soft push
          if (groupRef.current) {
            const dirX = Math.sin(groupRef.current.rotation.y)
            const dirZ = Math.cos(groupRef.current.rotation.y)
            store.setDribbleVelocity([dirX * 14, 0, dirZ * 14])
          }
        }
      }

    } else if (isSelected && !isTackling) {
      // ─────────────────────────────────────────────────────────
      // PLAYER CONTROL
      // ─────────────────────────────────────────────────────────
      const { moveInput, activeAction, isSprinting } = store
      const wantsSprint = isSprinting || keysPressed.current['shift'] || keysPressed.current['l']
      const stamina = store.playerStamina
      const canSprint = stamina > 8
      const sprinting = wantsSprint && canSprint
      const paceFactor = (playerData?.stats?.pace || 82) / 82
      const baseSpeed = sprinting
        ? (stamina < 30 ? 17 : 24) * paceFactor
        : 14 * Math.min(1.1, paceFactor)

      let mx = 0, mz = 0
      if (keysPressed.current['w'] || keysPressed.current['arrowup']) mx += team === 1 ? 1 : -1
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) mx -= team === 1 ? 1 : -1
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) mz -= team === 1 ? 1 : -1
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) mz += team === 1 ? 1 : -1
      if (Math.abs(moveInput.y) > 0.1) mx += -moveInput.y * (team === 1 ? 1 : -1)
      if (Math.abs(moveInput.x) > 0.1) mz += moveInput.x * (team === 1 ? 1 : -1)

      const mag = Math.hypot(mx, mz)
      moveSpeedMagnitude = mag > 0 ? baseSpeed : 0

      if (sprinting && mag > 0) store.setPlayerStamina(stamina - delta * 15)
      else if (!sprinting) store.setPlayerStamina(stamina + delta * (mag > 0 ? 4 : 11))

      if (mag > 0) {
        rigidBodyRef.current.setLinvel({ x: (mx / mag) * baseSpeed, y: vel.y, z: (mz / mag) * baseSpeed }, true)
        if (groupRef.current && skillMoveTimer === 0) {
          groupRef.current.rotation.y = Math.atan2(mx, mz)
        }
      } else {
        // Natural deceleration — don't hard-zero velocity
        rigidBodyRef.current.setLinvel({ x: vel.x * 0.78, y: vel.y, z: vel.z * 0.78 }, true)
      }

      // ── Action inputs ─────────────────────────────────────────
      const shooting = activeAction === 'shoot' || keysPressed.current[' '] || keysPressed.current['k']
      const through = activeAction === 'through' || keysPressed.current['i']
      const passing = activeAction === 'pass' || keysPressed.current['j'] || through
      const tackleAction = activeAction === 'tackle'
      const skillAction = activeAction === 'skill'

      if (tackleAction && store.ballPossession !== team) {
        triggerSlideTackle(); store.triggerAction(null)
      } else if (skillAction && distToBall < 4) {
        setSkillMoveTimer(0.4); store.triggerAction(null)
      } else if (distToBall < 2.5 && (shooting || passing)) {
        store.setLastTouchTeam(team, playerData?.id)
        store.setBallPossession(team)
        if (shooting) {
          const err = stamina < 30 ? 0.22 : 0.0
          store.applyKick(calculateShotImpulse(pos, team, err))
        } else {
          const target = findBestPassTarget(pos, playerData?.id, team, teammateIds, store.playerPositions, through)
          if (target) {
            store.setLastPasserId(playerData?.id || null)
            store.applyKick(calculatePassImpulse(pos, { x: target[0], y: target[1], z: target[2] }, through, team))
          }
        }
        if (activeAction) store.triggerAction(null)
      } else if (distToBall < 2.2 && mag > 0.5) {
        // Dribble push
        store.setLastTouchTeam(team, playerData?.id)
        store.setBallPossession(team)
        if (groupRef.current) {
          const dirX = Math.sin(groupRef.current.rotation.y)
          const dirZ = Math.cos(groupRef.current.rotation.y)
          const toPlayerX = pos.x - ballPosition[0]
          const toPlayerZ = pos.z - ballPosition[2]
          store.setDribbleVelocity([
            dirX * baseSpeed * 0.95 + toPlayerX * 1.2,
            0,
            dirZ * baseSpeed * 0.95 + toPlayerZ * 1.2,
          ])
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // HEAD TRACKING (ball awareness)
    // ─────────────────────────────────────────────────────────────
    if (headRef.current && groupRef.current && !isTackling) {
      const toBallX = ballPosition[0] - pos.x
      const toBallZ = ballPosition[2] - pos.z
      const globalAngle = Math.atan2(toBallX, toBallZ)
      let relYaw = globalAngle - groupRef.current.rotation.y
      relYaw = ((relYaw + Math.PI) % (Math.PI * 2)) - Math.PI
      if (relYaw < -Math.PI) relYaw += Math.PI * 2
      if (Math.abs(relYaw) < 1.5 && distToBall < 28) {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, relYaw * 0.6, 0.12)
        const pitch = (ballPosition[1] - (pos.y + 1.65 * heightScale)) / Math.max(distToBall, 1)
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -pitch * 0.45, 0.12)
      } else {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.1)
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.1)
      }
    }

    // ─────────────────────────────────────────────────────────────
    // PROCEDURAL LOCOMOTION ANIMATION
    // Improved: proper knee bend on calf (joint pivot at top of calf mesh)
    // animSpeed capped so legs don't spin at high velocity
    // ─────────────────────────────────────────────────────────────
    const speed = Math.hypot(vel.x, vel.z)
    const strideFreq = THREE.MathUtils.clamp(speed * 1.4, 0, 8.5)
    const strideDelta = strideFreq * delta

    if (speed > 0.4 && !isTackling) {
      const phase = (state.clock.elapsedTime * strideFreq) % (Math.PI * 2)
      const swing = Math.sin(phase)
      const swingCos = Math.cos(phase)

      // Torso lean into direction of travel, and slight counter-rotation with stride
      if (torsoRef.current) {
        const forwardLean = THREE.MathUtils.clamp(speed * 0.015, 0.05, 0.22)
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, forwardLean, 0.12)
        torsoRef.current.rotation.z = THREE.MathUtils.lerp(torsoRef.current.rotation.z, swing * 0.04, 0.1)
        // Vertical body bob
        torsoRef.current.position.y = (0.82 * heightScale) + Math.abs(swingCos) * 0.04
      }

      // Hips: alternate swing (opposite to arms)
      if (leftHipRef.current) {
        leftHipRef.current.rotation.x = THREE.MathUtils.lerp(leftHipRef.current.rotation.x, -swing * 0.65, 0.18)
      }
      if (rightHipRef.current) {
        rightHipRef.current.rotation.x = THREE.MathUtils.lerp(rightHipRef.current.rotation.x, swing * 0.65, 0.18)
      }

      // Knees: flex backward when the hip swings forward (realistic knee bend)
      if (leftKneeRef.current) {
        const leftKneeFlex = swing > 0 ? swing * 0.7 : 0.05
        leftKneeRef.current.rotation.x = THREE.MathUtils.lerp(leftKneeRef.current.rotation.x, leftKneeFlex, 0.2)
      }
      if (rightKneeRef.current) {
        const rightKneeFlex = swing < 0 ? -swing * 0.7 : 0.05
        rightKneeRef.current.rotation.x = THREE.MathUtils.lerp(rightKneeRef.current.rotation.x, rightKneeFlex, 0.2)
      }

      // Arms: swing opposite to legs
      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = THREE.MathUtils.lerp(leftShoulderRef.current.rotation.x, swing * 0.55, 0.15)
        leftShoulderRef.current.rotation.z = THREE.MathUtils.lerp(leftShoulderRef.current.rotation.z, 0.14, 0.1)
      }
      if (rightShoulderRef.current) {
        rightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(rightShoulderRef.current.rotation.x, -swing * 0.55, 0.15)
        rightShoulderRef.current.rotation.z = THREE.MathUtils.lerp(rightShoulderRef.current.rotation.z, -0.14, 0.1)
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = THREE.MathUtils.lerp(leftElbowRef.current.rotation.x, -0.55 - Math.abs(swing) * 0.25, 0.15)
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = THREE.MathUtils.lerp(rightElbowRef.current.rotation.x, -0.55 - Math.abs(swing) * 0.25, 0.15)
      }

    } else if (!isTackling) {
      // ── IDLE BREATHING ──────────────────────────────────────────
      const breath = Math.sin(t * 2.8) * 0.012
      if (torsoRef.current) {
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, 0.04, 0.08)
        torsoRef.current.position.y = (0.82 * heightScale) + breath
      }
      const idle = (ref: React.RefObject<THREE.Group | THREE.Mesh | null>, targetX: number, targetZ = 0) => {
        if (!ref.current) return
        ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, targetX, 0.1)
        ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, targetZ, 0.1)
      }
      idle(leftHipRef, -0.04)
      idle(rightHipRef, 0.04)
      idle(leftKneeRef, 0.06)
      idle(rightKneeRef, 0.06)
      idle(leftShoulderRef, 0, 0.1)
      idle(rightShoulderRef, 0, -0.1)
      idle(leftElbowRef as any, -0.3)
      idle(rightElbowRef as any, -0.3)
    }
  })

  if (playerData?.id && useGameStore.getState().redCards[playerData.id]) return null

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      mass={76}
      linearDamping={2.5}
      angularDamping={5}
      enabledRotations={[false, true, false]}
      colliders={false}
    >
      <group
        ref={groupRef}
        scale={[1, heightScale, 1]}
        onClick={(e) => { e.stopPropagation(); onSelected?.() }}
      >
        {/* ═══ TORSO GROUP ═══════════════════════════════════════ */}
        <group ref={torsoRef} position={[0, 0.82, 0]}>

          {/* Chest */}
          <mesh position={[0, 0.34, 0]} castShadow>
            <boxGeometry args={[BODY.chestW, BODY.chestH, BODY.chestD]} />
            <meshStandardMaterial {...matJersey} />
          </mesh>

          {/* Collar strip */}
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[BODY.chestW + 0.02, 0.04, BODY.chestD + 0.01]} />
            <meshStandardMaterial {...matTrim} />
          </mesh>

          {/* Abdomen */}
          <mesh position={[0, 0.14, 0]} castShadow>
            <boxGeometry args={[BODY.absW, BODY.absH, BODY.absD]} />
            <meshStandardMaterial {...matJersey} />
          </mesh>

          {/* Shorts */}
          <mesh position={[0, -0.02, 0]} castShadow>
            <boxGeometry args={[BODY.hipW, BODY.hipH, BODY.hipD]} />
            <meshStandardMaterial {...matShorts} />
          </mesh>

          {/* Jersey name + number on back */}
          <group position={[0, 0.34, -BODY.chestD / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
            <Text fontSize={0.058} color={team === 1 ? '#111111' : '#ffffff'} anchorX="center" anchorY="middle" position={[0, 0.16, 0]} fontWeight="bold" letterSpacing={0.04}>
              {(playerData?.name || 'PLAYER').toUpperCase().slice(0, 9)}
            </Text>
            <Text fontSize={0.2} color={team === 1 ? '#111111' : '#ffffff'} anchorX="center" anchorY="middle" position={[0, -0.04, 0]} fontWeight="black">
              {jerseyNumber}
            </Text>
          </group>

          {/* ═══ LEFT ARM ══════════════════════════════════════════ */}
          <group ref={leftShoulderRef} position={[-(BODY.chestW / 2 + 0.06), 0.42, 0]}>
            {/* Shoulder cap */}
            <mesh castShadow>
              <sphereGeometry args={[BODY.shoulderRadius, 12, 10]} />
              <meshStandardMaterial {...matJersey} />
            </mesh>
            {/* Upper arm */}
            <mesh position={[-0.04, -BODY.upperArmLen / 2, 0]} castShadow>
              <cylinderGeometry args={[BODY.upperArmR, BODY.upperArmR * 0.9, BODY.upperArmLen, 10]} />
              <meshStandardMaterial {...matJersey} />
            </mesh>
            {/* Forearm (elbow pivot) */}
            <group ref={leftElbowRef} position={[-0.04, -BODY.upperArmLen, 0]}>
              <mesh position={[0, -BODY.forearmLen / 2, 0]} castShadow>
                <cylinderGeometry args={[BODY.forearmR, BODY.forearmR * 0.85, BODY.forearmLen, 10]} />
                <meshStandardMaterial {...matSkin} />
              </mesh>
              {/* Hand */}
              <mesh position={[0, -BODY.forearmLen - 0.04, 0]}>
                <sphereGeometry args={[0.042, 8, 8]} />
                <meshStandardMaterial {...matSkin} />
              </mesh>
            </group>
            {/* GK glove */}
            {isGK && (
              <mesh position={[-0.04, -BODY.upperArmLen - BODY.forearmLen - 0.06, 0]}>
                <boxGeometry args={[0.11, 0.14, 0.08]} />
                <meshStandardMaterial color="#ffffff" roughness={0.15} />
              </mesh>
            )}
          </group>

          {/* ═══ RIGHT ARM ═════════════════════════════════════════ */}
          <group ref={rightShoulderRef} position={[BODY.chestW / 2 + 0.06, 0.42, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[BODY.shoulderRadius, 12, 10]} />
              <meshStandardMaterial {...matJersey} />
            </mesh>
            <mesh position={[0.04, -BODY.upperArmLen / 2, 0]} castShadow>
              <cylinderGeometry args={[BODY.upperArmR, BODY.upperArmR * 0.9, BODY.upperArmLen, 10]} />
              <meshStandardMaterial {...matJersey} />
            </mesh>
            <group ref={rightElbowRef} position={[0.04, -BODY.upperArmLen, 0]}>
              <mesh position={[0, -BODY.forearmLen / 2, 0]} castShadow>
                <cylinderGeometry args={[BODY.forearmR, BODY.forearmR * 0.85, BODY.forearmLen, 10]} />
                <meshStandardMaterial {...matSkin} />
              </mesh>
              <mesh position={[0, -BODY.forearmLen - 0.04, 0]}>
                <sphereGeometry args={[0.042, 8, 8]} />
                <meshStandardMaterial {...matSkin} />
              </mesh>
            </group>
            {isGK && (
              <mesh position={[0.04, -BODY.upperArmLen - BODY.forearmLen - 0.06, 0]}>
                <boxGeometry args={[0.11, 0.14, 0.08]} />
                <meshStandardMaterial color="#ffffff" roughness={0.15} />
              </mesh>
            )}
          </group>

          {/* ═══ NECK + HEAD ═══════════════════════════════════════ */}
          <group ref={headRef} position={[0, 0.56, 0]}>
            {/* Neck */}
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[BODY.neckR, BODY.neckR * 1.1, BODY.neckLen, 10]} />
              <meshStandardMaterial {...matSkin} />
            </mesh>
            {/* Head — slightly oval (taller than wide) */}
            <mesh position={[0, 0.17, 0]} castShadow>
              <sphereGeometry args={[BODY.headR, 20, 20]} />
              <meshStandardMaterial {...matSkin} />
            </mesh>
            {/* Hair */}
            <mesh position={[0, 0.23, -0.02]} castShadow>
              <sphereGeometry args={[BODY.headR + 0.005, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color={playerData ? '#1a0a00' : '#3d2200'} roughness={0.95} />
            </mesh>
            {/* Face shadow (brow ridge) */}
            <mesh position={[0, 0.2, BODY.headR - 0.01]}>
              <boxGeometry args={[0.09, 0.025, 0.02]} />
              <meshStandardMaterial {...matSkin} roughness={0.8} />
            </mesh>
            {/* Nose */}
            <mesh position={[0, 0.15, BODY.headR + 0.01]}>
              <boxGeometry args={[0.025, 0.032, 0.025]} />
              <meshStandardMaterial {...matSkin} />
            </mesh>
          </group>
        </group>

        {/* ═══ LEFT LEG ══════════════════════════════════════════ */}
        {/* Hip pivot at hip bone level */}
        <group ref={leftHipRef} position={[-0.12, 0.82, 0]}>
          {/* Thigh */}
          <mesh position={[0, -BODY.thighLen / 2, 0]} castShadow>
            <cylinderGeometry args={[BODY.thighR, BODY.thighR * 0.88, BODY.thighLen, 10]} />
            <meshStandardMaterial {...matSkin} />
          </mesh>
          {/* Knee pivot at bottom of thigh */}
          <group ref={leftKneeRef} position={[0, -BODY.thighLen, 0]}>
            {/* Knee cap sphere */}
            <mesh>
              <sphereGeometry args={[BODY.thighR * 0.9, 10, 10]} />
              <meshStandardMaterial {...matSkin} />
            </mesh>
            {/* Calf */}
            <mesh position={[0, -BODY.calfLen / 2 - 0.03, 0]} castShadow>
              <cylinderGeometry args={[BODY.calfR, BODY.calfR * 0.72, BODY.calfLen, 10]} />
              <meshStandardMaterial {...matSocks} />
            </mesh>
            {/* Boot */}
            <mesh position={[0, -BODY.calfLen - 0.06, 0.04]} castShadow>
              <boxGeometry args={[BODY.bootW, BODY.bootH, BODY.bootL]} />
              <meshStandardMaterial {...matBoot} />
            </mesh>
            {/* Boot sole */}
            <mesh position={[0, -BODY.calfLen - 0.11, 0.04]}>
              <boxGeometry args={[BODY.bootW - 0.01, 0.02, BODY.bootL - 0.01]} />
              <meshStandardMaterial color="#111" roughness={0.05} />
            </mesh>
          </group>
        </group>

        {/* ═══ RIGHT LEG ═════════════════════════════════════════ */}
        <group ref={rightHipRef} position={[0.12, 0.82, 0]}>
          <mesh position={[0, -BODY.thighLen / 2, 0]} castShadow>
            <cylinderGeometry args={[BODY.thighR, BODY.thighR * 0.88, BODY.thighLen, 10]} />
            <meshStandardMaterial {...matSkin} />
          </mesh>
          <group ref={rightKneeRef} position={[0, -BODY.thighLen, 0]}>
            <mesh>
              <sphereGeometry args={[BODY.thighR * 0.9, 10, 10]} />
              <meshStandardMaterial {...matSkin} />
            </mesh>
            <mesh position={[0, -BODY.calfLen / 2 - 0.03, 0]} castShadow>
              <cylinderGeometry args={[BODY.calfR, BODY.calfR * 0.72, BODY.calfLen, 10]} />
              <meshStandardMaterial {...matSocks} />
            </mesh>
            <mesh position={[0, -BODY.calfLen - 0.06, 0.04]} castShadow>
              <boxGeometry args={[BODY.bootW, BODY.bootH, BODY.bootL]} />
              <meshStandardMaterial {...matBoot} />
            </mesh>
            <mesh position={[0, -BODY.calfLen - 0.11, 0.04]}>
              <boxGeometry args={[BODY.bootW - 0.01, 0.02, BODY.bootL - 0.01]} />
              <meshStandardMaterial color="#111" roughness={0.05} />
            </mesh>
          </group>
        </group>

        {/* ═══ SELECTED INDICATOR ════════════════════════════════ */}
        {isSelected && (
          <mesh ref={indicatorRef} position={[0, 3.0, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.18, 0.28, 4]} />
            <meshStandardMaterial
              color="#4ade80"
              emissive="#22c55e"
              emissiveIntensity={2.5}
              roughness={0.1}
              metalness={0.6}
            />
          </mesh>
        )}
      </group>

      {/* Capsule collider — adjusted to real player height */}
      <CapsuleCollider
        args={[0.55 * heightScale, 0.22]}
        position={[0, 0.88 * heightScale, 0]}
      />
    </RigidBody>
  )
}
