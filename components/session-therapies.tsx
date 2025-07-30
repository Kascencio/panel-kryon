"use client"

import { useState } from "react"
import { Play, Settings, Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

/* ────────── Tipos ────────── */
export interface Therapy {
  id: string
  name: string
  description: string
  /**
   * Identificador de frecuencia / modo que coincide con audios y comandos
   * Accepted: general | intermitente | pausado | cascada | rojo | verde | azul | oceano (vídeo)
   */
  frequency:
    | "general"
    | "intermitente"
    | "pausado"
    | "cascada"
    | "rojo"
    | "verde"
    | "azul"
    | "oceano"
  color: string
  icon: string
  category: string
  /** true → intentará cargar /videos/<frequency>-<dur>.mp4 */
  hasVideo?: boolean

  /* personalización */
  customizable?: boolean
  lightMode?: string
  initialIntensity?: number
  sessionDuration?: "corto" | "mediano" | "largo"
}

interface Props {
  onTherapySelect(t: Therapy): void
  onStartTherapy(t: Therapy, d: "corto" | "mediano" | "largo"): void
  selectedTherapy: Therapy | null
  /**
   * NOTA: opcional para que pantallas antiguas no rompan.
   * Se invoca en Quick‑Start y al aplicar una personalización.
   */
  onLightIntensityChange?: (n: number) => void
}

/* ────────── Catálogo ────────── */
export const sessionTherapies: Therapy[] = [
  {
    id: "estres",
    name: "Estrés",
    description: "Reducción de estrés",
    frequency: "general",
    color: "#14b8a6",
    icon: "💆",
    category: "session",
    customizable: false,
    sessionDuration: "corto",
  },
  {
    id: "estres-custom",
    name: "Estrés – Personalizado",
    description: "Versión avanzada",
    frequency: "general",
    color: "#0d9488",
    icon: "🎚️",
    category: "session",
    customizable: true,
  },
  {
    id: "autismo",
    name: "Autismo",
    description: "Apoyo neurosensorial",
    frequency: "pausado",
    color: "#818cf8",
    icon: "🧩",
    category: "session",
    customizable: true,
  },
  {
    id: "down",
    name: "Down",
    description: "Ayuda cognitiva",
    frequency: "cascada",
    color: "#fbbf24",
    icon: "🌼",
    category: "session",
    customizable: true,
  },
  {
    id: "duelo",
    name: "Duelo",
    description: "Apoyo emocional",
    frequency: "rojo",
    color: "#ef4444",
    icon: "🕯️",
    category: "session",
    customizable: true,
  },
  {
    id: "alcoholismo",
    name: "Alcoholismo",
    description: "Control de adicciones",
    frequency: "verde",
    color: "#22c55e",
    icon: "🍺",
    category: "session",
    customizable: true,
  },
  {
    id: "ansiedad",
    name: "Ansiedad",
    description: "Relajación profunda",
    frequency: "azul",
    color: "#3b82f6",
    icon: "💙",
    category: "session",
    customizable: true,
  },
  /* Vídeo */
  {
    id: "oceano-video",
    name: "Olas Oceánicas",
    description: "Video de olas relajantes",
    frequency: "oceano",
    color: "#0ea5e9",
    icon: "🌊",
    category: "session",
    hasVideo: true,
    customizable: false,
    sessionDuration: "corto",
  },
]

/* ────────── Modos de luz ────────── */
const modes = [
  { id: "general",      name: "Patrón Complejo", icon: "🔄", color: "#06b6d4", description: "11 patrones variables" },
  { id: "intermitente", name: "Intermitente",    icon: "⚡",  color: "#f59e0b", description: "Cambio rápido 500 ms" },
  { id: "pausado",      name: "Pausado",         icon: "⏸️", color: "#8b5cf6", description: "Cambio 1.5 s" },
  { id: "cascada",      name: "Cascada",         icon: "🌊",  color: "#10b981", description: "Efecto cascada" },
  { id: "rojo",         name: "Solo Rojo",       icon: "🔴", color: "#ef4444", description: "Rojo sólido" },
  { id: "verde",        name: "Solo Verde",      icon: "🟢", color: "#22c55e", description: "Verde sólido" },
  { id: "azul",         name: "Solo Azul",       icon: "🔵", color: "#3b82f6", description: "Azul sólido" },
]

/* ══════════ Componente ══════════ */
export default function SessionTherapies({
  onTherapySelect,
  onStartTherapy,
  selectedTherapy,
  onLightIntensityChange,
}: Props) {
  const [dlg, setDlg] = useState<{ open: boolean; therapy: Therapy | null }>({
    open: false,
    therapy: null,
  })
  const [modeId, setModeId]       = useState(modes[0].id)
  const [intensity, setIntensity] = useState(80)
  const [dur, setDur]             = useState<"corto" | "mediano" | "largo">("corto")

  const openDlg = (t: Therapy) => {
    setDlg({ open: true, therapy: t })
    setModeId(t.lightMode ?? t.frequency)
    setIntensity(t.initialIntensity ?? 80)
    setDur(t.sessionDuration ?? "corto")
  }

  /* Guardar + iniciar */
  const saveAndStart = () => {
    if (!dlg.therapy) return
    const m = modes.find((x) => x.id === modeId)!

    const updated: Therapy = {
      ...dlg.therapy,
      lightMode: m.id,
      color: m.color,
      icon: m.icon,
      description: m.description,
      initialIntensity: intensity,
      sessionDuration: dur,
      customizable: true,
    }

    onTherapySelect(updated)
    onLightIntensityChange?.(intensity)
    setDlg({ open: false, therapy: null })
    onStartTherapy(updated, dur)
  }

  const mergeWithSelected = (t: Therapy) =>
    selectedTherapy?.id === t.id ? selectedTherapy : t

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {sessionTherapies.map((t) => {
        const C = mergeWithSelected(t)
        const selected = selectedTherapy?.id === C.id
        const quickDur = C.sessionDuration ?? "corto"
        const quickIntensity = C.initialIntensity ?? 80

        return (
          <Card
            key={C.id}
            onClick={() => onTherapySelect(C)}
            className={`bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-all ${
              selected ? "ring-2 ring-cyan-500 border-cyan-500" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white"
                  style={{ backgroundColor: C.color }}
                >
                  {C.icon}
                </div>
                <h3 className="text-white font-semibold">{C.name}</h3>

                <Badge
                  className="text-xs"
                  style={{
                    backgroundColor: `${C.color}20`,
                    color: C.color,
                    border: `1px solid ${C.color}40`,
                  }}
                >
                  {C.lightMode ?? C.frequency}
                </Badge>
                {C.hasVideo && (
                  <Badge className="bg-red-900/40 text-red-400 border-red-600/30 text-[10px] mt-1">
                    VIDEO
                  </Badge>
                )}

                <div className="flex gap-2 w-full">
                  {/* Quick‑start */}
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      onLightIntensityChange?.(quickIntensity)
                      onStartTherapy(C, quickDur)
                    }}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Iniciar
                  </Button>

                  {C.customizable && (
                    <Dialog
                      open={dlg.open && dlg.therapy?.id === C.id}
                      onOpenChange={(o) => !o && setDlg({ open: false, therapy: null })}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDlg(C)
                          }}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Personalizar
                        </Button>
                      </DialogTrigger>

                      {/* Diálogo */}
                      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
                        <DialogHeader>
                          <DialogTitle>Personalizar {C.name}</DialogTitle>
                        </DialogHeader>

                        <Label className="text-sm font-medium">Modo de Iluminación</Label>
                        <Select value={modeId} onValueChange={setModeId}>
                          <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-sm mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {modes.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                <div className="flex items-center gap-2">
                                  <span>{m.icon}</span>
                                  <div>
                                    <div className="font-medium">{m.name}</div>
                                    <div className="text-xs text-gray-400">{m.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Intensidad */}
                        <Label className="text-sm font-medium mt-4 inline-block">Intensidad inicial</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between text-sm text-gray-300">
                            <span className="flex items-center">
                              <Lightbulb className="h-4 w-4 mr-2" /> Intensidad
                            </span>
                            <span className="text-white font-medium">{intensity}%</span>
                          </div>
                          <Slider value={[intensity]} min={0} max={100} step={5} onValueChange={(v) => setIntensity(v[0])} />
                        </div>

                        {/* Duración */}
                        <Label className="text-sm font-medium mt-4 inline-block">Duración</Label>
                        <Select value={dur} onValueChange={(v) => setDur(v as any)}>
                          <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-sm mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="corto">Corto (4 min)</SelectItem>
                            <SelectItem value="mediano">Mediano (15 min)</SelectItem>
                            <SelectItem value="largo">Largo (20 min)</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Resumen */}
                        <div className="mt-4 p-3 rounded bg-gray-700/50 border border-gray-600 text-xs space-y-1">
                          <span className="font-medium">{modes.find((m) => m.id === modeId)?.name}</span>
                          <p className="text-gray-400">{modes.find((m) => m.id === modeId)?.description}</p>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            variant="outline"
                            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                            onClick={() => setDlg({ open: false, therapy: null })}
                          >
                            Cancelar
                          </Button>
                          <Button className="bg-orange-600 text-white" onClick={saveAndStart}>
                            Aplicar <Play className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
