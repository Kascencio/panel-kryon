"use client"

import { useState, useEffect } from "react"
import {
  Usb,
  Layout,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 *  Modal de permisos iniciales.
 *  • Solicita Web-Serial obligatoriamente.
 *  • El permiso `window-management` se intenta —pero si el
 *    navegador no lo soporta o el usuario lo rechaza, deja continuar.
 */
interface Props {
  open: boolean
  onDone(): void          // se ejecuta al continuar / omitir
}

export default function PermissionsModal({ open, onDone }: Props) {
  /* ------- estado de cada permiso ------- */
  const [serialGranted, setSerialGranted]   = useState(false)
  const [winGranted,    setWinGranted]      = useState<true | "unsupported" | false>(false)
  const [errorMsg,      setErrorMsg]        = useState<string | null>(null)

  /* ------- Web-Serial ------- */
  const requestSerial = async () => {
    try {
      if (!("serial" in navigator))
        throw new Error("Tu navegador no soporta Web-Serial.")
      await navigator.serial.requestPort()
      setSerialGranted(true)
      setErrorMsg(null)
    } catch (err: any) {
      setErrorMsg(err?.message || "Permiso serial denegado.")
    }
  }

  /* ------- Window-Management ------- */
  const requestWindow = async () => {
    try {
      // API experimental: si no existe -> se marca como unsupported
      // @ts-ignore
      if (!(navigator.permissions && navigator.permissions.request)) {
        setWinGranted("unsupported")
        return
      }
      // @ts-ignore
      const res = await navigator.permissions.request({ name: "window-management" })
      if (res.state === "granted") setWinGranted(true)
      else setErrorMsg("Permiso de ventanas denegado.")
    } catch {
      setWinGranted("unsupported")
    }
  }

  /* Si API no existe, marcar automáticamente */
  useEffect(() => {
    // @ts-ignore
    if (!(navigator.permissions && navigator.permissions.query)) {
      setWinGranted("unsupported")
    }
  }, [])

  /* ------- continuar / omitir ------- */
  const canContinue =
    serialGranted && (winGranted === true || winGranted === "unsupported")

  return (
    <Dialog open={open}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Permisos Iniciales</DialogTitle>
          <DialogDescription className="text-gray-400">
            Necesitamos uno o dos permisos del navegador para funcionar mejor.
          </DialogDescription>
        </DialogHeader>

        {/* Serial */}
        <div className="flex items-center justify-between p-3 bg-gray-700/40 rounded">
          <div className="flex items-center gap-3">
            <Usb className="h-6 w-6 text-cyan-400" />
            Conexión&nbsp;USB-Serial
          </div>
          {serialGranted ? (
            <CheckCircle className="h-6 w-6 text-green-400" />
          ) : (
            <Button size="sm" onClick={requestSerial}>
              Permitir
            </Button>
          )}
        </div>

        {/* Window management (opcional) */}
        <div className="flex items-center justify-between p-3 bg-gray-700/40 rounded">
          <div className="flex items-center gap-3">
            <Layout className="h-6 w-6 text-cyan-400" />
            Manejo&nbsp;de&nbsp;ventanas&nbsp;
            <span className="text-xs text-gray-400">
              {winGranted === "unsupported" && "(no soportado)"}
            </span>
          </div>
          {winGranted === true || winGranted === "unsupported" ? (
            <CheckCircle className="h-6 w-6 text-green-400" />
          ) : (
            <Button size="sm" onClick={requestWindow}>
              Permitir
            </Button>
          )}
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="flex items-center text-red-400 text-sm mt-2">
            <AlertCircle className="h-4 w-4 mr-1" /> {errorMsg}
          </div>
        )}

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button
            variant="outline"
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            onClick={onDone}                 // omitir
          >
            <X className="h-4 w-4 mr-1" /> Omitir
          </Button>
          <Button
            disabled={!canContinue}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50"
            onClick={onDone}
          >
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
