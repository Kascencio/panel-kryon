"use client"

import { useState, useEffect, useCallback } from "react"

/* ---------- tipos ---------- */
export interface ScreenInfo {
  id: string
  width: number
  height: number
  isPrimary: boolean
  isInternal: boolean
  label?: string
}

export type DetectionStatus = "idle" | "detecting" | "success" | "error"

/* ---------- hook principal ---------- */
export function useScreenDetector() {
  const [screens, setScreens] = useState<ScreenInfo[]>([])
  const [status, setStatus] = useState<DetectionStatus>("idle")
  const [permissionGranted, setPermissionGranted] = useState(false)

  /* detectar pantallas disponibles */
  const detectScreens = useCallback(async () => {
    setStatus("detecting")
    
    try {
      // Verificar si la API de pantallas está disponible
      if (!("getScreenDetails" in window)) {
        console.warn("API getScreenDetails no disponible")
        setStatus("error")
        return
      }

      // Solicitar permisos si es necesario
      if (typeof window.getScreenDetails === "function") {
        try {
          const screenDetails = await window.getScreenDetails()
          setPermissionGranted(true)
          
          const screenList: ScreenInfo[] = screenDetails.screens.map((screen, index) => ({
            id: screen.id || `screen-${index}`,
            width: screen.width,
            height: screen.height,
            isPrimary: screen.isPrimary || false,
            isInternal: screen.isInternal || false,
            label: screen.label || `Pantalla ${index + 1}`
          }))
          
          setScreens(screenList)
          setStatus("success")
        } catch (error) {
          console.error("Error al obtener detalles de pantalla:", error)
          setPermissionGranted(false)
          setStatus("error")
        }
      } else {
        // Fallback para navegadores que no soportan getScreenDetails
        const fallbackScreens: ScreenInfo[] = [{
          id: "primary",
          width: window.screen.width,
          height: window.screen.height,
          isPrimary: true,
          isInternal: true,
          label: "Pantalla Principal"
        }]
        
        setScreens(fallbackScreens)
        setStatus("success")
      }
    } catch (error) {
      console.error("Error en detección de pantallas:", error)
      setStatus("error")
    }
  }, [])

  /* detectar al montar */
  useEffect(() => {
    detectScreens()
  }, [detectScreens])

  /* escuchar cambios de pantalla */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        if (screens.length > 0) {
          detectScreens()
        }
      }
      
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [screens.length, detectScreens])

  return {
    screens,
    status,
    permissionGranted,
    detectScreens
  }
}
