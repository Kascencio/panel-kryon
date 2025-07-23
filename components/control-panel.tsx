"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Play,
  Pause,
  Activity,
  Zap,
  RefreshCw,
  Sparkles,
  Clock,
  Usb,
  Settings2,
  Video,
  Music,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import AudioPlayer from "@/components/audio-player"
import VideoPlayer from "@/components/video-player"
import ArduinoCommandMonitor from "@/components/arduino-command-monitor"
import AudioDurationWarning from "@/components/audio-duration-warning"

import { sessionTherapies } from "@/components/session-therapies"
import colorTherapies from "@/components/color-therapies"
import { therapies } from "@/components/more-therapies"

import { useArduinoService } from "@/components/arduino-service"
import { useToast } from "@/hooks/use-toast"

import type { Therapy } from "@/components/session-therapies"

/* ────────── helpers ────────── */
const allTherapies = [
  ...sessionTherapies,
  ...(Array.isArray(colorTherapies) ? colorTherapies : [colorTherapies]),
  ...therapies,
]

const availableModes = [
  { id: "patron",        name: "Patrón Complejo", icon: "🔄", arduinoMode: "general"       },
  { id: "intermitente",  name: "Intermitente",    icon: "⚡",  arduinoMode: "intermitente" },
  { id: "pausado",       name: "Pausado",         icon: "⏸️", arduinoMode: "pausado"      },
  { id: "cascada",       name: "Cascada",         icon: "🌊",  arduinoMode: "cascada"      },
  { id: "rojo",          name: "Solo Rojo",       icon: "🔴",  arduinoMode: "rojo"         },
  { id: "verde",         name: "Solo Verde",      icon: "🟢",  arduinoMode: "verde"        },
  { id: "azul",          name: "Solo Azul",       icon: "🔵",  arduinoMode: "azul"         },
]

const durationInMinutes = (d: "corto" | "mediano" | "largo") =>
  d === "corto" ? 4 : d === "mediano" ? 15 : 20

/* ══════════ COMPONENT ══════════ */
interface Props {
  sessionActive: boolean
  sessionDuration: "corto" | "mediano" | "largo"
  selectedTherapy: Therapy | null
  lightIntensity: number
  audioDuration: number | null
  selectedMode: string | null
  onStartSession: () => void
  onStopSession: () => void
  onCompleteSession: () => void
  onDurationChange: (d: "corto" | "mediano" | "largo") => void
  onLightIntensityChange: (i: number) => void
  onAudioDurationChange?: (d: number | null) => void
  onModeChange: (m: string | null) => void
  arduinoConnected: boolean
}

export default function ControlPanel({
  sessionActive,
  sessionDuration,
  selectedTherapy,
  lightIntensity,
  audioDuration,
  selectedMode,
  onStartSession,
  onStopSession,
  onCompleteSession,
  onDurationChange,
  onLightIntensityChange,
  onAudioDurationChange,
  onModeChange,
  arduinoConnected,
}: Props) {
  /* ────────── servicio Arduino ────────── */
  const {
    iniciarTerapia,
    detenerTerapia,
    completarTerapia,
    enviarComando,
    conectarArduino,
    connected,
  } = useArduinoService()

  const { toast } = useToast()

  /* ────────── estado local ────────── */
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [mediaType, setMediaType] = useState<"audio" | "video">("audio")
  const [isSendingIntensity, setIsSendingIntensity] = useState(false)
  const [showTestControls, setShowTestControls] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  /* ────────── helpers ────────── */
  const getEffectiveMode = useCallback(() => {
    if (selectedMode) return selectedMode
    if (!selectedTherapy) return "patron"
    if (selectedTherapy.customMode) return selectedTherapy.customMode
    return selectedTherapy.frequency
  }, [selectedMode, selectedTherapy])

  const getArduinoMode = useCallback(() => {
    const eff = getEffectiveMode()
    const cfg = availableModes.find((m) => m.id === eff)
    return cfg?.arduinoMode ?? "general"
  }, [getEffectiveMode])

  /* ────────── INICIAR sesión mejorado ────────── */
  const handleStartSession = useCallback(async () => {
    if (!selectedTherapy) {
      toast({ 
        title: "Sin terapia seleccionada", 
        description: "Selecciona una terapia antes de iniciar",
        variant: "destructive" 
      })
      return
    }

    setIsStarting(true)
    if (!connected) {
      const ok = await conectarArduino()
      if (!ok) {
        setIsStarting(false)
        return
      }
      await new Promise(r => setTimeout(r, 500))
    }

    try {
      const tipo = selectedTherapy.id
      const modo = getArduinoMode()
      const mins = durationInMinutes(sessionDuration)
      const inten = lightIntensity

      const success = await iniciarTerapia(tipo, modo, mins, inten)
      if (success) {
        onStartSession()
        toast({ 
          title: "Terapia iniciada ✨",
          description: `${selectedTherapy.name} - ${mins} min`
        })
      } else {
        toast({ 
          title: "Error al iniciar terapia",
          description: "Verifica conexión con Arduino",
          variant: "destructive" 
        })
      }
    } catch {
      toast({ 
        title: "Error inesperado",
        description: "Ocurrió un error al iniciar la terapia",
        variant: "destructive" 
      })
    } finally {
      setIsStarting(false)
    }
  }, [
    selectedTherapy,
    connected,
    conectarArduino,
    getArduinoMode,
    sessionDuration,
    lightIntensity,
    iniciarTerapia,
    onStartSession,
    toast,
  ])

  /* ────────── DETENER sesión mejorado ────────── */
  const handleStopSession = useCallback(async () => {
    try {
      await detenerTerapia()
      onStopSession()
    } catch {
      toast({ 
        title: "Error al detener",
        description: "No se pudo detener la terapia",
        variant: "destructive" 
      })
    }
  }, [detenerTerapia, onStopSession, toast])

  /* ────────── MEDIA completa ────────── */
  const handleMediaComplete = useCallback(async () => {
    try {
      await completarTerapia()
    } finally {
      onCompleteSession()
    }
  }, [completarTerapia, onCompleteSession])

  /* ────────── cambio de intensidad ────────── */
  const handleIntensityChange = useCallback((vals: number[]) => {
    const intensity = vals[0]
    onLightIntensityChange(intensity)
    if (sessionActive && connected) {
      setIsSendingIntensity(true)
      enviarComando(`intensidad:${intensity}`).finally(() => setIsSendingIntensity(false))
    }
  }, [sessionActive, connected, onLightIntensityChange, enviarComando])

  /* ────────── UI ────────── */
  return (
    <Card className="bg-gray-900 border-gray-800 text-white">
      <CardHeader className="bg-gray-800 rounded-t-lg pb-1">
        <CardTitle className="flex items-center justify-between text-cyan-400 text-base">
          <div className="flex items-center">
            <Activity className="mr-2 h-4 w-4"/> Control de Sesión
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTestControls(!showTestControls)}
            className="h-6 px-2 text-xs"
          >
            <Settings2 className="h-3 w-3"/>
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-3">
        {/* STATUS BAR */}
        <div className="flex justify-between items-center mb-2 text-xs text-gray-400">
          <span>{sessionActive ? "🔴 Activa" : "⏸️ En espera"}</span>
          <span className="flex items-center">
            {connected ? (
              <><Usb className="h-3 w-3 mr-1 text-green-400"/>OK</>
            ) : (
              <><Usb className="h-3 w-3 mr-1 text-red-400"/>Off</>
            )}
          </span>
          {selectedTherapy && (
            <Badge variant="outline" className="text-xs">
              {getEffectiveMode()}
            </Badge>
          )}
        </div>

        {/* MAIN BUTTON */}
        <div className="flex space-x-2">
          <Button
            onClick={sessionActive ? handleStopSession : handleStartSession}
            disabled={!selectedTherapy || isStarting}
            variant={sessionActive ? "destructive" : "default"}
            className={
              sessionActive 
                ? "bg-red-600 hover:bg-red-500 flex-1" 
                : "bg-cyan-600 hover:bg-cyan-500 flex-1"
            }
            size="sm"
          >
            {isStarting ? (
              <><RefreshCw className="mr-2 h-3 w-3 animate-spin"/>Iniciando...</>
            ) : sessionActive ? (
              <><Pause className="mr-2 h-3 w-3"/>Detener</>
            ) : (
              <><Play className="mr-2 h-3 w-3"/>Iniciar</>
            )}
          </Button>

          {!connected && (
            <Button
              onClick={conectarArduino}
              variant="outline"
              size="sm"
              className="border-green-500 text-green-400 hover:bg-green-500/10"
            >
              <Usb className="h-3 w-3"/>
            </Button>
          )}
        </div>

        {/* INTENSITY CONTROL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span className="flex items-center"><Zap className="mr-1 h-3 w-3"/>Intensidad: {lightIntensity}%</span>
            {isSendingIntensity && <RefreshCw className="h-3 w-3 animate-spin text-cyan-400"/>}
          </div>
          <Slider
            value={[lightIntensity]}
            onValueChange={handleIntensityChange}
            max={100}
            step={1}
            disabled={!connected}
          />
        </div>

        {/* MODE SELECT (read-only) */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-300">Modo</Label>
          <div className="text-sm">{getEffectiveMode()}</div>
        </div>

        {/* DURATION */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-300 flex items-center"><Clock className="mr-1 h-3 w-3"/>Duración</Label>
          <RadioGroup
            value={sessionDuration}
            onValueChange={(v) => onDurationChange(v as any)}
            className="flex space-x-4"
            disabled={sessionActive}
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="corto" id="corto" className="scale-75"/>
              <Label htmlFor="corto" className="text-xs">4 min</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="mediano" id="mediano" className="scale-75"/>
              <Label htmlFor="mediano" className="text-xs">15 min</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="largo" id="largo" className="scale-75"/>
              <Label htmlFor="largo" className="text-xs">20 min</Label>
            </div>
          </RadioGroup>
        </div>

        {/* MEDIA TYPE SELECT */}
        {selectedTherapy?.hasVideo && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-300">Tipo Media</Label>
            <Select
              value={mediaType}
              onValueChange={(v: "audio" | "video") => setMediaType(v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="audio"><><Music className="mr-2 h-3 w-3"/>Audio</></SelectItem>
                <SelectItem value="video"><><Video className="mr-2 h-3 w-3"/>Video</></SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* DURATION WARNING */}
        <AudioDurationWarning
          sessionDuration={sessionDuration}
          audioDuration={audioDuration}
          videoDuration={videoDuration}
        />

        {/* PLAYER */}
        {(mediaType === "audio" || !selectedTherapy?.hasVideo) ? (
          <AudioPlayer
            sessionActive={sessionActive}
            sessionDuration={sessionDuration}
            selectedTherapy={selectedTherapy}
            onAudioComplete={handleMediaComplete}
            onAudioDurationChange={onAudioDurationChange}
          />
        ) : (
          <VideoPlayer
            sessionActive={sessionActive}
            sessionDuration={sessionDuration}
            selectedTherapy={selectedTherapy}
            onVideoComplete={handleMediaComplete}
            onVideoDurationChange={setVideoDuration}
            isExternalScreen={false}
          />
        )}
      </CardContent>
    </Card>
  )
}
