"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Tv, Smartphone, Tablet, ExternalLink, Wifi, AlertTriangle, X } from "lucide-react"
import { useState, useEffect } from "react"

export type ScreenType = "main" | "monitor" | "tv" | "mobile" | "tablet" | "presentation"

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
  type: ScreenType
  name: string
  windowRef: Window | null
  url: string
}

interface ScreenSelectorProps {
  availableScreens: ScreenInfo[]
  externalWindows: Map<string, ExternalWindow>
  onOpenWindow: (type: ScreenType) => void
  onCloseWindow: (windowId: string) => void
  onDetectScreens: () => void
  screenDetectionStatus: "idle" | "detecting" | "success" | "error"
  permissionGranted: boolean
}

export default function ScreenSelector({
  availableScreens,
  externalWindows,
  onOpenWindow,
  onCloseWindow,
  onDetectScreens,
  screenDetectionStatus,
  permissionGranted,
}: ScreenSelectorProps) {
  const [detectedScreenCount, setDetectedScreenCount] = useState(1)

  // Detectar pantallas de forma simple
  useEffect(() => {
    const detectSimpleScreens = () => {
      try {
        // Método simple: usar las propiedades básicas de screen
        const screenWidth = window.screen.width
        const screenHeight = window.screen.height
        const availWidth = window.screen.availWidth
        const availHeight = window.screen.availHeight

        // Si availWidth es significativamente mayor que width, probablemente hay múltiples pantallas
        let estimatedScreens = 1
        if (availWidth > screenWidth * 1.5) {
          estimatedScreens = Math.floor(availWidth / screenWidth)
        }

        // También verificar por altura
        if (availHeight > screenHeight * 1.5) {
          const verticalScreens = Math.floor(availHeight / screenHeight)
          estimatedScreens = Math.max(estimatedScreens, verticalScreens)
        }

        setDetectedScreenCount(Math.min(estimatedScreens, 4)) // Máximo 4 pantallas
      } catch (error) {
        console.error("Error detectando pantallas:", error)
        setDetectedScreenCount(1)
      }
    }

    detectSimpleScreens()
  }, [])

  const getScreenIcon = (type: ScreenType) => {
    switch (type) {
      case "monitor":
        return <Monitor className="h-4 w-4" />
      case "tv":
        return <Tv className="h-4 w-4" />
      case "mobile":
        return <Smartphone className="h-4 w-4" />
      case "tablet":
        return <Tablet className="h-4 w-4" />
      default:
        return <ExternalLink className="h-4 w-4" />
    }
  }

  const getScreenName = (type: ScreenType) => {
    switch (type) {
      case "monitor":
        return "Monitor"
      case "tv":
        return "TV"
      case "mobile":
        return "Móvil"
      case "tablet":
        return "Tablet"
      default:
        return "Ventana"
    }
  }

  const isWindowOpen = (type: ScreenType) => {
    return Array.from(externalWindows.values()).some(
      (window) => window.type === type && window.windowRef && !window.windowRef.closed,
    )
  }

  const getWindowId = (type: ScreenType) => {
    const window = Array.from(externalWindows.values()).find((window) => window.type === type)
    return window?.id
  }

  const handleOpenWindow = (type: ScreenType) => {
    try {
      onOpenWindow(type)
    } catch (error) {
      console.error("Error abriendo ventana:", error)
    }
  }

  const handleCloseWindow = (windowId: string) => {
    try {
      onCloseWindow(windowId)
    } catch (error) {
      console.error("Error cerrando ventana:", error)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Monitor className="mr-2 h-5 w-5 text-blue-400" />
            Pantallas Externas
          </div>
          <div className="flex items-center space-x-2">
            {detectedScreenCount > 1 ? (
              <Badge className="bg-green-600/20 text-green-400 border-green-400">
                <Wifi className="mr-1 h-3 w-3" />
                {detectedScreenCount} pantallas
              </Badge>
            ) : (
              <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-400">
                <AlertTriangle className="mr-1 h-3 w-3" />1 pantalla
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información simple de pantallas */}
        <div className="text-xs text-gray-400 text-center">
          {detectedScreenCount > 1
            ? `Se detectaron ${detectedScreenCount} pantallas. Las ventanas se abrirán automáticamente.`
            : "Solo se detectó una pantalla. Las ventanas se abrirán en la pantalla principal."}
        </div>

        {/* Ventanas activas */}
        {externalWindows.size > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-400">Ventanas abiertas:</div>
            {Array.from(externalWindows.values()).map((window) => {
              const isWindowClosed = !window.windowRef || window.windowRef.closed
              return (
                <div key={window.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="text-green-400">{getScreenIcon(window.type)}</div>
                    <span className="text-white">{window.name}</span>
                    <Badge
                      className={`px-1 py-0 text-xs ${isWindowClosed ? "bg-red-600/80 text-white" : "bg-green-600/80 text-white"}`}
                    >
                      {isWindowClosed ? "Cerrada" : "Activa"}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                    onClick={() => handleCloseWindow(window.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {/* Botones para crear ventanas */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "monitor", name: "Monitor", icon: Monitor },
            { id: "tv", name: "TV", icon: Tv },
            { id: "mobile", name: "Móvil", icon: Smartphone },
            { id: "tablet", name: "Tablet", icon: Tablet },
          ].map((screen) => {
            const hasWindow = isWindowOpen(screen.id as ScreenType)
            const windowId = getWindowId(screen.id as ScreenType)

            return (
              <Button
                key={screen.id}
                size="sm"
                variant="outline"
                className={`h-8 text-xs ${
                  hasWindow
                    ? "bg-green-600/20 border-green-600/40 text-green-400"
                    : "bg-gray-800/60 border-gray-700/60 hover:bg-gray-700/80 text-gray-300"
                }`}
                onClick={() => {
                  if (hasWindow && windowId) {
                    handleCloseWindow(windowId)
                  } else {
                    handleOpenWindow(screen.id as ScreenType)
                  }
                }}
              >
                <screen.icon className="w-3 h-3 mr-1" />
                {hasWindow ? "Cerrar" : screen.name}
              </Button>
            )
          })}
        </div>

        {/* Información adicional */}
        <div className="text-xs text-gray-500 text-center">
          {externalWindows.size === 0
            ? "Haz clic en los botones para abrir ventanas externas"
            : `${externalWindows.size} ventana(s) externa(s) activa(s)`}
        </div>
      </CardContent>
    </Card>
  )
}
