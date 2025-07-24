"use client"

import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import ArduinoServiceProvider, { useArduinoService } from "@/components/arduino-service"
import { CustomTherapyProvider } from "@/components/custom-therapy-provider"
import { AudioCacheProvider, useAudioCache } from "@/components/audio-cache-provider"
import TherapySelectionScreen from "@/components/therapy-selection-screen"
// Define the Therapy type locally
export type Therapy = {
  color: string;
  name: string;
}
import SessionControlScreen from "@/components/session-control-screen"
import SimpleExternalWindowManager from "@/components/simple-external-window-manager"
import LoadingScreen from "@/components/loading-screen"

/* ────────── Estados de navegación ────────── */
type Screen = "loading" | "selection" | "session"

/* ══════════ ENTRY ══════════ */
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
  /* Estado UI */
  const [screen, setScreen] = useState<Screen>("loading")
  const [selectedTherapy, setSelectedTherapy] = useState<Therapy | null>(null)
  const [duration, setDuration] = useState<"corto" | "mediano" | "largo">("corto")
  const [light, setLight] = useState(80)

  /* Servicios */
  const {
    isPreloading,
    preloadProgress,
    preloadAudio,
  } = useAudioCache()
  const { connectionStatus, setAutoConnect } = useArduinoService()
  const arduinoReady = connectionStatus === "connected"

  /* Bootstrap: empieza precarga y autoconexión */
  useEffect(() => {
    preloadAudio()
    setAutoConnect(true)
  }, [preloadAudio, setAutoConnect])

  /* Cuando audio terminó de precargar (éxito o fallo) y Arduino listo → pantalla selección */
  useEffect(() => {
    if (!isPreloading && arduinoReady) {
      setScreen("selection")
    }
  }, [isPreloading, arduinoReady])

  /* Handlers */
  const handleStartTherapy = (therapy: Therapy, dur: "corto" | "mediano" | "largo") => {
    setSelectedTherapy(therapy)
    setDuration(dur)
    setScreen("session")
  }

  const handleEndSession = () => {
    setSelectedTherapy(null)
    setScreen("selection")
  }

  const minutes = { corto: 4, mediano: 15, largo: 20 }[duration]

  /* Splash */
  if (screen === "loading") {
    return (
      <LoadingScreen
        progress={preloadProgress}
        arduinoReady={arduinoReady}
        totalDurationMs={7000}
      />
    )
  }

  /* Main */
  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {screen === "selection" ? (
          <TherapySelectionScreen onStartTherapy={handleStartTherapy} />
        ) : (
          selectedTherapy && (
            <SessionControlScreen
              therapy={selectedTherapy}
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
        therapyColor={selectedTherapy?.color || "#0891b2"}
        sessionDuration={minutes}
        lightIntensity={light}
        selectedTherapy={selectedTherapy}
      />
    </>
  )
}
