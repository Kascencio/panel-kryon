"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, CheckCircle, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAudioCache } from "@/components/audio-cache-provider"

interface AudioPreloaderProps {
  autoStart?: boolean
  showProgress?: boolean
  onComplete?: () => void
  onError?: (error: string) => void
  className?: string
}

export default function AudioPreloader({
  autoStart = true,
  showProgress = true,
  onComplete,
  onError,
  className = "",
}: AudioPreloaderProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "completed" | "error">("idle")
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const { isPreloading, preloadProgress, totalFiles, loadedFiles, hasError, preloadAudio, clearCache } = useAudioCache()

  // Actualizar estado basado en el contexto
  useEffect(() => {
    if (isPreloading && status !== "loading") {
      setStatus("loading")
      setStartTime(Date.now())
    } else if (!isPreloading && preloadProgress >= 100 && !hasError && status !== "completed") {
      setStatus("completed")
      onComplete?.()
    } else if (!isPreloading && hasError && status !== "error") {
      setStatus("error")
      onError?.("Error cargando archivos de audio")
    }
  }, [isPreloading, preloadProgress, hasError, status, onComplete, onError])

  // Calcular tiempo transcurrido
  useEffect(() => {
    if (status === "loading" && startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 100)

      return () => clearInterval(interval)
    }
  }, [status, startTime])

  // Auto-iniciar si está habilitado
  useEffect(() => {
    if (autoStart && status === "idle" && !isPreloading && preloadProgress === 0) {
      console.log("🎵 AudioPreloader: Iniciando precarga automática...")
      preloadAudio()
    }
  }, [autoStart, status, isPreloading, preloadProgress, preloadAudio])

  // Si no se debe mostrar progreso, retornar null
  if (!showProgress) {
    return null
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return <Music className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "loading":
        return "Precargando audio..."
      case "completed":
        return "Audio listo"
      case "error":
        return "Error de carga"
      default:
        return "Preparando audio"
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "bg-blue-900/30 text-blue-400 border-blue-600/30"
      case "completed":
        return "bg-green-900/30 text-green-400 border-green-600/30"
      case "error":
        return "bg-red-900/30 text-red-400 border-red-600/30"
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-600/30"
    }
  }

  const handleRetry = () => {
    clearCache()
    setStatus("idle")
    setStartTime(null)
    setElapsedTime(0)
    setTimeout(() => {
      preloadAudio()
    }, 500)
  }

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>Sistema de Audio</span>
          </div>
          <Badge className={getStatusColor()}>{getStatusText()}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Progreso de carga</span>
            <span>{Math.round(preloadProgress)}%</span>
          </div>
          <Progress value={preloadProgress} className="w-full h-2" />
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="text-gray-400">Archivos</div>
            <div className="text-white font-mono">
              {loadedFiles} / {totalFiles}
            </div>
          </div>

          {status === "loading" && (
            <div className="space-y-1">
              <div className="text-gray-400">Tiempo</div>
              <div className="text-white font-mono">{formatTime(elapsedTime)}</div>
            </div>
          )}
        </div>

        {/* Estado detallado */}
        {status === "completed" && (
          <div className="p-2 bg-green-900/20 border border-green-600/30 rounded text-xs text-green-200">
            ✅ Todos los archivos de audio están listos para reproducción instantánea
          </div>
        )}

        {status === "error" && (
          <div className="space-y-2">
            <div className="p-2 bg-red-900/20 border border-red-600/30 rounded text-xs text-red-200">
              ❌ Error cargando archivos. Algunos audios pueden no estar disponibles.
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reintentar
            </Button>
          </div>
        )}

        {status === "loading" && (
          <div className="p-2 bg-blue-900/20 border border-blue-600/30 rounded text-xs text-blue-200">
            🎵 Precargando archivos de audio en segundo plano...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
