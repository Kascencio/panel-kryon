"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ArrowLeft, Play, Pause, RotateCcw, Timer, Mic, MicOff, Lightbulb,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import AudioPlayer from "@/components/audio-player"
import VideoPlayer from "@/components/video-player"
import ParticleEffects from "@/components/particle-effects"
import FrequencyWaves from "@/components/frequency-waves"
import { useMicrophone } from "@/hooks/useMicrophone"
import { useArduinoService } from "@/components/arduino-service"

/* ────────── tipos ────────── */
export interface Therapy {
  id: string
  name: string
  description: string
  frequency: string
  color: string
  icon: string
  category: string
  hasVideo?: boolean
  lightMode?: string
  initialIntensity?: number
}

interface Props {
  therapy: Therapy
  duration: "corto" | "mediano" | "largo"
  onEndSession(): void
  lightIntensity: number
  onLightIntensityChange(n: number): void
}

/* auxiliares */
const minutesOf = (d: Props["duration"]) => (d === "corto" ? 4 : d === "mediano" ? 15 : 20)
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,"0")} : ${String(s % 60).padStart(2,"0")}`

/* ══════════ componente ══════════ */
export default function SessionControlScreen({
  therapy,
  duration,
  onEndSession,
  lightIntensity,
  onLightIntensityChange,
}: Props) {
  /* estado */
  const [active, setActive] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [total, setTotal]   = useState(minutesOf(duration) * 60)

  /* hooks externos */
  const [micOn, setMicOn] = useState(false)
  useMicrophone(micOn)
  const { conectarArduino, iniciarTerapia, cambiarIntensidad, detenerTerapia } = useArduinoService()

  /* refresh duración si cambia */
  useEffect(() => {
    setTotal(minutesOf(duration) * 60)
    setElapsed(0)
  }, [duration])

  /* auto-start al montar */
  useEffect(() => { void handleStart() }, [])      // eslint-disable-line react-hooks/exhaustive-deps

  /* cronómetro */
  useEffect(() => {
    if (!active || paused) return
    const id = setInterval(() => setElapsed((p)=> p>=total?total:p+1), 1000)
    return () => clearInterval(id)
  }, [active, paused, total])

  /* iniciar terapia */
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

  /* helpers */
  const togglePause = () => setPaused(p=>!p)
  const handleStop  = useCallback(async ()=> { await detenerTerapia(); setActive(false); setPaused(false); setElapsed(0) }, [detenerTerapia])
  const changeInten = async (v:number[]) => { const n=v[0]; onLightIntensityChange(n); if(active) await cambiarIntensidad(n) }

  const progress = total ? (elapsed / total) * 100 : 0

  /* UI */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onEndSession} className="bg-gray-800 border-gray-700 text-white">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Sesión Activa</h1>
            <p className="text-gray-400">{therapy.name} · {minutesOf(duration)} min</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge style={{ backgroundColor:`${therapy.color}20`, color: therapy.color, border:`1px solid ${therapy.color}40` }}>
              {therapy.lightMode ?? therapy.frequency}
            </Badge>
            <Badge className={active ? "bg-green-900/30 text-green-400":"bg-gray-700 text-gray-400"}>
              {active? "ACTIVA":"INACTIVA"}
            </Badge>
            {therapy.hasVideo && <Badge className="bg-red-900/40 text-red-400 border-red-600/30">VIDEO</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* panel visual */}
          <div className="lg:col-span-2 space-y-6">
            {therapy.hasVideo ? (
              <VideoPlayer
                sessionActive={active && !paused}
                sessionDuration={duration}
                selectedTherapy={therapy}
                onVideoComplete={handleStop}
                onVideoDurationChange={(d)=> d&&setTotal(Math.floor(d))}
              />
            ) : (
              <Card className="bg-gray-800 border-gray-700 h-96">
                <CardContent className="p-0 h-full relative overflow-hidden rounded-lg">
                  <ParticleEffects isActive={active} color={therapy.color} intensity={lightIntensity} pattern={therapy.lightMode ?? therapy.frequency}/>
                  <FrequencyWaves isActive={active} frequency={therapy.lightMode ?? therapy.frequency} color={therapy.color} intensity={lightIntensity}/>
                  <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center text-white text-center">
                    <div className="w-24 h-24 mb-4 rounded-full flex items-center justify-center text-4xl" style={{ backgroundColor: therapy.color }}>{therapy.icon}</div>
                    <h2 className="text-2xl font-bold mb-2">{therapy.name}</h2>
                    <p className="text-gray-300 mb-4">{therapy.description}</p>
                    <div className="text-4xl font-mono font-bold mb-2">{fmt(elapsed)}</div>
                    <div className="text-lg text-gray-300">de {fmt(total)}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* progreso */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Progreso</span>
                  <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full h-3" />
              </CardContent>
            </Card>
          </div>

          {/* panel lateral */}
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader><CardTitle className="flex items-center text-white text-lg"><Timer className="mr-2 h-5 w-5"/>Control de Sesión</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {!active ? (
                  <Button style={{ backgroundColor:therapy.color,color:"white" }} className="w-full" onClick={handleStart}>
                    <Play className="h-5 w-5 mr-2"/> Iniciar
                  </Button>
                ) : (
                  <>
                    <Button onClick={togglePause} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white">
                      {paused? <><Play className="h-4 w-4 mr-1"/>Reanudar</> : <><Pause className="h-4 w-4 mr-1"/>Pausar</>}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600" onClick={handleStart}>
                        <RotateCcw className="h-4 w-4 mr-1"/> Reiniciar
                      </Button>
                      <Button variant="outline" className="bg-red-900/30 border-red-600 text-red-400 hover:bg-red-900/50" onClick={handleStop}>
                        Detener
                      </Button>
                    </div>
                  </>
                )}

                {/* intensidad */}
                <div className="space-y-2">
                  <span className="text-xs text-gray-300 flex items-center"><Lightbulb className="h-4 w-4 mr-1"/> Intensidad: {lightIntensity}%</span>
                  <Slider value={[lightIntensity]} min={10} max={100} step={5} onValueChange={changeInten}/>
                </div>

                {/* micrófono */}
                <Button
                  variant="outline"
                  className={micOn ? "w-full bg-green-900/30 border-green-600 text-green-400 hover:bg-green-900/40"
                                   : "w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"}
                  onClick={()=> setMicOn(v=>!v)}
                >
                  {micOn? <><Mic className="h-4 w-4 mr-2"/>Apagar Mic.</> : <><MicOff className="h-4 w-4 mr-2"/>Encender Mic.</>}
                </Button>

                {/* audio player si aplica */}
                {!therapy.hasVideo && (
                  <AudioPlayer
                    sessionActive={active && !paused}
                    sessionDuration={duration}
                    selectedTherapy={therapy}
                    onAudioComplete={handleStop}
                    onAudioDurationChange={(d)=>d && setTotal(Math.floor(d))}
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
