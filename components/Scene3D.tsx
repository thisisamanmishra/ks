'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/* ===== Hexagonal 3D Grid Background — Optimized ===== */
function HexGrid() {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const { count, matrices } = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.08, 6)
    const size = 1.2
    const rows = 8   // Reduced from 12
    const cols = 10   // Reduced from 16
    const items: THREE.Matrix4[] = []

    for (let r = -rows / 2; r < rows / 2; r++) {
      for (let c = -cols / 2; c < cols / 2; c++) {
        const x = c * size * 1.8 + (r % 2 === 0 ? 0 : size * 0.9)
        const y = r * size * 1.55
        const z = Math.random() * 0.5 - 0.25
        const s = 0.5 + Math.random() * 0.2
        const m = new THREE.Matrix4()
        m.compose(
          new THREE.Vector3(x, y, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
          new THREE.Vector3(s, s, s)
        )
        items.push(m)
      }
    }
    return { count: items.length, matrices: items }
  }, [])

  // Set instance matrices once
  useMemo(() => {
    if (!meshRef.current) return
    matrices.forEach((m, i) => meshRef.current!.setMatrixAt(i, m))
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [matrices])

  useFrame(() => {
    if (!groupRef.current) return
    const t = Date.now() / 1000
    groupRef.current.rotation.z = Math.sin(t * 0.05) * 0.02
  })

  const geo = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 0.08, 6), [])

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[geo, undefined, count]}>
        <meshStandardMaterial
          color="#1B3A6B"
          transparent
          opacity={0.15}
          roughness={0.3}
          metalness={0.6}
        />
      </instancedMesh>
    </group>
  )
}

/* ===== 3D Wireframe Wave — Optimized with lower resolution ===== */
function WaveGrid() {
  const meshRef = useRef<THREE.Mesh>(null)
  // Reduced from 64x64 to 32x32 segments
  const geometry = useMemo(() => new THREE.PlaneGeometry(22, 22, 32, 32), [])
  const frameSkip = useRef(0)

  useFrame(() => {
    if (!meshRef.current) return
    // Only update every 3rd frame
    frameSkip.current++
    if (frameSkip.current % 3 !== 0) return

    const positions = (meshRef.current.geometry as THREE.PlaneGeometry).attributes.position
    const time = Date.now() / 1000
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      positions.setZ(i,
        Math.sin(x * 0.4 + time * 0.7) * 0.5 +
        Math.cos(y * 0.4 + time * 0.5) * 0.5
      )
    }
    positions.needsUpdate = true
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 3, 0, 0]} position={[0, -3, 0]} geometry={geometry}>
      <meshStandardMaterial color="#4a7fff" wireframe transparent opacity={0.35} />
    </mesh>
  )
}

/* ===== Floating Objects: Simplified — only 4 objects instead of 8 ===== */
function FloatingBook({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.position.y = position[1] + Math.sin(t * 0.8 + position[0]) * 0.4
    ref.current.rotation.y = Math.sin(t * 0.3 + position[0]) * 0.3
  })
  return (
    <group ref={ref} position={position}>
      <mesh><boxGeometry args={[0.8, 0.06, 1.1]} /><meshStandardMaterial color="#FF6B35" roughness={0.4} metalness={0.3} /></mesh>
      <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.75, 0.04, 1.05]} /><meshStandardMaterial color="#fff5ee" roughness={0.8} /></mesh>
      <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.8, 0.03, 1.1]} /><meshStandardMaterial color="#e0551f" roughness={0.4} metalness={0.3} /></mesh>
    </group>
  )
}

function FloatingLaptop({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.position.y = position[1] + Math.sin(t * 0.6 + position[0] * 2) * 0.5
    ref.current.rotation.y = Math.sin(t * 0.25) * 0.4
  })
  return (
    <group ref={ref} position={position}>
      <mesh><boxGeometry args={[1.2, 0.05, 0.8]} /><meshStandardMaterial color="#254d8a" roughness={0.2} metalness={0.7} /></mesh>
      <mesh position={[0, 0.45, -0.35]} rotation={[-0.3, 0, 0]}><boxGeometry args={[1.1, 0.8, 0.03]} /><meshStandardMaterial color="#1B3A6B" roughness={0.1} metalness={0.8} /></mesh>
      <mesh position={[0, 0.45, -0.33]} rotation={[-0.3, 0, 0]}><planeGeometry args={[0.95, 0.65]} /><meshStandardMaterial color="#4a90ff" emissive="#4a90ff" emissiveIntensity={0.3} /></mesh>
    </group>
  )
}

function FloatingGradCap({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.position.y = position[1] + Math.sin(t * 0.7 + position[2]) * 0.35
    ref.current.rotation.y = t * 0.2
  })
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[1, 0.04, 1]} /><meshStandardMaterial color="#1B3A6B" roughness={0.3} metalness={0.5} /></mesh>
      <mesh position={[0, -0.15, 0]}><sphereGeometry args={[0.35, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#1B3A6B" roughness={0.3} metalness={0.5} /></mesh>
      <mesh position={[0.4, -0.05, 0.4]}><cylinderGeometry args={[0.02, 0.02, 0.5, 6]} /><meshStandardMaterial color="#FF6B35" /></mesh>
    </group>
  )
}

/* ===== Floating Particles — Reduced count ===== */
function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 150  // Reduced from 300
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24
      pos[i * 3 + 2] = (Math.random() - 0.5) * 24
    }
    return pos
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    const t = Date.now() / 1000
    pointsRef.current.rotation.y = t * 0.015
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#6690ff" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

/* ===== Main Scene — Optimized ===== */
export default function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 3, 10], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      frameloop="always"
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} />

      {/* Background layers */}
      <HexGrid />
      <WaveGrid />
      <FloatingParticles />

      {/* Floating 3D objects — reduced from 8 to 3 */}
      <FloatingBook position={[-4, 2, -2]} />
      <FloatingLaptop position={[3.5, 2.5, -1]} />
      <FloatingGradCap position={[-2, 3.5, 0]} />
    </Canvas>
  )
}
