"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Usb, Wifi, WifiOff, Settings, RefreshCw, CheckCircle, AlertCircle, Zap, Activity } from "lucide-react"
import { useArduinoService } from "@/components/arduino-service"
import { useToast } from "@/hooks/use-toast"

export default function ArduinoConnection() {
  const {
    connectionStatus,
    conectarArduino,
    enviarComando,
    cambiarIntensidad,
    autoConnect,
    setAutoConnect,
  } = useArduinoService()
  const { toast } = useToast()

  const connected = connectionStatus === "connected"
  const connecting = connectionStatus === "connecting"
  const error = connectionStatus === "error"

  const [connectionProgress, setConnectionProgress] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lastCommand, setLastCommand] = useState<string>("")

  // Auto-conexión al iniciar
  useEffect(() => {
    if (autoConnect && !connected && !connecting) {
      const timer = setTimeout(() => {
        conectarArduino()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [autoConnect, connected, connecting, conectarArduino])

  // Guardar preferencia
  const handleToggleAuto = useCallback((val: boolean) => {
    setAutoConnect(val)
  }, [setAutoConnect])

  // Progreso simulado
  useEffect(() => {
    if (connecting) {
      setConnectionProgress(0)
      const interval = setInterval(() => {
        setConnectionProgress(prev => prev >= 90 ? 90 : prev + 10)
      }, 200)
      return () => clearInterval(interval)
    } else {
      setConnectionProgress(connected ? 100 : 0)
    }
  }, [connecting, connected])

  const handleConnect = async () => {
    if (connecting || connected) return
    const success = await conectarArduino()
    if (success) {
      toast({ title: "Arduino conectado", description: "Conexión establecida", variant: "default" })
    }
  }

  const handleTestCommand = useCallback(async () => {
    if (!connected) return
    const cmd = "test:rojo"
    setLastCommand(cmd)
    const ok = await enviarComando(cmd)
    if (ok) toast({ title: "Comando enviado", description: cmd, variant: "default" })
  }, [connected, enviarComando, toast])

  const handleIntensityTest = useCallback(async () => {
    if (!connected) return
    const inten = 50
    const ok = await cambiarIntensidad(inten)
    if (ok) {
      const cmd = `intensidad:${inten}`
      setLastCommand(cmd)
      toast({ title: "Intensidad cambiada", description: `${inten}%`, variant: "default" })
    }
  }, [connected, cambiarIntensidad, toast])

  const getStatusIcon = () => {
    if (connecting) return <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
    if (connected) return <CheckCircle className="h-4 w-4 text-green-400" />
    if (error) return <AlertCircle className="h-4 w-4 text-red-400" />
    return <Usb className="h-4 w-4 text-gray-400" />
  }

  const getStatusText = () => connecting ? "Conectando..." : connected ? "Conectado" : error ? "Error" : "Desconectado"
  const getStatusColor = () => connecting ? "text-blue-400" : connected ? "text-green-400" : error ? "text-red-400" : "text-gray-400"

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-white text-sm">
          <div className="flex items-center gap-2">
            <Usb className="text-cyan-400 h-4 w-4" /> Arduino
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(v => !v)} className="p-0 text-gray-400">
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Estado */}
        <div className="flex justify-between items-center p-2 bg-gray-700/50 rounded">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`font-medium ${getStatusColor()}`}>{getStatusText()}</span>
          </div>
          {connected ? <Wifi className="h-4 w-4 text-green-400" /> : <WifiOff className="h-4 w-4 text-red-400" />}
        </div>

        {/* Progreso */}
        {connecting && (
          <div>
            <Progress value={connectionProgress} className="h-1" />
            <div className="text-xs text-blue-400 text-center">{connectionProgress}%</div>
          </div>
        )}

        {/* Auto-conexión */}
        <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded">
          <div>
            <span className="text-sm text-white">Auto-conexión</span>
            <div className="text-xs text-gray-400">Al iniciar la app</div>
          </div>
          <Switch checked={autoConnect} onCheckedChange={handleToggleAuto} disabled={connecting} />
        </div>

        {/* Botón conectar */}
        <Button onClick={handleConnect} disabled={connecting || connected} className="w-full text-xs h-8 bg-green-600 hover:bg-green-500">
          {connecting ? (
            <><RefreshCw className="animate-spin h-4 w-4 mr-1"/> Conectando...</>
          ) : (
            <><Usb className="h-4 w-4 mr-1"/> Conectar Arduino</>
          )}
        </Button>

        {/* Avanzado */}
        {showAdvanced && (
          <div className="mt-2 space-y-2 pt-2 border-t border-gray-700">
            <div className="text-xs font-medium text-gray-300">Controles de Prueba</div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleTestCommand} disabled={!connected} variant="outline" className="text-xs h-8">
                <Zap className="h-4 w-4 mr-1"/> Test LED
              </Button>
              <Button onClick={handleIntensityTest} disabled={!connected} variant="outline" className="text-xs h-8">
                <Activity className="h-4 w-4 mr-1"/> Test 50%
              </Button>
            </div>
            {lastCommand && (
              <div className="p-2 bg-gray-700/30 rounded text-xs font-mono text-cyan-400">
                Último comando: {lastCommand}
              </div>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  )
}
