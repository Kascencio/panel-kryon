/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Monitor,
  ExternalLink,
  X,
  Video,
  Music,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

/* --------------------------------------------------
 * Tipos
 * -------------------------------------------------*/
export interface ExternalWindow {
  id: string
  name: string
  windowRef: Window | null
  url: string
}

export interface WindowManagerProps {
  doorOpen: boolean
  sessionActive: boolean
  sessionType: "therapy" | "standby"
  therapyColor: string
  /** Duración en minutos – ya NO está limitada a 4/15/20  */
  sessionDuration: number
  lightIntensity: number
  selectedTherapy: any | null
}

/* --------------------------------------------------
 * Componente
 * -------------------------------------------------*/
export default function SimpleExternalWindowManager({
  doorOpen,
  sessionActive,
  sessionType,
  therapyColor,
  sessionDuration,
  lightIntensity,
  selectedTherapy,
}: WindowManagerProps) {
  /* ────────── estado interno ────────── */
  const [externalWindow, setExternalWindow] = useState<ExternalWindow | null>(null)
  const [showManager, setShowManager] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(0)
  const [windowReady, setWindowReady] = useState(false)

  /** refs */
  const messageChannel = useRef<BroadcastChannel | null>(null)
  const handshakeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const handshakeAttemptsRef = useRef(0)

  const { toast } = useToast()

  /* --------------------------------------------------
   * Comunicación → enviar estado a la ventana
   * -------------------------------------------------*/
  const postUpdate = useCallback(() => {
    if (!messageChannel.current || !externalWindow) return

    const cleanTherapy = selectedTherapy
      ? {
          id: selectedTherapy.id,
          name: selectedTherapy.name,
          description: selectedTherapy.description,
          frequency: selectedTherapy.frequency,
          color: selectedTherapy.color,
          icon: selectedTherapy.icon,
          category: selectedTherapy.category,
          hasVideo: selectedTherapy.hasVideo ?? false,
        }
      : null

    messageChannel.current.postMessage({
      type: "UPDATE_DATA",
      data: {
        doorOpen,
        sessionActive,
        sessionType,
        therapyColor,
        sessionDuration,
        lightIntensity,
        selectedTherapy: cleanTherapy,
        mediaType: cleanTherapy?.hasVideo ? "video" : "audio",
      },
    })
  }, [doorOpen, sessionActive, sessionType, therapyColor, sessionDuration, lightIntensity, selectedTherapy, externalWindow])

  /* --------------------------------------------------
   * Establecer canal y manejador global una sola vez
   * -------------------------------------------------*/
  useEffect(() => {
    const channel = new BroadcastChannel("arduino-app")
    messageChannel.current = channel

    const onMessage = (ev: MessageEvent) => {
      const { type, windowId } = ev.data || {}
      if (!externalWindow || windowId !== externalWindow.id) return

      switch (type) {
        case "SCREEN_READY": {
          setConnectionStatus("connected")
          setWindowReady(true)
          stopHandshake()
          postUpdate()
          break
        }
        case "ACK": {
          // Recibimos ACK de nuestro HANDSHAKE_REQUEST
          setConnectionStatus("connected")
          break
        }
        case "HEARTBEAT": {
          setLastHeartbeat(Date.now())
          if (connectionStatus !== "connected") setConnectionStatus("connected")
          break
        }
        case "SCREEN_CLOSED": {
          handleWindowClosed()
          break
        }
        default:
          break
      }
    }

    channel.addEventListener("message", onMessage)
    return () => {
      channel.removeEventListener("message", onMessage)
      channel.close()
    }
  }, [externalWindow, connectionStatus, postUpdate])

  /* --------------------------------------------------
   * Handshake helpers
   * -------------------------------------------------*/
  const startHandshake = useCallback(
    (id: string) => {
      stopHandshake()
      handshakeAttemptsRef.current = 0
      handshakeIntervalRef.current = setInterval(() => {
        if (!messageChannel.current) return
        if (handshakeAttemptsRef.current >= 6) {
          // 6 intentos (≈ 9 s) y sin éxito ⇒ error
          stopHandshake()
          setConnectionStatus("disconnected")
          toast({
            title: "Sin respuesta",
            description: "No se pudo establecer comunicación con la ventana externa.",
            variant: "destructive",
          })
          return
        }
        messageChannel.current.postMessage({ type: "HANDSHAKE_REQUEST", windowId: id, timestamp: Date.now() })
        handshakeAttemptsRef.current += 1
      }, 1500)
    },
    [toast]
  )

  const stopHandshake = () => {
    if (handshakeIntervalRef.current) {
      clearInterval(handshakeIntervalRef.current)
      handshakeIntervalRef.current = null
    }
  }

  /* --------------------------------------------------
   * Abrir ventana externa
   * -------------------------------------------------*/
  const openWindow = useCallback(() => {
    if (externalWindow?.windowRef && !externalWindow.windowRef.closed) {
      externalWindow.windowRef.focus()
      return
    }

    // Intentamos abrir pop‑up
    const id = `ext-${Date.now()}`
    const name = "Cabina Ventana Extendida"
    const url = `/external-screen?id=${id}&type=extended&name=${encodeURIComponent(name)}`
    const specs = [
      "width=1200",
      "height=800",
      `left=${Math.max(0, window.screen.width - 1220)}`,
      "top=50",
      "resizable=yes",
      "scrollbars=no",
    ].join(",")
    const ref = window.open(url, id, specs)

    if (!ref) {
      toast({
        title: "Pop‑up bloqueado",
        description: "Habilita las ventanas emergentes para usar la vista externa.",
        variant: "destructive",
      })
      setConnectionStatus("disconnected")
      return
    }

    setExternalWindow({ id, name, url, windowRef: ref })
    setConnectionStatus("connecting")
    setWindowReady(false)
    startHandshake(id)
  }, [externalWindow, toast, startHandshake])

  /* --------------------------------------------------
   * Cerrar – local o remoto
   * -------------------------------------------------*/
  const handleWindowClosed = useCallback(() => {
    stopHandshake()
    setExternalWindow(null)
    setConnectionStatus("disconnected")
    setWindowReady(false)
  }, [])

  const closeWindow = () => {
    externalWindow?.windowRef?.close()
    handleWindowClosed()
  }

  /* --------------------------------------------------
   * Heart‑beat watchdog
   * -------------------------------------------------*/
  useEffect(() => {
    if (!externalWindow || connectionStatus !== "connected") return
    const iv = setInterval(() => {
      if (Date.now() - lastHeartbeat > 10000) {
        setConnectionStatus("disconnected")
      }
    }, 5000)
    return () => clearInterval(iv)
  }, [externalWindow, connectionStatus, lastHeartbeat])

  /* --------------------------------------------------
   * Sync en cada cambio de props – solo si conectado
   * -------------------------------------------------*/
  useEffect(() => {
    if (connectionStatus === "connected") postUpdate()
  }, [doorOpen, sessionActive, sessionType, therapyColor, sessionDuration, lightIntensity, selectedTherapy, connectionStatus, postUpdate])

  /* --------------------------------------------------
   * UI helpers
   * -------------------------------------------------*/
  const isActive = !!externalWindow?.windowRef && !externalWindow.windowRef.closed
  const color = connectionStatus === "connected" ? "green" : connectionStatus === "connecting" ? "yellow" : "red"

  /* --------------------------------------------------
   * Render
   * -------------------------------------------------*/
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botón flotante */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowManager((p) => !p)}
        className={`h-12 w-12 rounded-full border-${color}-600/40 bg-${color}-900/20 backdrop-blur-sm`}
      >
        <Monitor className={`h-5 w-5 text-${color}-400`} />
        {isActive && connectionStatus === "connected" && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-green-600 text-white text-xs flex items-center justify-center">
            1
          </Badge>
        )}
      </Button>

      {/* Panel */}
      <AnimatePresence>
        {showManager && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 right-4 w-80 bg-gray-900/95 backdrop-blur-md border border-gray-700/40 rounded-lg p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white">
                <Monitor className="h-5 w-5 text-cyan-400" /> Ventana Externa
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowManager(false)}>
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </div>

            {/* Estado de conexión */}
            <Alert className="mb-4 bg-gray-800/40 border-gray-700/40">
              {connectionStatus === "connected" ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : connectionStatus === "connecting" ? (
                <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <AlertDescription className="text-sm text-gray-300">
                {connectionStatus === "connected" ? "Conectada" : connectionStatus === "connecting" ? "Conectando…" : "Desconectada"}
              </AlertDescription>
            </Alert>

            {/* Detalles de la terapia */}
            {selectedTherapy && (
              <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-gray-400">
                <span>Terapia:</span>
                <span className="text-white">{selectedTherapy.name}</span>
                <span>Duración:</span>
                <span className="text-white">{sessionDuration} min</span>
                <span>Tipo:</span>
                <span className="text-white flex items-center gap-1">
                  {selectedTherapy.hasVideo ? <Video className="h-3 w-3" /> : <Music className="h-3 w-3" />} {selectedTherapy.hasVideo ? "Video" : "Audio"}
                </span>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-2">
              {isActive ? (
                <Button variant="outline" size="sm" className="flex-1" onClick={closeWindow}>
                  <X className="h-3 w-3 mr-1" /> Cerrar
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={openWindow}
                  disabled={connectionStatus === "connecting"}
                >
                  <ExternalLink className="h-3 w-3 mr-1" /> Abrir
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
