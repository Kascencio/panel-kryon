"use client"

import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import ArduinoServiceProvider from "@/components/arduino-service"
import { CustomTherapyProvider } from "@/components/custom-therapy-provider"
import { AudioCacheProvider } from "@/components/audio-cache-provider"
import TherapySelectionScreen from "@/components/therapy-selection-screen"
import SessionControlScreen from "@/components/session-control-screen"
import SimpleExternalWindowManager from "@/components/simple-external-window-manager"

interface Therapy {
  id: string
  name: string
  description: string
  duration?: number
  frequency: string
  color: string
  icon: string
  category: string
  hasVideo?: boolean
}

type AppScreen = "selection" | "session"

function CabinaApp() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("selection")
  const [selectedTherapy, setSelectedTherapy] = useState<Therapy | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<"corto" | "mediano" | "largo">("corto")
  const [lightIntensity, setLightIntensity] = useState(80)
  const [appInitialized, setAppInitialized] = useState(false)

  // Inicializar la app
  useEffect(() => {
    // Marcar como inicializada después de un breve delay
    const timer = setTimeout(() => {
      setAppInitialized(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getDurationInMinutes = () => {
    switch (selectedDuration) {
      case "corto":
        return 4
      case "mediano":
        return 15
      case "largo":
        return 20
      default:
        return 4
    }
  }

  const handleStartTherapy = (therapy: Therapy, duration: "corto" | "mediano" | "largo") => {
    setSelectedTherapy(therapy)
    setSelectedDuration(duration)
    setCurrentScreen("session")
  }

  const handleEndSession = () => {
    setCurrentScreen("selection")
    setSelectedTherapy(null)
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {currentScreen === "selection" ? (
          <TherapySelectionScreen onStartTherapy={handleStartTherapy} />
        ) : (
          selectedTherapy && (
            <SessionControlScreen
              therapy={selectedTherapy}
              duration={selectedDuration}
              onEndSession={handleEndSession}
              lightIntensity={lightIntensity}
              onLightIntensityChange={setLightIntensity}
            />
          )
        )}
        <Toaster />
      </main>

      {/* Ventana externa - activa desde el inicio de la app */}
      <SimpleExternalWindowManager
        doorOpen={appInitialized} // Se activa cuando la app se inicializa
        sessionActive={currentScreen === "session"}
        sessionType={currentScreen === "session" ? "therapy" : "standby"}
        therapyColor={selectedTherapy?.color || "#0891b2"}
        sessionDuration={getDurationInMinutes()}
        lightIntensity={lightIntensity}
        selectedTherapy={selectedTherapy}
      />
    </>
  )
}

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
