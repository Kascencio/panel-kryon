/* components/external-screen.tsx */
"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Head from "next/head"
import { Wifi, WifiOff, Minimize2 } from "lucide-react"

import { useSessionBridge } from "@/hooks/useSessionBridge"

/* ────────── helpers ────────── */
const fmtTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(1, "0")}:${Math.floor(s % 60)
    .toString()
    .padStart(1, "0")}`

/* ══════════ componente ══════════ */
export default function ExternalScreen() {
  /* query-params ---------------------------------------------------- */
  const params      = useSearchParams()
  /** `string | null` — ya no puede ser `undefined` */
  const windowId    = params.get("id")          // ⟵  string | null
  const windowName  = params.get("name") ?? "Ventana Externa"

  /* puente con la app principal ------------------------------------ */
  const { sessionData, connected } = useSessionBridge(windowId)

  /* refs y estado del vídeo ---------------------------------------- */
  const videoRef               = useRef<HTMLVideoElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [current, setCurrent]  = useState(0)
  const [duration, setDuration]= useState(0)
  const [error, setError]      = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  /* función para salir de pantalla completa ----------------------- */
  const exitFullscreen = async () => {
    try {
      // Método 1: exitFullscreen estándar
      if (document.exitFullscreen) {
        await document.exitFullscreen()
        return
      }
      // Método 2: webkitExitFullscreen (Safari)
      if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
        return
      }
      // Método 3: mozCancelFullScreen (Firefox)
      if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
        return
      }
      // Método 4: msExitFullscreen (IE/Edge)
      if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
        return
      }
    } catch (e) {
      console.error("Error saliendo de pantalla completa:", e)
    }
  }

  /* detectar cambios de pantalla completa -------------------------- */
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = 
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement

      setIsFullscreen(!!fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    // Verificar estado inicial
    handleFullscreenChange()

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [])

  /* carga de vídeo -------------------------------------------------- */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    // Si la terapia actual no tiene vídeo → pausa y limpia
    if (!sessionData.selectedTherapy?.hasVideo) {
      v.pause()
      v.removeAttribute("src")
      v.load()
      setVideoLoaded(false)
      return
    }

    const suf  = `${sessionData.sessionDuration}min`
    const base = sessionData.selectedTherapy.frequency || "general"
    const src  = `/videos/${base}-${suf}.mp4`

    if (v.dataset.src === src) return // Ya estamos en ese vídeo

    setVideoLoaded(false)
    setError(null)

    const onLoaded = () => {
      setVideoLoaded(true)
      setDuration(v.duration)
    }
    const onTime = () => setCurrent(v.currentTime)
    const onErr  = () => setError(`No se pudo cargar el archivo ${src}`)

    v.src         = src
    v.dataset.src = src
    v.load()

    v.addEventListener("loadedmetadata", onLoaded, { once: true })
    v.addEventListener("timeupdate", onTime)
    v.addEventListener("error", onErr, { once: true })

    return () => v.removeEventListener("timeupdate", onTime)
  }, [sessionData.selectedTherapy, sessionData.sessionDuration])

  /* sincronizar play/pause con la sesión --------------------------- */
  useEffect(() => {
    const v = videoRef.current
    if (!v || !videoLoaded) return

    if (sessionData.sessionActive) {
      v.currentTime = 0
      v.play().catch((e) => console.warn("Autoplay bloqueado:", e))
    } else {
      v.pause()
    }
  }, [sessionData.sessionActive, videoLoaded])

  /* UI -------------------------------------------------------------- */
  const bg = sessionData.selectedTherapy?.color || "#0f172a"

  return (
    <>
      {/* título fijo para AutoHotkey */}
      <Head>
        <title>Cabina Ventana Extendida</title>
      </Head>

      <div className="relative w-screen h-screen overflow-hidden" style={{ background: bg }}>
        {/* Vídeo a pantalla completa */}
        {sessionData.selectedTherapy?.hasVideo && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted={false}
            controls={false}
          />
        )}

        {/* Barra superior */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-center p-4 text-white text-sm bg-black/30 backdrop-blur-md">
          <span>{decodeURIComponent(windowName)}</span>
          
          <div className="flex items-center gap-4">
            {/* Estado de conexión */}
            <span className="flex items-center gap-1">
              {connected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-400" /> Conectado
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-400" /> Desconectado
                </>
              )}
            </span>

            {/* Botón salir de pantalla completa */}
            {isFullscreen && (
              <button
                onClick={exitFullscreen}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-xs"
                title="Salir de pantalla completa"
              >
                <Minimize2 className="h-3 w-3" />
                Salir
              </button>
            )}
          </div>
        </div>

        {/* Mensaje central cuando no hay vídeo */}
        {!sessionData.selectedTherapy?.hasVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
            <div className="text-6xl mb-4">🧘‍♀️</div>
            <h2 className="text-3xl font-bold mb-2">
              {sessionData.sessionActive
                ? sessionData.selectedTherapy?.name
                : "Sistema en espera"}
            </h2>
            {sessionData.selectedTherapy && (
              <p className="max-w-md text-gray-200">
                {sessionData.selectedTherapy.description}
              </p>
            )}
          </div>
        )}

        {/* Barra de progreso inferior */}
        {sessionData.selectedTherapy?.hasVideo && videoLoaded && (
          <div className="absolute bottom-0 left-0 w-full p-3 bg-black/40 backdrop-blur-md text-white text-xs flex items-center gap-3">
            <div>
              {fmtTime(current)} / {fmtTime(duration)}
            </div>
            <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400"
                style={{ width: `${(current / duration) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Overlay de error */}
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-black/80 text-red-400 text-center p-6">
            <p>{error}</p>
          </div>
        )}
      </div>
    </>
  )
}
