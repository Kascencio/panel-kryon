"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react"
import { useToast } from "@/hooks/use-toast"

/* ───────── Tipos ───────── */
type Status = "disconnected" | "connecting" | "connected" | "error"
interface PortInfo { usbVendorId?: number; usbProductId?: number }

interface Ctx {
  connected: boolean
  connectionStatus: Status
  isSerialAvailable: boolean
  lastCommand: string | null
  conectarArduino(): Promise<boolean>
  iniciarTerapia(tipo: string, modo: string, minutos: number, intensidad: number): Promise<boolean>
  cambiarIntensidad(intensidad: number): Promise<boolean>
  detenerTerapia(): Promise<boolean>
  completarTerapia(): Promise<boolean>
  enviarComando(cmd: string): Promise<boolean>
  autoConnect: boolean
  setAutoConnect(val: boolean): void
}

const ArduinoCtx = createContext<Ctx | undefined>(undefined)
export const useArduinoService = (): Ctx => {
  const ctx = useContext(ArduinoCtx)
  if (!ctx) throw new Error("useArduinoService must be inside ArduinoServiceProvider")
  return ctx
}

/* ───────── Constantes ───────── */
const ESP32_USB_FILTERS: SerialPortFilter[] = [
  { usbVendorId: 0x10C4, usbProductId: 0xEA60 }, // ESP32 CP210x
  { usbVendorId: 0x1A86, usbProductId: 0x7523 }, // ESP32 CH340
]
const BAUD_RATE = 115200 // ESP32 usa 115200 por defecto

const safeLocalStorage = {
  getItem: (key: string) => typeof window !== "undefined" ? localStorage.getItem(key) : null,
  setItem: (key: string, val: string) => {
    if (typeof window !== "undefined") localStorage.setItem(key, val)
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") localStorage.removeItem(key)
  },
}

/* ═════════ Provider ═════════ */
export default function ArduinoServiceProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<Status>("disconnected")
  const [autoConnect, setAutoConnect] = useState(false)
  const [lastCommand, setLastCommand] = useState<string | null>(null)

  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null)

  const isSerialAvailable = typeof navigator !== "undefined" && "serial" in navigator
  const connected = connectionStatus === "connected"

  /* ───────── Persistencia de puerto ───────── */
  const savePortInfo = (info: PortInfo) => {
    safeLocalStorage.setItem("esp32-port-info", JSON.stringify(info))
  }
  const loadPortInfo = (): PortInfo | null => {
    const raw = safeLocalStorage.getItem("esp32-port-info")
    try {
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  /* ───────── Abrir puerto ───────── */
  const openPort = useCallback(async (port: SerialPort): Promise<boolean> => {
    if (port.readable && port.writable) {
      portRef.current = port
      readerRef.current = port.readable.getReader()
      writerRef.current = port.writable.getWriter()
      setConnectionStatus("connected")
      toast({ title: "Sistema Cuántico conectado", description: "Puerto ya estaba abierto" })
      return true
    }

    try {
      setConnectionStatus("connecting")
      await port.open({ baudRate: BAUD_RATE })

      const reader = port.readable!.getReader()
      const writer = port.writable!.getWriter()
      portRef.current = port
      readerRef.current = reader
      writerRef.current = writer
      savePortInfo(port.getInfo())

      ;(async () => {
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            const text = new TextDecoder().decode(value).trim()
            console.log("🟢 Sistema Cuántico >", text)
            if (/error/i.test(text)) {
              toast({ title: "Sistema Error", description: text, variant: "destructive" })
            }
          }
        } catch (err) {
          console.warn("Sistema reader error", err)
        }
      })()

      await writer.write(new TextEncoder().encode("init\n"))
      await new Promise((r) => setTimeout(r, 1500))
      await writer.write(new TextEncoder().encode("status\n"))

      setConnectionStatus("connected")
      toast({ title: "Sistema Cuántico conectado", description: "¡Listo!" })
      return true
    } catch (err: any) {
      if (err?.name === "InvalidStateError") {
              console.warn("Puerto ya abierto, estableciendo refs…")
      portRef.current = port
      readerRef.current = port.readable!.getReader()
      writerRef.current = port.writable!.getWriter()
      setConnectionStatus("connected")
      toast({ title: "Sistema Cuántico conectado", description: "Puerto ya estaba abierto" })
      return true
      }
      console.error("Error opening Sistema Cuántico port:", err)
      setConnectionStatus("error")
      return false
    }
  }, [toast])

  const autoReconnect = useCallback(async (): Promise<boolean> => {
    if (!isSerialAvailable) return false
    const saved = loadPortInfo()
    const ports = await navigator.serial.getPorts()
    const match = ports.find((p) => {
      if (!saved) return true
      const info = p.getInfo()
      return info.usbVendorId === saved.usbVendorId && info.usbProductId === saved.usbProductId
    })
    return match ? openPort(match) : false
  }, [isSerialAvailable, openPort])

  useEffect(() => {
    if (autoConnect && !connected && connectionStatus !== "connecting") {
      autoReconnect().catch(console.error)
    }
  }, [autoConnect, connected, connectionStatus, autoReconnect])

  const conectarESP32 = useCallback(async (): Promise<boolean> => {
    if (!isSerialAvailable) {
      toast({ title: "Serial no disponible", variant: "destructive" })
      return false
    }
    if (connected) return true
    if (connectionStatus === "connecting") return false

    if (await autoReconnect()) return true

    try {
      const port = await navigator.serial.requestPort({ filters: ESP32_USB_FILTERS })
      return openPort(port)
    } catch (err) {
      console.error("Sistema Cuántico requestPort cancelado:", err)
      setConnectionStatus("disconnected")
      return false
    }
  }, [isSerialAvailable, connected, connectionStatus, autoReconnect, openPort, toast])

  const enviarComando = useCallback(async (cmd: string): Promise<boolean> => {
    const writer = writerRef.current
    if (!writer || !connected) {
      toast({ title: "Sistema Cuántico desconectado", description: "Conecta primero", variant: "destructive" })
      return false
    }
    try {
      console.log("📤", cmd)
      await writer.write(new TextEncoder().encode(cmd + "\n"))
      setLastCommand(cmd)
      if (/^(inicio:|intensidad:)/.test(cmd)) await new Promise((r) => setTimeout(r, 100))
      return true
    } catch (err) {
      console.error("Error sending command:", err)
      setConnectionStatus("error")
      toast({ title: "Comunicación fallida", variant: "destructive" })
      return false
    }
  }, [connected, toast])

  const iniciarTerapia = useCallback(async (tipo: string, modo: string, minutos: number, intensidad: number) => {
    const ok = await enviarComando(`inicio:${modo},${intensidad},${minutos}`)
    if (ok) {
      await new Promise((r) => setTimeout(r, 200))
      await enviarComando("luces:on")
      toast({ title: "Terapia iniciada", description: `${modo} ${intensidad}% ${minutos}min` })
    }
    return ok
  }, [enviarComando, toast])

  const cambiarIntensidad = useCallback((inten: number) => enviarComando(`intensidad:${Math.max(0, Math.min(100, inten))}`), [enviarComando])

  const detenerTerapia = useCallback(async () => {
    const ok = await enviarComando("stop")
    if (ok) {
      await new Promise((r) => setTimeout(r, 100))
      await enviarComando("luces:off")
      toast({ title: "Terapia detenida" })
    }
    return ok
  }, [enviarComando, toast])

  const completarTerapia = useCallback(async () => {
    const ok = await enviarComando("completado")
    if (ok) {
      await new Promise((r) => setTimeout(r, 100))
      await enviarComando("luces:off")
      toast({ title: "Terapia completada" })
    }
    return ok
  }, [enviarComando, toast])

  const desconectar = useCallback(async () => {
    await readerRef.current?.cancel()
    await writerRef.current?.close()
    await portRef.current?.close()
    readerRef.current = null
    writerRef.current = null
    portRef.current = null
    setConnectionStatus("disconnected")
          toast({ title: "Sistema Cuántico desconectado" })
  }, [toast])

  useEffect(() => {
    return () => {
      void desconectar()
    }
  }, [desconectar])

  const ctx: Ctx = {
    connected,
    connectionStatus,
    isSerialAvailable,
    lastCommand,
    conectarArduino: conectarESP32,
    iniciarTerapia,
    cambiarIntensidad,
    detenerTerapia,
    completarTerapia,
    enviarComando,
    autoConnect,
    setAutoConnect,
  }

  return <ArduinoCtx.Provider value={ctx}>{children}</ArduinoCtx.Provider>
}
