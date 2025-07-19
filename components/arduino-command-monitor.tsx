"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Terminal, Trash2, Copy, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CommandLog {
  id: string
  command: string
  timestamp: Date
  status: "sent" | "success" | "error"
}

export default function ArduinoCommandMonitor() {
  const [commandHistory, setCommandHistory] = useState<CommandLog[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  // Simular comandos para demostración
  useEffect(() => {
    const interval = setInterval(() => {
      // Solo agregar comandos si hay actividad simulada
      if (Math.random() > 0.95) {
        const commands = ["intensidad:80", "inicio:terapia,patron,15,80", "test:rojo", "stop", "completado"]

        const randomCommand = commands[Math.floor(Math.random() * commands.length)]

        const newLog: CommandLog = {
          id: Date.now().toString(),
          command: randomCommand,
          timestamp: new Date(),
          status: Math.random() > 0.1 ? "success" : "error",
        }

        setCommandHistory((prev) => [newLog, ...prev.slice(0, 19)]) // Mantener solo 20 comandos
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const clearHistory = () => {
    setCommandHistory([])
    toast({
      title: "Historial limpiado",
      description: "Se ha limpiado el historial de comandos",
      variant: "default",
    })
  }

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
    toast({
      title: "Comando copiado",
      description: `"${command}" copiado al portapapeles`,
      variant: "default",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-600/80 text-white"
      case "error":
        return "bg-red-600/80 text-white"
      default:
        return "bg-yellow-600/80 text-white"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-3 w-3" />
      case "error":
        return <Terminal className="h-3 w-3" />
      default:
        return <Terminal className="h-3 w-3" />
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center">
            <Terminal className="mr-2 h-5 w-5 text-green-400" />
            Monitor de Comandos Arduino
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-600/80 text-white">{commandHistory.length} comandos</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? "Contraer" : "Expandir"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {commandHistory.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay comandos en el historial</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Últimos comandos enviados</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            </div>

            <div className={`space-y-2 ${isExpanded ? "max-h-96" : "max-h-48"} overflow-y-auto`}>
              {commandHistory.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded text-sm">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Badge className={`${getStatusColor(log.status)} text-xs`}>{getStatusIcon(log.status)}</Badge>
                    <code className="text-green-400 font-mono text-xs truncate">{log.command}</code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{log.timestamp.toLocaleTimeString()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCommand(log.command)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Información sobre los comandos */}
        <div className="mt-4 p-3 bg-gray-700/30 rounded text-xs text-gray-400">
          <div className="font-medium mb-2">Comandos disponibles:</div>
          <div className="grid grid-cols-1 gap-1">
            <code>inicio:terapia,modo,duracion,intensidad</code>
            <code>intensidad:valor (0-100)</code>
            <code>test:color (rojo/verde/azul/blanco)</code>
            <code>stop - Detener terapia</code>
            <code>completado - Finalizar sesión</code>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
