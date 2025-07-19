"use client"

import { Monitor, RefreshCw, Tv, Smartphone, Laptop, CheckCircle, AlertTriangle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useScreenContext } from "@/hooks/ScreenProvider"

/**
 * Panel compacto que consume ScreenProvider y muestra:
 *  – Estado de la detección
 *  – Lista rápida de pantallas con info básica
 *  – Botón "Detectar" y switch "Auto" (polling cada 3 s)
 */
export default function ScreenPanel() {
  const { screens, status, permissionGranted, refresh, autoDetect, toggleAutoDetect } = useScreenContext()

  /* helpers -----------------------------*/
  const statusMap: Record<typeof status, { icon: JSX.Element; text: string; color: string }> = {
    idle: {
      icon: <Monitor className="h-4 w-4 text-gray-400" />,
      text: "Sin detectar todavía",
      color: "text-gray-400",
    },
    detecting: {
      icon: <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />,
      text: "Detectando pantallas…",
      color: "text-blue-400",
    },
    success: {
      icon: <CheckCircle className="h-4 w-4 text-green-400" />,
      text: `${screens.length} pantalla(s) detectada(s)`,
      color: "text-green-400",
    },
    error: {
      icon: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
      text: "No se detectaron pantallas externas",
      color: "text-yellow-400",
    },
  }

  const getIcon = (idx: number) => {
    if (idx === 0) return <Monitor className="h-4 w-4" />
    if (idx === 1) return <Tv className="h-4 w-4" />
    if (idx === 2) return <Laptop className="h-4 w-4" />
    return <Smartphone className="h-4 w-4" />
  }

  /* render ------------------------------*/
  return (
    <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm text-white">
          <span className="flex items-center gap-2">
            {statusMap[status].icon}
            <span className={statusMap[status].color}>{statusMap[status].text}</span>
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={status === "detecting"}
              onClick={refresh}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Detectar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleAutoDetect}
              className={autoDetect ? "border-green-600 text-green-400 bg-green-900/20" : "border-gray-600 text-gray-300 hover:bg-gray-700"}
            >
              Auto {autoDetect ? "ON" : "OFF"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {!permissionGranted && (
          <p className="text-xs text-yellow-400">Otorga permiso de gestión de ventanas para una detección más precisa.</p>
        )}

        {/* Lista de pantallas */}
        <div className="space-y-2">
          {screens.map((scr, idx) => (
            <div key={scr.id} className="flex items-center justify-between bg-gray-700/40 p-2 rounded">
              <div className="flex items-center gap-2 text-gray-200">
                {getIcon(idx)}
                <span>{scr.name}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {scr.width}×{scr.height}
              </Badge>
            </div>
          ))}
          {screens.length === 0 && status !== "detecting" && (
            <p className="text-center text-xs text-gray-400">No hay pantallas registradas aún.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
