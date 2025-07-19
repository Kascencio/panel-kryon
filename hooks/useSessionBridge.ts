/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react"

/* --------------------------------------------------
 * Tipos de datos de la sesión
 * -------------------------------------------------*/
export interface SelectedTherapy {
  id: string
  name: string
  description: string
  frequency: string
  color: string
  icon: string
  category: string
  hasVideo: boolean
}

export interface SessionData {
  doorOpen: boolean
  sessionActive: boolean
  sessionType: "therapy" | "standby"
  therapyColor: string
  /** Duración en minutos (cualquier número > 0) */
  sessionDuration: number
  lightIntensity: number
  selectedTherapy: SelectedTherapy | null
  /** Epoch‑ms de la última actualización */
  timestamp: number
}

export interface SessionBridge {
  /** Datos de la sesión sincronizados */
  sessionData: SessionData
  /** ¿Hay conexión viva con el Window Manager? */
  connected: boolean
}

/* --------------------------------------------------
 * Hook principal
 * -------------------------------------------------*/
export function useSessionBridge(windowId: string | null): SessionBridge {
  /* Estado local de la sesión */
  const [sessionData, setSessionData] = useState<SessionData>(() => ({
    doorOpen: false,
    sessionActive: false,
    sessionType: "standby",
    therapyColor: "#0891b2",
    sessionDuration: 4,
    lightIntensity: 80,
    selectedTherapy: null,
    timestamp: Date.now(),
  }))

  /* ¿Se recibió al menos un ACK/UPDATE? */
  const [connected, setConnected] = useState(false)

  /* Refs internos para canal & heartbeat */
  const channelRef = useRef<BroadcastChannel | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  /* --------------------------------------------------
   * 1. Inicializar BroadcastChannel + Handshake
   * -------------------------------------------------*/
  useEffect(() => {
    if (!windowId) return

    const ch = new BroadcastChannel("arduino-app")
    channelRef.current = ch

    const onBCMessage = (ev: MessageEvent) => {
      try {
        const { type, data, windowId: targetId } = ev.data || {}
        if (targetId && targetId !== windowId) return // ignorar si no es para mí

        switch (type) {
          /* ------------ handshake bidireccional ------------ */
          case "HANDSHAKE_REQUEST": {
            ch.postMessage({ type: "HANDSHAKE", windowId, timestamp: Date.now() })
            break
          }
          case "ACK": {
            setConnected(true)
            break
          }

          /* ------------ payload con los datos de la sesión ------------ */
          case "UPDATE_DATA": {
            if (!data) break
            setSessionData({
              doorOpen: data.doorOpen ?? false,
              sessionActive: data.sessionActive ?? false,
              sessionType: data.sessionType ?? "standby",
              therapyColor: data.therapyColor ?? "#0891b2",
              sessionDuration: data.sessionDuration ?? 4,
              lightIntensity: data.lightIntensity ?? 80,
              selectedTherapy: data.selectedTherapy ?? null,
              timestamp: Date.now(),
            })
            setConnected(true)
            break
          }
          default:
            break
        }
      } catch (err) {
        console.error("useSessionBridge: error procesando mensaje", err)
      }
    }

    ch.addEventListener("message", onBCMessage)

    /* -------- Handshake inicial -------- */
    setTimeout(() => {
      ch.postMessage({ type: "HANDSHAKE", windowId, timestamp: Date.now() })
      ch.postMessage({ type: "SCREEN_READY", windowId })
    }, 400)

    /* -------- Heartbeat cada 5 s -------- */
    heartbeatRef.current = setInterval(() => {
      ch.postMessage({ type: "HEARTBEAT", windowId })
    }, 5000)

    /* Limpieza */
    return () => {
      ch.removeEventListener("message", onBCMessage)
      ch.close()
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [windowId])

  /* --------------------------------------------------
   * 2. Fallback: escuchar también window.postMessage
   *    (Safari no soporta BroadcastChannel en algunas versiones)
   * -------------------------------------------------*/
  useEffect(() => {
    const onPM = (ev: MessageEvent) => {
      if (ev.data?.type !== "UPDATE_SESSION" || !ev.data.payload) return
      const d = ev.data.payload
      setSessionData({
        doorOpen: d.doorOpen ?? false,
        sessionActive: d.sessionActive ?? false,
        sessionType: d.sessionType ?? "standby",
        therapyColor: d.therapyColor ?? "#0891b2",
        sessionDuration: d.sessionDuration ?? 4,
        lightIntensity: d.lightIntensity ?? 80,
        selectedTherapy: d.selectedTherapy ?? null,
        timestamp: d.timestamp ?? Date.now(),
      })
      setConnected(true)
    }

    window.addEventListener("message", onPM)
    return () => window.removeEventListener("message", onPM)
  }, [])

  return { sessionData, connected }
}
