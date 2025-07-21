"use client"

import { useState } from "react"
import {
  Play,
  Settings,
  Lightbulb,
} from "lucide-react"

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

export interface Therapy {
  id: string
  name: string
  description: string
  frequency: string
  color: string
  icon: string
  category: string
  hasVideo?: boolean
  customMode?: string       // marca modo custom
  initialIntensity?: number // intensidad inicial seleccionada
}

interface Props {
  onTherapySelect: (therapy: Therapy) => void
  selectedTherapy: Therapy | null
}

export const sessionTherapies: Therapy[] = [
  { id: "general", name: "General", description: "Terapia general", frequency: "general", color: "#06b6d4", icon: "🔄", category: "session" },
  { id: "cascada", name: "Cascada", description: "Patrón cascada", frequency: "cascada", color: "#3b82f6", icon: "💧", category: "session" },
  { id: "pausado", name: "Pausado", description: "Patrón pausado", frequency: "pausado", color: "#8b5cf6", icon: "⏸️", category: "session" },
  { id: "intermitente", name: "Intermitente", description: "Patrón rápido", frequency: "intermitente", color: "#f59e0b", icon: "⚡", category: "session" },
  { id: "oceano-video", name: "Olas Oceánicas", description: "Video de olas", frequency: "video_oceano", color: "#0ea5e9", icon: "🌊", category: "session", hasVideo: true },
]

const availableModes = [
  { id: "general", name: "Patrón Complejo", description: "11 patrones variables", icon: "🔄", color: "#06b6d4" },
  { id: "intermitente", name: "Intermitente", description: "Cambio 500 ms", icon: "⚡", color: "#f59e0b" },
  { id: "pausado", name: "Pausado", description: "Cambio 1.5 s", icon: "⏸️", color: "#8b5cf6" },
  { id: "cascada", name: "Cascada", description: "Efecto cascada", icon: "🌊", color: "#10b981" },
  { id: "red", name: "Solo Rojo", description: "Rojo sólido", icon: "🔴", color: "#ef4444" },
  { id: "green", name: "Solo Verde", description: "Verde sólido", icon: "🟢", color: "#22c55e" },
  { id: "blue", name: "Solo Azul", description: "Azul sólido", icon: "🔵", color: "#3b82f6" },
]

export default function SessionTherapies({ onTherapySelect, selectedTherapy }: Props) {
  const [dialog, setDialog] = useState<{ open: boolean; therapy: Therapy | null }>({ open: false, therapy: null })
  const [selectedMode, setSelectedMode] = useState<string>("")
  const [selectedIntensity, setSelectedIntensity] = useState<number>(80)

  const openCustomize = (therapy: Therapy) => {
    setDialog({ open: true, therapy })
    setSelectedMode(therapy.frequency)
    setSelectedIntensity(therapy.initialIntensity ?? 80)
  }

  const saveCustomization = () => {
    if (!dialog.therapy) return
    const mode = availableModes.find(m => m.id === selectedMode)
    if (!mode) return

    onTherapySelect({
      ...dialog.therapy,
      frequency: mode.id,
      color: mode.color,
      icon: mode.icon,
      description: mode.description,
      customMode: mode.id,
      initialIntensity: selectedIntensity,
    })
    setDialog({ open: false, therapy: null })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {sessionTherapies.map(t => (
        <Card
          key={t.id}
          onClick={() => onTherapySelect({ ...t, initialIntensity: t.initialIntensity ?? 80 })}
          className={`bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-all $
            selectedTherapy?.id === t.id ? "ring-2 ring-cyan-500 border-cyan-500" : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white" style={{ backgroundColor: t.color }}>
                {t.icon}
              </div>
              <h3 className="text-white font-semibold">{t.name}</h3>
              <div className="flex items-center gap-1">
                <Badge className="text-xs" style={{ backgroundColor: `${t.color}20`, color: t.color, border: `1px solid ${t.color}40` }}>
                  {t.frequency}
                </Badge>
                {t.hasVideo && (
                  <Badge className="bg-red-900/40 text-red-400 border-red-600/30 text-[10px]">
                    VIDEO
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                  onClick={e => { e.stopPropagation(); onTherapySelect({ ...t, initialIntensity: t.initialIntensity ?? 80 }) }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Iniciar
                </Button>
                {!t.hasVideo && (
                  <Dialog open={dialog.open && dialog.therapy?.id === t.id} onOpenChange={open => !open && setDialog({ open: false, therapy: null })}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => { e.stopPropagation(); openCustomize(t) }}
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Personalizar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
                      <DialogHeader>
                        <DialogTitle>Personalizar {t.name}</DialogTitle>
                      </DialogHeader>
                      <Label className="text-sm font-medium">Modo de Iluminación</Label>
                      <Select value={selectedMode} onValueChange={setSelectedMode}>
                        <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white text-sm mt-2">
                          <SelectValue placeholder="Selecciona un modo" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600 text-white">
                          {availableModes.map(m => (
                            <SelectItem key={m.id} value={m.id} className="focus:bg-gray-600">
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
                      <Label className="text-sm font-medium mt-4 inline-block">Intensidad Inicial</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm text-gray-300">
                          <span className="flex items-center"><Lightbulb className="h-4 w-4 mr-2"/>Intensidad</span>
                          <span className="text-white font-medium">{selectedIntensity}%</span>
                        </div>
                        <Slider
                          value={[selectedIntensity]}
                          min={10}
                          max={100}
                          step={5}
                          onValueChange={v => setSelectedIntensity(v[0])}
                        />
                      </div>
                      {selectedMode && (
                        <div className="mt-4 p-3 rounded bg-gray-700/50 border border-gray-600 space-y-1 text-xs">
                          <span className="font-medium">{availableModes.find(m => m.id === selectedMode)?.name}</span>
                          <p className="text-gray-400">{availableModes.find(m => m.id === selectedMode)?.description}</p>
                        </div>
                      )}
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDialog({ open: false, therapy: null })} className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
                          Cancelar
                        </Button>
                        <Button onClick={saveCustomization} disabled={!selectedMode} className="bg-orange-600 text-white">
                          Aplicar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
