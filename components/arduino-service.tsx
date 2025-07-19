"use client"
import React, {
  createContext, useContext, useState, useEffect,
  useRef, useCallback, type ReactNode,
} from "react"
import { useToast } from "@/hooks/use-toast"

type Status = "disconnected" | "connecting" | "connected" | "error"

interface Ctx {
  connected: boolean
  connectionStatus: Status
  isSerialAvailable: boolean
  lastCommand: string | null

  /* API de alto nivel ------------------------------------ */
  conectarArduino(): Promise<boolean>
  // CORREGIDO: firma consistente con el uso
  iniciarTerapia(tipo: string, modo: string, minutos: number, intensidad: number): Promise<boolean>
  cambiarIntensidad(intensidad: number): Promise<boolean>
  detenerTerapia(): Promise<boolean>
  completarTerapia(): Promise<boolean>

  /* Útil si quieres mandar algo ad‑hoc */
  enviarComando(cmd: string): Promise<boolean>

  /* Preferencia */
  autoConnect: boolean
  setAutoConnect(val: boolean): void
}

const ArduinoCtx = createContext<Ctx | undefined>(undefined)
export const useArduinoService = () => {
  const c = useContext(ArduinoCtx)
  if (!c) throw new Error("useArduinoService must be inside provider")
  return c
}

export default function ArduinoServiceProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()

  /* -------------------------------------------------- */
  /* Estado base                                        */
  /* -------------------------------------------------- */
  const [connectionStatus, setStatus] = useState<Status>("disconnected")
  const [autoConnect, setAutoConnect]   = useState(false)
  const [lastCommand, setLast]         = useState<string | null>(null)

  const portRef   = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
  const writerRef = useRef<WritableStreamDefaultWriter | null>(null)

  const isSerialAvailable = typeof navigator !== "undefined" && "serial" in navigator
  const connected = connectionStatus === "connected"

  /* -------------------------------------------------- */
  /* Guardar / cargar preferencia                       */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pref = localStorage.getItem("arduino-auto-connect")
      if (pref === "true") setAutoConnect(true)
    }
  }, [])
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("arduino-auto-connect", String(autoConnect))
    }
  }, [autoConnect])

  /* -------------------------------------------------- */
  /* Auto-conexión al cargar                           */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (autoConnect && isSerialAvailable && !connected) {
      // Intentar reconectar automáticamente si hay dispositivos previos
      navigator.serial.getPorts().then(ports => {
        if (ports.length > 0) {
          console.log("🔄 Intentando auto-reconexión...")
          conectarArduino().catch(console.error)
        }
      })
    }
  }, [autoConnect, isSerialAvailable, connected])

  /* -------------------------------------------------- */
  /* Conexión                                           */
  /* -------------------------------------------------- */
  const conectarArduino = useCallback(async (): Promise<boolean> => {
    if (!isSerialAvailable) {
      toast({ title: "Serial API no disponible", variant: "destructive" })
      return false
    }
    if (connected) return true

    setStatus("connecting")
    try {
      const port = await navigator.serial.requestPort()
      await port.open({ baudRate: 9600 })

      const reader = port.readable!.getReader()
      const writer = port.writable!.getWriter()

      portRef.current   = port
      readerRef.current = reader
      writerRef.current = writer

      /* lectura simple de debug */
      ;(async () => {
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            const response = new TextDecoder().decode(value).trim()
            console.log("🟢 Arduino >", response)
            
            // Mostrar respuestas importantes del Arduino
            if (response.includes("error") || response.includes("Error")) {
              toast({ 
                title: "Arduino Error", 
                description: response,
                variant: "destructive" 
              })
            }
          }
        } catch (err) {
          console.warn("reader error", err)
        }
      })()

      // Enviar comando de prueba y esperar un poco
      await writer.write(new TextEncoder().encode("test:conexion\n"))
      
      // Pequeña pausa para estabilizar la conexión
      await new Promise(resolve => setTimeout(resolve, 1000))

      setStatus("connected")
      toast({ title: "Arduino conectado exitosamente ✅" })
      
      if (!autoConnect) {
        setAutoConnect(true)
        toast({ title: "Auto‑conexión activada para próximas sesiones" })
      }
      return true
    } catch (err) {
      console.error("Error conectando Arduino:", err)
      setStatus("error")
      toast({ 
        title: "Error de conexión", 
        description: "No se pudo conectar al Arduino",
        variant: "destructive" 
      })
      return false
    }
  }, [connected, autoConnect, isSerialAvailable, toast])

  /* -------------------------------------------------- */
  /* Util: enviar línea                                */
  /* -------------------------------------------------- */
  const sendLine = useCallback(async (cmd: string): Promise<boolean> => {
    if (!writerRef.current || !connected) {
      console.warn("❌ No se puede enviar comando: Arduino desconectado")
      toast({ 
        title: "Arduino desconectado", 
        description: "Conecta el Arduino antes de iniciar la terapia",
        variant: "destructive" 
      })
      return false
    }
    
    try {
      await writerRef.current.write(new TextEncoder().encode(cmd + "\n"))
      setLast(cmd)
      console.log("📤 Enviando:", cmd)
      return true
    } catch (e) {
      console.error("Error enviando comando:", e)
      setStatus("error")
      toast({ 
        title: "Error de comunicación", 
        description: "Fallo al enviar comando al Arduino",
        variant: "destructive" 
      })
      return false
    }
  }, [connected, toast])

  /* -------------------------------------------------- */
  /* Comandos de negocio - CORREGIDOS                  */
  /* -------------------------------------------------- */
  const iniciarTerapia = useCallback(async (tipo: string, modo: string, minutos: number, intensidad: number): Promise<boolean> => {
    // Formato más completo para el Arduino
    const comando = `inicio:${modo},${intensidad},${minutos},${tipo}`
    console.log("🚀 Iniciando terapia:", { tipo, modo, minutos, intensidad })
    
    const success = await sendLine(comando)
    if (success) {
      toast({ 
        title: "Terapia iniciada", 
        description: `Modo: ${modo}, Intensidad: ${intensidad}%, Duración: ${minutos}min`
      })
    }
    return success
  }, [sendLine, toast])

  const cambiarIntensidad = useCallback(async (intensidad: number): Promise<boolean> => {
    const intensidadLimitada = Math.max(0, Math.min(100, intensidad))
    const comando = `intensidad:${intensidadLimitada}`
    console.log("💡 Cambiando intensidad:", intensidadLimitada)
    return await sendLine(comando)
  }, [sendLine])

  const detenerTerapia = useCallback(async (): Promise<boolean> => {
    console.log("🛑 Deteniendo terapia")
    const success = await sendLine("stop")
    if (success) {
      toast({ title: "Terapia detenida" })
    }
    return success
  }, [sendLine, toast])
  
  const completarTerapia = useCallback(async (): Promise<boolean> => {
    console.log("✅ Completando terapia")
    const success = await sendLine("completado")
    if (success) {
      toast({ title: "Terapia completada exitosamente ✨" })
    }
    return success
  }, [sendLine, toast])

  /* -------------------------------------------------- */
  /* Manejo de desconexión                            */
  /* -------------------------------------------------- */
  const desconectarArduino = useCallback(async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel()
        readerRef.current = null
      }
      if (writerRef.current) {
        await writerRef.current.close()
        writerRef.current = null
      }
      if (portRef.current) {
        await portRef.current.close()
        portRef.current = null
      }
      setStatus("disconnected")
      toast({ title: "Arduino desconectado" })
    } catch (err) {
      console.error("Error al desconectar:", err)
    }
  }, [toast])

  /* -------------------------------------------------- */
  /* Limpieza al salir                                  */
  /* -------------------------------------------------- */
  useEffect(() => {
    return () => {
      desconectarArduino()
    }
  }, [desconectarArduino])

  /* -------------------------------------------------- */
  /* Exponer contexto                                   */
  /* -------------------------------------------------- */
  const ctx: Ctx = {
    connected,
    connectionStatus,
    isSerialAvailable,
    lastCommand,
    conectarArduino,
    enviarComando: sendLine,
    iniciarTerapia,
    cambiarIntensidad,
    detenerTerapia,
    completarTerapia,
    autoConnect,
    setAutoConnect,
  }

  return <ArduinoCtx.Provider value={ctx}>{children}</ArduinoCtx.Provider>
}