"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, Info, CheckCircle } from "lucide-react"

interface AudioDurationWarningProps {
  sessionDuration: "corto" | "mediano" | "largo"
  audioDuration: number | null
  isVisible: boolean
}

export default function AudioDurationWarning({ sessionDuration, audioDuration, isVisible }: AudioDurationWarningProps) {
  if (!isVisible || !audioDuration) {
    return null
  }

  // Convertir duración de segundos a minutos
  const audioMinutes = Math.floor(audioDuration / 60)
  const audioSeconds = Math.floor(audioDuration % 60)

  // Determinar el comportamiento según la categoría
  const getDurationInfo = () => {
    switch (sessionDuration) {
      case "corto":
        return {
          expectedDuration: "4 minutos o menos",
          behavior: "La sesión durará exactamente el tiempo del audio o máximo 4 minutos",
          color: "green",
          icon: CheckCircle,
          isOptimal: audioDuration <= 240, // 4 minutos
        }
      case "mediano":
        return {
          expectedDuration: "4 a 15 minutos",
          behavior: "La sesión durará exactamente el tiempo del audio",
          color: "yellow",
          icon: Clock,
          isOptimal: audioDuration > 240 && audioDuration <= 900, // 4-15 minutos
        }
      case "largo":
        return {
          expectedDuration: "Más de 15 minutos",
          behavior: "La sesión durará hasta que termine el audio completo",
          color: "blue",
          icon: Info,
          isOptimal: audioDuration > 900, // más de 15 minutos
        }
      default:
        return {
          expectedDuration: "Desconocido",
          behavior: "Comportamiento no definido",
          color: "gray",
          icon: AlertTriangle,
          isOptimal: false,
        }
    }
  }

  const durationInfo = getDurationInfo()

  // Determinar el tipo de alerta
  const getAlertVariant = () => {
    if (durationInfo.isOptimal) {
      return "default" // Verde/azul para óptimo
    } else {
      return "destructive" // Amarillo/rojo para advertencia
    }
  }

  const getAlertColor = () => {
    if (durationInfo.isOptimal) {
      return durationInfo.color === "green"
        ? "border-green-500/50 bg-green-500/10"
        : durationInfo.color === "blue"
          ? "border-blue-500/50 bg-blue-500/10"
          : "border-yellow-500/50 bg-yellow-500/10"
    } else {
      return "border-orange-500/50 bg-orange-500/10"
    }
  }

  const IconComponent = durationInfo.icon

  return (
    <Alert className={`${getAlertColor()} border text-white`}>
      <IconComponent
        className={`h-4 w-4 ${
          durationInfo.isOptimal
            ? durationInfo.color === "green"
              ? "text-green-400"
              : durationInfo.color === "blue"
                ? "text-blue-400"
                : "text-yellow-400"
            : "text-orange-400"
        }`}
      />
      <AlertDescription className="text-sm">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              Duración de {sessionDuration}: {durationInfo.expectedDuration}
            </span>
            <Badge
              className={`text-xs ${
                durationInfo.color === "green"
                  ? "bg-green-600/30 text-green-400"
                  : durationInfo.color === "blue"
                    ? "bg-blue-600/30 text-blue-400"
                    : durationInfo.color === "yellow"
                      ? "bg-yellow-600/30 text-yellow-400"
                      : "bg-gray-600/30 text-gray-400"
              }`}
            >
              {sessionDuration.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-300">
              Audio disponible: {audioMinutes}:{audioSeconds.toString().padStart(2, "0")}
            </span>
            <Badge
              className={`text-xs ${
                durationInfo.isOptimal ? "bg-green-600/30 text-green-400" : "bg-orange-600/30 text-orange-400"
              }`}
            >
              {durationInfo.isOptimal ? "Óptimo" : "Advertencia"}
            </Badge>
          </div>

          <div className="text-gray-400 text-xs">
            <strong>Comportamiento:</strong> {durationInfo.behavior}
          </div>

          {!durationInfo.isOptimal && (
            <div className="text-orange-300 text-xs bg-orange-500/10 p-2 rounded border border-orange-500/20">
              <strong>⚠️ Nota:</strong> La duración del audio no es óptima para la categoría "{sessionDuration}"
              seleccionada.
              {sessionDuration === "corto" &&
                audioDuration > 240 &&
                " El audio es más largo de lo recomendado para sesiones cortas."}
              {sessionDuration === "mediano" &&
                (audioDuration <= 240 || audioDuration > 900) &&
                " El audio está fuera del rango recomendado para sesiones medianas."}
              {sessionDuration === "largo" &&
                audioDuration <= 900 &&
                " El audio es más corto de lo recomendado para sesiones largas."}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
