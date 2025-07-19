// ExternalScreen.tsx – pantalla remota a pantalla completa
"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Wifi, WifiOff } from "lucide-react"
import { useSessionBridge } from "@/hooks/useSessionBridge"

/* ------------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------*/
const fmt = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
}

/* ------------------------------------------------------------------
 * Componente
 * ----------------------------------------------------------------*/
export default function ExternalScreen() {
  /* ────────── id & datos desde query ────────── */
  const params = useSearchParams()
  const windowId = params.get("id")
  const windowName = params.get("name") ?? "Ventana Externa"

  /* ────────── bridge con la app principal ────────── */
  const { sessionData, connected } = useSessionBridge(windowId)

  /* ────────── video refs / estado interno ────────── */
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  /* ------------------------------------------------------------------
   * Cargar / reproducir video sólo cuando la sesión está activa
   * ----------------------------------------------------------------*/
  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    // si NO hay terapia con video o la sesión no está activa ⇒ pausa
    if (!sessionData.sessionActive || !sessionData.selectedTherapy?.hasVideo) {
      v.pause()
      return
    }

    // Construir src cada vez que cambie terapia o duración
    const src = `/videos/${sessionData.selectedTherapy.frequency || "general"}-${sessionData.sessionDuration}min.mp4`

    if (!videoLoaded) {
      v.src = src
      v.load()
    }

    const handleLoaded = () => {
      setVideoLoaded(true)
      setDuration(v.duration)
      v.play().catch((e) => {
        console.warn("autoplay bloqueado", e)
      })
    }
    const handleTime = () => setCurrent(v.currentTime)
    const handleError = () => {
      setError(`No se pudo cargar el archivo ${src}`)
    }

    v.addEventListener("loadedmetadata", handleLoaded)
    v.addEventListener("timeupdate", handleTime)
    v.addEventListener("error", handleError)

    return () => {
      v.removeEventListener("loadedmetadata", handleLoaded)
      v.removeEventListener("timeupdate", handleTime)
      v.removeEventListener("error", handleError)
    }
  }, [sessionData, videoLoaded])

  /* ------------------------------------------------------------------
   * UI
   * ----------------------------------------------------------------*/
  const bg = sessionData.selectedTherapy?.color || "#0f172a"

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: bg }}>
      {/* VIDEO a pantalla completa */}
      {sessionData.selectedTherapy?.hasVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted={false}
          controls={false}
        />
      )}

      {/* Overlay de estado */}
      <div className="absolute top-0 left-0 w-full flex justify-between p-4 text-white text-sm bg-black/30 backdrop-blur-md">
        <span>{decodeURIComponent(windowName)}</span>
        <span className="flex items-center gap-1">
          {connected ? <Wifi className="h-4 w-4 text-green-400" /> : <WifiOff className="h-4 w-4 text-red-400" />}
          {connected ? "Conectado" : "Desconectado"}
        </span>
      </div>

      {/* Info terapia (center cuando no hay video) */}
      {!sessionData.selectedTherapy?.hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
          <div className="text-6xl mb-4">🧘‍♀️</div>
          <h2 className="text-3xl font-bold mb-2">
            {sessionData.sessionActive ? sessionData.selectedTherapy?.name : "Sistema en espera"}
          </h2>
          {!!sessionData.selectedTherapy && (
            <p className="max-w-md text-gray-200">{sessionData.selectedTherapy.description}</p>
          )}
        </div>
      )}

      {/* Barra inferior con progreso – solo cuando hay video */}
      {sessionData.selectedTherapy?.hasVideo && videoLoaded && (
        <div className="absolute bottom-0 left-0 w-full p-3 bg-black/40 backdrop-blur-md text-white text-xs flex items-center gap-3">
          <div>{fmt(current)} / {fmt(duration)}</div>
          <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400" style={{ width: `${(current/duration)*100}%` }} />
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/80 text-red-400 text-center p-6">
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
