"use client"
import {
  Monitor, ExternalLink, X, Wifi, WifiOff, RefreshCw,
  Video, Music, CheckCircle, AlertCircle
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

/* ---------- tipos ---------- */
export interface ExternalWindow {
  id: string
  name: string
  url: string
  windowRef: Window | null
}

export interface WindowManagerProps {
  /* estado global */
  doorOpen: boolean
  sessionActive: boolean
  sessionType: "therapy" | "standby"
  therapyColor: string
  sessionDuration: number
  lightIntensity: number
  selectedTherapy: any | null
  /* NUEVO ↓↓↓ */
  autoOpen?: boolean          // abrir pop-up automáticamente
}

/* ═════════════════════════ Componente ═════════════════════════ */
export default function SimpleExternalWindowManager({
  doorOpen,
  sessionActive,
  sessionType,
  therapyColor,
  sessionDuration,
  lightIntensity,
  selectedTherapy,
  autoOpen = false,
}: WindowManagerProps) {
  /* ---------- estado interno ---------- */
  const [showPanel, setShowPanel] = useState(false)
  const [external, setExternal] = useState<ExternalWindow | null>(null)
  const [status, setStatus] = useState<"disconnected"|"connecting"|"connected">(
    "disconnected",
  )
  const [lastHB, setLastHB] = useState(0)

  const channelRef           = useRef<BroadcastChannel | null>(null)
  const handshakeTimerRef    = useRef<NodeJS.Timeout | null>(null)
  const { toast }            = useToast()

  /* ---------- helpers ---------- */
  const postUpdate = useCallback(() => {
    if (!channelRef.current) return
    channelRef.current.postMessage({
      type : "UPDATE_DATA",
      data : {
        doorOpen,
        sessionActive,
        sessionType,
        therapyColor,
        sessionDuration,
        lightIntensity,
        selectedTherapy,
      },
      windowId: external?.id,
    })
  }, [
    doorOpen, sessionActive, sessionType,
    therapyColor, sessionDuration, lightIntensity,
    selectedTherapy, external?.id,
  ])

  /* ---------- abrir pop-up ---------- */
  const openWindow = useCallback(() => {
    if (external?.windowRef && !external.windowRef.closed) {
      external.windowRef.focus()
      return
    }

    const id   = `ext-${Date.now()}`
    const name = "Cabina · Pantalla Extendida"
    const url  = `/external-screen?id=${id}&name=${encodeURIComponent(name)}`
    const specs = [
      "width=1200",
      "height=800",
      "resizable=yes",
      "scrollbars=no",
      `left=${Math.max(0, window.screen.width - 1220)}`,
      "top=50",
    ].join(",")

    const ref = window.open(url, id, specs)

    if (!ref) {
      toast({
        title: "Pop-up bloqueado",
        description: "Permite ventanas emergentes para abrir la pantalla externa.",
        variant: "destructive",
      })
      return
    }

    setExternal({ id, name, url, windowRef: ref })
    setStatus("connecting")
  }, [external?.windowRef, toast])

  /* ---------- cerrar ---------- */
  const closeWindow = useCallback(() => {
    external?.windowRef?.close()
    setExternal(null)
    setStatus("disconnected")
  }, [external])

  /* ---------- BroadcastChannel ---------- */
  useEffect(() => {
    if (!external) return
    const ch = new BroadcastChannel("arduino-app")
    channelRef.current = ch

    const onMsg = (ev: MessageEvent) => {
      const { type, windowId } = ev.data || {}
      if (windowId !== external.id) return

      switch (type) {
        case "HANDSHAKE":
        case "ACK":
          setStatus("connected")
          break
        case "HEARTBEAT":
          setLastHB(Date.now())
          break
        case "SCREEN_CLOSED":
          closeWindow()
          break
        default:
          break
      }
    }

    ch.addEventListener("message", onMsg)
    /* envía datos iniciales */
    const hi = setTimeout(postUpdate, 450)

    return () => {
      clearTimeout(hi)
      ch.removeEventListener("message", onMsg)
      ch.close()
      channelRef.current = null
    }
  }, [external, postUpdate, closeWindow])

  /* ---------- heartbeat watchdog ---------- */
  useEffect(() => {
    if (status !== "connected") return
    const iv = setInterval(() => {
      if (Date.now() - lastHB > 10_000) {
        setStatus("disconnected")
      }
    }, 5_000)
    return () => clearInterval(iv)
  }, [status, lastHB])

  /* ---------- prop autoOpen ---------- */
  useEffect(() => {
    if (!autoOpen) return
    if (!doorOpen) return               // espera a que termine el splash
    if (status !== "disconnected") return
    openWindow()
    // solo 1 intento; si el navegador lo bloquea aparecerá el toast
  }, [autoOpen, doorOpen, status, openWindow])

  /* ---------- sincr. en cada cambio de props ---------- */
  useEffect(() => {
    if (status === "connected") postUpdate()
  }, [status, postUpdate])

  /* ---------- UI mínimo ---------- */
  const color =
    status === "connected"   ? "text-green-400"
    : status === "connecting"? "text-yellow-400"
    : "text-red-400"

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* FAB */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowPanel(!showPanel)}
        className="h-12 w-12 rounded-full bg-gray-800/60 backdrop-blur"
      >
        <Monitor className={`h-5 w-5 ${color}`} />
        {status === "connected" && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 bg-green-600 text-white p-0">
            1
          </Badge>
        )}
      </Button>

      {/* Manager panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 w-80 bg-gray-900/95 border border-gray-700/40
                       rounded-lg p-4 backdrop-blur-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-white">
                <Monitor className="h-5 w-5 text-cyan-400" /> Ventana Externa
              </span>
              <Button variant="ghost" size="icon" onClick={() => setShowPanel(false)}>
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </div>

            {/* Estado */}
            <Alert className="bg-gray-800/40 border-gray-700/40">
              {status === "connected" ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : status === "connecting" ? (
                <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <AlertDescription className="text-sm text-gray-300">
                {status === "connected"
                  ? "Conectada"
                  : status === "connecting"
                  ? "Conectando…"
                  : "Desconectada"}
              </AlertDescription>
            </Alert>

            {selectedTherapy && (
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
                <span>Terapia:</span>
                <span className="text-white">{selectedTherapy.name}</span>
                <span>Duración:</span>
                <span className="text-white">{sessionDuration} min</span>
                <span>Tipo:</span>
                <span className="text-white flex items-center gap-1">
                  {selectedTherapy.hasVideo ? <Video className="h-3 w-3" /> :
                    <Music className="h-3 w-3" />}
                  {selectedTherapy.hasVideo ? "Video" : "Audio"}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {status === "disconnected" ? (
                <Button className="flex-1" onClick={openWindow}>
                  <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                </Button>
              ) : (
                <Button variant="outline" className="flex-1" onClick={closeWindow}>
                  <X className="h-4 w-4 mr-1" /> Cerrar
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
