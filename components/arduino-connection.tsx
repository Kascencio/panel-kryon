"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Usb, Wifi, WifiOff, Settings, RefreshCw, CheckCircle, AlertCircle, Zap, Activity } from "lucide-react"
import { useArduinoService } from "@/components/arduino-service"
import { useToast } from "@/hooks/use-toast"

export default function ArduinoConnection() {
  const [autoConnect, setAutoConnect] = useState(false)
  const [connectionProgress, setConnectionProgress] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lastCommand, setLastCommand] = useState<string>("")

  const { connectionStatus, conectarArduino, enviarComando, cambiarIntensidad } = useArduinoService()

  // Helpers locales
  const connected = connectionStatus === "connected"
  const connecting = connectionStatus === "connecting"
  const error = connectionStatus === "error"

  const { toast } = useToast()

  // Cargar preferencia de auto-conexión
  useEffect(() => {
    const savedAutoConnect = localStorage.getItem("arduino-auto-connect")
    if (savedAutoConnect === "true") {
      setAutoConnect(true)
      // Auto-conectar después de un breve delay
      setTimeout(() => {
        if (!connected && !connecting) {
          handleConnect()
        }
      }, 2000)
    }
  }, [])

  // Guardar preferencia de auto-conexión
  useEffect(() => {
    localStorage.setItem("arduino-auto-connect", autoConnect.toString())
  }, [autoConnect])

  // Simular progreso de conexión
  useEffect(() => {
    if (connecting) {
      setConnectionProgress(0)
      const interval = setInterval(() => {
        setConnectionProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      return () => clearInterval(interval)
    } else {
      setConnectionProgress(connected ? 100 : 0)
    }
  }, [connecting, connected])

  const handleConnect = async () => {
    try {
      const success = await conectarArduino()
      if (success) {
        toast({
          title: "Arduino conectado",
          description: "Conexión establecida correctamente",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error conectando:", error)
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con Arduino. Verifica la conexión USB.",
        variant: "destructive",
      })
    }
  }

  const handleTestCommand = async () => {
    if (!connected) return

    try {
      const testCmd = "test:rojo"
      setLastCommand(testCmd)
      const success = await enviarComando(testCmd)
      if (success) {
        toast({
          title: "Comando enviado",
          description: `Comando de prueba: ${testCmd}`,
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error enviando comando:", error)
    }
  }

  const handleIntensityTest = async () => {
    if (!connected) return

    try {
      const success = await cambiarIntensidad(50)
      if (success) {
        setLastCommand("intensidad:50")
        toast({
          title: "Intensidad cambiada",
          description: "Intensidad ajustada a 50%",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error cambiando intensidad:", error)
    }
  }

  const getStatusIcon = () => {
    if (connecting) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
    } else if (connected) {
      return <CheckCircle className="h-4 w-4 text-green-400" />
    } else if (error) {
      return <AlertCircle className="h-4 w-4 text-red-400" />
    } else {
      return <Usb className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    if (connecting) return "Conectando..."
    if (connected) return "Conectado"
    if (error) return "Error"
    return "Desconectado"
  }

  const getStatusColor = () => {
    if (connecting) return "text-blue-400"
    if (connected) return "text-green-400"
    if (error) return "text-red-400"
    return "text-gray-400"
  }

  return (
    <Card className="bg-gray-800 border-gray-700 h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          <div className="flex items-center">
            <Usb className="mr-2 h-4 w-4 text-cyan-400" />
            Arduino
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Estado de conexión */}
        <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <div>
              <div className={`text-sm font-medium ${getStatusColor()}`}>{getStatusText()}</div>
              {/* {port && <div className="text-xs text-gray-400">Puerto: {port.getInfo?.().usbProductId || "USB"}</div>} */}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {connected ? <Wifi className="h-4 w-4 text-green-400" /> : <WifiOff className="h-4 w-4 text-red-400" />}
          </div>
        </div>

        {/* Progreso de conexión */}
        {connecting && (
          <div className="space-y-1">
            <Progress value={connectionProgress} className="w-full h-1" />
            <div className="text-xs text-blue-400 text-center">Estableciendo conexión... {connectionProgress}%</div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-2 bg-red-900/20 border border-red-600/30 rounded">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-3 w-3 text-red-400" />
              <span className="text-red-200 text-xs">{error}</span>
            </div>
          </div>
        )}

        {/* Auto-conexión */}
        <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
          <div>
            <div className="text-sm text-white">Auto-conexión</div>
            <div className="text-xs text-gray-400">Conectar automáticamente al iniciar</div>
          </div>
          <Switch checked={autoConnect} onCheckedChange={setAutoConnect} disabled={connecting} />
        </div>

        {/* Botones de control */}
        <div className="space-y-2">
          {!connected ? (
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-green-600 hover:bg-green-500 text-white text-xs h-7"
            >
              {connecting ? (
                <>
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Usb className="mr-1 h-3 w-3" />
                  Conectar Arduino
                </>
              )}
            </Button>
          ) : (
            <Button className="w-full bg-red-600 hover:bg-red-500 text-white text-xs h-7" disabled>
              <WifiOff className="mr-1 h-3 w-3" />
              Desconectado
            </Button>
          )}
        </div>

        {/* Controles avanzados */}
        {showAdvanced && (
          <div className="space-y-2 pt-2 border-t border-gray-700">
            <div className="text-xs font-medium text-gray-300 mb-2">Controles de Prueba</div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleTestCommand}
                disabled={!connected}
                variant="outline"
                className="text-xs h-7 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                <Zap className="mr-1 h-3 w-3" />
                Test LED
              </Button>

              <Button
                onClick={handleIntensityTest}
                disabled={!connected}
                variant="outline"
                className="text-xs h-7 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                <Activity className="mr-1 h-3 w-3" />
                Test 50%
              </Button>
            </div>

            {/* Último comando */}
            {lastCommand && (
              <div className="p-2 bg-gray-700/30 rounded">
                <div className="text-xs text-gray-400 mb-1">Último comando:</div>
                <div className="text-xs font-mono text-cyan-400">{lastCommand}</div>
              </div>
            )}

            {/* Información técnica */}
            <div className="p-2 bg-blue-900/20 border border-blue-600/30 rounded">
              <div className="text-xs text-blue-400 font-medium mb-1">ℹ️ Información</div>
              <ul className="text-xs text-blue-200 space-y-0.5">
                <li>• Protocolo: Serial USB</li>
                <li>• Baudrate: 9600</li>
                <li>• LEDs: 24 NeoPixel</li>
                <li>• Comandos: inicio, test, intensidad</li>
              </ul>
            </div>
          </div>
        )}

        {/* Estado de conexión compacto */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700">
          <span>Estado: {connected ? "Listo" : "Inactivo"}</span>
          <span>Auto: {autoConnect ? "ON" : "OFF"}</span>
        </div>
      </CardContent>
    </Card>
  )
}
