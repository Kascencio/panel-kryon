"use client"
import { useState, useCallback, useEffect } from "react"
import { Monitor, Tv, Smartphone, Laptop, X, Grid3X3, Video, Music, ExternalLink, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import AdvancedScreenDetector from "./advanced-screen-detector"

interface ScreenInfo {
  id: string
  name: string
  width: number
  height: number
  left: number
  top: number
  isPrimary: boolean
  availWidth: number
  availHeight: number
}

interface ExternalWindow {
  id: string
  type: string
  name: string
  windowRef: Window | null
  url: string
  targetScreen?: ScreenInfo
}

interface EnhancedMultiScreenManagerProps {
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

export default function EnhancedMultiScreenManager({
  doorOpen,
  sessionActive,
  sessionType,
  therapyColor,
  sessionDuration,
  lightIntensity,
  onStartSession,
  onStopSession,
  selectedTherapy,
}: EnhancedMultiScreenManagerProps) {
  const [showManager, setShowManager] = useState(false)
  const [showAdvancedDetector, setShowAdvancedDetector] = useState(false)
  const [detectedScreens, setDetectedScreens] = useState<ScreenInfo[]>([])
  const [externalWindows, setExternalWindows] = useState<Map<string, ExternalWindow>>(new Map())
  const [autoCreatedScreens, setAutoCreatedScreens] = useState(false)

  // Datos de sesión para pasar al detector
  const sessionData = {
    doorOpen,
    sessionActive,
    sessionType,
    therapyColor,
    sessionDuration,
    lightIntensity,
    selectedTherapy,
  }

  // Crear pantallas automáticamente cuando se selecciona una terapia con video
  useEffect(() => {
    if (selectedTherapy?.hasVideo && !autoCreatedScreens && detectedScreens.length > 1) {
      // Buscar una pantalla secundaria para abrir automáticamente
      const secondaryScreen = detectedScreens.find((screen) => !screen.isPrimary)
      if (secondaryScreen) {
        handleScreensDetected(detectedScreens) // Asegurar que tenemos las pantallas
        // Simular apertura automática en pantalla secundaria
        setTimeout(() => {
          const windowId = openWindowOnSpecificScreen(secondaryScreen, "tv")
          if (windowId) {
            setAutoCreatedScreens(true)
            console.log("🎬 Pantalla automática creada para terapia con video en pantalla secundaria")
          }
        }, 1000)
      }
    } else if (!selectedTherapy?.hasVideo && autoCreatedScreens) {
      // Cerrar ventanas automáticas cuando no hay video
      closeAllWindows()
      setAutoCreatedScreens(false)
      console.log("🎵 Pantallas limpiadas para terapia solo audio")
    }
  }, [selectedTherapy?.hasVideo, autoCreatedScreens, detectedScreens])

  // Manejar detección de pantallas
  const handleScreensDetected = useCallback((screens: ScreenInfo[]) => {
    setDetectedScreens(screens)
    console.log(`🖥️ Detectadas ${screens.length} pantallas:`, screens)
  }, [])

  // Manejar apertura de ventana
  const handleWindowOpened = useCallback((windowId: string, window: ExternalWindow) => {
    setExternalWindows((prev) => new Map(prev).set(windowId, window))
    console.log(`🚀 Ventana abierta: ${window.name}`)
  }, [])

  // Manejar cierre de ventana
  const handleWindowClosed = useCallback((windowId: string) => {
    setExternalWindows((prev) => {
      const newMap = new Map(prev)
      newMap.delete(windowId)
      return newMap
    })
    console.log(`❌ Ventana cerrada: ${windowId}`)
  }, [])

  // Abrir ventana en pantalla específica
  const openWindowOnSpecificScreen = useCallback((screen: ScreenInfo, type = "monitor") => {
    const windowId = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Calcular posición para centrar en la pantalla objetivo
    const windowWidth = Math.min(800, screen.availWidth * 0.8)
    const windowHeight = Math.min(600, screen.availHeight * 0.8)
    const left = screen.left + (screen.availWidth - windowWidth) / 2
    const top = screen.top + (screen.availHeight - windowHeight) / 2

    const features = [
      `width=${windowWidth}`,
      `height=${windowHeight}`,
      `left=${left}`,
      `top=${top}`,
      "scrollbars=no",
      "resizable=yes",
      "status=no",
      "location=no",
      "toolbar=no",
      "menubar=no",
    ].join(",")

    const url = `/external-screen?id=${windowId}&type=${type}&screen=${screen.id}&name=${encodeURIComponent(`${type} - ${screen.name}`)}`
    const newWindow = window.open(url, `screen-${windowId}`, features)

    if (newWindow) {
      const externalWindow: ExternalWindow = {
        id: windowId,
        type,
        name: `${type} - ${screen.name}`,
        windowRef: newWindow,
        url,
        targetScreen: screen,
      }

      setExternalWindows((prev) => new Map(prev).set(windowId, externalWindow))
      return windowId
    } else {
      alert("No se pudo abrir la ventana. Verifica que los pop-ups estén habilitados.")
      return null
    }
  }, [])

  // Cerrar ventana específica
  const closeWindow = useCallback(
    (windowId: string) => {
      const window = externalWindows.get(windowId)
      if (window?.windowRef && !window.windowRef.closed) {
        window.windowRef.close()
      }
      setExternalWindows((prev) => {
        const newMap = new Map(prev)
        newMap.delete(windowId)
        return newMap
      })
    },
    [externalWindows],
  )

  // Cerrar todas las ventanas
  const closeAllWindows = useCallback(() => {
    externalWindows.forEach((window) => {
      if (window.windowRef && !window.windowRef.closed) {
        window.windowRef.close()
      }
    })
    setExternalWindows(new Map())
    setAutoCreatedScreens(false)
  }, [externalWindows])

  // Obtener estadísticas
  const getStats = () => {
    const totalWindows = externalWindows.size
    const activeWindows = Array.from(externalWindows.values()).filter(
      (window) => window.windowRef && !window.windowRef.closed,
    ).length

    return { totalWindows, activeWindows, detectedScreens: detectedScreens.length }
  }

  const stats = getStats()
  const hasVideo = selectedTherapy?.hasVideo || false

  return (
    <>
      {/* Botón principal flotante */}
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
                {stats.activeWindows > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-cyan-600 text-white text-xs flex items-center justify-center">
                    {stats.activeWindows}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Gestor de Pantallas Múltiples</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Panel principal del gestor */}
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
                  <h3 className="text-white font-medium">Pantallas Múltiples</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800/80"
                    onClick={() => setShowAdvancedDetector(!showAdvancedDetector)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800/80"
                    onClick={() => setShowManager(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Estado de la terapia */}
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
                    Terapia solo audio. Las ventanas externas mostrarán información de la sesión.
                  </AlertDescription>
                </Alert>
              )}

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-800/50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-white">{stats.detectedScreens}</div>
                  <div className="text-xs text-gray-400">Pantallas</div>
                </div>
                <div className="bg-gray-800/50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-cyan-400">{stats.activeWindows}</div>
                  <div className="text-xs text-gray-400">Activas</div>
                </div>
                <div className="bg-gray-800/50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-green-400">{stats.totalWindows}</div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
              </div>

              {/* Lista de ventanas activas */}
              {stats.activeWindows > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-300">Ventanas Activas</h4>
                  {Array.from(externalWindows.values())
                    .filter((window) => window.windowRef && !window.windowRef.closed)
                    .map((window) => (
                      <div
                        key={window.id}
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-700/50"
                      >
                        <div className="flex items-center">
                          <div className="mr-2 text-green-400">
                            {window.type === "tv" ? (
                              <Tv className="h-4 w-4" />
                            ) : window.type === "mobile" ? (
                              <Smartphone className="h-4 w-4" />
                            ) : window.type === "laptop" ? (
                              <Laptop className="h-4 w-4" />
                            ) : (
                              <Monitor className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm text-white">{window.name}</div>
                            <div className="text-xs text-gray-400">
                              {window.targetScreen?.name || "Pantalla desconocida"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-cyan-400 hover:bg-cyan-900/20"
                            onClick={() => {
                              if (window.windowRef && !window.windowRef.closed) {
                                window.windowRef.focus()
                              }
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                            onClick={() => closeWindow(window.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Acciones rápidas */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-300">Acciones Rápidas</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-blue-600/20 text-blue-400 border-blue-600/40 hover:bg-blue-600/30"
                    onClick={() => setShowAdvancedDetector(!showAdvancedDetector)}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    {showAdvancedDetector ? "Ocultar" : "Mostrar"} Detector
                  </Button>
                </div>

                {/* Controles globales */}
                {stats.totalWindows > 0 && (
                  <div className="pt-3 border-t border-gray-700/50">
                    <Button variant="destructive" size="sm" className="w-full text-xs" onClick={closeAllWindows}>
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

      {/* Detector avanzado */}
      <AnimatePresence>
        {showAdvancedDetector && (
          <motion.div
            className="fixed bottom-4 left-4 w-96 z-30"
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <AdvancedScreenDetector
              onScreensDetected={handleScreensDetected}
              onWindowOpened={handleWindowOpened}
              onWindowClosed={handleWindowClosed}
              sessionData={sessionData}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
