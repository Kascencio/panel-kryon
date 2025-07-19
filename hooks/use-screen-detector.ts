import { useCallback, useEffect, useRef, useState } from "react"

/* --------------------------------------------------
 * Tipos
 * -------------------------------------------------*/
export interface ScreenInfo {
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

export type DetectionStatus = "idle" | "detecting" | "success" | "error"

/* --------------------------------------------------
 * Hook principal
 * -------------------------------------------------*/
export function useScreenDetector() {
  /** Última lista de pantallas detectadas */
  const [screens, setScreens] = useState<ScreenInfo[]>([])
  /** ¿Tiene el permiso `window-management`? */
  const [permissionGranted, setPermissionGranted] = useState(false)
  /** Estado del último intento de detección */
  const [status, setStatus] = useState<DetectionStatus>("idle")

  /** ---------- Detectar pantallas ---------------*/
  const detectScreens = useCallback(async (): Promise<ScreenInfo[]> => {
    setStatus("detecting")

    try {
      // 1) Screen Management API (Chrome ≥ 111 con flag / Edge Canary…)
      if ("getScreenDetails" in window) {
        // @ts-ignore – todavía experimental
        const screenDetails: any = await (window as any).getScreenDetails()

        const mapped: ScreenInfo[] = screenDetails.screens.map((scr: any, idx: number) => ({
          id: `screen-${idx}`,
          name: scr.label || `Pantalla ${idx + 1}`,
          width: scr.width,
          height: scr.height,
          left: scr.left,
          top: scr.top,
          isPrimary: scr.isPrimary,
          availWidth: scr.availWidth,
          availHeight: scr.availHeight,
        }))

        setScreens(mapped)
        setPermissionGranted(true)
        setStatus("success")
        return mapped
      }

      // 2) Fallback heurístico (si no hay API nativa)
      const fallback = await fallbackDetect()
      setScreens(fallback)
      setStatus(fallback.length > 1 ? "success" : "error")
      return fallback
    } catch (err) {
      console.warn("useScreenDetector: error detectando pantallas", err)
      setStatus("error")
      return []
    }
  }, [])

  /** ---------- Fallback simple ---------------*/
  const fallbackDetect = useCallback(async (): Promise<ScreenInfo[]> => {
    const primary: ScreenInfo = {
      id: "primary",
      name: "Pantalla Principal",
      width: window.screen.width,
      height: window.screen.height,
      left: 0,
      top: 0,
      isPrimary: true,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
    }

    const list: ScreenInfo[] = [primary]

    // Intentar abrir una ventanita fantasma para detectar segundo monitor
    try {
      const test = window.open("", "_blank", "width=100,height=100,left=9999,top=9999")
      if (test) {
        await new Promise((res) => setTimeout(res, 120))
        const actualLeft = test.screenLeft ?? test.screenX ?? 0
        const actualTop = test.screenTop ?? test.screenY ?? 0
        test.close()

        if (actualLeft !== 9999 || actualTop !== 9999) {
          list.push({
            id: "secondary",
            name: "Pantalla Secundaria (heurística)",
            width: window.screen.width,
            height: window.screen.height,
            left: actualLeft,
            top: actualTop,
            isPrimary: false,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
          })
        }
      }
    } catch (err) {
      /* mute */
    }

    return list
  }, [])

  /** ---------- Solicitar permiso explícito ---------------*/
  const requestPermission = useCallback(async () => {
    if ("permissions" in navigator) {
      try {
        // @ts-ignore – prop experimental
        const permStatus = await navigator.permissions.query({ name: "window-management" as any })
        if (permStatus.state === "granted") {
          setPermissionGranted(true)
        }
        // No hacemos nada si es denied; detectScreens() hará fallback
      } catch (err) {
        console.warn("useScreenDetector: no se pudo consultar permisos", err)
      }
    }
    // Siempre intentamos detectar
    await detectScreens()
  }, [detectScreens])

  /** ---------- Auto‑detección al montar ---------------*/
  useEffect(() => {
    requestPermission()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    screens,
    status,
    permissionGranted,
    detectScreens,
    requestPermission,
  }
}
