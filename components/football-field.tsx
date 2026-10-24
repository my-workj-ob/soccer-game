'use client'

import React, { useMemo } from 'react'
import * as THREE from 'three'

interface StadiumProps {
  fieldLength?: number
  fieldWidth?: number
}

/**
 * Creates a procedural grass-like texture with darker/lighter variation and subtle grid lines.
 */
function createGrassTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Base grass green
  ctx.fillStyle = '#2d6a20'
  ctx.fillRect(0, 0, size, size)

  // Add noise-like variation using random pixel blobs
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = Math.random() * 3 + 1
    const lightness = Math.random() > 0.5 ? 0.15 : -0.1
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = lightness > 0 ? `rgba(255,255,255,${lightness * 0.4})` : `rgba(0,0,0,${Math.abs(lightness) * 0.5})`
    ctx.fill()
  }

  // Subtle cross-hatch grass blade lines
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 0.5
  for (let y = 0; y < size; y += 8) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(12, 8)
  return texture
}

/**
 * A simple procedural football texture using a canvas with pentagon patches.
 */
export function createFootballTexture(): THREE.CanvasTexture | undefined {
  if (typeof document === 'undefined') return undefined
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // White base
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, size, size)

  // Draw 12 pentagons arranged in a proper football pattern
  const drawPentagon = (cx: number, cy: number, radius: number, rotation: number) => {
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2 + rotation
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
  }

  const pentagonPositions = [
    { x: 256, y: 256, r: 80, rot: 0 },
    { x: 256, y: 80, r: 60, rot: 0 },
    { x: 256, y: 432, r: 60, rot: Math.PI },
    { x: 100, y: 168, r: 60, rot: 0.6 },
    { x: 412, y: 168, r: 60, rot: -0.6 },
    { x: 100, y: 344, r: 60, rot: -0.6 },
    { x: 412, y: 344, r: 60, rot: 0.6 },
  ]

  for (const p of pentagonPositions) {
    drawPentagon(p.x, p.y, p.r, p.rot)
    ctx.fillStyle = '#1a1a1a'
    ctx.fill()
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

/**
 * Generates all pitch line geometry: sidelines, halfway, center circle,
 * penalty areas, goal areas, penalty spots, penalty arc.
 */
function buildPitchMarkings(fieldLength: number, fieldWidth: number): THREE.Group {
  const group = new THREE.Group()
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false })
  const lw = 0.12 // line width in meters

  const addLine = (x1: number, z1: number, x2: number, z2: number, width = lw) => {
    const len = Math.hypot(x2 - x1, z2 - z1)
    const geom = new THREE.PlaneGeometry(len, width)
    const m = new THREE.Mesh(geom, mat)
    m.rotation.x = -Math.PI / 2
    m.position.set((x1 + x2) / 2, 0.01, (z1 + z2) / 2)
    const angle = Math.atan2(z2 - z1, x2 - x1)
    m.rotation.z = angle
    group.add(m)
  }

  const addCircle = (cx: number, cz: number, innerR: number, outerR: number) => {
    const geom = new THREE.RingGeometry(innerR, outerR, 72)
    const m = new THREE.Mesh(geom, mat)
    m.rotation.x = -Math.PI / 2
    m.position.set(cx, 0.01, cz)
    group.add(m)
  }

  const addDot = (cx: number, cz: number, r = 0.3) => {
    const geom = new THREE.CircleGeometry(r, 20)
    const m = new THREE.Mesh(geom, mat)
    m.rotation.x = -Math.PI / 2
    m.position.set(cx, 0.01, cz)
    group.add(m)
  }

  const hl = fieldLength / 2
  const hw = fieldWidth / 2

  // Touchlines
  addLine(-hl, -hw, hl, -hw)
  addLine(-hl, hw, hl, hw)
  // Goal lines
  addLine(-hl, -hw, -hl, hw)
  addLine(hl, -hw, hl, hw)
  // Halfway line
  addLine(-hl, 0, hl, 0, lw)
  // Center circle (9.15m radius)
  addCircle(0, 0, 9.05, 9.17)
  addDot(0, 0)

  // Penalty and goal areas (both sides)
  const sides = [-1, 1]
  for (const s of sides) {
    const gx = s * hl

    // Penalty area: 40.32m wide, 16.5m deep
    const penZ = 40.32 / 2
    const penX = gx - s * 16.5
    addLine(gx, -penZ, penX, -penZ)
    addLine(gx, penZ, penX, penZ)
    addLine(penX, -penZ, penX, penZ)

    // Goal area: 18.32m wide, 5.5m deep
    const goalZ = 18.32 / 2
    const goalX = gx - s * 5.5
    addLine(gx, -goalZ, goalX, -goalZ)
    addLine(gx, goalZ, goalX, goalZ)
    addLine(goalX, -goalZ, goalX, goalZ)

    // Penalty spot (11m from goal line)
    const penSpotX = gx - s * 11
    addDot(penSpotX, 0)

    // Penalty arc (9.15m from penalty spot, only outside penalty area)
    const arcGeom = new THREE.RingGeometry(9.05, 9.17, 72, 1, Math.PI * 0.26, Math.PI * 0.48)
    const arcMesh = new THREE.Mesh(arcGeom, mat)
    arcMesh.rotation.x = -Math.PI / 2
    arcMesh.rotation.z = s === 1 ? 0 : Math.PI
    arcMesh.position.set(penSpotX, 0.01, 0)
    group.add(arcMesh)

    // Corner arcs (1m radius, quarter-circle)
    for (const cz of [-hw, hw]) {
      const cArc = new THREE.RingGeometry(0.9, 1.0, 32, 1, 0, Math.PI / 2)
      const cMesh = new THREE.Mesh(cArc, mat)
      cMesh.rotation.x = -Math.PI / 2
      // Rotate so arc points inward
      const baseRot = (s === -1 ? 0 : Math.PI) + (cz < 0 ? 0 : Math.PI / 2)
      cMesh.rotation.z = baseRot + (cz < 0 ? (s === -1 ? Math.PI * 1.5 : 0) : (s === -1 ? Math.PI : Math.PI * 0.5))
      cMesh.position.set(gx, 0.01, cz)
      group.add(cMesh)
    }
  }

  return group
}

function buildGoalNet(isLeft: boolean): THREE.Group {
  const group = new THREE.Group()
  const gw = 7.32 // goal width
  const gh = 2.44 // goal height
  const gd = 2.2   // depth
  const postR = 0.06
  const postMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.1,
    metalness: 0.6,
  })
  const backMat = new THREE.MeshStandardMaterial({
    color: '#cccccc',
    roughness: 0.3,
    metalness: 0.4,
  })

  // Front posts
  const postGeom = new THREE.CylinderGeometry(postR, postR, gh, 16)
  const leftPost = new THREE.Mesh(postGeom, postMat)
  leftPost.position.set(0, gh / 2, -gw / 2)
  leftPost.castShadow = true
  const rightPost = new THREE.Mesh(postGeom, postMat)
  rightPost.position.set(0, gh / 2, gw / 2)
  rightPost.castShadow = true

  // Crossbar
  const crossGeom = new THREE.CylinderGeometry(postR, postR, gw, 16)
  const crossbar = new THREE.Mesh(crossGeom, postMat)
  crossbar.rotation.z = Math.PI / 2
  crossbar.position.set(0, gh, 0)
  crossbar.castShadow = true

  group.add(leftPost, rightPost, crossbar)

  // Back frame posts
  const dir = isLeft ? -gd : gd
  const bpGeom = new THREE.CylinderGeometry(0.04, 0.04, gh, 12)
  const bpL = new THREE.Mesh(bpGeom, backMat)
  bpL.position.set(dir, gh / 2, -gw / 2)
  const bpR = new THREE.Mesh(bpGeom, backMat)
  bpR.position.set(dir, gh / 2, gw / 2)
  group.add(bpL, bpR)

  // Top back bar
  const topBackGeom = new THREE.CylinderGeometry(0.04, 0.04, gw, 12)
  const topBack = new THREE.Mesh(topBackGeom, backMat)
  topBack.rotation.z = Math.PI / 2
  topBack.position.set(dir, gh, 0)
  group.add(topBack)

  // Net — built from thin lines using EdgesGeometry on a subdivided box
  const netDivX = 12
  const netDivZ = 16
  const netDivY = 8
  const netGeom = new THREE.BoxGeometry(Math.abs(gd), gh, gw, netDivX, netDivY, netDivZ)
  const edges = new THREE.EdgesGeometry(netGeom, 1)
  const netLineMat = new THREE.LineBasicMaterial({
    color: '#dddddd',
    transparent: true,
    opacity: 0.55,
  })
  const netLines = new THREE.LineSegments(edges, netLineMat)
  netLines.position.set(dir / 2, gh / 2, 0)
  group.add(netLines)

  return group
}

export function FootballField({ fieldLength = 105, fieldWidth = 68 }: StadiumProps) {
  const grassTex = useMemo(() => {
    if (typeof document === 'undefined') return null
    return createGrassTexture()
  }, [])

  const markings = useMemo(() => buildPitchMarkings(fieldLength, fieldWidth), [fieldLength, fieldWidth])

  const stripes = useMemo(() => {
    const numStripes = 14
    const sw = fieldLength / numStripes
    return Array.from({ length: numStripes }, (_, i) => ({
      x: -fieldLength / 2 + (i + 0.5) * sw,
      width: sw,
      isEven: i % 2 === 0,
    }))
  }, [fieldLength])

  const hl = fieldLength / 2
  const hw = fieldWidth / 2

  return (
    <group>
      {/* === ATMOSPHERE / SKY === */}
      {/* Distant sky background (hemisphere-like gradient effect) */}
      <mesh position={[0, -5, 0]} receiveShadow={false}>
        <sphereGeometry args={[200, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#0a1628" side={THREE.BackSide} />
      </mesh>

      {/* === PITCH SURFACE === */}
      {stripes.map((s, i) => (
        <mesh key={i} position={[s.x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[s.width, fieldWidth]} />
          <meshStandardMaterial
            color={s.isEven ? '#2d6a20' : '#357a26'}
            roughness={0.88}
            metalness={0}
            map={grassTex || undefined}
          />
        </mesh>
      ))}

      {/* Outer apron (around-pitch grass) */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[fieldLength + 30, fieldWidth + 24]} />
        <meshStandardMaterial color="#1e4d16" roughness={0.9} />
      </mesh>

      {/* === PITCH MARKINGS === */}
      <primitive object={markings} />

      {/* === CORNER FLAGS === */}
      {([[-hl, -hw], [-hl, hw], [hl, -hw], [hl, hw]] as [number, number][]).map(([cx, cz], i) => (
        <group key={i} position={[cx, 0, cz]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 1.5, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0.2, 1.35, 0]}>
            <boxGeometry args={[0.38, 0.25, 0.02]} />
            <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.15} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* === GOALS === */}
      <group position={[-hl, 0, 0]}>
        <primitive object={buildGoalNet(true)} />
      </group>
      <group position={[hl, 0, 0]}>
        <primitive object={buildGoalNet(false)} />
      </group>

      {/* === ADVERTISING BOARDS === */}
      {/* North sideline */}
      <mesh position={[0, 0.5, -(hw + 1.2)]}>
        <boxGeometry args={[fieldLength - 4, 0.9, 0.3]} />
        <meshStandardMaterial color="#0f172a" emissive="#1d4ed8" emissiveIntensity={0.25} roughness={0.3} />
      </mesh>
      {/* South sideline */}
      <mesh position={[0, 0.5, hw + 1.2]}>
        <boxGeometry args={[fieldLength - 4, 0.9, 0.3]} />
        <meshStandardMaterial color="#0f172a" emissive="#059669" emissiveIntensity={0.25} roughness={0.3} />
      </mesh>
      {/* Behind west goal */}
      <mesh position={[-(hl + 2.5), 0.5, 0]}>
        <boxGeometry args={[0.3, 0.9, fieldWidth + 8]} />
        <meshStandardMaterial color="#0f172a" emissive="#7c3aed" emissiveIntensity={0.2} roughness={0.3} />
      </mesh>
      {/* Behind east goal */}
      <mesh position={[hl + 2.5, 0.5, 0]}>
        <boxGeometry args={[0.3, 0.9, fieldWidth + 8]} />
        <meshStandardMaterial color="#0f172a" emissive="#b45309" emissiveIntensity={0.2} roughness={0.3} />
      </mesh>

      {/* === STADIUM STANDS === */}
      {/* North Stand */}
      <group position={[0, 5, -(hw + 18)]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[fieldLength + 24, 12, 16]} />
          <meshStandardMaterial color="#1a2535" roughness={0.95} />
        </mesh>
        {/* Seat rows: staggered colored blocks */}
        {Array.from({ length: 6 }, (_, row) => (
          <mesh key={row} position={[0, -5 + row * 1.5, 8 - row * 1.2]}>
            <boxGeometry args={[fieldLength + 20, 1, 2.5]} />
            <meshStandardMaterial
              color={row % 2 === 0 ? '#1d3a6e' : '#152d57'}
              roughness={0.9}
            />
          </mesh>
        ))}
        {/* Crowd texture strip */}
        <mesh position={[0, 1.5, 7.9]}>
          <planeGeometry args={[fieldLength + 18, 9]} />
          <meshBasicMaterial color="#2563eb" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* South Stand */}
      <group position={[0, 5, hw + 18]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[fieldLength + 24, 12, 16]} />
          <meshStandardMaterial color="#1a2535" roughness={0.95} />
        </mesh>
        {Array.from({ length: 6 }, (_, row) => (
          <mesh key={row} position={[0, -5 + row * 1.5, -(8 - row * 1.2)]}>
            <boxGeometry args={[fieldLength + 20, 1, 2.5]} />
            <meshStandardMaterial
              color={row % 2 === 0 ? '#1d3a6e' : '#152d57'}
              roughness={0.9}
            />
          </mesh>
        ))}
        <mesh position={[0, 1.5, -7.9]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[fieldLength + 18, 9]} />
          <meshBasicMaterial color="#0d9488" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* West End Stand (behind goal) */}
      <group position={[-(hl + 18), 5, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[16, 10, fieldWidth + 24]} />
          <meshStandardMaterial color="#1a2535" roughness={0.95} />
        </mesh>
        {Array.from({ length: 5 }, (_, row) => (
          <mesh key={row} position={[8 - row * 1.2, -4 + row * 1.5, 0]}>
            <boxGeometry args={[2.5, 1, fieldWidth + 20]} />
            <meshStandardMaterial color={row % 2 === 0 ? '#7c3aed' : '#6d28d9'} roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* East End Stand (behind goal) */}
      <group position={[hl + 18, 5, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[16, 10, fieldWidth + 24]} />
          <meshStandardMaterial color="#1a2535" roughness={0.95} />
        </mesh>
        {Array.from({ length: 5 }, (_, row) => (
          <mesh key={row} position={[-(8 - row * 1.2), -4 + row * 1.5, 0]}>
            <boxGeometry args={[2.5, 1, fieldWidth + 20]} />
            <meshStandardMaterial color={row % 2 === 0 ? '#b45309' : '#92400e'} roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* === ROOF STRUCTURE (thin canopy overhang) === */}
      <mesh position={[0, 15, -(hw + 14)]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[fieldLength + 28, 0.4, 10]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 15, hw + 14]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[fieldLength + 28, 0.4, 10]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} transparent opacity={0.85} />
      </mesh>

      {/* === FLOODLIGHT TOWERS === */}
      {([[-hl - 12, 0, -(hw + 10)], [hl + 12, 0, -(hw + 10)], [-hl - 12, 0, hw + 10], [hl + 12, 0, hw + 10]] as [number, number, number][]).map(([lx, ly, lz], i) => (
        <group key={i} position={[lx, ly, lz]}>
          {/* Tower column */}
          <mesh position={[0, 12, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.7, 24, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Light housing */}
          <mesh position={[0, 25, 0]}>
            <boxGeometry args={[4, 1.5, 2]} />
            <meshStandardMaterial color="#f8fafc" emissive="#fff7ed" emissiveIntensity={1.2} />
          </mesh>
          {/* Stadium light */}
          <pointLight
            position={[0, 25, 0]}
            intensity={80}
            distance={160}
            color="#fff5e6"
            castShadow={false}
          />
        </group>
      ))}
    </group>
  )
}
