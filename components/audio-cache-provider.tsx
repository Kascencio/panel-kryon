"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

interface AudioCacheItem {
  blob: Blob
  url: string
  duration: number
  loadedAt: number
}

interface AudioCacheContextType {
  // Estado de precarga
  isPreloading: boolean
  preloadProgress: number
  totalFiles: number
  loadedFiles: number
  hasError: boolean

  // Métodos de cache
  getAudioBlob: (src: string) => Blob | null
  getAudioUrl: (src: string) => string | null
  getAudioDuration: (src: string) => number
  isAudioReady: (src: string) => boolean

  // Control de precarga
  preloadAudio: () => Promise<void>
  clearCache: () => void
}

const AudioCacheContext = createContext<AudioCacheContextType | undefined>(undefined)

// Lista de archivos de audio a precargar - incluyendo MP3 y FLAC
const AUDIO_FILES = [
  // Archivos MP3 principales
  "/audio/general-4min.mp3",
  "/audio/general-15min.mp3",
  "/audio/general-20min.mp3",
  "/audio/cascada-4min.mp3",
  "/audio/cascada-15min.mp3",
  "/audio/cascada-20min.mp3",
  "/audio/pausado-4min.mp3",
  "/audio/pausado-15min.mp3",
  "/audio/pausado-20min.mp3",
  "/audio/intermitente-4min.mp3",
  "/audio/intermitente-15min.mp3",
  "/audio/intermitente-20min.mp3",
  "/audio/relax-4min.mp3",
  "/audio/relax-15min.mp3",
  "/audio/relax-20min.mp3",
  "/audio/energy-4min.mp3",
  "/audio/energy-15min.mp3",
  "/audio/energy-20min.mp3",
  "/audio/balance-4min.mp3",
  "/audio/balance-15min.mp3",
  "/audio/balance-20min.mp3",

  // Archivos FLAC de alta calidad
  "/audio/flac/general-4min.flac",
  "/audio/flac/general-15min.flac",
  "/audio/flac/general-20min.flac",
  "/audio/flac/cascada-4min.flac",
  "/audio/flac/cascada-15min.flac",
  "/audio/flac/cascada-20min.flac",
  "/audio/flac/pausado-4min.flac",
  "/audio/flac/pausado-15min.flac",
  "/audio/flac/pausado-20min.flac",
  "/audio/flac/intermitente-4min.flac",
  "/audio/flac/intermitente-15min.flac",
  "/audio/flac/intermitente-20min.flac",
  "/audio/flac/red-4min.flac",
  "/audio/flac/red-15min.flac",
  "/audio/flac/red-20min.flac",
  "/audio/flac/green-4min.flac",
  "/audio/flac/green-15min.flac",
  "/audio/flac/green-20min.flac",
  "/audio/flac/blue-4min.flac",
  "/audio/flac/blue-15min.flac",
  "/audio/flac/blue-20min.flac",
]

export function AudioCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Map<string, AudioCacheItem>>(new Map())
  const [isPreloading, setIsPreloading] = useState(false)
  const [preloadProgress, setPreloadProgress] = useState(0)
  const [loadedFiles, setLoadedFiles] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [hasStartedPreload, setHasStartedPreload] = useState(false)

  const totalFiles = AUDIO_FILES.length

  // Función para obtener duración de audio usando AudioContext
  const getAudioDurationFromBlob = useCallback(async (blob: Blob): Promise<number> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      audioContext.close()
      return audioBuffer.duration
    } catch (error) {
      console.warn("Error obteniendo duración de audio:", error)
      return 0
    }
  }, [])

  // Función para precargar un archivo individual
  const preloadSingleFile = useCallback(
    async (src: string): Promise<boolean> => {
      try {
        console.log(`🎵 Precargando: ${src}`)

        const response = await fetch(src)
        if (!response.ok) {
          console.warn(`❌ No se pudo cargar: ${src} (${response.status})`)
          return false
        }

        const blob = await response.blob()
        const duration = await getAudioDurationFromBlob(blob)
        const url = URL.createObjectURL(blob)

        const cacheItem: AudioCacheItem = {
          blob,
          url,
          duration,
          loadedAt: Date.now(),
        }

        setCache((prev) => { const m = new Map(prev); m.set(src, cacheItem); return m })
        console.log(`✅ Precargado: ${src} (${Math.floor(duration)}s)`)
        return true
      } catch (error) {
        console.error(`❌ Error precargando ${src}:`, error)
        return false
      }
    },
    [getAudioDurationFromBlob],
  )

  // Función principal de precarga
  const preloadAudio = useCallback(async () => {
    if (isPreloading || hasStartedPreload) {
      console.log("⚠️ Precarga ya en progreso o completada")
      return
    }

    console.log("🚀 Iniciando precarga de audio...")
    setIsPreloading(true)
    setHasStartedPreload(true)
    setPreloadProgress(0)
    setLoadedFiles(0)
    setHasError(false)

    let loaded = 0
    let errors = 0

    // Función para procesar archivos en lotes
    const processBatch = async (files: string[], batchSize = 2) => {
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize)

        // Procesar lote en paralelo
        const results = await Promise.allSettled(batch.map(file => preloadSingleFile(file)))

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) loaded++
          else errors++
          setLoadedFiles(loaded)
          setPreloadProgress(((loaded + errors) / totalFiles) * 100)
        })

        if (i + batchSize < files.length) await new Promise(res => setTimeout(res, 200))
      }
    }

    try {
      await processBatch(AUDIO_FILES)
      if (errors > 0) {
        setHasError(true)
        console.warn(`⚠️ Precarga completada con ${errors} errores de ${totalFiles} archivos`)
      } else {
        console.log(`🎉 Precarga completada exitosamente: ${loaded}/${totalFiles} archivos`)
      }
    } catch (error) {
      console.error("❌ Error general en precarga:", error)
      setHasError(true)
    } finally {
      setIsPreloading(false)
      console.log(`🏁 Precarga finalizada. Cache: ${cache.size} archivos`)
    }
  }, [isPreloading, hasStartedPreload, preloadSingleFile, totalFiles, cache.size])

  // Iniciar precarga automáticamente al montar
  useEffect(() => {
    if (!hasStartedPreload) {
      const timer = setTimeout(preloadAudio, 1000)
      return () => clearTimeout(timer)
    }
  }, [hasStartedPreload, preloadAudio])

  // Métodos del contexto
  const getAudioBlob = useCallback((src: string) => cache.get(src)?.blob || null, [cache])
  const getAudioUrl = useCallback((src: string) => cache.get(src)?.url || null, [cache])
  const getAudioDuration = useCallback((src: string) => cache.get(src)?.duration || 0, [cache])
  const isAudioReady = useCallback((src: string) => cache.has(src), [cache])

  const clearCache = useCallback(() => {
    cache.forEach(item => URL.revokeObjectURL(item.url))
    setCache(new Map())
    setPreloadProgress(0)
    setLoadedFiles(0)
    setHasStartedPreload(false)
    setHasError(false)
    console.log("🧹 Cache de audio limpiado")
  }, [cache])

  // Cleanup al desmontar
  useEffect(() => () => {
    cache.forEach(item => URL.revokeObjectURL(item.url))
  }, [cache])

  const value = {
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

  return <AudioCacheContext.Provider value={value}>{children}</AudioCacheContext.Provider>
}

export function useAudioCache() {
  const context = useContext(AudioCacheContext)
  if (!context) throw new Error("useAudioCache debe ser usado dentro de un AudioCacheProvider")
  return context
}
