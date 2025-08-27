"use client"

import {
  Monitor,
  ExternalLink,
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Video,
  Music,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
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
  url: string
  windowRef: Window | null
}

export interface WindowManagerProps {
  doorOpen: boolean
  sessionActive: boolean
  sessionType: "therapy" | "standby"
  therapyColor: string
  sessionDuration: number
  lightIntensity: number
  selectedTherapy: any | null
  autoOpen?: boolean
}

/* ═══════════════════════════════════════════════════ */
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
  /* ---------------- state interno ---------------- */
  const [showPanel, setShowPanel] = useState(false)
  const [external, setExternal]   = useState<ExternalWindow | null>(null)
  const [status, setStatus]       = useState<"disconnected" | "connecting" | "connected">(
    "disconnected",
  )
  const [lastHB, setLastHB] = useState(0)

  /* refs */
  const channelRef = useRef<BroadcastChannel | null>(null)
  const openedRef  = useRef(false)
  const screenCheckInterval = useRef<NodeJS.Timeout | null>(null)

  const { toast } = useToast()

  /* ─────────────────────────────────────── */
  /*  Detectar / solicitar permisos pantalla */
  /* ─────────────────────────────────────── */
  const getExternalScreen = useCallback(async (): Promise<Screen | null> => {
    try {
      // @ts-ignore – API experimental
      if (!("getScreenDetails" in window)) {
        console.log("⚠️ getScreenDetails no disponible en este navegador")
        return null
      }

      const request = async (name: "window-placement" | "window-management") => {
        try {
          // @ts-ignore
          const q = await navigator.permissions.query({ name })
          if (q.state === "granted") {
            console.log(`✅ Permiso ${name} ya concedido`)
            return true
          }
          // @ts-ignore
          const r = await navigator.permissions.request({ name })
          const granted = r.state === "granted"
          console.log(`🔐 Permiso ${name}: ${granted ? 'concedido' : 'denegado'}`)
          return granted
        } catch (err) {
          console.warn(`❌ Error solicitando permiso ${name}:`, err)
          return false
        }
      }

      console.log("🔐 Solicitando permisos de pantalla...")
      const granted =
        (await request("window-placement")) ||
        (await request("window-management"))

      if (!granted) {
        console.log("❌ Permisos de pantalla denegados")
        return null
      }

      console.log("✅ Permisos concedidos, obteniendo detalles de pantalla...")
      // @ts-ignore
      const details = await (window as any).getScreenDetails()
      
      if (!details || !details.screens || !Array.isArray(details.screens)) {
        console.log("❌ No se pudieron obtener detalles de pantalla")
        return null
      }

      console.log(`📺 Pantallas detectadas: ${details.screens.length}`)
      details.screens.forEach((screen: any, index: number) => {
        console.log(`  Pantalla ${index}:`, {
          width: screen.width,
          height: screen.height,
          isPrimary: screen.isPrimary,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight
        })
      })

      const externalScreen = details.screens.find(
        // @ts-ignore
        (s: any) => !s.isPrimary,
      )

      if (externalScreen) {
        console.log("🎯 Pantalla externa encontrada:", {
          width: externalScreen.width,
          height: externalScreen.height,
          isPrimary: externalScreen.isPrimary
        })
        return externalScreen
      } else {
        console.log("❌ No se encontró pantalla externa (todas son primarias)")
        return null
      }
    } catch (err) {
      console.error("💥 Error en getExternalScreen:", err)
      return null
    }
  }, [])

  /* ---------------- enviar UPDATE ---------------- */
  const postUpdate = useCallback(() => {
    if (!channelRef.current) return
    channelRef.current.postMessage({
      type: "UPDATE_DATA",
      data: {
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
    doorOpen,
    sessionActive,
    sessionType,
    therapyColor,
    sessionDuration,
    lightIntensity,
    selectedTherapy,
    external?.id,
  ])

  /* ---------------- abrir pop-up ---------------- */
  const openWindow = useCallback(async () => {
    console.log("🚀 Iniciando apertura de ventana externa...")
    
    if (openedRef.current) {
      console.log("⚠️ Ya se está intentando abrir una ventana, saltando...")
      return
    }
    
    if (external?.windowRef && !external.windowRef.closed) {
      console.log("🔵 Ventana ya existe, enfocando...")
      external.windowRef.focus()
      return
    }

    console.log("🔍 Obteniendo pantalla externa...")
    const extScreen = await getExternalScreen()

    if (!extScreen) {
      console.log("❌ No se detectó pantalla externa, mostrando toast...")
      toast({
        title: "No se detectó un monitor externo",
        description:
          "Conecta una pantalla externa para usar esta función.",
        variant: "destructive",
      })
      return
    }

    console.log("✅ Pantalla externa confirmada, procediendo a abrir ventana...")
    openedRef.current = true // Marcar ANTES de abrir la ventana

    /* specs */
    const specs = [
      // coordenadas exactas
      `left=${(extScreen as any).availLeft ?? (extScreen as any).left ?? 0}`,
      `top=${(extScreen as any).availTop ?? (extScreen as any).top ?? 0}`,
      `width=${(extScreen as any).availWidth ?? extScreen.width}`,
      `height=${(extScreen as any).availHeight ?? extScreen.height}`,
      "fullscreen=yes", // FULLSCREEN:
      "scrollbars=no",
      "menubar=no",
      "toolbar=no",
      "location=no",
      "status=no",
      "resizable=no",
      "scrollbars=no",
      "titlebar=no",
    ].join(",")
    
    console.log("📐 Especificaciones de ventana:", specs)

    const id   = `ext-${Date.now()}`
    const name = "Cabina · Pantalla Extendida"
    const url  = `/external-screen?id=${id}&name=${encodeURIComponent(name)}`

    console.log("🌐 Abriendo ventana con URL:", url)
    const ref = window.open(url, id, specs)
    
    if (!ref) {
      console.log("❌ Ventana bloqueada por el navegador")
      toast({
        title: "Pop-up bloqueado",
        description:
          "Activa las ventanas emergentes para usar la pantalla extendida.",
        variant: "destructive",
      })
      openedRef.current = false // Reset si falla
      return
    }
    
    console.log("✅ Ventana abierta exitosamente:", ref)

    /* FULLSCREEN: forzar pantalla completa de múltiples formas */
    const forceFullscreen = async () => {
      try {
        // Método 1: requestFullscreen estándar
        if (ref.document?.documentElement?.requestFullscreen) {
          await ref.document.documentElement.requestFullscreen()
          return true
        }
      } catch (e) {
        console.log("Método 1 falló:", e)
      }

      try {
        // Método 2: webkitRequestFullscreen (Safari)
        if ((ref.document?.documentElement as any)?.webkitRequestFullscreen) {
          await (ref.document.documentElement as any).webkitRequestFullscreen()
          return true
        }
      } catch (e) {
        console.log("Método 2 falló:", e)
      }

      try {
        // Método 3: mozRequestFullScreen (Firefox)
        if ((ref.document?.documentElement as any)?.mozRequestFullScreen) {
          await (ref.document.documentElement as any).mozRequestFullScreen()
          return true
        }
      } catch (e) {
        console.log("Método 3 falló:", e)
      }

      try {
        // Método 4: msRequestFullscreen (IE/Edge)
        if ((ref.document?.documentElement as any)?.msRequestFullscreen) {
          await (ref.document.documentElement as any).msRequestFullscreen()
          return true
        }
      } catch (e) {
        console.log("Método 4 falló:", e)
      }

      return false
    }

    // Intentar pantalla completa después de un pequeño delay
    setTimeout(async () => {
      const success = await forceFullscreen()
      if (success) {
        console.log("🖥️ Pantalla completa activada")
      } else {
        console.log("⚠️ No se pudo activar pantalla completa automáticamente")
      }
    }, 500)

    setExternal({ id, name, url, windowRef: ref })
    setStatus("connecting")
  }, [external?.windowRef, getExternalScreen, toast])

  /* ---------------- cerrar ---------------- */
  const closeWindow = useCallback(() => {
    external?.windowRef?.close()
    setExternal(null)
    setStatus("disconnected")
    openedRef.current = false // <--- Reset al cerrar
  }, [external])

  /* ---------------- BroadcastChannel ---------------- */
  useEffect(() => {
    if (!external) return

    const ch = new BroadcastChannel("arduino-app")
    channelRef.current = ch

    const onMessage = (ev: MessageEvent) => {
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

    ch.addEventListener("message", onMessage)
    const hi = setTimeout(postUpdate, 450)

    return () => {
      ch.removeEventListener("message", onMessage)
      ch.close()
      channelRef.current = null
      clearTimeout(hi)
    }
  }, [external, postUpdate, closeWindow])

  /* ---------------- watchdog ---------------- */
  useEffect(() => {
    if (status !== "connected") return
    const iv = setInterval(() => {
      // Verificar si la ventana sigue abierta
      if (external?.windowRef && external.windowRef.closed) {
        console.log("🔴 Ventana externa cerrada, reseteando estado...")
        setExternal(null)
        setStatus("disconnected")
        openedRef.current = false
        return
      }
      
      // Verificar heartbeat
      if (Date.now() - lastHB > 10_000) {
        console.log("💔 Sin heartbeat, marcando como desconectado...")
        setStatus("disconnected")
      }
    }, 2_000) // Verificar más frecuentemente (cada 2 segundos)
    return () => clearInterval(iv)
  }, [status, lastHB, external])

  /* ---------------- autoOpen ---------------- */
  useEffect(() => {
    if (autoOpen && doorOpen && status === "disconnected") {
      (async () => {
        const extScreen = await getExternalScreen()
        if (extScreen) {
          openWindow()
        }
        // Si no hay pantalla externa, no hace nada
      })()
    }
  }, [autoOpen, doorOpen, status, openWindow, getExternalScreen])

  /* ---------------- Detector de pantallas mejorado ---------------- */
  useEffect(() => {
    // Solo activar detector si autoOpen está habilitado y doorOpen es true
    if (!autoOpen || !doorOpen) {
      if (screenCheckInterval.current) {
        clearInterval(screenCheckInterval.current)
        screenCheckInterval.current = null
      }
      return
    }

    // Función para verificar pantallas periódicamente
    const checkScreens = async () => {
      // Solo verificar si no hay ventana conectada
      if (status === "connected" || status === "connecting") {
        console.log("🔵 Pantalla ya conectada, saltando verificación...")
        return
      }

      console.log("🔍 Verificando pantallas externas...")
      const extScreen = await getExternalScreen()
      
      if (extScreen) {
        console.log("✅ Pantalla externa detectada:", {
          width: extScreen.width,
          height: extScreen.height,
          isPrimary: (extScreen as any).isPrimary
        })
        
        // Si encontramos una pantalla externa y no hay ventana abierta, abrir automáticamente
        if (status === "disconnected" && !openedRef.current) {
          console.log("🚀 Abriendo ventana automáticamente...")
          openWindow()
        }
      } else {
        console.log("❌ No se detectó pantalla externa")
      }
    }

    // Verificar inmediatamente
    checkScreens()

    // Configurar verificación periódica cada 2 segundos (más frecuente)
    screenCheckInterval.current = setInterval(checkScreens, 2000)

    return () => {
      if (screenCheckInterval.current) {
        clearInterval(screenCheckInterval.current)
        screenCheckInterval.current = null
      }
    }
  }, [autoOpen, doorOpen, status, getExternalScreen, openWindow])

  /* ---------------- sync ---------------- */
  useEffect(() => {
    if (status === "connected") postUpdate()
  }, [status, postUpdate])

  /* ---------------- UI ---------------- */
  const colorClass =
    status === "connected"
      ? "text-green-400"
      : status === "connecting"
      ? "text-yellow-400"
      : "text-red-400"

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* FAB */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowPanel((p) => !p)}
        className="h-12 w-12 rounded-full bg-gray-800/60 backdrop-blur"
      >
        <Monitor className={`h-5 w-5 ${colorClass}`} />
        {status === "connected" && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 bg-green-600 text-white p-0">
            1
          </Badge>
        )}
      </Button>

      {/* Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 w-80 space-y-4 rounded-lg border border-gray-700/40 bg-gray-900/95 p-4 backdrop-blur-lg"
          >
            {/* header */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-white">
                <Monitor className="h-5 w-5 text-cyan-400" />
                Ventana Externa
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPanel(false)}
              >
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </div>

            {/* Estado */}
            <Alert className="bg-gray-800/40 border-gray-700/40">
              {status === "connected" ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : status === "connecting" ? (
                <RefreshCw className="h-4 w-4 animate-spin text-yellow-400" />
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

            {/* Detalles */}
            {selectedTherapy && (
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
                <span>Terapia:</span>
                <span className="text-white">{selectedTherapy.name}</span>
                <span>Duración:</span>
                <span className="text-white">{sessionDuration} min</span>
                <span>Tipo:</span>
                <span className="text-white flex items-center gap-1">
                  {selectedTherapy.hasVideo ? (
                    <>
                      <Video className="h-3 w-3" /> Video
                    </>
                  ) : (
                    <>
                      <Music className="h-3 w-3" /> Audio
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-2">
              {status === "disconnected" ? (
                <>
                  <Button className="flex-1" onClick={openWindow}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      console.log("🔄 Forzando detección de pantallas...")
                      const extScreen = await getExternalScreen()
                      if (extScreen) {
                        toast({
                          title: "Pantalla detectada",
                          description: "Pantalla externa encontrada, abriendo ventana...",
                        })
                        openWindow()
                      } else {
                        toast({
                          title: "No se detectó pantalla",
                          description: "Conecta una pantalla externa y vuelve a intentar",
                          variant: "destructive",
                        })
                      }
                    }}
                    title="Forzar detección de pantallas"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={closeWindow}
                  >
                    <X className="h-4 w-4 mr-1" /> Cerrar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (external?.windowRef) {
                        try {
                          await external.windowRef.document?.documentElement?.requestFullscreen?.()
                          toast({
                            title: "Pantalla completa",
                            description: "Activada manualmente",
                          })
                        } catch (e) {
                          toast({
                            title: "Error",
                            description: "No se pudo activar pantalla completa",
                            variant: "destructive",
                          })
                        }
                      }
                    }}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
