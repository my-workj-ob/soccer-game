'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '@/lib/game-store'

const BROADCAST_HEIGHT = 22
const BROADCAST_Z_OFFSET = 30
const BROADCAST_FOV = 55

// Smoothing factors
const POS_LERP = 0.045
const LOOK_LERP = 0.06

export function CameraController() {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3(-10, BROADCAST_HEIGHT, BROADCAST_Z_OFFSET))
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((_, delta) => {
    const store = useGameStore.getState()
    const { ballPosition, ballVelocity, cameraView, matchStatus, refereeEvent } = store

    if (matchStatus !== 'playing' && matchStatus !== 'paused') return

    const ballVec = new THREE.Vector3(ballPosition[0], ballPosition[1], ballPosition[2])
    const ballVelVec = new THREE.Vector3(ballVelocity[0], 0, ballVelocity[2])

    // Anticipate where the ball is heading — look slightly ahead
    const anticipation = ballVelVec.clone().multiplyScalar(0.35)
    const lookAt = ballVec.clone().add(anticipation)
    lookAt.y = 0.5

    if (cameraView === 'third-person') {
      // ── BROADCAST: Elevated side angle tracking the ball along X axis ──
      // Camera stays on the +Z side, elevated, centred horizontally on ball X
      const clampedBallX = THREE.MathUtils.clamp(ballPosition[0], -40, 40)
      const desiredZ = BROADCAST_Z_OFFSET

      // Dynamic height: pull back slightly when ball is near center
      const dynamicHeight = BROADCAST_HEIGHT + Math.abs(clampedBallX) * 0.05

      targetPos.current.set(clampedBallX * 0.55, dynamicHeight, desiredZ)
      lookTarget.current.copy(lookAt)

    } else if (cameraView === 'top-down') {
      // ── TOP-DOWN: Bird's eye, centred on ball ──
      const clampedX = THREE.MathUtils.clamp(ballPosition[0], -45, 45)
      const clampedZ = THREE.MathUtils.clamp(ballPosition[2], -30, 30)
      targetPos.current.set(clampedX, 50, clampedZ + 0.01)
      lookTarget.current.set(clampedX, 0, clampedZ)

    } else if (cameraView === 'side-view') {
      // ── SIDE VIEW: Fixed Z, tracks ball X ──
      const clampedX = THREE.MathUtils.clamp(ballPosition[0], -48, 48)
      targetPos.current.set(clampedX * 0.45, 18, 38)
      lookTarget.current.set(clampedX * 0.4, 1, ballPosition[2] * 0.3)
    }

    // Goal celebration: zoom in dramatically
    if (refereeEvent === 'goal') {
      const goalX = ballPosition[0] > 0 ? 48 : -48
      targetPos.current.set(goalX > 0 ? 30 : -30, 12, 20)
      lookTarget.current.set(goalX, 1.5, 0)
    }

    // Apply smooth camera movement
    camera.position.lerp(targetPos.current, POS_LERP)

    const currentLook = new THREE.Vector3()
    currentLook.copy(lookTarget.current)

    // Manually lerp the camera look-at direction
    const currentDir = new THREE.Vector3()
    camera.getWorldDirection(currentDir)
    const desiredDir = lookTarget.current.clone().sub(camera.position).normalize()
    const lerpedDir = currentDir.lerp(desiredDir, LOOK_LERP)
    const lookPoint = camera.position.clone().add(lerpedDir)
    camera.lookAt(lookPoint)
  })

  return null
}
