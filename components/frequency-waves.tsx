"use client"

import { useEffect, useRef } from "react"

interface FrequencyWavesProps {
  frequency: string
  color: string
  intensity: number
  animationFrame: number
}

export default function FrequencyWaves({ frequency, color, intensity, animationFrame }: FrequencyWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar canvas
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)

    // Configuración de ondas según la frecuencia
    const getWaveConfig = (freq: string) => {
      switch (freq) {
        case "general":
          return { waves: 3, speed: 1, amplitude: 0.3 }
        case "cascada":
          return { waves: 5, speed: 0.5, amplitude: 0.4 }
        case "pausado":
          return { waves: 2, speed: 0.3, amplitude: 0.2 }
        case "intermitente":
          return { waves: 4, speed: 2, amplitude: 0.5 }
        case "rojo":
          return { waves: 3, speed: 1.5, amplitude: 0.4 }
        case "verde":
          return { waves: 4, speed: 0.8, amplitude: 0.3 }
        case "azul":
          return { waves: 2, speed: 0.6, amplitude: 0.25 }
        default:
          return { waves: 3, speed: 1, amplitude: 0.3 }
      }
    }

    const config = getWaveConfig(frequency)
    const alpha = (intensity / 100) * 0.7

    // Dibujar ondas
    for (let i = 0; i < config.waves; i++) {
      ctx.beginPath()
      ctx.strokeStyle = `${color}${Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, "0")}`
      ctx.lineWidth = 2

      const phase = (animationFrame * config.speed + i * 60) * 0.02
      const waveHeight = height * config.amplitude

      for (let x = 0; x <= width; x += 2) {
        const y =
          height / 2 + Math.sin(x * 0.02 + phase) * waveHeight + Math.sin(x * 0.01 + phase * 1.5) * (waveHeight * 0.5)

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()
    }

    // Efecto de pulso para frecuencias intermitentes
    if (frequency === "intermitente") {
      const pulseAlpha = Math.sin(animationFrame * 0.3) * 0.3 + 0.4
      ctx.fillStyle = `${color}${Math.floor(pulseAlpha * 255)
        .toString(16)
        .padStart(2, "0")}`
      ctx.fillRect(0, 0, width, height)
    }
  }, [frequency, color, intensity, animationFrame])

  return <canvas ref={canvasRef} className="w-full h-full absolute bottom-0 left-0" />
}
