// src/hooks/useMicrophone.ts
"use client"
import { useEffect, useRef, useState } from "react"

/**
 * Activa un stream de micrófono mientras `enabled` sea true.
 * Devuelve { ready, stream } para que la UI sepa si realmente está encendido.
 */
export function useMicrophone(enabled: boolean) {
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    const manage = async () => {
      try {
        if (enabled && !streamRef.current) {
          /* Solicita acceso al mic */
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          if (!mounted) return
          streamRef.current = stream
          setReady(true)
        } else if (!enabled && streamRef.current) {
          /* Apaga y libera pistas */
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
          setReady(false)
        }
      } catch (err) {
        console.error("Micrófono:", err)
        setReady(false)
      }
    }

    manage()
    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [enabled])

  return { ready, stream: streamRef.current }
}
