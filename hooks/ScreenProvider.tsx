"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useScreenDetector, type ScreenInfo, type DetectionStatus } from "./use-screen-detector"

/* ---------- tipos de lo que expondremos ---------- */
interface ScreenContextType {
  /* datos de lectura */
  screens: ScreenInfo[]
  status: DetectionStatus
  permissionGranted: boolean
  autoDetect: boolean

  /* acciones */
  refresh: () => Promise<void>
  toggleAutoDetect: () => void
}

/* ---------- contexto ---------- */
const ScreenContext = createContext<ScreenContextType | undefined>(undefined)

/* ---------- provider ---------- */
export function ScreenProvider({ children }: { children: ReactNode }) {
  /* hook que ya creaste */
  const { screens, status, permissionGranted, detectScreens } = useScreenDetector()

  /* control del “auto‑polling” */
  const [autoDetect, setAutoDetect] = useState(false)

  useEffect(() => {
    if (!autoDetect) return

    const id = setInterval(() => {
      detectScreens() // vuelve a checar cada 3 s
    }, 3000)

    return () => clearInterval(id)
  }, [autoDetect, detectScreens])

  /* API que expondremos */
  const value: ScreenContextType = {
    screens,
    status,
    permissionGranted,
    autoDetect,
    refresh: detectScreens,
    toggleAutoDetect: () => setAutoDetect((v) => !v),
  }

  return <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>
}

/* ---------- hook de consumo ---------- */
export function useScreenContext() {
  const ctx = useContext(ScreenContext)
  if (!ctx) throw new Error("useScreenContext debe usarse dentro de <ScreenProvider>")
  return ctx
}
