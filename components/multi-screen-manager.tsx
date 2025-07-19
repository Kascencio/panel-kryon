"use client"

import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { Monitor, Tv, Smartphone, Laptop, Cast, X, Grid3X3, Video, Music, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ScreenType } from "@/components/screen-selector"
import { motion, AnimatePresence } from "framer-motion"

interface Screen {
  id: string
  type: ScreenType
  name: string
  visible: boolean
  isPrimary: boolean
  windowRef: Window | null
  url: string
}

interface MultiScreenManagerProps {
  doorOpen: boolean
  sessionActive: boolean
  sessionType: string
  therapyColor: string | null
  sessionDuration: number
  lightIntensity: number
  onStartSession?: () => void
  onStopSession?: () => void
  selectedTherapy: any | null
}

const SCREEN_TYPES: { type: ScreenType; name: string; icon: React.ReactNode; color: string }[] = [
  { type: "monitor", name: "Monitor Externo", icon: <Monitor className="h-4 w-4" />, color: "#3b82f6" },
  { type: "tv", name: "Televisión", icon: <Tv className="h-4 w-4" />, color: "#ef4444" },
  { type: "mobile", name: "Dispositivo Móvil", icon: <Smartphone className="h-4 w-4" />, color: "#10b981" },
  { type: "laptop", name: "Laptop", icon: <Laptop className="h-4 w-4" />, color: "#f59e0b" },
  { type: "presentation", name: "Modo Presentación", icon: <Cast className="h-4 w-4" />, color: "#8b5cf6" },
]

export default function MultiScreenManager({
  doorOpen,
  sessionActive,
  sessionType,
  therapyColor,
  sessionDuration,
  lightIntensity,
  onStartSession,
  onStopSession,
  selectedTherapy,
}: MultiScreenManagerProps) {
  const [screens, setScreens] = useState<Screen[]>([])
  const [showManager, setShowManager] = useState(false)
  const [autoCreatedScreens, setAutoCreatedScreens] = useState(false)
  const messageChannelRef = useRef<BroadcastChannel | null>(null)

  // Generar ID único para pantallas
  const generateScreenId = useCallback(() => {
    return `screen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Configurar canal de comunicación entre ventanas
  useEffect(() => {
    messageChannelRef.current = new BroadcastChannel("cabina-aq-screens")

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "SCREEN_CLOSED") {
        setScreens((prev) => prev.filter((screen) => screen.id !== event.data.screenId))
      }
    }

    messageChannelRef.current.addEventListener("message", handleMessage)

    return () => {
      if (messageChannelRef.current) {
        messageChannelRef.current.removeEventListener("message", handleMessage)
        messageChannelRef.current.close()
      }
    }
  }, [])

  // Enviar datos actualizados a todas las pantallas
  const broadcastUpdate = useCallback(() => {
    if (messageChannelRef.current) {
      messageChannelRef.current.postMessage({
        type: "UPDATE_DATA",
        data: {
          doorOpen,
          sessionActive,
          sessionType,
          therapyColor,
          sessionDuration,
          lightIntensity,
          selectedTherapy,
          hasVideo: selectedTherapy?.hasVideo || false,
          mediaType: selectedTherapy?.hasVideo ? "video" : "audio",
          videoSource: selectedTherapy?.hasVideo
            ? `/video/${selectedTherapy?.frequency || "general"}-${sessionDuration}min.mp4`
            : "",
        },
      })
    }
  }, [doorOpen, sessionActive, sessionType, therapyColor, sessionDuration, lightIntensity, selectedTherapy])

  // Actualizar pantallas cuando cambien los datos
  useEffect(() => {
    broadcastUpdate()
  }, [broadcastUpdate])

  // Crear pantallas automáticamente cuando se selecciona una terapia con video
  useEffect(() => {
    if (selectedTherapy?.hasVideo && !autoCreatedScreens) {
      createScreen("tv", true)
      setAutoCreatedScreens(true)
      console.log("🎬 Pantalla automática creada para terapia con video")
    } else if (!selectedTherapy?.hasVideo && autoCreatedScreens) {
      closeAllScreens()
      setAutoCreatedScreens(false)
      console.log("🎵 Pantallas limpiadas para terapia solo audio")
    }
  }, [selectedTherapy?.hasVideo, autoCreatedScreens])

  // Crear nueva pantalla
  const createScreen = useCallback(
    (type: ScreenType, isAutomatic = false) => {
      const screenInfo = SCREEN_TYPES.find((s) => s.type === type)
      if (!screenInfo) return

      const screenId = generateScreenId()

      // Configurar dimensiones según el tipo de pantalla
      const getWindowFeatures = (screenType: ScreenType) => {
        switch (screenType) {
          case "mobile":
            return "width=320,height=640,scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no"
          case "presentation":
            return "width=1200,height=800,scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no"
          case "tv":
            return "width=800,height=600,scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no"
          default:
            return "width=640,height=480,scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no"
        }
      }

      // Crear URL para la pantalla externa
      const screenUrl = `/external-screen?id=${screenId}&type=${type}&name=${encodeURIComponent(screenInfo.name)}`

      // Abrir nueva ventana
      const newWindow = window.open(screenUrl, `screen-${screenId}`, getWindowFeatures(type))

      if (newWindow) {
        const newScreen: Screen = {
          id: screenId,
          type,
          name: screenInfo.name,
          visible: true,
          isPrimary: screens.length === 0,
          windowRef: newWindow,
          url: screenUrl,
        }

        setScreens((prev) => [...prev, newScreen])

        // Enviar datos iniciales a la nueva ventana
        setTimeout(() => {
          broadcastUpdate()
        }, 1000)

        if (isAutomatic) {
          console.log(`🚀 Pantalla ${screenInfo.name} abierta automáticamente`)
        }
      } else {
        alert("No se pudo abrir la ventana. Verifica que los pop-ups estén habilitados.")
      }
    },
    [screens.length, generateScreenId, broadcastUpdate],
  )

  // Cerrar pantalla
  const closeScreen = useCallback((screenId: string) => {
    setScreens((prev) => {
      const screenToClose = prev.find((screen) => screen.id === screenId)
      if (screenToClose?.windowRef && !screenToClose.windowRef.closed) {
        screenToClose.windowRef.close()
      }

      const updatedScreens = prev.filter((screen) => screen.id !== screenId)

      // Si cerramos la pantalla principal, hacer principal a la primera disponible
      if (screenToClose?.isPrimary && updatedScreens.length > 0) {
        updatedScreens[0].isPrimary = true
      }

      return updatedScreens
    })
  }, [])

  // Establecer pantalla como principal
  const setPrimaryScreen = useCallback((screenId: string) => {
    setScreens((prev) =>
      prev.map((screen) => ({
        ...screen,
        isPrimary: screen.id === screenId,
      })),
    )
  }, [])

  // Cerrar todas las pantallas
  const closeAllScreens = useCallback(() => {
    screens.forEach((screen) => {
      if (screen.windowRef && !screen.windowRef.closed) {
        screen.windowRef.close()
      }
    })
    setScreens([])
    setAutoCreatedScreens(false)
  }, [screens])

  // Verificar estado de las ventanas
  useEffect(() => {
    const interval = setInterval(() => {
      setScreens((prev) =>
        prev.filter((screen) => {
          if (screen.windowRef && screen.windowRef.closed) {
            return false
          }
          return true
        }),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Obtener estadísticas de pantallas
  const getScreenStats = useCallback(() => {
    const total = screens.length
    const visible = screens.filter((screen) => screen.visible).length
    const primary = screens.find((screen) => screen.isPrimary)

    return { total, visible, primary }
  }, [screens])

  const stats = getScreenStats()

  // Determinar si hay video en la terapia seleccionada
  const hasVideo = selectedTherapy?.hasVideo || false

  return (
    <>
      {/* Botón para mostrar/ocultar el gestor */}
      <div className="fixed bottom-4 right-4 z-40">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full bg-gray-900/90 backdrop-blur-sm border-gray-700/50 hover:bg-gray-800/90 shadow-lg"
                onClick={() => setShowManager(!showManager)}
              >
                <Grid3X3 className="h-5 w-5 text-gray-300" />
                {screens.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-cyan-600 text-white text-xs flex items-center justify-center">
                    {stats.visible}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Pantallas Externas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Panel del gestor de pantallas */}
      <AnimatePresence>
        {showManager && (
          <motion.div
            className="fixed bottom-20 right-4 w-80 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-xl z-40"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Grid3X3 className="h-5 w-5 text-cyan-400 mr-2" />
                  <h3 className="text-white font-medium">Pantallas Externas</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800/80"
                  onClick={() => setShowManager(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Estado automático */}
              {hasVideo && (
                <Alert className="mb-4 bg-blue-900/20 border-blue-600/30">
                  <Video className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-200 text-xs">
                    {autoCreatedScreens
                      ? "Ventana automática abierta para reproducir video"
                      : "Esta terapia incluye video. Se abrirá una ventana automáticamente."}
                  </AlertDescription>
                </Alert>
              )}

              {!hasVideo && (
                <Alert className="mb-4 bg-gray-700/20 border-gray-600/30">
                  <Music className="h-4 w-4 text-gray-400" />
                  <AlertDescription className="text-gray-300 text-xs">
                    Terapia solo audio. Las ventanas externas mostrarán la simulación 3D.
                  </AlertDescription>
                </Alert>
              )}

              {/* Información sobre pop-ups */}
              <Alert className="mb-4 bg-yellow-900/20 border-yellow-600/30">
                <ExternalLink className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200 text-xs">
                  Las pantallas se abren en ventanas nuevas. Asegúrate de permitir pop-ups en tu navegador.
                </AlertDescription>
              </Alert>

              {/* Estadísticas simples */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-800/50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-white">{stats.total}</div>
                  <div className="text-xs text-gray-400">Ventanas</div>
                </div>
                <div className="bg-gray-800/50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-cyan-400">{stats.visible}</div>
                  <div className="text-xs text-gray-400">Abiertas</div>
                </div>
              </div>

              {/* Lista de pantallas activas */}
              {screens.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-300">Ventanas Abiertas</h4>
                  {screens.map((screen) => {
                    const screenInfo = SCREEN_TYPES.find((s) => s.type === screen.type)
                    const isWindowClosed = screen.windowRef?.closed || false

                    return (
                      <div
                        key={screen.id}
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-700/50"
                      >
                        <div className="flex items-center">
                          <div className="mr-2" style={{ color: screenInfo?.color }}>
                            {screenInfo?.icon}
                          </div>
                          <div>
                            <div className="text-sm text-white">{screen.name}</div>
                            <div className="flex items-center gap-1">
                              {screen.isPrimary && (
                                <Badge className="bg-cyan-600/80 text-white text-xs px-1 py-0">Principal</Badge>
                              )}
                              <Badge
                                className={`text-xs px-1 py-0 ${
                                  isWindowClosed ? "bg-red-600/80 text-white" : "bg-green-600/80 text-white"
                                }`}
                              >
                                {isWindowClosed ? "Cerrada" : hasVideo ? "Video" : "3D"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!isWindowClosed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-cyan-400 hover:bg-cyan-900/20"
                              onClick={() => {
                                if (screen.windowRef && !screen.windowRef.closed) {
                                  screen.windowRef.focus()
                                }
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                            onClick={() => closeScreen(screen.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Agregar pantallas manualmente */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Abrir Nueva Ventana</h4>
                <div className="grid grid-cols-2 gap-2">
                  {SCREEN_TYPES.slice(0, 4).map((screenType) => (
                    <Button
                      key={screenType.type}
                      variant="outline"
                      size="sm"
                      className="justify-start bg-gray-800/60 border-gray-700/60 hover:bg-gray-700/80 text-xs"
                      onClick={() => createScreen(screenType.type)}
                    >
                      <div className="mr-2" style={{ color: screenType.color }}>
                        {screenType.icon}
                      </div>
                      {screenType.name.split(" ")[0]}
                    </Button>
                  ))}
                </div>

                {/* Controles globales */}
                {screens.length > 0 && (
                  <div className="pt-3 border-t border-gray-700/50">
                    <Button variant="destructive" size="sm" className="w-full text-xs" onClick={closeAllScreens}>
                      <X className="h-3 w-3 mr-1" />
                      Cerrar Todas las Ventanas
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
