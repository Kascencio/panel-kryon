"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Mic,
  MicOff,
  Lightbulb,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"

import AudioPlayer from "@/components/audio-player"
import VideoPlayer from "@/components/video-player"
import TimerDisplay from "@/components/timer-display"
import FrequencyWaves from "@/components/frequency-waves"
import ParticleEffects from "@/components/particle-effects"
import { useMicrophone } from "@/hooks/useMicrophone"
import { useArduinoService } from "@/components/arduino-service"

/* ────────── Tipos ────────── */
export interface Therapy {
  id: string
  name: string
  description: string
  frequency: string
  color: string
  icon: string
  category: string
  hasVideo?: boolean
}

interface Props {
  therapy: Therapy
  duration: "corto" | "mediano" | "largo"
  onEndSession: () => void
  lightIntensity: number
  onLightIntensityChange: (intensity: number) => void
}

/* ────────── Auxiliares ────────── */
const durLabel = (d: Props["duration"]) =>
  d === "corto" ? "4 minutos" : d === "mediano" ? "15 minutos" : "20 minutos"

const fmt = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")} : ${(s % 60).toString().padStart(2, "0")}`

/* ══════════ Componente ══════════ */
export default function SessionControlScreen({
  therapy,
  duration,
  onEndSession,
  lightIntensity,
  onLightIntensityChange,
}: Props) {
  /* Estado sesión */
  const [active, setActive] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [total, setTotal] = useState(0)

  /* Micrófono */
  const [micEnabled, setMicEnabled] = useState(false)
  const { ready: micReady } = useMicrophone(micEnabled)

  /* Arduino Service */
  const {
    conectarArduino,
    iniciarTerapia,
    cambiarIntensidad,
    detenerTerapia,
  } = useArduinoService()

  /* Calcular duración total */
  useEffect(() => {
    const mins = duration === "corto" ? 4 : duration === "mediano" ? 15 : 20
    setTotal(mins * 60)
  }, [duration])

  /* Timer tick */
  useEffect(() => {
    if (!active || paused) return
    const id = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= total) {
          setActive(false)
          return total
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [active, paused, total])

  /* Handlers de control */
  const start = async () => {
    // Llamar a conectarArduino directamente en el click para mantener el contexto de user gesture
    const ok = await conectarArduino()
    if (!ok) return

    const mins = duration === "corto" ? 4 : duration === "mediano" ? 15 : 20
    const success = await iniciarTerapia(
      therapy.id,
      therapy.frequency,
      mins,
      lightIntensity
    )
    if (!success) return

    setActive(true)
    setPaused(false)
    setElapsed(0)
  }

  const togglePause = () => setPaused((p) => !p)

  const stop = async () => {
    await detenerTerapia()
    setActive(false)
    setPaused(false)
    setElapsed(0)
  }

  const restart = async () => {
    await detenerTerapia()
    await start()
  }

  const handleLightChange = async (vals: number[]) => {
    const intensity = vals[0]
    onLightIntensityChange(intensity)
    if (active) {
      await cambiarIntensidad(intensity)
    }
  }

  const progress = total ? (elapsed / total) * 100 : 0

  /* ────────── Render ────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={onEndSession}
            variant="outline"
            className="bg-gray-800 border-gray-700 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Sesión Activa</h1>
            <p className="text-gray-400">
              {therapy.name} – {durLabel(duration)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge style={{ backgroundColor: `${therapy.color}20`, color: therapy.color, border: `1px solid ${therapy.color}40` }}>
              {therapy.frequency}
            </Badge>
            <Badge className={active ? "bg-green-900/30 text-green-400" : "bg-gray-700 text-gray-400"}>
              {active ? "ACTIVA" : "INACTIVA"}
            </Badge>
            {therapy.hasVideo && <Badge className="bg-red-900/40 text-red-400 border-red-600/30">VIDEO</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel visual principal */}
          <div className="lg:col-span-2 space-y-6">
            {therapy.hasVideo ? (
              <VideoPlayer
                sessionActive={active && !paused}
                sessionDuration={duration}
                selectedTherapy={therapy}
                onVideoComplete={() => setActive(false) || setPaused(false)}
                onVideoDurationChange={(d) => d && setTotal(Math.floor(d))}
              />
            ) : (
              <Card className="bg-gray-800 border-gray-700 h-96">
                <CardContent className="p-0 h-full relative overflow-hidden rounded-lg">
                  <ParticleEffects isActive={active} color={therapy.color} intensity={lightIntensity} pattern={therapy.frequency} />
                  <FrequencyWaves isActive={active} frequency={therapy.frequency} color={therapy.color} intensity={lightIntensity} />
                  <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-white text-center">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-4" style={{ backgroundColor: therapy.color }}>
                      {therapy.icon}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{therapy.name}</h2>
                    <p className="text-gray-300 mb-4">{therapy.description}</p>
                    <div className="text-4xl font-mono font-bold mb-2">{fmt(elapsed)}</div>
                    <div className="text-lg text-gray-300">de {fmt(total)}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Barra de progreso */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Progreso de la sesión</span>
                  <span className="text-gray-400 text-sm">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full h-3" />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Inicio</span>
                  <span>{fmt(elapsed)} / {fmt(total)}</span>
                  <span>Fin</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel de control lateral */}
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white text-lg">
                  <Timer className="mr-2 h-5 w-5" /> Control de Sesión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!active ? (
                  <Button onClick={start} className="w-full" style={{ backgroundColor: therapy.color, color: "white" }}>
                    <Play className="mr-2 h-5 w-5" /> Iniciar Sesión
                  </Button>
                ) : (
                  <>
                    <Button onClick={togglePause} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white">
                      {paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />} {paused ? "Reanudar" : "Pausar"}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={restart} variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                        <RotateCcw className="mr-1 h-4 w-4" /> Reiniciar
                      </Button>
                      <Button onClick={stop} variant="outline" className="bg-red-900/30 border-red-600 text-red-400 hover:bg-red-900/50">
                        Detener
                      </Button>
                    </div>
                  </>
                )}

                {/* Micrófono toggle */}
                <Button onClick={() => setMicEnabled((v) => !v)} variant="outline" className={micEnabled ? "w-full bg-green-900/30 border-green-600 text-green-400 hover:bg-green-900/40" : "w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"}>
                  {micEnabled ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />} {micEnabled ? "Apagar Micrófono" : "Encender Micrófono"}
                </Button>

                {/* Control de intensidad */}
                <div className="space-y-2">
                  <span className="text-xs text-gray-300 flex items-center">
                    <Lightbulb className="mr-1 h-4 w-4" /> Intensidad: {lightIntensity}%
                  </span>
                  <Slider value={[lightIntensity]} min={10} max={100} step={5} onValueChange={handleLightChange} />
                </div>

                {/* Reproductor de audio/video */}
                {therapy.hasVideo ? null : (
                  <AudioPlayer
                    sessionActive={active && !paused}
                    sessionDuration={duration}
                    selectedTherapy={therapy}
                    onAudioComplete={() => setActive(false) || setPaused(false)}
                    onAudioDurationChange={(d) => d && setTotal(Math.floor(d))}
                    preferFlac
                  />
                )}

                {/* Timer adicional */}
                <TimerDisplay currentTime={elapsed} totalTime={total} isActive={active && !paused} onComplete={() => setActive(false) || setPaused(false)} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
