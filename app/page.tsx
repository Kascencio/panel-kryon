"use client"

import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"

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
  const [light, setLight] = useState(80)
  const [needsPerms, setNeedsPerms] = useState(true)

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

      {/* Ventana externa / pantalla extendida */}
      <SimpleExternalWindowManager
        doorOpen={screen !== "loading"}  // se abre cuando termina el splash
        sessionActive={screen === "session"}
        sessionType={screen === "session" ? "therapy" : "standby"}
        therapyColor={therapy?.color || "#0891b2"}
        sessionDuration={minutes}
        lightIntensity={light}
        selectedTherapy={therapy}
        /*  autoOpen => el componente abrirá el pop-up al montarse
            (sin esperar a que el usuario pulse el botón flotante) */
        autoOpen
      />
    </>
  )
}
