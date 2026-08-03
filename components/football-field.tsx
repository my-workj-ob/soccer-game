'use client'

import React, { useMemo } from 'react'
import * as THREE from 'three'

export function FootballField() {
  // Field dimensions: 105m length x 68m width
  const fieldLength = 105
  const fieldWidth = 68

  // Generate 14 alternating grass mowing stripes along X axle
  const stripes = useMemo(() => {
    const numStripes = 14
    const stripeWidth = fieldLength / numStripes
    const arr = []
    for (let i = 0; i < numStripes; i++) {
      const x = -fieldLength / 2 + (i + 0.5) * stripeWidth
      const isEven = i % 2 === 0
      arr.push({ x, width: stripeWidth, color: isEven ? '#15803d' : '#16a34a' })
    }
    return arr
  }, [fieldLength])

  const markingsMesh = useMemo(() => {
    const group = new THREE.Group()
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const lineWidth = 0.15

    const createLine = (x1: number, z1: number, x2: number, z2: number) => {
      const length = Math.hypot(x2 - x1, z2 - z1)
      const geom = new THREE.PlaneGeometry(length, lineWidth)
      const mesh = new THREE.Mesh(geom, lineMaterial)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set((x1 + x2) / 2, 0.015, (z1 + z2) / 2)
      if (x2 !== x1) {
        mesh.rotation.z = Math.atan2(z2 - z1, x2 - x1)
      } else {
        mesh.rotation.z = Math.PI / 2
      }
      group.add(mesh)
    }

    // Outer sidelines & baselines
    createLine(-fieldLength / 2, -fieldWidth / 2, fieldLength / 2, -fieldWidth / 2)
    createLine(-fieldLength / 2, fieldWidth / 2, fieldLength / 2, fieldWidth / 2)
    createLine(-fieldLength / 2, -fieldWidth / 2, -fieldLength / 2, fieldWidth / 2)
    createLine(fieldLength / 2, -fieldWidth / 2, fieldLength / 2, fieldWidth / 2)

    // Halfway line
    createLine(0, -fieldWidth / 2, 0, fieldWidth / 2)

    // Center Circle (radius 9.15m)
    const circleGeom = new THREE.RingGeometry(9.0, 9.15, 64)
    const circleMesh = new THREE.Mesh(circleGeom, lineMaterial)
    circleMesh.rotation.x = -Math.PI / 2
    circleMesh.position.y = 0.015
    group.add(circleMesh)

    // Center Spot
    const spotGeom = new THREE.CircleGeometry(0.2, 16)
    const spotMesh = new THREE.Mesh(spotGeom, lineMaterial)
    spotMesh.rotation.x = -Math.PI / 2
    spotMesh.position.y = 0.015
    group.add(spotMesh)

    // Penalty & Goal areas for both teams
    const addPenaltyArea = (side: -1 | 1) => {
      const baseX = (side * fieldLength) / 2
      const penDepth = side * -16.5
      const penWidth = 40.32
      const goalDepth = side * -5.5
      const goalWidth = 18.32

      // Penalty box
      createLine(baseX, -penWidth / 2, baseX + penDepth, -penWidth / 2)
      createLine(baseX, penWidth / 2, baseX + penDepth, penWidth / 2)
      createLine(baseX + penDepth, -penWidth / 2, baseX + penDepth, penWidth / 2)

      // Goal box
      createLine(baseX, -goalWidth / 2, baseX + goalDepth, -goalWidth / 2)
      createLine(baseX, goalWidth / 2, baseX + goalDepth, goalWidth / 2)
      createLine(baseX + goalDepth, -goalWidth / 2, baseX + goalDepth, goalWidth / 2)

      // Penalty spot at 11m
      const penSpot = new THREE.Mesh(spotGeom, lineMaterial)
      penSpot.rotation.x = -Math.PI / 2
      penSpot.position.set(baseX - side * 11, 0.015, 0)
      group.add(penSpot)
    }

    addPenaltyArea(-1)
    addPenaltyArea(1)

    return group
  }, [fieldLength, fieldWidth])

  return (
    <group>
      {/* Grass Pitch with alternating mowed lawn stripes */}
      {stripes.map((stripe, idx) => (
        <mesh key={idx} position={[stripe.x, 0, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[stripe.width, fieldWidth]} />
          <meshStandardMaterial color={stripe.color} side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
      ))}

      {/* Outer stadium track / synthetic grass surrounding pitch */}
      <mesh position={[0, -0.05, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[140, 100]} />
        <meshStandardMaterial color="#14532d" roughness={0.9} />
      </mesh>

      {/* Pitch markings */}
      <primitive object={markingsMesh} />

      {/* Corner Flags */}
      {[
        [-fieldLength / 2, -fieldWidth / 2],
        [-fieldLength / 2, fieldWidth / 2],
        [fieldLength / 2, -fieldWidth / 2],
        [fieldLength / 2, fieldWidth / 2],
      ].map(([cx, cz], idx) => (
        <group key={idx} position={[cx, 0, cz]}>
          {/* Flag pole */}
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.5]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
          {/* Flag fabric */}
          <mesh position={[0.2, 1.3, 0]}>
            <boxGeometry args={[0.4, 0.3, 0.02]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Glowing LED Advertising Banners */}
      {/* North Sideline */}
      <mesh position={[0, 0.6, -37]}>
        <boxGeometry args={[110, 1.2, 0.4]} />
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>
      {/* South Sideline */}
      <mesh position={[0, 0.6, 37]}>
        <boxGeometry args={[110, 1.2, 0.4]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>
      {/* West Behind Goal */}
      <mesh position={[-56, 0.6, 0]}>
        <boxGeometry args={[0.4, 1.2, 60]} />
        <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>
      {/* East Behind Goal */}
      <mesh position={[56, 0.6, 0]}>
        <boxGeometry args={[0.4, 1.2, 60]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>

      {/* Stadium Grandstands / Crowd Stands */}
      {/* North Stand */}
      <group position={[0, 6, -46]} rotation={[0.4, 0, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[120, 15, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        {/* Colorful Crowd Simulation banner */}
        <mesh position={[0, 0.5, 6.1]}>
          <planeGeometry args={[118, 14]} />
          <meshBasicMaterial color="#3b82f6" opacity={0.7} transparent />
        </mesh>
      </group>

      {/* South Stand */}
      <group position={[0, 6, 46]} rotation={[-0.4, 0, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[120, 15, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.5, -6.1]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[118, 14]} />
          <meshBasicMaterial color="#10b981" opacity={0.7} transparent />
        </mesh>
      </group>

      {/* West Stand */}
      <group position={[-65, 6, 0]} rotation={[0, 0, -0.4]}>
        <mesh receiveShadow>
          <boxGeometry args={[12, 15, 80]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>

      {/* East Stand */}
      <group position={[65, 6, 0]} rotation={[0, 0, 0.4]}>
        <mesh receiveShadow>
          <boxGeometry args={[12, 15, 80]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>

      {/* Stadium Floodlight Towers at 4 Corners */}
      {[
        [-62, 18, -42],
        [62, 18, -42],
        [-62, 18, 42],
        [62, 18, 42],
      ].map(([lx, ly, lz], idx) => (
        <group key={idx} position={[lx, ly, lz]}>
          {/* Pylon pillar */}
          <mesh position={[0, -ly / 2, 0]}>
            <cylinderGeometry args={[0.8, 1.2, ly, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Light fixture panel */}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[6, 3, 1]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.0} />
          </mesh>
          {/* Point light down to field center */}
          <pointLight intensity={50} distance={120} color="#f8fafc" position={[0, 0, 0]} />
        </group>
      ))}

      {/* Goals */}
      <Goal position={[-52.5, 0, 0]} isWest={true} />
      <Goal position={[52.5, 0, 0]} isWest={false} />
    </group>
  )
}

interface GoalProps {
  position: [number, number, number]
  isWest: boolean
}

function Goal({ position, isWest }: GoalProps) {
  const depth = isWest ? -2.2 : 2.2

  return (
    <group position={position}>
      {/* Goal posts (White pipes) */}
      <mesh position={[0, 1.22, -3.66]}>
        <cylinderGeometry args={[0.06, 0.06, 2.44, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.22, 3.66]}>
        <cylinderGeometry args={[0.06, 0.06, 2.44, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.5} />
      </mesh>

      {/* Crossbar */}
      <mesh position={[0, 2.44, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 7.32, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.5} />
      </mesh>

      {/* Back supports & frame */}
      <mesh position={[depth, 1.22, -3.66]}>
        <cylinderGeometry args={[0.04, 0.04, 2.44, 12]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      <mesh position={[depth, 1.22, 3.66]}>
        <cylinderGeometry args={[0.04, 0.04, 2.44, 12]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>

      {/* Net simulation mesh */}
      <mesh position={[depth / 2, 1.22, 0]}>
        <boxGeometry args={[Math.abs(depth), 2.44, 7.32]} />
        <meshStandardMaterial color="#f8fafc" wireframe={true} transparent opacity={0.6} roughness={0.5} />
      </mesh>
    </group>
  )
}
