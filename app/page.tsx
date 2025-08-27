"use client"

import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { RotateCcw, Minimize2, Monitor } from "lucide-react"

import ArduinoServiceProvider, {
  useArduinoService,
} from "@/components/arduino-service"
import { CustomTherapyProvider } from "@/components/custom-therapy-provider"
import {
  AudioCacheProvider,
  useAudioCache,
} from "@/components/audio-cache-provider"

import TherapySelectionScreen from "@/components/therapy-selection-screen"
import SessionControlScreen from "@/components/session-control-screen"
import SimpleExternalWindowManager from "@/components/simple-external-window-manager"

import type { Therapy } from "@/components/session-therapies"

import LoadingScreen from "@/components/loading-screen"
import PermissionsModal from "@/components/permissions-modal"

/* ────────── “pantallas” ────────── */
type Screen = "loading" | "selection" | "session"

/* ═════════════════  ROOT  (Next.js page) ═════════════════ */
export default function Home() {
  return (
    <AudioCacheProvider>
      <ArduinoServiceProvider>
        <CustomTherapyProvider>
          <CabinaApp />
        </CustomTherapyProvider>
      </ArduinoServiceProvider>
    </AudioCacheProvider>
  )
}

/* ═════════════════  APP  ═════════════════ */
function CabinaApp() {
  /* --------------- STATE --------------- */
  const [screen, setScreen] = useState<Screen>("loading")
  const [therapy, setTherapy] = useState<Therapy | null>(null)
  const [duration, setDuration] =
    useState<"corto" | "mediano" | "largo">("corto")
  const [light, setLight] = useState(50)
  const [needsPerms, setNeedsPerms] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  /* --------------- SERVICES --------------- */
  const { isPreloading, preloadProgress, preloadAudio } = useAudioCache()
  const { connectionStatus, setAutoConnect } = useArduinoService()
  const arduinoReady = connectionStatus === "connected"

  /* --------------- SPLASH --------------- */
  const SPLASH_TIMEOUT = 20_000
  const [bootStarted] = useState(() => Date.now())

  /* Permisos (solo en cliente) */
  useEffect(() => {
    if (typeof window !== "undefined") {
      setNeedsPerms(!localStorage.getItem("cabina-perms-ok"))
    }
  }, [])

  /* Lanzar precarga y autoconexión solo 1 vez */
  useEffect(() => {
    preloadAudio()
    setAutoConnect(true) // => ArduinoService intentará reconectar solo
  }, [preloadAudio, setAutoConnect])

  /* Transición splash → selección */
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - bootStarted
      const audioDone = !isPreloading
      const timeout = elapsed >= SPLASH_TIMEOUT

      if ((audioDone && arduinoReady) || timeout) {
        setScreen("selection")
        clearInterval(id)
      }
    }, 350)

    return () => clearInterval(id)
  }, [isPreloading, arduinoReady, bootStarted])

  /* Detectar cambios de pantalla completa */
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

  /* --------------- HANDLERS --------------- */
  const handleStartTherapy = (
    t: Therapy,
    d: "corto" | "mediano" | "largo",
  ) => {
    setTherapy(t)
    setDuration(d)
    setScreen("session")
  }

  const handleEndSession = () => {
    setTherapy(null)
    setScreen("selection")
  }

  /* Duración en minutos numérico */
  const minutes = { corto: 4, mediano: 15, largo: 20 }[duration]

  /* --------------- RENDER --------------- */
  if (screen === "loading") {
    return (
      <LoadingScreen
        progress={preloadProgress}
        totalDurationMs={SPLASH_TIMEOUT}
      />
    )
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Modal de permisos la primera vez */}
        {needsPerms && (
          <PermissionsModal
            open={true}
            onDone={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("cabina-perms-ok", "1")
              }
              setNeedsPerms(false)
            }}
          />
        )}

        {/* Pantalla principal */}
        {screen === "selection" ? (
          <TherapySelectionScreen onStartTherapy={handleStartTherapy} />
        ) : (
          therapy && (
            <SessionControlScreen
              therapy={therapy}
              duration={duration}
              lightIntensity={light}
              onLightIntensityChange={setLight}
              onEndSession={handleEndSession}
              /*  auto-open hace que el temporizador arranque nada más
                  montar el componente – útil cuando venimos de “selección” */
              autoOpen
            />
          )
        )}

        <Toaster />
      </main>

      {/* Barra de herramientas flotante */}
      <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
        {/* Botón de reiniciar sistema */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm("¿Reiniciar la aplicación? Se perderá el progreso actual.")) {
              window.location.reload()
            }
          }}
          className="bg-gray-800/80 backdrop-blur border-gray-600 text-white hover:bg-gray-700/80 shadow-lg"
          title="Reiniciar aplicación"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reiniciar
        </Button>

        {/* Botón de salir de pantalla completa (solo si está en pantalla completa) */}
        {isFullscreen && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                if (document.exitFullscreen) {
                  await document.exitFullscreen()
                } else if ((document as any).webkitExitFullscreen) {
                  await (document as any).webkitExitFullscreen()
                } else if ((document as any).mozCancelFullScreen) {
                  await (document as any).mozCancelFullScreen()
                } else if ((document as any).msExitFullscreen) {
                  await (document as any).msExitFullscreen()
                }
              } catch (err) {
                console.warn("Error saliendo de pantalla completa:", err)
              }
            }}
            className="bg-orange-800/80 backdrop-blur border-orange-600 text-white hover:bg-orange-700/80 shadow-lg"
            title="Salir de pantalla completa"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Salir Fullscreen
          </Button>
        )}
      </div>

      {/* Ventana externa / pantalla extendida */}
      <SimpleExternalWindowManager
        doorOpen={screen !== "loading"}  // se abre cuando termina el splash
        sessionActive={screen === "session"}
        sessionType={screen === "session" ? "therapy" : "standby"}
        therapyColor={therapy?.color || "#0891b2"}
        sessionDuration={minutes}
        lightIntensity={light}
        selectedTherapy={therapy}
        autoOpen
      />
    </>
  )
}
