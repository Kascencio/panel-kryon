"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

export interface CustomTherapy {
  id: string
  name: string
  description: string
  color: string
  icon: string
  category: "custom"
  frequency: string
  hasVideo: boolean
  hasAudio: boolean
  audioFiles: {
    [duration: string]: string
  }
  videoFiles: {
    [duration: string]: string
  }
  createdAt: string
  updatedAt: string
}

interface CustomTherapyContextType {
  customTherapies: CustomTherapy[]
  addTherapy: (therapy: Omit<CustomTherapy, "id" | "createdAt" | "updatedAt">) => void
  updateTherapy: (id: string, therapy: Partial<CustomTherapy>) => void
  deleteTherapy: (id: string) => void
  exportTherapies: () => void
  importTherapies: (file: File) => Promise<void>
  clearAllTherapies: () => void
  isLoaded: boolean
  createAudioElement: (therapyId: string, duration: string) => HTMLAudioElement | null
  createVideoElement: (therapyId: string, duration: string) => HTMLVideoElement | null
  getTherapyAudio: (therapyId: string, duration: string) => string | null
  getTherapyVideo: (therapyId: string, duration: string) => string | null
}

const CustomTherapyContext = createContext<CustomTherapyContextType | undefined>(undefined)

const STORAGE_KEY = "cabina-aq-custom-therapies-v2"

export function CustomTherapyProvider({ children }: { children: ReactNode }) {
  const [customTherapies, setCustomTherapies] = useState<CustomTherapy[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const { toast } = useToast()

  // Función para guardar en localStorage de forma segura
  const saveToStorage = (therapies: CustomTherapy[]) => {
    try {
      const dataToSave = JSON.stringify(therapies)
      localStorage.setItem(STORAGE_KEY, dataToSave)
      console.log(`💾 Guardadas ${therapies.length} terapias personalizadas en localStorage`)
      return true
    } catch (error) {
      console.error("Error guardando en localStorage:", error)
      toast({
        title: "Error de guardado",
        description: "No se pudieron guardar las terapias personalizadas. Espacio insuficiente.",
        variant: "destructive",
      })
      return false
    }
  }

  // Función para cargar desde localStorage de forma segura
  const loadFromStorage = (): CustomTherapy[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        console.log("📂 No hay terapias guardadas en localStorage")
        return []
      }

      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) {
        console.warn("⚠️ Datos inválidos en localStorage, limpiando...")
        localStorage.removeItem(STORAGE_KEY)
        return []
      }

      const validTherapies = parsed.filter((therapy: any) => {
        return (
          therapy &&
          typeof therapy === "object" &&
          therapy.id &&
          therapy.name &&
          therapy.category === "custom" &&
          therapy.createdAt &&
          therapy.updatedAt
        )
      })

      console.log(`✅ Cargadas ${validTherapies.length} terapias válidas de ${parsed.length} total`)
      return validTherapies
    } catch (error) {
      console.error("Error cargando desde localStorage:", error)
      localStorage.removeItem(STORAGE_KEY)
      toast({
        title: "Error de carga",
        description: "Los datos guardados estaban corruptos y fueron eliminados",
        variant: "destructive",
      })
      return []
    }
  }

  // Cargar terapias al inicializar
  useEffect(() => {
    const loadedTherapies = loadFromStorage()
    setCustomTherapies(loadedTherapies)
    setIsLoaded(true)
  }, [])

  // Guardar terapias cuando cambien
  useEffect(() => {
    if (!isLoaded) return

    const timeoutId = setTimeout(() => {
      saveToStorage(customTherapies)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [customTherapies, isLoaded])

  const addTherapy = (therapy: Omit<CustomTherapy, "id" | "createdAt" | "updatedAt">) => {
    const newTherapy: CustomTherapy = {
      ...therapy,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setCustomTherapies((prev) => {
      const updated = [...prev, newTherapy]
      console.log(`➕ Agregada terapia: ${newTherapy.name}`)
      return updated
    })

    toast({
      title: "Terapia agregada",
      description: `"${therapy.name}" se ha agregado correctamente`,
      variant: "default",
    })
  }

  const updateTherapy = (id: string, updates: Partial<CustomTherapy>) => {
    setCustomTherapies((prev) => {
      const updated = prev.map((therapy) =>
        therapy.id === id ? { ...therapy, ...updates, updatedAt: new Date().toISOString() } : therapy,
      )
      console.log(`✏️ Actualizada terapia ID: ${id}`)
      return updated
    })

    toast({
      title: "Terapia actualizada",
      description: "Los cambios se han guardado correctamente",
      variant: "default",
    })
  }

  const deleteTherapy = (id: string) => {
    const therapy = customTherapies.find((t) => t.id === id)
    setCustomTherapies((prev) => {
      const updated = prev.filter((therapy) => therapy.id !== id)
      console.log(`🗑️ Eliminada terapia: ${therapy?.name}`)
      return updated
    })

    toast({
      title: "Terapia eliminada",
      description: `"${therapy?.name}" se ha eliminado correctamente`,
      variant: "default",
    })
  }

  const exportTherapies = () => {
    try {
      const exportData = {
        version: "2.0",
        exportDate: new Date().toISOString(),
        therapies: customTherapies,
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `cabina-aq-terapias-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Exportación exitosa",
        description: `${customTherapies.length} terapias exportadas`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error exportando terapias:", error)
      toast({
        title: "Error de exportación",
        description: "No se pudieron exportar las terapias",
        variant: "destructive",
      })
    }
  }

  const importTherapies = async (file: File) => {
    try {
      const text = await file.text()
      const importedData = JSON.parse(text)

      let importedTherapies: CustomTherapy[]
      if (importedData.therapies && Array.isArray(importedData.therapies)) {
        importedTherapies = importedData.therapies
      } else if (Array.isArray(importedData)) {
        importedTherapies = importedData
      } else {
        throw new Error("El archivo no contiene un formato válido de terapias")
      }

      const validTherapies = importedTherapies.filter((therapy) => {
        return therapy && typeof therapy === "object" && therapy.name && therapy.color && therapy.category === "custom"
      })

      if (validTherapies.length === 0) {
        throw new Error("No se encontraron terapias válidas en el archivo")
      }

      const therapiesWithNewIds = validTherapies.map((therapy) => ({
        ...therapy,
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        updatedAt: new Date().toISOString(),
        createdAt: therapy.createdAt || new Date().toISOString(),
      }))

      setCustomTherapies((prev) => {
        const updated = [...prev, ...therapiesWithNewIds]
        console.log(`📥 Importadas ${therapiesWithNewIds.length} terapias`)
        return updated
      })

      toast({
        title: "Importación exitosa",
        description: `${therapiesWithNewIds.length} terapias importadas`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error importando terapias:", error)
      toast({
        title: "Error de importación",
        description: error instanceof Error ? error.message : "No se pudieron importar las terapias",
        variant: "destructive",
      })
    }
  }

  const clearAllTherapies = () => {
    setCustomTherapies([])
    console.log("🧹 Todas las terapias personalizadas eliminadas")

    toast({
      title: "Terapias eliminadas",
      description: "Todas las terapias personalizadas han sido eliminadas",
      variant: "default",
    })
  }

  const createAudioElement = (therapyId: string, duration: string): HTMLAudioElement | null => {
    const therapy = customTherapies.find((t) => t.id === therapyId)
    if (!therapy || !therapy.audioFiles[duration]) {
      return null
    }

    const audio = new Audio()
    audio.src = therapy.audioFiles[duration]
    audio.preload = "metadata"
    return audio
  }

  const createVideoElement = (therapyId: string, duration: string): HTMLVideoElement | null => {
    const therapy = customTherapies.find((t) => t.id === therapyId)
    if (!therapy || !therapy.videoFiles[duration]) {
      return null
    }

    const video = document.createElement("video")
    video.src = therapy.videoFiles[duration]
    video.preload = "metadata"
    return video
  }

  const getTherapyAudio = (therapyId: string, duration: string): string | null => {
    const therapy = customTherapies.find((t) => t.id === therapyId)
    return therapy?.audioFiles[duration] || null
  }

  const getTherapyVideo = (therapyId: string, duration: string): string | null => {
    const therapy = customTherapies.find((t) => t.id === therapyId)
    return therapy?.videoFiles[duration] || null
  }

  return (
    <CustomTherapyContext.Provider
      value={{
        customTherapies,
        addTherapy,
        updateTherapy,
        deleteTherapy,
        exportTherapies,
        importTherapies,
        clearAllTherapies,
        isLoaded,
        createAudioElement,
        createVideoElement,
        getTherapyAudio,
        getTherapyVideo,
      }}
    >
      {children}
    </CustomTherapyContext.Provider>
  )
}

export function useCustomTherapy() {
  const context = useContext(CustomTherapyContext)
  if (context === undefined) {
    throw new Error("useCustomTherapy debe ser usado dentro de un CustomTherapyProvider")
  }
  return context
}
