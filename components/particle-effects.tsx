"use client"

import type React from "react"

import { useMemo, useRef, useEffect } from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import { PointsMaterial } from "three"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
}

interface ParticleEffectsProps {
  color: string
  intensity: number
  active: boolean
}

/* ----------  CONSTANTS ---------- */
const ARDUINO_COLORS = {
  rojo: "#ff0000",
  verde: "#00ff00",
  azul: "#0000ff",
}

/* ----------  2-D CANVAS (fireflies) ---------- */
function use2DParticles(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  color: string,
  intensity: number,
  active: boolean,
) {
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!active) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      particlesRef.current = []
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    const w = canvas.offsetWidth
    const h = canvas.offsetHeight

    const create = (): Particle => ({
      x: Math.random() * w,
      y: h + 10,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      life: 0,
      maxLife: Math.random() * 60 + 30,
      size: Math.random() * 3 + 1,
    })

    const loop = () => {
      ctx.clearRect(0, 0, w, h)
      if (Math.random() < (intensity / 100) * 0.3) particlesRef.current.push(create())

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        p.life++

        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * (intensity / 100) * 0.6
        if (alpha > 0.01) {
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
        return p.life < p.maxLife && p.y > -10
      })

      animationRef.current = requestAnimationFrame(loop)
    }

    loop()
    return () => animationRef.current && cancelAnimationFrame(animationRef.current)
  }, [color, intensity, active])
}

/* ----------  3-D PARTICLES (inside Canvas) ---------- */
interface ThreeParticlesProps {
  safeColor: string
  intensity: number
  active: boolean
  particleCount: number
}

function ThreeParticles({ safeColor, intensity, active, particleCount }: ThreeParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)

  // geometry & velocity arrays remain constant
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const vel = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.random() * 1.2
      pos.set([r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)], i * 3)
      vel.set([(Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01], i * 3)
    }
    return { positions: pos, velocities: vel }
  }, [particleCount])

  useFrame(({ clock }) => {
    if (!active || !pointsRef.current) return
    const time = clock.getElapsedTime()
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const move = 0.003 * intensity
      pos[i3] += Math.sin(time * 0.1 + i) * move
      pos[i3 + 1] += Math.cos(time * 0.13 + i) * move
      pos[i3 + 2] += Math.sin(time * 0.07 + i) * move

      const d = pos[i3] * pos[i3] + pos[i3 + 1] * pos[i3 + 1] + pos[i3 + 2] * pos[i3 + 2]
      if (d > 1.44 /* 1.2^2 */) {
        const f = 1.2 / Math.sqrt(d)
        pos[i3] *= f
        pos[i3 + 1] *= f
        pos[i3 + 2] *= f
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    if (pointsRef.current.material instanceof PointsMaterial) {
      pointsRef.current.material.size = 0.025 * intensity
      pointsRef.current.material.opacity = 0.6 * intensity
      pointsRef.current.material.color = new THREE.Color(safeColor)
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color={safeColor}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

/* ----------  MAIN COMPONENT ---------- */
export default function ParticleEffects({ color, intensity, active }: ParticleEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  use2DParticles(canvasRef, color, intensity, active)

  // map arbitrary colors to exact Arduino palette
  const safeColor = useMemo(() => {
    if (Object.values(ARDUINO_COLORS).includes(color)) return color
    if (/(red|pink|amber|orange)/i.test(color)) return ARDUINO_COLORS.rojo
    if (/(green|lime|emerald)/i.test(color)) return ARDUINO_COLORS.verde
    if (/(blue|cyan|indigo|purple)/i.test(color)) return ARDUINO_COLORS.azul
    return ARDUINO_COLORS.verde
  }, [color])

  const particleCount = 200

  if (!active) return <canvas ref={canvasRef} className="w-full h-full absolute inset-0 pointer-events-none" />

  return (
    <>
      {/* 2-D effect */}
      <canvas ref={canvasRef} className="w-full h-full absolute inset-0 pointer-events-none" />

      {/* 3-D effect (only when active) */}
      <Canvas
        className="w-full h-full absolute inset-0 pointer-events-none"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3] }}
      >
        <ThreeParticles safeColor={safeColor} intensity={intensity} active={active} particleCount={particleCount} />
      </Canvas>
    </>
  )
}
