"use client"

import { useState, useEffect, useCallback } from "react"
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

import { useMicrophone } from "@/hooks/useMicrophone"
import { useArduinoService } from "@/components/arduino-service"
import type { Therapy } from "@/components/session-therapies"

/* ────────── tipos ────────── */

interface Props {
  therapy: Therapy
  duration: "corto" | "mediano" | "largo"
  onEndSession(): void           // ← Regresa a la pantalla de selección
  lightIntensity: number
  onLightIntensityChange(n: number): void
  autoOpen?: boolean             // ← Inicia automáticamente al montar si es true
}

/* ────────── auxiliares ────────── */
const minutesOf = (d: Props["duration"]) =>
  d === "corto" ? 4 : d === "mediano" ? 15 : 20

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")} : ${String(s % 60).padStart(2, "0")}`

/* ══════════ componente ══════════ */
export default function SessionControlScreen({
  therapy,
  duration,
  onEndSession,
  lightIntensity,
  onLightIntensityChange,
  autoOpen = false,
}: Props) {
  /* -------- estado local -------- */
  const [active, setActive] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [total, setTotal] = useState(minutesOf(duration) * 60)

  /* -------- servicios externos -------- */
  const [micOn, setMicOn] = useState(false)
  const { ready: micReady, audioLevel, isPlaying, micVolume, changeMicVolume } = useMicrophone(micOn)

  const {
    conectarArduino,
    iniciarTerapia,
    cambiarIntensidad,
    detenerTerapia,
  } = useArduinoService()

  /* -------- efectos -------- */
  /* Actualiza duración si cambia el selector */
  useEffect(() => {
    setTotal(minutesOf(duration) * 60)
    setElapsed(0)
  }, [duration])

  /* Lanza la sesión automáticamente si autoOpen === true */
  useEffect(() => {
    if (autoOpen) {
      void handleStart()
    }
    // Sólo depende de autoOpen y de la función construida
  }, [autoOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Reloj de la sesión */
  useEffect(() => {
    if (!active || paused) return
    const id = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= total) {
          clearInterval(id)
          void handleStop() // Detener y volver
          return total
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [active, paused, total]) // eslint-disable-line react-hooks/exhaustive-deps

  /* -------- handlers -------- */
  const handleStart = useCallback(async (): Promise<boolean> => {
    if (active) return true
    if (!(await conectarArduino())) return false

    const ok = await iniciarTerapia(
      therapy.id,
      therapy.lightMode ?? therapy.frequency,
      minutesOf(duration),
      lightIntensity,
    )
    if (!ok) return false

    setActive(true)
    setPaused(false)
    setElapsed(0)
    return true
  }, [active, conectarArduino, iniciarTerapia, therapy, duration, lightIntensity])

  const handleStop = useCallback(async () => {
    await detenerTerapia()
    setActive(false)
    setPaused(false)
    setElapsed(0)
    onEndSession()        // ← Navega automáticamente al selector
  }, [detenerTerapia, onEndSession])

  const togglePause = () => setPaused((p) => !p)

  const changeInten = async (v: number[]) => {
    const n = v[0]
    onLightIntensityChange(n)
    if (active) await cambiarIntensidad(n)
  }

  /* -------- derivadas -------- */
  const progress = total ? (elapsed / total) * 100 : 0

  /* -------- UI -------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onEndSession}
            className="bg-gray-800 border-gray-700 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Sesión Activa</h1>
            <p className="text-gray-400">
              {therapy.name} · {minutesOf(duration)} min
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              style={{
                backgroundColor: `${therapy.color}20`,
                color: therapy.color,
                border: `1px solid ${therapy.color}40`,
              }}
            >
              {therapy.lightMode ?? therapy.frequency}
            </Badge>
            <Badge
              className={
                active ? "bg-green-900/30 text-green-400" : "bg-gray-700 text-gray-400"
              }
            >
              {active ? "ACTIVA" : "INACTIVA"}
            </Badge>
            {therapy.hasVideo && (
              <Badge className="bg-red-900/40 text-red-400 border-red-600/30">
                VIDEO
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel visual principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-800 border-gray-700 h-96">
              <CardContent className="p-0 h-full relative overflow-hidden rounded-lg">
                {/* Panel visual simplificado */}
                <div 
                  className="w-full h-full flex items-center justify-center transition-all duration-1000"
                  style={{
                    background: active 
                      ? `radial-gradient(circle, ${therapy.color}40, ${therapy.color}10, transparent)`
                      : 'linear-gradient(135deg, #1f2937, #374151)',
                    opacity: active ? (lightIntensity / 100) : 0.3
                  }}
                >
                  {/* Overlay con información */}
                  <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center text-white text-center">
                    <div
                      className="w-24 h-24 mb-4 rounded-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: therapy.color }}
                    >
                      {therapy.icon}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{therapy.name}</h2>
                    <p className="text-gray-300 mb-4">{therapy.description}</p>
                    <div className="text-4xl font-mono font-bold mb-2">
                      {fmt(elapsed)}
                    </div>
                    <div className="text-lg text-gray-300">
                      de {fmt(total)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Barra de progreso */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Progreso</span>
                  <span className="text-sm text-gray-400">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="w-full h-3" />
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
                {/* Botones de control principales */}
                {!active ? (
                  <Button
                    style={{ backgroundColor: therapy.color, color: "white" }}
                    className="w-full"
                    onClick={handleStart}
                  >
                    <Play className="h-5 w-5 mr-2" /> Iniciar
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={togglePause}
                      className="w-full bg-yellow-600 hover:bg-yellow-500 text-white"
                    >
                      {paused ? (
                        <>
                          <Play className="h-4 w-4 mr-1" /> Reanudar
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4 mr-1" /> Pausar
                        </>
                      )}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        onClick={handleStart}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" /> Reiniciar
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-red-900/30 border-red-600 text-red-400 hover:bg-red-900/50"
                        onClick={handleStop}
                      >
                        Detener
                      </Button>
                    </div>
                  </>
                )}

                {/* Control de intensidad */}
                <div className="space-y-2">
                  <span className="text-xs text-gray-300 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-1" /> Intensidad:{" "}
                    {lightIntensity}%
                  </span>
                  <Slider
                    value={[lightIntensity]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={changeInten}
                  />
                </div>

                {/* Micrófono */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className={
                      micOn
                        ? "w-full bg-green-900/30 border-green-600 text-green-400 hover:bg-green-900/40"
                        : "w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    }
                    onClick={() => setMicOn((v) => !v)}
                  >
                    {micOn ? (
                      <>
                        <Mic className="h-4 w-4 mr-2" /> Apagar Mic.
                      </>
                    ) : (
                      <>
                        <MicOff className="h-4 w-4 mr-2" /> Encender Mic.
                      </>
                    )}
                  </Button>
                  
                  {/* Indicador de nivel de audio */}
                  {micOn && micReady && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-green-400 transition-all duration-100 ease-out"
                            style={{ width: `${audioLevel}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 min-w-[30px] text-right">
                          {Math.round(audioLevel)}%
                        </span>
                      </div>
                      
                      {/* Estado de reproducción del micrófono */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Micrófono:</span>
                        <span className={`font-medium ${isPlaying ? 'text-green-400' : 'text-yellow-400'}`}>
                          {isPlaying ? '🔊 Reproduciendo' : '⏸️ Pausado'}
                        </span>
                      </div>
                      
                      {/* Control de volumen del micrófono */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Volumen Mic:</span>
                          <span className="text-white">{Math.round(micVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={micVolume * 100}
                          onChange={(e) => changeMicVolume(parseInt(e.target.value) / 100)}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${micVolume * 100}%, #374151 ${micVolume * 100}%, #374151 100%)`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Reproductor de audio cuando no hay vídeo */}
                {!therapy.hasVideo && (
                  <AudioPlayer
                    sessionActive={active && !paused}
                    sessionDuration={duration}
                    selectedTherapy={therapy}
                    onAudioComplete={handleStop}
                    onAudioDurationChange={(d) =>
                      d && setTotal(Math.floor(d))
                    }
                    preferFlac
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
