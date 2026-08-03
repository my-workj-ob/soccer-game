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

  // Biomechanical Limb Joints
  const leftThighRef = useRef<THREE.Group>(null)
  const leftCalfRef = useRef<THREE.Mesh>(null)
  const rightThighRef = useRef<THREE.Group>(null)
  const rightCalfRef = useRef<THREE.Mesh>(null)

  const leftShoulderRef = useRef<THREE.Group>(null)
  const leftForearmRef = useRef<THREE.Mesh>(null)
  const rightShoulderRef = useRef<THREE.Group>(null)
  const rightForearmRef = useRef<THREE.Mesh>(null)

  const keysPressed = useRef<{ [key: string]: boolean }>({})

  const [isTackling, setIsTackling] = useState(false)
  const [skillMoveTimer, setSkillMoveTimer] = useState(0)

  const isGK = playerData?.position === 'goalkeeper'

  // Pro Kit Color Palettes (Real Madrid White & Gold / Man City Sky Blue & Navy)
  const jerseyColor = isGK
    ? team === 1 ? '#eab308' : '#22c55e'
    : team === 1 ? '#f8fafc' : '#0284c7'
  const trimColor = isGK ? '#000000' : team === 1 ? '#eab308' : '#ffffff'
  const shortsColor = isGK ? '#000000' : team === 1 ? '#f8fafc' : '#1e293b'
  const socksColor = isGK ? (team === 1 ? '#eab308' : '#22c55e') : (team === 1 ? '#f8fafc' : '#0284c7')
  const bootColor = team === 1 ? '#facc15' : '#10b981'

  // Real-world height scaling (Baseline is 1.85 meters)
  const realHeight = playerData?.height || 1.85
  const heightScale = realHeight / 1.85

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysPressed.current[key] = true

      if (isSelected) {
        if (key === 'q' || e.key === 'Tab') {
          if (e.key === 'Tab') e.preventDefault()
          useGameStore.getState().switchPlayerToClosest()
        }
        if ((key === 'c' || key === 'e') && !isTackling && useGameStore.getState().ballPossession !== team) {
          triggerSlideTackle()
        }
        if (key === 'z' || key === 'r') {
          setSkillMoveTimer(0.45)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isSelected, isTackling, team])

  const triggerSlideTackle = () => {
    setIsTackling(true)
    if (rigidBodyRef.current && groupRef.current) {
      const rot = groupRef.current.rotation.y
      const forwardX = Math.sin(rot) * 28
      const forwardZ = Math.cos(rot) * 28
      rigidBodyRef.current.setLinvel({ x: forwardX, y: 0.2, z: forwardZ }, true)
    }
    setTimeout(() => setIsTackling(false), 850)
  }

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return

    const store = useGameStore.getState()
    if (playerData?.id && store.redCards[playerData.id]) {
      rigidBodyRef.current.setTranslation({ x: -99, y: -99, z: -99 }, true)
      return
    }

    if (isSelected && indicatorRef.current) {
      indicatorRef.current.rotation.y += delta * 3.5
      indicatorRef.current.position.y = 2.85 + Math.sin(performance.now() * 0.006) * 0.15
    }

    const pos = rigidBodyRef.current.translation()
    const vel = rigidBodyRef.current.linvel()
    const { ballPosition, applyKick, triggerAction, setLastTouchTeam, setLastPasserId, updatePlayerDistance, matchStatus, cameraView, playerStamina, setPlayerStamina, team1Players, team2Players, playerDistancesToBall, tacticalPreset, refereeEvent } = store
    const distToBall = Math.hypot(pos.x - ballPosition[0], pos.z - ballPosition[2])

    if (playerData?.id) {
      updatePlayerDistance(playerData.id, distToBall)
      store.updatePlayerPosition(playerData.id, [pos.x, pos.y, pos.z])
    }

    if (matchStatus !== 'playing') {
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    const teammateIds = team === 1 ? team1Players.map(p => p.id) : team2Players.map(p => p.id)
    const opponentIds = team === 1 ? team2Players.map(p => p.id) : team1Players.map(p => p.id)
    const minTeammateDist = Math.min(...teammateIds.map(id => playerDistancesToBall[id] ?? 999))
    const isClosestToBall = (playerDistancesToBall[playerData?.id || ''] ?? 999) <= minTeammateDist + 0.1

    if (distToBall < 3.2 && store.ballPossession !== team && !isTackling) {
      store.setBallPossession(team)
    }

    let moveSpeedMagnitude = 0

    // --- SLIDE TACKLE FOUL DETECTION & ANIMATION OVERRIDE ---
    if (isTackling && groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -Math.PI / 2.3, 0.25)
      
      for (const oppId of opponentIds) {
        const oppPos = store.playerPositions[oppId]
        if (oppPos) {
          const distToOpp = Math.hypot(pos.x - oppPos[0], pos.z - oppPos[2])
          if (distToOpp < 2.2 && distToBall > 1.6 && !store.refereeEvent) {
            const isFromBehind = Math.random() < 0.25
            const cardSeverity = isFromBehind ? 'red' : Math.random() < 0.65 ? 'yellow' : 'none'
            store.addFoul(team, playerData?.id, cardSeverity)
            store.setRefereeEvent('foul')
            audioEngine.playRefereeWhistle('short')
            audioEngine.playCrowdReaction('boo')
            
            setTimeout(() => {
              store.setRefereeEvent(null)
            }, 3000)
            break
          }
        }
      }
    } else if (groupRef.current && groupRef.current.rotation.x !== 0) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.2)
    }

    // --- SKILL MOVE (ZIDANE ROULETTE) ---
    if (skillMoveTimer > 0) {
      setSkillMoveTimer(Math.max(0, skillMoveTimer - delta))
      if (groupRef.current) {
        groupRef.current.rotation.y += delta * 15
      }
    }

    // --- AI BEHAVIOR ---
    if (!isSelected && !isTackling) {
      if (isGK) {
        const targetGoalX = team === 1 ? -49.5 : 49.5
        const targetZ = Math.min(3.6, Math.max(-3.6, ballPosition[2]))
        const dz = targetZ - pos.z
        const dx = targetGoalX - pos.x
        
        rigidBodyRef.current.setLinvel({ x: dx * 3.5, y: vel.y, z: dz * 4.5 }, true)

        if (groupRef.current) {
          groupRef.current.rotation.y = team === 1 ? Math.PI / 2 : -Math.PI / 2
          const ballSpeedXZ = Math.hypot(store.ballVelocity[0], store.ballVelocity[2])
          if (distToBall < 9 && ballSpeedXZ > 11) {
            if (ballPosition[2] < pos.z - 0.8) {
               groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -Math.PI / 2.3, 0.25)
            } else if (ballPosition[2] > pos.z + 0.8) {
               groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.PI / 2.3, 0.25)
            }
          } else {
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.15)
          }
        }

        if (distToBall < 4.2 && Math.abs(pos.x) > 43) {
          setLastTouchTeam(team, playerData?.id)
          store.setBallPossession(team)
          const target = findBestPassTarget(pos, playerData?.id, team, teammateIds, store.playerPositions, false)
          if (target && Math.hypot(target[0] - pos.x, target[2] - pos.z) < 36) {
            applyKick(calculatePassImpulse(pos, { x: target[0], y: target[1], z: target[2] }, false, team))
          } else {
            applyKick([team === 1 ? 8.5 : -8.5, 2.5, (Math.random() - 0.5) * 3.5])
          }
        }
      } else {
        const hasPossession = store.ballPossession === team
        const role = playerData?.position || 'midfielder'
        const anchor = calculateTacticalAnchor(role, position, ballPosition, team, hasPossession, tacticalPreset)
        let targetX = anchor[0]
        let targetZ = anchor[2]

        if (isClosestToBall && (distToBall < 17 || !hasPossession)) {
          targetX = ballPosition[0]
          targetZ = ballPosition[2]
        }

        const dx = targetX - pos.x
        const dz = targetZ - pos.z
        const distToTarget = Math.hypot(dx, dz)

        if (distToTarget > 0.5) {
          const moveSpeed = distToBall < 6 ? 16 : 11
          moveSpeedMagnitude = moveSpeed
          const norm = distToTarget || 1
          rigidBodyRef.current.setLinvel({ x: (dx / norm) * moveSpeed, y: vel.y, z: (dz / norm) * moveSpeed }, true)
          if (groupRef.current && distToTarget > 0.1 && skillMoveTimer === 0) {
            groupRef.current.rotation.y = Math.atan2(dx, dz)
          }
        } else {
          rigidBodyRef.current.setLinvel({ x: vel.x * 0.8, y: vel.y, z: vel.z * 0.8 }, true)
        }

        if (distToBall < 2.6 && !store.kickImpulse && Math.random() < 0.16) {
          setLastTouchTeam(team, playerData?.id)
          store.setBallPossession(team)
          const action = evaluateAIBallCarrierAction(pos, team, distToBall, store.playerPositions, opponentIds, tacticalPreset)

          if (action === 'shoot') {
            applyKick(calculateShotImpulse(pos, team, 0.1))
          } else if (action === 'pass') {
            const target = findBestPassTarget(pos, playerData?.id, team, teammateIds, store.playerPositions, false)
            if (target) {
              setLastPasserId(playerData?.id || null)
              applyKick(calculatePassImpulse(pos, { x: target[0], y: target[1], z: target[2] }, false, team))
            }
          } else {
            if (groupRef.current) {
              const dirX = Math.sin(groupRef.current.rotation.y)
              const dirZ = Math.cos(groupRef.current.rotation.y)
              store.setDribbleVelocity([dirX * 16, 0, dirZ * 16])
            }
          }
        }
      }
    } else if (isSelected && !isTackling) {
      // --- USER CONTROLS WITH REAL-WORLD PACE & FATIGUE ---
      const { moveInput, activeAction, isSprinting } = store
      const wantsToSprint = isSprinting || keysPressed.current['shift'] || keysPressed.current['l']
      const canSprint = playerStamina > 8
      const isSprintActive = wantsToSprint && canSprint
      
      // Integrate authentic player Pace rating (e.g. Mbappe Pace 97 vs Rodri Pace 66)
      const paceFactor = (playerData?.stats?.pace || 85) / 85
      const baseSprintSpeed = (playerStamina < 30 ? 18 : 25) * paceFactor
      const currentSpeed = isSprintActive ? baseSprintSpeed : 15 * Math.min(1.1, paceFactor)

      let moveX = 0
      let moveZ = 0

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) moveX += team === 1 ? 1 : -1
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) moveX -= team === 1 ? 1 : -1
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) moveZ -= team === 1 ? 1 : -1
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) moveZ += team === 1 ? 1 : -1

      if (Math.abs(moveInput.y) > 0.1 || Math.abs(moveInput.x) > 0.1) {
        moveX += -moveInput.y * (team === 1 ? 1 : -1)
        moveZ += moveInput.x * (team === 1 ? 1 : -1)
      }

      const magnitude = Math.hypot(moveX, moveZ)
      moveSpeedMagnitude = magnitude > 0 ? currentSpeed : 0

      if (moveSpeedMagnitude > 0) {
        if (isSprintActive) setPlayerStamina(playerStamina - delta * 16)
        else setPlayerStamina(playerStamina + delta * 5)
      } else {
        setPlayerStamina(playerStamina + delta * 12)
      }

      if (magnitude > 0) {
        moveX = (moveX / magnitude) * currentSpeed
        moveZ = (moveZ / magnitude) * currentSpeed
      }

      rigidBodyRef.current.setLinvel({ x: moveX, y: vel.y, z: moveZ }, true)

      if (magnitude > 0 && groupRef.current && skillMoveTimer === 0) {
        groupRef.current.rotation.y = Math.atan2(moveX, moveZ)
      }

      // --- USER PASSING & SHOOTING ASSISTS ---
      const isShooting = activeAction === 'shoot' || keysPressed.current[' '] || keysPressed.current['k']
      const isThrough = activeAction === 'through' || keysPressed.current['i']
      const isPassing = activeAction === 'pass' || keysPressed.current['j'] || isThrough
      const isTacklingAction = activeAction === 'tackle'
      const isSkillAction = activeAction === 'skill'

      if (isTacklingAction && store.ballPossession !== team) {
        triggerSlideTackle()
        triggerAction(null)
      } else if (isSkillAction && distToBall < 3.8) {
        setSkillMoveTimer(0.45)
        triggerAction(null)
      } else if (distToBall < 3.8 && (isShooting || isPassing)) {
        setLastTouchTeam(team, playerData?.id)
        store.setBallPossession(team)

        if (isShooting) {
          const fatigueError = playerStamina < 30 ? 0.28 : 0.0
          applyKick(calculateShotImpulse(pos, team, fatigueError))
        } else if (isPassing) {
          const target = findBestPassTarget(pos, playerData?.id, team, teammateIds, store.playerPositions, isThrough)
          if (target) {
            setLastPasserId(playerData?.id || null)
            applyKick(calculatePassImpulse(pos, { x: target[0], y: target[1], z: target[2] }, isThrough, team))
          }
        }
        if (activeAction) triggerAction(null)
      } else if (distToBall < 3.5 && magnitude > 1) {
        setLastTouchTeam(team, playerData?.id)
        store.setBallPossession(team)
        if (groupRef.current && (isSelected || isClosestToBall)) {
          const dirX = Math.sin(groupRef.current.rotation.y)
          const dirZ = Math.cos(groupRef.current.rotation.y)
          const toPlayerX = pos.x - ballPosition[0]
          const toPlayerZ = pos.z - ballPosition[2]
          
          store.setDribbleVelocity([
            dirX * currentSpeed * 0.98 + toPlayerX * 1.5, 
            0, 
            dirZ * currentSpeed * 0.98 + toPlayerZ * 1.5
          ])
        }
      }

      // --- CAMERAS ---
      if (matchStatus === 'playing') {
        if (cameraView === 'third-person') {
          const cameraOffsetX = team === 1 ? -14 : 14
          const targetCamPos = new THREE.Vector3(pos.x + cameraOffsetX, pos.y + 7.5, pos.z * 0.7)
          state.camera.position.lerp(targetCamPos, 0.08)
          state.camera.lookAt(new THREE.Vector3(pos.x + (team === 1 ? 16 : -16), pos.y + 0.5, pos.z * 0.7))
        } else if (cameraView === 'top-down') {
          const targetCamPos = new THREE.Vector3(ballPosition[0], 45, ballPosition[2] + 0.1)
          state.camera.position.lerp(targetCamPos, 0.05)
          state.camera.lookAt(new THREE.Vector3(ballPosition[0], 0, ballPosition[2]))
        } else if (cameraView === 'side-view') {
          const targetCamPos = new THREE.Vector3(ballPosition[0] * 0.5, 20, 35)
          state.camera.position.lerp(targetCamPos, 0.05)
          state.camera.lookAt(new THREE.Vector3(ballPosition[0] * 0.5, 0, ballPosition[2] * 0.5))
        }
      }
    }

    // --- BIOMECHANICAL PROCEDURAL KINEMATICS & CELEBRATIONS ---
    const t = state.clock.elapsedTime
    
    if (refereeEvent === 'goal' && distToBall < 20) {
      if (leftShoulderRef.current) leftShoulderRef.current.rotation.z = Math.PI / 2.2
      if (rightShoulderRef.current) rightShoulderRef.current.rotation.z = -Math.PI / 2.2
      if (torsoRef.current) torsoRef.current.position.y = (1.05 * heightScale) + Math.abs(Math.sin(t * 8)) * 0.35
      if (groupRef.current) groupRef.current.rotation.y += delta * 6
      return
    }

    if (headRef.current && groupRef.current && !isTackling) {
      const toBallX = ballPosition[0] - pos.x
      const toBallZ = ballPosition[2] - pos.z
      const globalBallAngle = Math.atan2(toBallX, toBallZ)
      let relativeYaw = globalBallAngle - groupRef.current.rotation.y
      
      relativeYaw = ((relativeYaw + Math.PI) % (Math.PI * 2)) - Math.PI
      if (relativeYaw < -Math.PI) relativeYaw += Math.PI * 2

      if (Math.abs(relativeYaw) < 1.4 && distToBall < 30) {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, relativeYaw * 0.7, 0.15)
        const toBallY = (ballPosition[1] - (pos.y + 1.7 * heightScale)) / (distToBall || 1)
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -toBallY * 0.5, 0.15)
      } else {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.12)
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.12)
      }
    }

    const animSpeed = moveSpeedMagnitude * 0.75
    if (moveSpeedMagnitude > 0.4 && !isTackling) {
      const stride = Math.sin(t * animSpeed)
      const cosStride = Math.cos(t * animSpeed)

      if (torsoRef.current) {
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, 0.22 + Math.min(moveSpeedMagnitude * 0.012, 0.15), 0.15)
        torsoRef.current.position.y = (0.95 * heightScale) + Math.abs(cosStride) * 0.05
      }

      if (leftThighRef.current) leftThighRef.current.rotation.x = -stride * 0.75
      if (rightThighRef.current) rightThighRef.current.rotation.x = stride * 0.75

      if (leftCalfRef.current) leftCalfRef.current.rotation.x = stride > 0 ? stride * 0.8 : 0.05
      if (rightCalfRef.current) rightCalfRef.current.rotation.x = stride < 0 ? -stride * 0.8 : 0.05

      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = stride * 0.6
        leftShoulderRef.current.rotation.z = 0.15
      }
      if (rightShoulderRef.current) {
        rightShoulderRef.current.rotation.x = -stride * 0.6
        rightShoulderRef.current.rotation.z = -0.15
      }
      if (leftForearmRef.current) leftForearmRef.current.rotation.x = -0.45 - Math.abs(stride) * 0.2
      if (rightForearmRef.current) rightForearmRef.current.rotation.x = -0.45 - Math.abs(stride) * 0.2

    } else if (!isTackling) {
      const breath = Math.sin(t * 3.5)
      if (torsoRef.current) {
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, 0.05, 0.1)
        torsoRef.current.position.y = (0.95 * heightScale) + breath * 0.015
      }

      if (leftThighRef.current) leftThighRef.current.rotation.x = THREE.MathUtils.lerp(leftThighRef.current.rotation.x, -0.04, 0.15)
      if (rightThighRef.current) rightThighRef.current.rotation.x = THREE.MathUtils.lerp(rightThighRef.current.rotation.x, 0.04, 0.15)
      if (leftCalfRef.current) leftCalfRef.current.rotation.x = THREE.MathUtils.lerp(leftCalfRef.current.rotation.x, 0.08, 0.15)
      if (rightCalfRef.current) rightCalfRef.current.rotation.x = THREE.MathUtils.lerp(rightCalfRef.current.rotation.x, 0.08, 0.15)
      
      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = THREE.MathUtils.lerp(leftShoulderRef.current.rotation.x, 0, 0.15)
        leftShoulderRef.current.rotation.z = THREE.MathUtils.lerp(leftShoulderRef.current.rotation.z, 0.1, 0.15)
      }
      if (rightShoulderRef.current) {
        rightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(rightShoulderRef.current.rotation.x, 0, 0.15)
        rightShoulderRef.current.rotation.z = THREE.MathUtils.lerp(rightShoulderRef.current.rotation.z, -0.1, 0.15)
      }
      if (leftForearmRef.current) leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(leftForearmRef.current.rotation.x, -0.25, 0.15)
      if (rightForearmRef.current) rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(rightForearmRef.current.rotation.x, -0.25, 0.15)
    }
  })

  if (playerData?.id && useGameStore.getState().redCards[playerData.id]) {
    return null
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      mass={78}
      linearDamping={2.0}
      angularDamping={4.0}
      enabledRotations={[false, true, false]}
      colliders={false}
    >
      <group
        ref={groupRef}
        scale={[1, heightScale, 1]}
        onClick={(e) => {
          e.stopPropagation()
          onSelected?.()
        }}
      >
        {/* --- TORSO & CHEST --- */}
        <group ref={torsoRef} position={[0, 0.95, 0]}>
          <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.44, 0.38, 0.25]} />
            <meshStandardMaterial
              color={jerseyColor}
              roughness={0.35}
              emissive={isSelected ? trimColor : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : 0}
            />
          </mesh>

          <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.37, 0.28, 0.22]} />
            <meshStandardMaterial color={jerseyColor} roughness={0.4} />
          </mesh>

          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[0.46, 0.05, 0.26]} />
            <meshStandardMaterial color={trimColor} roughness={0.2} metalness={0.2} />
          </mesh>

          <group position={[0, 0.38, -0.14]} rotation={[0, Math.PI, 0]}>
            <Text
              position={[0, 0.18, 0]}
              fontSize={0.065}
              color={team === 1 ? '#000000' : '#ffffff'}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
              letterSpacing={0.05}
            >
              {playerData?.name || (team === 1 ? 'BAKHTIYOR' : 'PLAYER')}
            </Text>
            <Text
              position={[0, -0.06, 0]}
              fontSize={0.24}
              color={team === 1 ? '#000000' : '#ffffff'}
              anchorX="center"
              anchorY="middle"
              fontWeight="black"
            >
              {jerseyNumber}
            </Text>
          </group>

          <group ref={leftShoulderRef} position={[-0.30, 0.52, 0]}>
            <mesh position={[-0.04, -0.14, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.055, 0.32, 12]} />
              <meshStandardMaterial color={jerseyColor} roughness={0.4} />
            </mesh>
            <mesh ref={leftForearmRef} position={[-0.04, -0.36, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.045, 0.32, 12]} />
              <meshStandardMaterial color="#ffdbac" roughness={0.6} />
            </mesh>
            {isGK && (
              <mesh position={[-0.04, -0.54, 0.02]} castShadow>
                <boxGeometry args={[0.14, 0.18, 0.16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} />
              </mesh>
            )}
          </group>

          <group ref={rightShoulderRef} position={[0.30, 0.52, 0]}>
            <mesh position={[0.04, -0.14, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.055, 0.32, 12]} />
              <meshStandardMaterial color={jerseyColor} roughness={0.4} />
            </mesh>
            <mesh ref={rightForearmRef} position={[0.04, -0.36, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.045, 0.32, 12]} />
              <meshStandardMaterial color="#ffdbac" roughness={0.6} />
            </mesh>
            {isGK && (
              <mesh position={[0.04, -0.54, 0.02]} castShadow>
                <boxGeometry args={[0.14, 0.18, 0.16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} />
              </mesh>
            )}
          </group>

          <group ref={headRef} position={[0, 0.72, 0]}>
            <mesh position={[0, -0.06, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.07, 0.12, 12]} />
              <meshStandardMaterial color="#ffdbac" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.12, 0]} castShadow>
              <sphereGeometry args={[0.13, 24, 24]} />
              <meshStandardMaterial color="#ffdbac" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.18, -0.02]} castShadow>
              <sphereGeometry args={[0.135, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshStandardMaterial color="#1f140e" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.12, 0.13]}>
              <boxGeometry args={[0.04, 0.06, 0.03]} />
              <meshStandardMaterial color="#f6cf9f" roughness={0.6} />
            </mesh>
          </group>

          <mesh position={[0, -0.02, 0]} castShadow>
            <boxGeometry args={[0.42, 0.36, 0.25]} />
            <meshStandardMaterial color={shortsColor} roughness={0.5} />
          </mesh>
        </group>

        {/* --- LEFT LEG JOINT HIERARCHY --- */}
        <group ref={leftThighRef} position={[-0.14, 0.95, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.095, 0.08, 0.45, 12]} />
            <meshStandardMaterial color="#ffdbac" roughness={0.65} />
          </mesh>
          <mesh ref={leftCalfRef} position={[0, -0.58, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.065, 0.42, 12]} />
            <meshStandardMaterial color={socksColor} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.82, 0.05]} castShadow>
            <boxGeometry args={[0.13, 0.12, 0.26]} />
            <meshStandardMaterial color={bootColor} roughness={0.2} metalness={0.3} />
          </mesh>
          <mesh position={[0, -0.89, 0.05]}>
            <boxGeometry args={[0.12, 0.02, 0.22]} />
            <meshStandardMaterial color="#000000" roughness={0.1} />
          </mesh>
        </group>

        {/* --- RIGHT LEG JOINT HIERARCHY --- */}
        <group ref={rightThighRef} position={[0.14, 0.95, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.095, 0.08, 0.45, 12]} />
            <meshStandardMaterial color="#ffdbac" roughness={0.65} />
          </mesh>
          <mesh ref={rightCalfRef} position={[0, -0.58, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.065, 0.42, 12]} />
            <meshStandardMaterial color={socksColor} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.82, 0.05]} castShadow>
            <boxGeometry args={[0.13, 0.12, 0.26]} />
            <meshStandardMaterial color={bootColor} roughness={0.2} metalness={0.3} />
          </mesh>
          <mesh position={[0, -0.89, 0.05]}>
            <boxGeometry args={[0.12, 0.02, 0.22]} />
            <meshStandardMaterial color="#000000" roughness={0.1} />
          </mesh>
        </group>

        {isSelected && (
          <mesh ref={indicatorRef} position={[0, 2.85, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.22, 0.35, 4]} />
            <meshStandardMaterial
              color="#4ade80"
              emissive="#22c55e"
              emissiveIntensity={3.2}
              roughness={0.1}
              metalness={0.8}
            />
          </mesh>
        )}
      </group>

      <CapsuleCollider args={[0.6 * heightScale, 0.25]} position={[0, 0.95 * heightScale, 0]} />
    </RigidBody>
  )
}
