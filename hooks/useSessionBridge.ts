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
  /** Duración en minutos – puede ser cualquier número > 0 */
  sessionDuration: number
  lightIntensity: number
  selectedTherapy: SelectedTherapy | null
  /** Epoch‑ms de la última actualización */
  timestamp: number
}

export interface SessionBridge {
  /** Últimos datos recibidos */
  sessionData: SessionData
  /** Conexión viva con el Window Manager */
  connected: boolean
}

/* ==================================================
 * useSessionBridge – hook de sincronización con la
 * ventana externa (pop‑up) de la cabina.
 * =================================================*/
export function useSessionBridge(windowId: string | null): SessionBridge {
  /* -------- estado local -------- */
  const [sessionData, setSessionData] = useState<SessionData>(() => ({
    doorOpen: false,
    sessionActive: false,
    sessionType: "standby",
    therapyColor: "#0891b2",
    sessionDuration: 4,
    lightIntensity: 50,
    selectedTherapy: null,
    timestamp: Date.now(),
  }))

  const [connected, setConnected] = useState(false)

  /* -------- refs internos -------- */
  const channelRef = useRef<BroadcastChannel | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  /* --------------------------------------------------
   * 1️⃣  BroadcastChannel + handshake bidireccional
   * -------------------------------------------------*/
  useEffect(() => {
    if (!windowId) return

    const ch = new BroadcastChannel("arduino-app")
    channelRef.current = ch

    const onBCMessage = (ev: MessageEvent) => {
      try {
        const { type, data, windowId: targetId } = ev.data || {}
        if (targetId && targetId !== windowId) return // ignora si no es para mí

        switch (type) {
          /* ---------- handshake ---------- */
          case "HANDSHAKE_REQUEST": {
            // ✅ la respuesta esperada por el Window Manager es ACK
            ch.postMessage({ type: "ACK", windowId, timestamp: Date.now() })
            break
          }

          /* ---------- datos de sesión ---------- */
          case "UPDATE_DATA": {
            if (!data) break
            setSessionData({
              doorOpen: data.doorOpen ?? false,
              sessionActive: data.sessionActive ?? false,
              sessionType: data.sessionType ?? "standby",
              therapyColor: data.therapyColor ?? "#0891b2",
              sessionDuration: data.sessionDuration ?? 4,
              lightIntensity: data.lightIntensity ?? 50,
              selectedTherapy: data.selectedTherapy ?? null,
              timestamp: Date.now(),
            })
            setConnected(true)
            break
          }

          /* ---------- keep‑alive ---------- */
          case "PING": {
            ch.postMessage({ type: "PONG", windowId })
            break
          }
          default:
            break
        }
      } catch (err) {
        console.error("useSessionBridge › onBCMessage", err)
      }
    }

    ch.addEventListener("message", onBCMessage)

    /* Enviamos nuestra presencia */
    setTimeout(() => {
      ch.postMessage({ type: "SCREEN_READY", windowId })
    }, 400)

    /* Heart‑beat cada 5 s */
    heartbeatRef.current = setInterval(() => {
      ch.postMessage({ type: "HEARTBEAT", windowId })
    }, 5000)

    /* cleanup */
    return () => {
      ch.removeEventListener("message", onBCMessage)
      ch.close()
      heartbeatRef.current && clearInterval(heartbeatRef.current)
    }
  }, [windowId])

  /* --------------------------------------------------
   * 2️⃣  Fallback window.postMessage → Safari / iOS
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
                      lightIntensity: d.lightIntensity ?? 50,
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
