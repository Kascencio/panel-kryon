"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Play, Settings, Lightbulb } from "lucide-react"

interface Therapy {
  id: string
  name: string
  description: string
  frequency: string
  color: string
  icon: string
  category: string
  hasVideo?: boolean
}

interface ColorTherapiesProps {
  onTherapySelect: (therapy: Therapy) => void
  selectedTherapy: Therapy | null
}

const colorTherapies: Therapy[] = [
  {
    id: "red",
    name: "Rojo",
    description: "Terapia de luz roja energizante",
    frequency: "red",
    color: "#ef4444",
    icon: "🔴",
    category: "color",
  },
  {
    id: "green",
    name: "Verde",
    description: "Terapia de luz verde equilibrante",
    frequency: "green",
    color: "#22c55e",
    icon: "🟢",
    category: "color",
  },
  {
    id: "blue",
    name: "Azul",
    description: "Terapia de luz azul relajante",
    frequency: "blue",
    color: "#3b82f6",
    icon: "🔵",
    category: "color",
  },
  {
    id: "yellow",
    name: "Amarillo",
    description: "Terapia de luz amarilla estimulante",
    frequency: "yellow",
    color: "#eab308",
    icon: "🟡",
    category: "color",
  },
  {
    id: "purple",
    name: "Púrpura",
    description: "Terapia de luz púrpura meditativa",
    frequency: "purple",
    color: "#a855f7",
    icon: "🟣",
    category: "color",
  },
  {
    id: "orange",
    name: "Naranja",
    description: "Terapia de luz naranja vitalizante",
    frequency: "orange",
    color: "#f97316",
    icon: "🟠",
    category: "color",
  },
]

// Modos disponibles para personalización (comunes para todas las terapias)
const availableModes = [
  {
    id: "general",
    name: "Patrón Complejo",
    description: "11 patrones diferentes con velocidad variable",
    icon: "🔄",
    color: "#06b6d4",
  },
  {
    id: "intermitente",
    name: "Intermitente",
    description: "Cambio rápido entre colores cada 500ms",
    icon: "⚡",
    color: "#f59e0b",
  },
  {
    id: "pausado",
    name: "Pausado",
    description: "Cambio lento entre colores cada 1.5 segundos",
    icon: "⏸️",
    color: "#8b5cf6",
  },
  {
    id: "cascada",
    name: "Cascada",
    description: "Efecto cascada LED por LED con 3 colores",
    icon: "🌊",
    color: "#10b981",
  },
  {
    id: "red",
    name: "Solo Rojo",
    description: "Todos los LEDs en rojo sólido",
    icon: "🔴",
    color: "#ef4444",
  },
  {
    id: "green",
    name: "Solo Verde",
    description: "Todos los LEDs en verde sólido",
    icon: "🟢",
    color: "#22c55e",
  },
  {
    id: "blue",
    name: "Solo Azul",
    description: "Todos los LEDs en azul sólido",
    icon: "🔵",
    color: "#3b82f6",
  },
  {
    id: "yellow",
    name: "Solo Amarillo",
    description: "Todos los LEDs en amarillo sólido",
    icon: "🟡",
    color: "#eab308",
  },
  {
    id: "purple",
    name: "Solo Púrpura",
    description: "Todos los LEDs en púrpura sólido",
    icon: "🟣",
    color: "#a855f7",
  },
  {
    id: "orange",
    name: "Solo Naranja",
    description: "Todos los LEDs en naranja sólido",
    icon: "🟠",
    color: "#f97316",
  },
  {
    id: "relax",
    name: "Relajación",
    description: "Terapia profunda de relajación",
    icon: "🧘",
    color: "#06b6d4",
  },
  {
    id: "energy",
    name: "Energía",
    description: "Terapia energizante y revitalizante",
    icon: "⚡",
    color: "#f59e0b",
  },
  {
    id: "balance",
    name: "Equilibrio",
    icon: "⚖️",
    color: "#8b5cf6",
    description: "Terapia de equilibrio y armonía",
  },
  {
    id: "focus",
    name: "Concentración",
    description: "Terapia para mejorar el enfoque",
    icon: "🎯",
    color: "#10b981",
  },
  {
    id: "sleep",
    name: "Sueño",
    description: "Terapia para inducir el sueño",
    icon: "😴",
    color: "#6366f1",
  },
  {
    id: "meditation",
    name: "Meditación",
    description: "Terapia para meditación profunda",
    icon: "🕉️",
    color: "#ec4899",
  },
]

export default function ColorTherapies({ onTherapySelect, selectedTherapy }: ColorTherapiesProps) {
  const [customizeDialog, setCustomizeDialog] = useState<{ open: boolean; therapy: Therapy | null }>({
    open: false,
    therapy: null,
  })
  const [selectedMode, setSelectedMode] = useState<string>("")
  const [selectedIntensity, setSelectedIntensity] = useState<number>(80)

  const handleCustomize = (therapy: Therapy) => {
    setCustomizeDialog({ open: true, therapy })
    setSelectedMode(therapy.frequency) // Set initial mode to current therapy's frequency
    setSelectedIntensity(80) // Default intensity
  }

  const handleSaveCustomization = () => {
    if (!customizeDialog.therapy) return

    const selectedModeData = availableModes.find((mode) => mode.id === selectedMode)
    if (!selectedModeData) return

    const customizedTherapy: Therapy = {
      ...customizeDialog.therapy,
      frequency: selectedMode,
      color: selectedModeData.color,
      icon: selectedModeData.icon,
      description: selectedModeData.description, // Update description based on selected mode
    }

    onTherapySelect(customizedTherapy)
    setCustomizeDialog({ open: false, therapy: null })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {colorTherapies.map((therapy) => (
        <Card
          key={therapy.id}
          className={`bg-gray-800 border-gray-700 hover:border-gray-600 transition-all cursor-pointer ${
            selectedTherapy?.id === therapy.id ? "ring-2 ring-purple-500 border-purple-500" : ""
          }`}
          onClick={() => onTherapySelect(therapy)}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Icono */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white border-2"
                style={{
                  backgroundColor: `${therapy.color}20`,
                  borderColor: therapy.color,
                  color: therapy.color,
                }}
              >
                {therapy.icon}
              </div>

              {/* Nombre */}
              <h3 className="text-white font-semibold text-lg">{therapy.name}</h3>

              {/* Badge de frecuencia */}
              <Badge
                className="text-xs"
                style={{
                  backgroundColor: `${therapy.color}20`,
                  color: therapy.color,
                  border: `1px solid ${therapy.color}40`,
                }}
              >
                Color {therapy.frequency}
              </Badge>

              {/* Botones */}
              <div className="flex space-x-2 w-full">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTherapySelect(therapy)
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Iniciar
                </Button>
                <Dialog
                  open={customizeDialog.open && customizeDialog.therapy?.id === therapy.id}
                  onOpenChange={(open) => {
                    if (!open) {
                      setCustomizeDialog({ open: false, therapy: null })
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCustomize(therapy)
                      }}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Personalizar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle>Personalizar {therapy.name}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* Selector de modo */}
                      <div>
                        <Label htmlFor="mode-select" className="text-sm font-medium">
                          Modo de Iluminación
                        </Label>
                        <Select value={selectedMode} onValueChange={setSelectedMode}>
                          <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white text-sm mt-2">
                            <SelectValue placeholder="Selecciona un modo" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600 text-white">
                            {availableModes.map((mode) => (
                              <SelectItem key={mode.id} value={mode.id} className="focus:bg-gray-600 focus:text-white">
                                <div className="flex items-center space-x-2">
                                  <span>{mode.icon}</span>
                                  <div>
                                    <div className="font-medium">{mode.name}</div>
                                    <div className="text-xs text-gray-400">{mode.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Control de intensidad */}
                      <div>
                        <Label htmlFor="intensity-slider" className="text-sm font-medium">
                          Intensidad Inicial
                        </Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm flex items-center">
                              <Lightbulb className="mr-2 h-4 w-4" />
                              Intensidad
                            </span>
                            <span className="text-white text-sm font-medium">{selectedIntensity}%</span>
                          </div>
                          <Slider
                            value={[selectedIntensity]}
                            min={10}
                            max={100}
                            step={5}
                            onValueChange={(value) => setSelectedIntensity(value[0])}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>10%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>

                      {/* Preview del modo seleccionado */}
                      {selectedMode && (
                        <div className="p-3 rounded-md bg-gray-700/50 border border-gray-600">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{availableModes.find((m) => m.id === selectedMode)?.icon}</span>
                            <span className="font-medium text-sm">
                              {availableModes.find((m) => m.id === selectedMode)?.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">
                            {availableModes.find((m) => m.id === selectedMode)?.description}
                          </p>
                          <div className="flex items-center space-x-2 text-xs">
                            <Lightbulb className="h-3 w-3 text-yellow-400" />
                            <span className="text-gray-300">Intensidad inicial: </span>
                            <span className="text-yellow-400 font-medium">{selectedIntensity}%</span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setCustomizeDialog({ open: false, therapy: null })}
                          className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSaveCustomization}
                          disabled={!selectedMode}
                          className="bg-orange-600 hover:bg-orange-500 text-white"
                        >
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
