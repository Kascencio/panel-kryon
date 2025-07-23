"use client"

import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import ArduinoServiceProvider from "@/components/arduino-service"
import { CustomTherapyProvider } from "@/components/custom-therapy-provider"
import { AudioCacheProvider } from "@/components/audio-cache-provider"
import TherapySelectionScreen, {
  type Therapy, // reutilizamos el tipo del selector
} from "@/components/therapy-selection-screen"
import SessionControlScreen from "@/components/session-control-screen"
import SimpleExternalWindowManager from "@/components/simple-external-window-manager"
import LoadingScreen from "@/components/loading-screen"

/* ────────── Pantallas ────────── */
type AppScreen = "loading" | "selection" | "session"

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

function CabinaApp() {
  /* ────────── Estado global ────────── */
  const [screen, setScreen] = useState<AppScreen>("loading")
  const [therapy, setTherapy] = useState<Therapy | null>(null)
  const [duration, setDuration] = useState<"corto" | "mediano" | "largo">(
    "corto",
  )
  const [light, setLight] = useState(80)

  /* ────────── Bootstrap (splash) ────────── */
  useEffect(() => {
    const init = async () => {
      await new Promise((r) => setTimeout(r, 3000)) // 1 s de “Loading…”
      setScreen("selection")
    }
    init()
  }, [])

  /* ────────── Inicio de sesión ────────── */
  const handleStartTherapy = (
    t: Therapy,
    headerDur: "corto" | "mediano" | "largo",
  ) => {
    /* duración: la del diálogo tiene prioridad */
    const finalDur = t.sessionDuration ?? headerDur
    setDuration(finalDur)

    /* intensidad inicial sincronizada si existe */
    if (typeof t.initialIntensity === "number") {
      setLight(t.initialIntensity)
    }

    setTherapy(t)          // versión (posiblemente) personalizada
    setScreen("session")
  }

  /* ────────── Fin de sesión ────────── */
  const handleEndSession = () => {
    setTherapy(null)
    setScreen("selection")
  }

  /* ────────── util duración (min) ────────── */
  const minutes = { corto: 4, mediano: 15, largo: 20 }[duration]

  /* ────────── Render según pantalla ────────── */
  if (screen === "loading") return <LoadingScreen />

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {screen === "selection" ? (
          <TherapySelectionScreen onStartTherapy={handleStartTherapy} />
        ) : therapy ? (
          <SessionControlScreen
            therapy={therapy}
            duration={duration}
            lightIntensity={light}
            onLightIntensityChange={setLight}
            onEndSession={handleEndSession}
          />
        ) : null}
        <Toaster />
      </main>

      {/* Ventana externa opcional */}
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
