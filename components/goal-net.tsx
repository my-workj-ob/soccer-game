'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'

export function GoalNet({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isGoal, setIsGoal] = useState(false)
  const soundRef = useRef<HTMLAudioElement | null>(null)

  const width = 7.32
  const height = 2.44
  const depth = 2

  // Create cloth-like goal net using vertices
  const createNetGeometry = () => {
    const segments = 12

    const geometry = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []

    // Front face
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const x = (i / segments) * width - width / 2
        const y = (j / segments) * height
        const z = 0
        vertices.push(x, y, z)
      }
    }

    // Back face (depth)
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const x = (i / segments) * width - width / 2
        const y = (j / segments) * height
        const z = depth
        vertices.push(x, y, z)
      }
    }

    // Create faces
    const stride = segments + 1
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * stride + j
        const b = a + 1
        const c = a + stride
        const d = c + 1

        indices.push(a, c, b)
        indices.push(b, c, d)

        // Back face
        const offset = stride * (segments + 1)
        indices.push(a + offset, b + offset, c + offset)
        indices.push(b + offset, d + offset, c + offset)
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1))
    geometry.computeVertexNormals()

    return geometry
  }

  const handleBallGoal = () => {
    setIsGoal(true)
    // Play goal sound
    if (!soundRef.current) {
      soundRef.current = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAAA=')
    }
    soundRef.current.play().catch(() => {})

    // Emit particles/confetti
    setTimeout(() => setIsGoal(false), 2000)
  }

  useFrame(() => {
    if (isGoal && meshRef.current) {
      meshRef.current.rotation.z = Math.sin(Date.now() * 0.01) * 0.02
    }
  })

  return (
    <group position={position}>
      {/* Goal frame */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, width]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>

      {/* Net mesh with cloth-like appearance */}
      <mesh
        ref={meshRef}
        geometry={createNetGeometry()}
        position={[0, height / 2, depth / 2]}
        onPointerEnter={handleBallGoal}
      >
        <meshPhongMaterial
          color="#ffffff"
          wireframe={false}
          emissive={isGoal ? '#ffff00' : '#000000'}
          emissiveIntensity={isGoal ? 0.5 : 0}
        />
      </mesh>

      {/* Goal collision box */}
      <RigidBody type="fixed" onCollisionEnter={handleBallGoal}>
        <CuboidCollider
          args={[width / 2, height / 2, depth / 2]}
          position={[0, height / 2, depth / 2]}
          restitution={0.8}
          friction={0.2}
        />
      </RigidBody>

      {/* Posts */}
      {[
        [-width / 2 + 0.1, 0, 0],
        [width / 2 - 0.1, 0, 0],
        [-width / 2 + 0.1, 0, depth],
        [width / 2 - 0.1, 0, depth],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.12, 0.12, height + 0.5]} />
          <meshStandardMaterial color="#ff6600" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}
