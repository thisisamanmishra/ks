'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

/* ===== Isometric 3D Icons for Services ===== */
function ThesisIcon() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.rotation.y = Math.sin(t * 0.5) * 0.3
  })
  return (
    <group ref={ref} scale={1.2}>
      <mesh position={[0, 0, 0]}><boxGeometry args={[0.7, 0.05, 0.9]} /><meshStandardMaterial color="#FF6B35" /></mesh>
      <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.65, 0.08, 0.85]} /><meshStandardMaterial color="#fff5ee" /></mesh>
      <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.7, 0.03, 0.9]} /><meshStandardMaterial color="#e0551f" /></mesh>
      {/* Ribbon */}
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.04, 0.04, 0.12, 8]} /><meshStandardMaterial color="#1B3A6B" /></mesh>
    </group>
  )
}

function WebsiteIcon() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.rotation.y = Math.sin(t * 0.4) * 0.3
  })
  return (
    <group ref={ref} scale={1.1}>
      <mesh><boxGeometry args={[1, 0.7, 0.04]} /><meshStandardMaterial color="#1B3A6B" metalness={0.7} roughness={0.2} /></mesh>
      <mesh position={[0, 0, 0.025]}><planeGeometry args={[0.85, 0.55]} /><meshStandardMaterial color="#4a90ff" emissive="#4a90ff" emissiveIntensity={0.2} /></mesh>
      <mesh position={[0, -0.42, 0]}><boxGeometry args={[0.3, 0.1, 0.04]} /><meshStandardMaterial color="#254d8a" /></mesh>
    </group>
  )
}

function LogoIcon() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.rotation.y = t * 0.3
  })
  return (
    <group ref={ref} scale={1.2}>
      <mesh><cylinderGeometry args={[0.5, 0.5, 0.06, 32]} /><meshStandardMaterial color="#FF6B35" metalness={0.5} /></mesh>
      <mesh position={[0, 0.04, 0]}><torusGeometry args={[0.3, 0.04, 8, 32]} /><meshStandardMaterial color="#1B3A6B" /></mesh>
      <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={0.3} /></mesh>
    </group>
  )
}

function AssignIcon() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.rotation.y = Math.sin(t * 0.45) * 0.25
  })
  return (
    <group ref={ref} scale={1.1}>
      <mesh><boxGeometry args={[0.7, 0.9, 0.04]} /><meshStandardMaterial color="#fff5ee" /></mesh>
      <mesh position={[0, 0, -0.025]}><boxGeometry args={[0.75, 0.95, 0.02]} /><meshStandardMaterial color="#1B3A6B" /></mesh>
      {[0.25, 0.1, -0.05, -0.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0.025]}><boxGeometry args={[0.5, 0.04, 0.01]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      ))}
      <mesh position={[-0.2, 0.35, 0.025]}><boxGeometry args={[0.12, 0.12, 0.01]} /><meshStandardMaterial color="#FF6B35" /></mesh>
    </group>
  )
}

function SEOIcon() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.rotation.y = Math.sin(t * 0.35) * 0.35
  })
  return (
    <group ref={ref} scale={1.1}>
      <mesh><torusGeometry args={[0.35, 0.06, 8, 32]} /><meshStandardMaterial color="#1B3A6B" metalness={0.6} /></mesh>
      <mesh position={[0.35, -0.35, 0]} rotation={[0, 0, -0.8]}><cylinderGeometry args={[0.04, 0.06, 0.4, 8]} /><meshStandardMaterial color="#FF6B35" /></mesh>
      <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.3, 0.25, 0.04]} /><meshStandardMaterial color="#FF6B35" transparent opacity={0.6} /></mesh>
    </group>
  )
}

function VideoIcon() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.rotation.y = Math.sin(t * 0.5) * 0.2
  })
  return (
    <group ref={ref} scale={1.2}>
      <mesh><boxGeometry args={[1, 0.6, 0.05]} /><meshStandardMaterial color="#1B3A6B" metalness={0.4} roughness={0.3} /></mesh>
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[0.9, 0.5]} /><meshStandardMaterial color="#0f2545" /></mesh>
      {/* Play button */}
      <mesh position={[0, 0, 0.04]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.12, 0.18, 3]} />
        <meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

function ResumeIcon() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.rotation.y = Math.sin(t * 0.4) * 0.3
  })
  return (
    <group ref={ref} scale={1.1}>
      <mesh><boxGeometry args={[0.65, 0.85, 0.03]} /><meshStandardMaterial color="white" /></mesh>
      <mesh position={[0, 0.3, 0.02]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#1B3A6B" /></mesh>
      {[-0.05, -0.15, -0.25].map((y, i) => (
        <mesh key={i} position={[0, y, 0.02]}><boxGeometry args={[0.45, 0.035, 0.005]} /><meshStandardMaterial color="#e2e8f0" /></mesh>
      ))}
      <mesh position={[-0.15, 0.15, 0.02]}><boxGeometry args={[0.15, 0.04, 0.005]} /><meshStandardMaterial color="#FF6B35" /></mesh>
    </group>
  )
}

function BlogIcon() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.rotation.y = Math.sin(t * 0.5) * 0.2
  })
  return (
    <group ref={ref} scale={1.1}>
      <mesh><boxGeometry args={[0.8, 0.6, 0.03]} /><meshStandardMaterial color="white" /></mesh>
      <mesh position={[-0.15, 0.15, 0.02]}><boxGeometry args={[0.3, 0.2, 0.01]} /><meshStandardMaterial color="#4a90ff" /></mesh>
      {[0, -0.1, -0.2].map((y, i) => (
        <mesh key={i} position={[0.1, y, 0.02]}><boxGeometry args={[0.35, 0.03, 0.005]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
      ))}
    </group>
  )
}

const iconComponents: Record<string, React.FC> = {
  thesis: ThesisIcon,
  website: WebsiteIcon,
  logo: LogoIcon,
  assignment: AssignIcon,
  seo: SEOIcon,
  video: VideoIcon,
  resume: ResumeIcon,
  blog: BlogIcon,
}

export function ServiceIcon3D({ type }: { type: string }) {
  const IconComp = iconComponents[type] || ThesisIcon
  return (
    <div className="w-20 h-20 mx-auto mb-3">
      <Canvas camera={{ position: [0, 0.5, 2], fov: 35 }} dpr={[1, 1.5]} gl={{ alpha: true }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 3]} intensity={0.5} />
        <IconComp />
      </Canvas>
    </div>
  )
}

/* ===== 3D Map Pin for Contact ===== */
function MapPin3D() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.position.y = Math.sin(t * 1.2) * 0.15
    ref.current.rotation.y = t * 0.3
  })
  return (
    <group ref={ref}>
      {/* Pin body */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.4, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshStandardMaterial color="#FF6B35" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Pin point */}
      <mesh position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.28, 0.5, 32]} />
        <meshStandardMaterial color="#FF6B35" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Inner circle */}
      <mesh position={[0, 0.35, 0.3]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Shadow disk */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 32]} />
        <meshStandardMaterial color="#1B3A6B" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

export function ContactMapPin() {
  return (
    <div className="w-32 h-32 mx-auto">
      <Canvas camera={{ position: [0, 0, 3], fov: 35 }} dpr={[1, 1.5]} gl={{ alpha: true }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 3]} intensity={0.6} />
        <pointLight position={[-2, 2, 2]} intensity={0.3} color="#FF6B35" />
        <MapPin3D />
      </Canvas>
    </div>
  )
}

/* ===== 3D Speech Bubble for Testimonials ===== */
function SpeechBubble3D({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.position.y = Math.sin(t * 0.8) * 0.08
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.15
  })
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.85} roughness={0.1} metalness={0.3} />
      </mesh>
      {/* tail */}
      <mesh position={[-0.25, -0.4, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.12, 0.25, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.85} />
      </mesh>
      {/* Quote mark */}
      <mesh position={[-0.1, 0.1, 0.4]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.1, 0.1, 0.4]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  )
}

export function TestimonialBubble({ variant = 0 }: { variant?: number }) {
  const colors = ['#1B3A6B', '#FF6B35', '#254d8a', '#e0551f', '#4a90ff', '#0f2545']
  return (
    <div className="w-16 h-16">
      <Canvas camera={{ position: [0, 0, 2], fov: 35 }} dpr={[1, 1.5]} gl={{ alpha: true }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 3, 3]} intensity={0.4} />
        <SpeechBubble3D color={colors[variant % colors.length]} />
      </Canvas>
    </div>
  )
}

/* ===== 3D Timeline Node ===== */
function TimelineOrb({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() / 1000
    ref.current.rotation.y = t * 0.5
    ref.current.position.y = Math.sin(t * 0.6) * 0.05
  })
  return (
    <group ref={ref}>
      <mesh>
        <torusGeometry args={[0.25, 0.06, 16, 32]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

export function TimelineNode3D({ index = 0 }: { index?: number }) {
  const colors = ['#1B3A6B', '#FF6B35', '#254d8a', '#e0551f']
  return (
    <div className="w-12 h-12">
      <Canvas camera={{ position: [0, 0, 1.5], fov: 35 }} dpr={[1, 1.5]} gl={{ alpha: true }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 2]} intensity={0.5} />
        <TimelineOrb color={colors[index % colors.length]} />
      </Canvas>
    </div>
  )
}
