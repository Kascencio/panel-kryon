"use client"

import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import ArduinoServiceProvider, { useArduinoService } from "@/components/arduino-service"
import { CustomTherapyProvider } from "@/components/custom-therapy-provider"
import { AudioCacheProvider, useAudioCache } from "@/components/audio-cache-provider"
import TherapySelectionScreen from "@/components/therapy-selection-screen"
import SessionControlScreen from "@/components/session-control-screen"
import SimpleExternalWindowManager from "@/components/simple-external-window-manager"
import type { Therapy } from "@/components/session-therapies"
import LoadingScreen from "@/components/loading-screen"
import PermissionsModal from "@/components/permissions-modal"

/* ────────── rutas ────────── */
type Screen = "loading" | "selection" | "session"

/* ══════════ ROOT ══════════ */
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

/* ══════════ APP PRINCIPAL ══════════ */
function CabinaApp() {
  /* ---------------- state ---------------- */
  const [screen, setScreen] = useState<Screen>("loading")
  const [therapy, setTherapy] = useState<Therapy | null>(null)
  const [duration, setDuration] = useState<"corto" | "mediano" | "largo">("corto")
  const [light, setLight] = useState(80)
  const [needsPerms, setNeedsPerms] = useState<boolean>(true) // default to true until we check localStorage

  /* ---------------- servicios ---------------- */
  const { isPreloading, preloadProgress, preloadAudio } = useAudioCache()
  const { connectionStatus, setAutoConnect } = useArduinoService()
  const arduinoReady = connectionStatus === "connected"

  /* ---------------- splash timer ---------------- */
  const SPLASH_TIMEOUT = 9000 // 9 s máximo en loading
  const [bootStarted] = useState(() => Date.now())

  /* check localStorage on client side */
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const hasPerms = localStorage.getItem("cabina-perms-ok")
      setNeedsPerms(!hasPerms)
    }
  }, [])

  /* start tasks once */
  useEffect(() => {
    preloadAudio()
    setAutoConnect(true)
  }, [preloadAudio, setAutoConnect])

  /* decide cuándo salir del loading */
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - bootStarted
      const audioDone = !isPreloading
      const timeUp = elapsed > SPLASH_TIMEOUT
      if ((audioDone && arduinoReady) || timeUp) {
        if (needsPerms) {
          // mostrará modal después del splash
          setScreen("selection")
        } else {
          setScreen("selection")
        }
        clearInterval(id)
      }
    }, 300)
    return () => clearInterval(id)
  }, [isPreloading, arduinoReady, bootStarted])

  /* ---------------- handlers ---------------- */
  const handleStartTherapy = (t: Therapy, d: "corto" | "mediano" | "largo") => {
    setTherapy(t)
    setDuration(d)
    setScreen("session")
  }
  const handleEndSession = () => {
    setTherapy(null)
    setScreen("selection")
  }

  const minutes = { corto: 4, mediano: 15, largo: 20 }[duration]

  /* ---------------- render ---------------- */
  if (screen === "loading") {
    return <LoadingScreen progress={preloadProgress} totalDurationMs={SPLASH_TIMEOUT} />
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Permisos primera vez */}
      {needsPerms && (
        <PermissionsModal
          open={true}
          onDone={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem("cabina-perms-ok", "1")
            }
            setNeedsPerms(false)
          }}
        />
      )}
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
            />
          )
        )}
        <Toaster />
      </main>

      {/* Ventana externa */}
      <SimpleExternalWindowManager
        doorOpen={screen !== "loading"}
        sessionActive={screen === "session"}
        sessionType={screen === "session" ? "therapy" : "standby"}
        therapyColor={therapy?.color || "#0891b2"}
        sessionDuration={minutes}
        lightIntensity={light}
        selectedTherapy={therapy}
      />
    </>
  )
}
