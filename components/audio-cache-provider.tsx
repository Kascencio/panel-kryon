"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

/* ────────── interfaces ────────── */
interface AudioCacheItem {
  blob: Blob
  url: string
  duration: number
  loadedAt: number
}

interface AudioCacheContextType {
  /* Estado general */
  isPreloading: boolean
  preloadProgress: number
  totalFiles: number
  loadedFiles: number
  hasError: boolean

  /* Query helpers */
  getAudioBlob(src: string): Blob | null
  getAudioUrl(src: string): string | null
  getAudioDuration(src: string): number
  isAudioReady(src: string): boolean

  /* Control */
  preloadAudio(): Promise<void>
  clearCache(): void
}

/* ────────── contexto ────────── */
const AudioCacheContext = createContext<AudioCacheContextType | undefined>(
  undefined,
)

/*
 * ================================================================
 *   Audios
 *   --------------------------------------------------------------
 *   La lista se genera dinámicamente a partir de los identificadores
 *   de terapia / patrón y de las duraciones disponibles.
 * ================================================================
 */
const BASE_FREQUENCIES = [
  /* patrones LED bases */
  "general",
  "cascada",
  "pausado",
  "intermitente",
  /* nuevas terapias 2025
  "estres",
  "autismo",
  "down",
  "duelo",
  "alcohol", // mismo id que “alcoholismo” → frecuencia "alcohol"
  */
  /* wellness extras */
  "relax",
  "energy",
  "balance",
  /* colores sólidos */
  "red",
  "green",
  "blue",
] as const

const DURATIONS = ["4min", "15min", "20min"] as const

/*
 * Construimos la lista una sola vez al arrancar.
 * Para cada <freq>-<dur>.mp3 y su versión .flac.
 */
const AUDIO_FILES: string[] = (() => {
  const out: string[] = []
  for (const freq of BASE_FREQUENCIES) {
    for (const dur of DURATIONS) {
      out.push(`/audio/${freq}-${dur}.mp3`)
      out.push(`/audio/flac/${freq}-${dur}.flac`)
    }
  }
  return out
})()

/* ─────────────────────────────────────────────────────────────── */
export function AudioCacheProvider({ children }: { children: ReactNode }) {
  /* ------- estado interno ------- */
  const [cache, setCache] = useState<Map<string, AudioCacheItem>>(new Map())
  const [isPreloading, setIsPreloading] = useState(false)
  const [preloadProgress, setPreloadProgress] = useState(0)
  const [loadedFiles, setLoadedFiles] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const totalFiles = AUDIO_FILES.length

  /* ------- util: calcular duración ------- */
  const getDurationFromBlob = useCallback(async (b: Blob): Promise<number> => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const buf = await b.arrayBuffer()
      const audioBuf = await ctx.decodeAudioData(buf)
      ctx.close()
      return audioBuf.duration
    } catch (e) {
      console.warn("AudioCache – error duration", e)
      return 0
    }
  }, [])

  /* ------- carga 1 archivo ------- */
  const preloadOne = useCallback(
    async (src: string): Promise<boolean> => {
      try {
        const res = await fetch(src)
        if (!res.ok) return false
        const blob = await res.blob()
        const duration = await getDurationFromBlob(blob)
        const url = URL.createObjectURL(blob)
        setCache((m) => {
          const n = new Map(m)
          n.set(src, { blob, url, duration, loadedAt: Date.now() })
          return n
        })
        return true
      } catch (e) {
        console.error("AudioCache – fetch fail", src, e)
        return false
      }
    },
    [getDurationFromBlob],
  )

  /* ------- carga masiva ------- */
  const preloadAudio = useCallback(async () => {
    if (isPreloading || hasStarted) return
    setIsPreloading(true)
    setHasStarted(true)
    setLoadedFiles(0)
    setPreloadProgress(0)
    setHasError(false)

    let ok = 0
    let fail = 0

    const BATCH = 2
    for (let i = 0; i < AUDIO_FILES.length; i += BATCH) {
      const slice = AUDIO_FILES.slice(i, i + BATCH)
      const res = await Promise.all(slice.map((s) => preloadOne(s)))
      res.forEach((r) => (r ? ok++ : fail++))
      setLoadedFiles(ok)
      setPreloadProgress(((ok + fail) / totalFiles) * 100)
      if (fail && fail % 5 === 0) await new Promise((r) => setTimeout(r, 300))
    }

    setHasError(fail > 0)
    setIsPreloading(false)
    console.log(
      `AudioCache – done (${ok}/${totalFiles} ok${fail ? ", " + fail + " fails" : ""})`,
    )
  }, [isPreloading, hasStarted, preloadOne, totalFiles])

  /* auto‑start 1 s después de montar */
  useEffect(() => {
    if (!hasStarted) {
      const t = setTimeout(preloadAudio, 1_000)
      return () => clearTimeout(t)
    }
  }, [hasStarted, preloadAudio])

  /* ------- helpers ------- */
  const getAudioBlob = useCallback((s: string) => cache.get(s)?.blob ?? null, [cache])
  const getAudioUrl = useCallback((s: string) => cache.get(s)?.url ?? null, [cache])
  const getAudioDuration = useCallback((s: string) => cache.get(s)?.duration ?? 0, [cache])
  const isAudioReady = useCallback((s: string) => cache.has(s), [cache])

  const clearCache = useCallback(() => {
    cache.forEach((c) => URL.revokeObjectURL(c.url))
    setCache(new Map())
    setPreloadProgress(0)
    setLoadedFiles(0)
    setHasStarted(false)
    setHasError(false)
  }, [cache])

  /* ------- out ------- */
  const ctx: AudioCacheContextType = {
    isPreloading,
    preloadProgress,
    totalFiles,
    loadedFiles,
    hasError,
    getAudioBlob,
    getAudioUrl,
    getAudioDuration,
    isAudioReady,
    preloadAudio,
    clearCache,
  }

  return <AudioCacheContext.Provider value={ctx}>{children}</AudioCacheContext.Provider>
}

export function useAudioCache() {
  const c = useContext(AudioCacheContext)
  if (!c) throw new Error("useAudioCache debe usarse dentro de AudioCacheProvider")
  return c
}
