'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/* ===== Hexagonal 3D Grid Background ===== */
function HexGrid() {
  const groupRef = useRef<THREE.Group>(null)
  const hexes = useMemo(() => {
    const items: { x: number; y: number; z: number; scale: number; isLogo: boolean }[] = []
    const size = 1.2
    const rows = 12
    const cols = 16
    for (let r = -rows / 2; r < rows / 2; r++) {
      for (let c = -cols / 2; c < cols / 2; c++) {
        const x = c * size * 1.8 + (r % 2 === 0 ? 0 : size * 0.9)
        const y = r * size * 1.55
        const z = Math.random() * 0.5 - 0.25
        const isLogo = (Math.abs(r) < 2 && Math.abs(c) < 2 && Math.random() > 0.6)
        items.push({ x, y, z, scale: 0.5 + Math.random() * 0.2, isLogo })
      }
    }
    return items
  }, [])

  useFrame(() => {
    if (!groupRef.current) return
    const t = Date.now() / 1000
    groupRef.current.rotation.z = Math.sin(t * 0.05) * 0.02
  })

  return (
    <group ref={groupRef}>
      {hexes.map((h, i) => (
        <HexCell key={i} position={[h.x, h.y, h.z]} scale={h.scale} index={i} isLogo={h.isLogo} />
      ))}
    </group>
  )
}

function HexCell({ position, scale, index, isLogo }: { position: [number, number, number]; scale: number; index: number; isLogo: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 0.08, 6), [])

  useFrame(() => {
    if (!meshRef.current) return
    const t = Date.now() / 1000
    meshRef.current.position.z = position[2] + Math.sin(t * 0.3 + index * 0.1) * 0.15
    meshRef.current.material = meshRef.current.material as THREE.MeshStandardMaterial
  })

  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI / 2, 0, 0]} scale={scale} geometry={geo}>
      <meshStandardMaterial
        color={isLogo ? '#FF6B35' : '#1B3A6B'}
        transparent
        opacity={isLogo ? 0.4 : 0.15}
        roughness={0.3}
        metalness={0.6}
      />
    </mesh>
  )
}

/* ===== 3D Wireframe Wave ===== */
function WaveGrid() {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => new THREE.PlaneGeometry(22, 22, 64, 64), [])

  useFrame((state) => {
    if (!meshRef.current) return
    const positions = (meshRef.current.geometry as THREE.PlaneGeometry).attributes.position
    const time = Date.now() / 1000
    const pointer = state.pointer
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const dist = Math.sqrt((x - pointer.x * 5) ** 2 + (y - pointer.y * 5) ** 2)
      positions.setZ(i,
        Math.sin(x * 0.4 + time * 0.7) * 0.5 +
        Math.cos(y * 0.4 + time * 0.5) * 0.5 +
        Math.sin(dist * 0.4 - time) * 0.2
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

/* ===== Floating Objects: Book, Laptop, Graduation Cap ===== */
function FloatingBook({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.position.y = position[1] + Math.sin(t * 0.8 + position[0]) * 0.4
    ref.current.rotation.y = Math.sin(t * 0.3 + position[0]) * 0.3
    ref.current.rotation.z = Math.cos(t * 0.4) * 0.1
  })
  return (
    <group ref={ref} position={position}>
      {/* Book cover */}
      <mesh>
        <boxGeometry args={[0.8, 0.06, 1.1]} />
        <meshStandardMaterial color="#FF6B35" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Pages */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.75, 0.04, 1.05]} />
        <meshStandardMaterial color="#fff5ee" roughness={0.8} />
      </mesh>
      {/* Back cover */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.8, 0.03, 1.1]} />
        <meshStandardMaterial color="#e0551f" roughness={0.4} metalness={0.3} />
      </mesh>
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
    ref.current.rotation.x = Math.cos(t * 0.35) * 0.1
  })
  return (
    <group ref={ref} position={position}>
      {/* Base */}
      <mesh>
        <boxGeometry args={[1.2, 0.05, 0.8]} />
        <meshStandardMaterial color="#254d8a" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.45, -0.35]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.1, 0.8, 0.03]} />
        <meshStandardMaterial color="#1B3A6B" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Screen glow */}
      <mesh position={[0, 0.45, -0.33]} rotation={[-0.3, 0, 0]}>
        <planeGeometry args={[0.95, 0.65]} />
        <meshStandardMaterial color="#4a90ff" emissive="#4a90ff" emissiveIntensity={0.3} />
      </mesh>
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
    ref.current.rotation.z = Math.sin(t * 0.5) * 0.15
  })
  return (
    <group ref={ref} position={position}>
      {/* Cap board */}
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[1, 0.04, 1]} />
        <meshStandardMaterial color="#1B3A6B" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Dome */}
      <mesh position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1B3A6B" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Tassel */}
      <mesh position={[0.4, -0.05, 0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
        <meshStandardMaterial color="#FF6B35" />
      </mesh>
      <mesh position={[0.4, -0.3, 0.4]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#FF6B35" />
      </mesh>
    </group>
  )
}

function FloatingPen({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.position.y = position[1] + Math.sin(t * 0.9 + position[0] * 3) * 0.3
    ref.current.rotation.z = Math.sin(t * 0.4) * 0.5 + 0.3
  })
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
        <meshStandardMaterial color="#FF6B35" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0.28, 0.48, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.04, 0.15, 8]} />
        <meshStandardMaterial color="#254d8a" />
      </mesh>
    </group>
  )
}

/* ===== Floating Particles ===== */
function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 300
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
    pointsRef.current.rotation.x = Math.sin(t * 0.008) * 0.1
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

/* ===== Main Scene ===== */
export default function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 3, 10], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} />
      <pointLight position={[-5, 3, -5]} intensity={0.3} color="#FF6B35" />

      {/* Background layers */}
      <HexGrid />
      <WaveGrid />
      <FloatingParticles />

      {/* Floating 3D objects */}
      <FloatingBook position={[-4, 2, -2]} />
      <FloatingBook position={[5, -1, -3]} />
      <FloatingLaptop position={[3.5, 2.5, -1]} />
      <FloatingLaptop position={[-5, -2, -2]} />
      <FloatingGradCap position={[-2, 3.5, 0]} />
      <FloatingGradCap position={[4, -2.5, -1]} />
      <FloatingPen position={[1, 3, 1]} />
      <FloatingPen position={[-3, -1.5, 0]} />
    </Canvas>
  )
}
